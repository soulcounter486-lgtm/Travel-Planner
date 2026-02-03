import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, MessageSquare, Ticket, Bell, Send, Trash2, Plus, Gift, CheckCircle2, Clock } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface User {
  id: string;
  email: string;
  name?: string;
  profileImage?: string;
  provider?: string;
  createdAt?: string;
}

interface Coupon {
  id: number;
  name: string;
  description?: string;
  discountType: string;
  discountValue: number;
  validFrom?: string;
  validUntil?: string;
  isActive: boolean;
  createdAt?: string;
}

interface Announcement {
  id: number;
  title: string;
  content?: string;
  imageUrl?: string;
  linkUrl?: string;
  type: string;
  isActive: boolean;
  sortOrder: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

export default function AdminMembers() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("members");
  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [sendCouponOpen, setSendCouponOpen] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<string>("");

  const [newCouponOpen, setNewCouponOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    name: "",
    description: "",
    discountType: "percent",
    discountValue: 10,
    validUntil: "",
  });

  const [newAnnouncementOpen, setNewAnnouncementOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    imageUrl: "",
    linkUrl: "",
    type: "banner",
    isActive: true,
    sortOrder: 0,
  });

  const { data: members = [], isLoading: membersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/members"],
    enabled: isAdmin,
  });

  const { data: allCoupons = [], isLoading: couponsLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/admin/coupons"],
    enabled: isAdmin,
  });

  const { data: allAnnouncements = [], isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/announcements"],
    enabled: isAdmin,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: string; title: string; content: string }) => {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setSendMessageOpen(false);
      setMessageTitle("");
      setMessageContent("");
      setSelectedUser(null);
      toast({ title: "쪽지를 발송했습니다" });
    },
    onError: () => {
      toast({ title: "쪽지 발송 실패", variant: "destructive" });
    },
  });

  const sendCouponMutation = useMutation({
    mutationFn: async (data: { userId: string; couponId: number }) => {
      const res = await fetch("/api/admin/user-coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      setSendCouponOpen(false);
      setSelectedCouponId("");
      setSelectedUser(null);
      toast({ title: "쿠폰을 발급했습니다" });
    },
    onError: () => {
      toast({ title: "쿠폰 발급 실패", variant: "destructive" });
    },
  });

  const createCouponMutation = useMutation({
    mutationFn: async (data: typeof couponForm) => {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      setNewCouponOpen(false);
      setCouponForm({ name: "", description: "", discountType: "percent", discountValue: 10, validUntil: "" });
      toast({ title: "쿠폰이 생성되었습니다" });
    },
    onError: () => {
      toast({ title: "쿠폰 생성 실패", variant: "destructive" });
    },
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      toast({ title: "쿠폰이 삭제되었습니다" });
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: typeof announcementForm) => {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      setNewAnnouncementOpen(false);
      setAnnouncementForm({ title: "", content: "", imageUrl: "", linkUrl: "", type: "banner", isActive: true, sortOrder: 0 });
      toast({ title: "공지사항이 생성되었습니다" });
    },
    onError: () => {
      toast({ title: "공지사항 생성 실패", variant: "destructive" });
    },
  });

  const toggleAnnouncementMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      toast({ title: "공지사항이 삭제되었습니다" });
    },
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">관리자 권한이 필요합니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              회원 관리
            </TabsTrigger>
            <TabsTrigger value="coupons" className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              쿠폰 관리
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              공지 관리
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  전체 회원 ({members.length}명)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <p className="text-muted-foreground">로딩 중...</p>
                ) : (
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          {member.profileImage ? (
                            <img src={member.profileImage} alt="" className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{member.name || "이름 없음"}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {member.provider === "kakao" ? "카카오" : "Replit"}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(member);
                              setSendMessageOpen(true);
                            }}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            쪽지
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(member);
                              setSendCouponOpen(true);
                            }}
                          >
                            <Gift className="w-4 h-4 mr-1" />
                            쿠폰
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coupons">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  쿠폰 목록
                </CardTitle>
                <Dialog open={newCouponOpen} onOpenChange={setNewCouponOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      새 쿠폰
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>새 쿠폰 생성</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>쿠폰 이름</Label>
                        <Input
                          value={couponForm.name}
                          onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })}
                          placeholder="예: 첫 방문 10% 할인"
                        />
                      </div>
                      <div>
                        <Label>설명</Label>
                        <Textarea
                          value={couponForm.description}
                          onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                          placeholder="쿠폰 설명..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>할인 유형</Label>
                          <Select
                            value={couponForm.discountType}
                            onValueChange={(v) => setCouponForm({ ...couponForm, discountType: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percent">퍼센트 (%)</SelectItem>
                              <SelectItem value="fixed">정액 (원)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>할인 값</Label>
                          <Input
                            type="number"
                            value={couponForm.discountValue}
                            onChange={(e) => setCouponForm({ ...couponForm, discountValue: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>유효기간</Label>
                        <Input
                          type="date"
                          value={couponForm.validUntil}
                          onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
                        />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => createCouponMutation.mutate(couponForm)}
                        disabled={!couponForm.name || createCouponMutation.isPending}
                      >
                        생성하기
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {couponsLoading ? (
                  <p className="text-muted-foreground">로딩 중...</p>
                ) : allCoupons.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">등록된 쿠폰이 없습니다</p>
                ) : (
                  <div className="space-y-3">
                    {allCoupons.map((coupon) => (
                      <div key={coupon.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <p className="font-medium">{coupon.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {coupon.discountType === "percent" ? `${coupon.discountValue}% 할인` : `${coupon.discountValue.toLocaleString()}원 할인`}
                          </p>
                          {coupon.validUntil && (
                            <p className="text-xs text-muted-foreground">
                              ~ {format(new Date(coupon.validUntil), "yyyy.MM.dd", { locale: ko })}까지
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={coupon.isActive ? "default" : "secondary"}>
                            {coupon.isActive ? "활성" : "비활성"}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteCouponMutation.mutate(coupon.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  공지사항/배너
                </CardTitle>
                <Dialog open={newAnnouncementOpen} onOpenChange={setNewAnnouncementOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      새 공지
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>새 공지사항</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>제목</Label>
                        <Input
                          value={announcementForm.title}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                          placeholder="공지 제목"
                        />
                      </div>
                      <div>
                        <Label>내용</Label>
                        <Textarea
                          value={announcementForm.content}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                          placeholder="공지 내용..."
                        />
                      </div>
                      <div>
                        <Label>이미지 URL (선택)</Label>
                        <Input
                          value={announcementForm.imageUrl}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, imageUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <Label>링크 URL (선택)</Label>
                        <Input
                          value={announcementForm.linkUrl}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, linkUrl: e.target.value })}
                          placeholder="클릭 시 이동할 URL"
                        />
                      </div>
                      <div>
                        <Label>유형</Label>
                        <Select
                          value={announcementForm.type}
                          onValueChange={(v) => setAnnouncementForm({ ...announcementForm, type: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="banner">배너</SelectItem>
                            <SelectItem value="popup">팝업</SelectItem>
                            <SelectItem value="notice">공지</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => createAnnouncementMutation.mutate(announcementForm)}
                        disabled={!announcementForm.title || createAnnouncementMutation.isPending}
                      >
                        생성하기
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {announcementsLoading ? (
                  <p className="text-muted-foreground">로딩 중...</p>
                ) : allAnnouncements.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">등록된 공지사항이 없습니다</p>
                ) : (
                  <div className="space-y-3">
                    {allAnnouncements.map((ann) => (
                      <div key={ann.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          {ann.imageUrl && (
                            <img src={ann.imageUrl} alt="" className="w-16 h-10 object-cover rounded" />
                          )}
                          <div>
                            <p className="font-medium">{ann.title}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {ann.type === "banner" ? "배너" : ann.type === "popup" ? "팝업" : "공지"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={ann.isActive}
                            onCheckedChange={(checked) =>
                              toggleAnnouncementMutation.mutate({ id: ann.id, isActive: checked })
                            }
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteAnnouncementMutation.mutate(ann.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={sendMessageOpen} onOpenChange={setSendMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>쪽지 보내기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              받는 사람: <strong>{selectedUser?.name || selectedUser?.email}</strong>
            </p>
            <div>
              <Label>제목</Label>
              <Input
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                placeholder="쪽지 제목"
              />
            </div>
            <div>
              <Label>내용</Label>
              <Textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="쪽지 내용을 입력하세요..."
                rows={4}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (selectedUser) {
                  sendMessageMutation.mutate({
                    receiverId: selectedUser.id,
                    title: messageTitle,
                    content: messageContent,
                  });
                }
              }}
              disabled={!messageTitle || !messageContent || sendMessageMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              발송하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={sendCouponOpen} onOpenChange={setSendCouponOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>쿠폰 발급</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              받는 사람: <strong>{selectedUser?.name || selectedUser?.email}</strong>
            </p>
            <div>
              <Label>발급할 쿠폰 선택</Label>
              <Select value={selectedCouponId} onValueChange={setSelectedCouponId}>
                <SelectTrigger>
                  <SelectValue placeholder="쿠폰을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {allCoupons.filter(c => c.isActive).map((coupon) => (
                    <SelectItem key={coupon.id} value={coupon.id.toString()}>
                      {coupon.name} ({coupon.discountType === "percent" ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString()}원`})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => {
                if (selectedUser && selectedCouponId) {
                  sendCouponMutation.mutate({
                    userId: selectedUser.id,
                    couponId: parseInt(selectedCouponId),
                  });
                }
              }}
              disabled={!selectedCouponId || sendCouponMutation.isPending}
            >
              <Gift className="w-4 h-4 mr-2" />
              발급하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
