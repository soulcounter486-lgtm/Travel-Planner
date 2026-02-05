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
import { ArrowLeft, Users, MessageSquare, Ticket, Bell, Send, Trash2, Plus, Gift, Megaphone, GripVertical, Edit2, Shield, ShieldCheck, Settings, Moon, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  profileImageUrl?: string;
  loginMethod?: string;
  isAdmin?: boolean;
  canViewNightlife18?: boolean;
  canViewEco?: boolean;
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
  placeId?: number | null;
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

function SortableAnnouncementItem({ 
  ann, 
  onToggle, 
  onDelete, 
  onEdit 
}: { 
  ann: Announcement; 
  onToggle: (id: number, isActive: boolean) => void; 
  onDelete: (id: number) => void;
  onEdit: (ann: Announcement) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ann.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-xs"
    >
      <div className="flex items-center gap-1 min-w-0 flex-1">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 touch-none"
          data-testid={`drag-handle-${ann.id}`}
        >
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </button>
        <Badge variant={ann.isActive ? "default" : "secondary"} className="text-[10px] h-4 px-1 flex-shrink-0">
          {ann.type === "notice" && "공지"}
          {ann.type === "event" && "이벤트"}
          {ann.type === "promotion" && "프로모션"}
          {ann.type === "urgent" && "긴급"}
          {ann.type === "banner" && "배너"}
          {ann.type === "popup" && "팝업"}
        </Badge>
        <span className="font-medium truncate">{ann.title}</span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2"
          onClick={() => onEdit(ann)}
          data-testid={`edit-announcement-${ann.id}`}
        >
          <Edit2 className="w-3 h-3" />
        </Button>
        <Switch
          checked={ann.isActive}
          onCheckedChange={(checked) => onToggle(ann.id, checked)}
          className="scale-75"
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-red-500 hover:text-red-600"
          onClick={() => onDelete(ann.id)}
          data-testid={`delete-announcement-${ann.id}`}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default function AdminMembers() {
  const { isAdmin, userId: currentUserId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("members");
  const [sendMessageOpen, setSendMessageOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [sendCouponOpen, setSendCouponOpen] = useState(false);
  const [selectedCouponId, setSelectedCouponId] = useState<string>("");
  const [broadcastMessageOpen, setBroadcastMessageOpen] = useState(false);
  const [broadcastCouponOpen, setBroadcastCouponOpen] = useState(false);
  const [editAnnouncementOpen, setEditAnnouncementOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const [newCouponOpen, setNewCouponOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({
    name: "",
    description: "",
    discountType: "percent",
    discountValue: 10,
    validUntil: "",
    placeId: null as number | null,
    isWelcomeCoupon: false,
  });

  const [newAnnouncementOpen, setNewAnnouncementOpen] = useState(false);
  const [editCouponOpen, setEditCouponOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editCouponForm, setEditCouponForm] = useState({
    name: "",
    description: "",
    discountType: "percent",
    discountValue: 10,
    validFrom: "",
    validUntil: "",
    placeId: null as number | null,
    isWelcomeCoupon: false,
  });
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    imageUrl: "",
    linkUrl: "",
    type: "notice",
    isActive: true,
    sortOrder: 0,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: members = [], isLoading: membersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin,
  });

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["/api/admin/notifications/unread-count"],
    enabled: isAdmin,
    select: (data: any) => data?.count || 0,
    refetchInterval: 30000,
  });

  const markNotificationsReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/notifications/mark-read", {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("알림 읽음 처리 실패");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread-count"] });
    },
  });

  const toggleNightlife18Mutation = useMutation({
    mutationFn: async ({ userId, canViewNightlife18 }: { userId: string; canViewNightlife18: boolean }) => {
      const res = await fetch(`/api/admin/users/${userId}/nightlife18`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ canViewNightlife18 }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "밤문화18 권한이 변경되었습니다" });
    },
    onError: (error: Error) => {
      toast({ title: "권한 변경 실패", description: error.message, variant: "destructive" });
    },
  });

  const toggleEcoMutation = useMutation({
    mutationFn: async ({ userId, canViewEco }: { userId: string; canViewEco: boolean }) => {
      const res = await fetch(`/api/admin/users/${userId}/eco`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ canViewEco }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "에코 권한이 변경되었습니다" });
    },
    onError: (error: Error) => {
      toast({ title: "권한 변경 실패", description: error.message, variant: "destructive" });
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin: newIsAdmin }: { userId: string; isAdmin: boolean }) => {
      const res = await fetch(`/api/admin/users/${userId}/admin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isAdmin: newIsAdmin }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "관리자 권한이 변경되었습니다" });
    },
    onError: (error: Error) => {
      toast({ title: "권한 변경 실패", description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "회원이 삭제되었습니다" });
    },
    onError: (error: Error) => {
      toast({ title: "삭제 실패", description: error.message, variant: "destructive" });
    },
  });

  const { data: allCoupons = [], isLoading: couponsLoading } = useQuery<Coupon[]>({
    queryKey: ["/api/admin/coupons"],
    enabled: isAdmin,
  });

  const { data: allAnnouncements = [], isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/announcements"],
    enabled: isAdmin,
  });

  const { data: allPlaces = [] } = useQuery<{ id: number; name: string; category: string; latitude?: string; longitude?: string; address?: string }[]>({
    queryKey: ["/api/places"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: string; title: string; content: string }) => {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      setSendMessageOpen(false);
      setMessageTitle("");
      setMessageContent("");
      setSelectedUser(null);
      toast({ title: "쪽지를 발송했습니다" });
    },
    onError: (error: Error) => {
      toast({ title: "쪽지 발송 실패", description: error.message, variant: "destructive" });
    },
  });

  const broadcastMessageMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await fetch("/api/admin/messages/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      setBroadcastMessageOpen(false);
      setMessageTitle("");
      setMessageContent("");
      toast({ title: `전체 ${data.sentCount}명에게 쪽지 발송 완료` });
    },
    onError: () => {
      toast({ title: "전체 쪽지 발송 실패", variant: "destructive" });
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

  const broadcastCouponMutation = useMutation({
    mutationFn: async (data: { couponId: number }) => {
      const res = await fetch("/api/admin/user-coupons/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      setBroadcastCouponOpen(false);
      setSelectedCouponId("");
      toast({ title: `전체 ${data.issuedCount}명에게 쿠폰 발급 완료` });
    },
    onError: () => {
      toast({ title: "전체 쿠폰 발급 실패", variant: "destructive" });
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
      setCouponForm({ name: "", description: "", discountType: "percent", discountValue: 10, validUntil: "", placeId: null, isWelcomeCoupon: false });
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

  const updateCouponMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof editCouponForm }) => {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coupons"] });
      setEditCouponOpen(false);
      setEditingCoupon(null);
      toast({ title: "쿠폰이 수정되었습니다" });
    },
  });

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setEditCouponForm({
      name: coupon.name,
      description: coupon.description || "",
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      validFrom: coupon.validFrom ? coupon.validFrom.split("T")[0] : "",
      validUntil: coupon.validUntil ? coupon.validUntil.split("T")[0] : "",
      placeId: coupon.placeId || null,
      isWelcomeCoupon: coupon.isWelcomeCoupon || false,
    });
    setEditCouponOpen(true);
  };

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
      setAnnouncementForm({ title: "", content: "", imageUrl: "", linkUrl: "", type: "notice", isActive: true, sortOrder: 0 });
      toast({ title: "공지사항이 생성되었습니다" });
    },
    onError: () => {
      toast({ title: "공지사항 생성 실패", variant: "destructive" });
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: async (data: Partial<Announcement> & { id: number }) => {
      const res = await fetch(`/api/admin/announcements/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      setEditAnnouncementOpen(false);
      setEditingAnnouncement(null);
      toast({ title: "공지사항이 수정되었습니다" });
    },
    onError: () => {
      toast({ title: "공지사항 수정 실패", variant: "destructive" });
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

  const reorderAnnouncementsMutation = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      const res = await fetch("/api/admin/announcements/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
    },
    onError: () => {
      toast({ title: "순서 변경 실패", variant: "destructive" });
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = allAnnouncements.findIndex((a) => a.id === active.id);
      const newIndex = allAnnouncements.findIndex((a) => a.id === over.id);
      const newOrder = arrayMove(allAnnouncements, oldIndex, newIndex);
      const orderedIds = newOrder.map((a) => a.id);
      reorderAnnouncementsMutation.mutate(orderedIds);
    }
  };

  const handleEditAnnouncement = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setEditAnnouncementOpen(true);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">관리자 권한이 필요합니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-2 sm:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg sm:text-xl font-bold">관리자</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-9 mb-3">
            <TabsTrigger 
              value="members" 
              className="text-xs px-1 relative"
              onClick={() => {
                if (unreadCount > 0) {
                  markNotificationsReadMutation.mutate();
                }
              }}
            >
              <Users className="w-3 h-3 mr-1" />
              회원
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="coupons" className="text-xs px-1">
              <Ticket className="w-3 h-3 mr-1" />
              쿠폰
            </TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs px-1">
              <Bell className="w-3 h-3 mr-1" />
              공지
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-0">
            <Card>
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    회원 ({members.length}명)
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => setBroadcastMessageOpen(true)}>
                      <Megaphone className="w-3 h-3 mr-1" />
                      전체 쪽지
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setBroadcastCouponOpen(true)}>
                      <Gift className="w-3 h-3 mr-1" />
                      전체 쿠폰
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                {membersLoading ? (
                  <p className="text-muted-foreground text-sm p-2">로딩 중...</p>
                ) : (
                  <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                    {[...members].sort((a, b) => (b.isAdmin ? 1 : 0) - (a.isAdmin ? 1 : 0)).map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-xs">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            {member.profileImageUrl ? (
                              <img src={member.profileImageUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                              <Users className="w-3 h-3 text-primary" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <p className="font-medium truncate">{member.nickname || member.firstName || member.email?.split("@")[0] || "이름없음"}</p>
                              {member.isAdmin && (
                                <Badge variant="default" className="h-4 px-1 text-[9px] bg-amber-500">
                                  <ShieldCheck className="w-2 h-2 mr-0.5" />
                                  관리자
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                              {member.loginMethod && (
                                <Badge variant="outline" className="h-3 px-1 text-[8px]">
                                  {member.loginMethod}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant={member.isAdmin ? "default" : "ghost"}
                            className={`h-6 px-2 text-[10px] ${member.isAdmin ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                            onClick={() => toggleAdminMutation.mutate({ userId: member.id, isAdmin: !member.isAdmin })}
                            disabled={toggleAdminMutation.isPending || String(member.id) === String(currentUserId)}
                            title={String(member.id) === String(currentUserId) ? "자신의 권한은 변경할 수 없습니다" : "관리자 권한 토글"}
                            data-testid={`toggle-admin-${member.id}`}
                          >
                            {member.isAdmin ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant={member.canViewNightlife18 ? "default" : "outline"}
                            className={`h-6 px-2 text-[10px] ${member.canViewNightlife18 ? "bg-rose-500 hover:bg-rose-600 text-white" : "border-rose-300 dark:border-rose-700"}`}
                            onClick={() => toggleNightlife18Mutation.mutate({ userId: member.id, canViewNightlife18: !member.canViewNightlife18 })}
                            disabled={toggleNightlife18Mutation.isPending}
                            title={member.canViewNightlife18 ? "밤문화18 권한 해제" : "밤문화18 권한 부여"}
                            data-testid={`toggle-nightlife18-${member.id}`}
                          >
                            <Moon className={`w-3 h-3 ${member.canViewNightlife18 ? "" : "text-rose-500"}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant={member.canViewEco ? "default" : "outline"}
                            className={`h-6 px-2 text-[10px] ${member.canViewEco ? "bg-pink-500 hover:bg-pink-600 text-white" : "border-pink-300 dark:border-pink-700"}`}
                            onClick={() => toggleEcoMutation.mutate({ userId: member.id, canViewEco: !member.canViewEco })}
                            disabled={toggleEcoMutation.isPending}
                            title={member.canViewEco ? "에코 권한 해제" : "에코 권한 부여"}
                            data-testid={`toggle-eco-${member.id}`}
                          >
                            <Sparkles className={`w-3 h-3 ${member.canViewEco ? "" : "text-pink-500"}`} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[10px]"
                            onClick={() => {
                              setSelectedUser(member);
                              setSendMessageOpen(true);
                            }}
                          >
                            <MessageSquare className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[10px]"
                            onClick={() => {
                              setSelectedUser(member);
                              setSendCouponOpen(true);
                            }}
                          >
                            <Gift className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[10px] text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm(`정말 ${member.nickname || member.email} 회원을 삭제하시겠습니까?`)) {
                                deleteUserMutation.mutate(member.id);
                              }
                            }}
                            disabled={deleteUserMutation.isPending || member.isAdmin || String(member.id) === String(currentUserId)}
                            title={member.isAdmin ? "관리자는 삭제할 수 없습니다" : String(member.id) === String(currentUserId) ? "자신은 삭제할 수 없습니다" : "회원 삭제"}
                            data-testid={`delete-user-${member.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coupons" className="mt-0">
            <Card>
              <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Ticket className="w-4 h-4" />
                  쿠폰 ({allCoupons.length}개)
                </CardTitle>
                <Dialog open={newCouponOpen} onOpenChange={setNewCouponOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-7 text-xs">
                      <Plus className="w-3 h-3 mr-1" />
                      새 쿠폰
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="text-base">새 쿠폰 생성</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">쿠폰 이름</Label>
                        <Input
                          className="h-8 text-sm"
                          value={couponForm.name}
                          onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })}
                          placeholder="예: 첫 방문 10% 할인"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">설명</Label>
                        <Textarea
                          className="text-sm min-h-[60px]"
                          value={couponForm.description}
                          onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                          placeholder="쿠폰 설명"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">할인 유형</Label>
                          <Select
                            value={couponForm.discountType}
                            onValueChange={(v) => setCouponForm({ ...couponForm, discountType: v })}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percent">% 할인</SelectItem>
                              <SelectItem value="fixed">금액 할인 (VND)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">할인값 {couponForm.discountType === 'fixed' && '(VND)'}</Label>
                          <Input
                            type="number"
                            className="h-8 text-sm"
                            value={couponForm.discountValue || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCouponForm({ ...couponForm, discountValue: val === '' ? 0 : parseInt(val, 10) || 0 });
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">유효기간</Label>
                        <Input
                          type="date"
                          className="h-8 text-sm"
                          value={couponForm.validUntil}
                          onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">연결 장소 (선택)</Label>
                        <Select
                          value={couponForm.placeId?.toString() || "none"}
                          onValueChange={(v) => setCouponForm({ ...couponForm, placeId: v === "none" ? null : Number(v) })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="장소 선택 (선택사항)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">없음</SelectItem>
                            {(() => {
                              const categoryLabels: Record<string, string> = {
                                attraction: "관광명소",
                                korean_food: "한식",
                                local_food: "현지음식",
                                restaurant: "맛집",
                                cafe: "카페",
                                services: "서비스/마사지",
                                exchange: "환전소",
                              };
                              const grouped = allPlaces.reduce((acc, place) => {
                                const cat = place.category || "other";
                                if (!acc[cat]) acc[cat] = [];
                                acc[cat].push(place);
                                return acc;
                              }, {} as Record<string, typeof allPlaces>);
                              const order = ["attraction", "korean_food", "local_food", "restaurant", "cafe", "services", "exchange"];
                              const sortedCategories = Array.from(new Set([...order.filter(c => grouped[c]), ...Object.keys(grouped).filter(c => !order.includes(c))]));
                              return sortedCategories.map((cat) => (
                                <SelectGroup key={cat}>
                                  <SelectLabel>{categoryLabels[cat] || "기타"}</SelectLabel>
                                  {grouped[cat].map((place) => (
                                    <SelectItem key={place.id} value={place.id.toString()}>
                                      {place.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              ));
                            })()}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <input
                          type="checkbox"
                          id="isWelcomeCoupon"
                          checked={couponForm.isWelcomeCoupon}
                          onChange={(e) => setCouponForm({ ...couponForm, isWelcomeCoupon: e.target.checked })}
                          className="w-4 h-4"
                          data-testid="checkbox-welcome-coupon"
                        />
                        <Label htmlFor="isWelcomeCoupon" className="text-xs cursor-pointer">
                          첫 로그인 쿠폰 (신규 회원 첫 로그인 시 자동 발급)
                        </Label>
                      </div>
                      <Button
                        className="w-full h-8 text-sm"
                        onClick={() => createCouponMutation.mutate(couponForm)}
                        disabled={!couponForm.name || createCouponMutation.isPending}
                      >
                        생성
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                {couponsLoading ? (
                  <p className="text-muted-foreground text-sm p-2">로딩 중...</p>
                ) : (
                  <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                    {allCoupons.map((coupon) => (
                      <div key={coupon.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-medium">{coupon.name}</span>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">
                              {coupon.discountType === "percent" ? `${coupon.discountValue}%` : `${coupon.discountValue.toLocaleString()}원`}
                            </Badge>
                            {coupon.isWelcomeCoupon && (
                              <Badge variant="default" className="text-[10px] h-4 px-1 bg-green-600">
                                첫 로그인
                              </Badge>
                            )}
                          </div>
                          {coupon.validUntil && (
                            <p className="text-[10px] text-muted-foreground">
                              ~{format(new Date(coupon.validUntil), "yy.MM.dd")}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2"
                            onClick={() => handleEditCoupon(coupon)}
                            data-testid={`button-edit-coupon-${coupon.id}`}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-red-500 hover:text-red-600"
                            onClick={() => deleteCouponMutation.mutate(coupon.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 쿠폰 수정 다이얼로그 */}
            <Dialog open={editCouponOpen} onOpenChange={setEditCouponOpen}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-base">쿠폰 수정</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">쿠폰명</Label>
                    <Input
                      className="h-8 text-sm"
                      value={editCouponForm.name}
                      onChange={(e) => setEditCouponForm({ ...editCouponForm, name: e.target.value })}
                      data-testid="input-edit-coupon-name"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">설명</Label>
                    <Textarea
                      className="text-sm min-h-[60px]"
                      value={editCouponForm.description}
                      onChange={(e) => setEditCouponForm({ ...editCouponForm, description: e.target.value })}
                      data-testid="input-edit-coupon-description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">할인유형</Label>
                      <Select
                        value={editCouponForm.discountType}
                        onValueChange={(v) => setEditCouponForm({ ...editCouponForm, discountType: v })}
                      >
                        <SelectTrigger className="h-8 text-sm" data-testid="select-edit-discount-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">%</SelectItem>
                          <SelectItem value="fixed">금액 할인 (VND)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">할인값 {editCouponForm.discountType === 'fixed' && '(VND)'}</Label>
                      <Input
                        type="number"
                        className="h-8 text-sm"
                        value={editCouponForm.discountValue || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditCouponForm({ ...editCouponForm, discountValue: val === '' ? 0 : parseInt(val, 10) || 0 });
                        }}
                        data-testid="input-edit-discount-value"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">시작일</Label>
                      <Input
                        type="date"
                        className="h-8 text-sm"
                        value={editCouponForm.validFrom}
                        onChange={(e) => setEditCouponForm({ ...editCouponForm, validFrom: e.target.value })}
                        data-testid="input-edit-valid-from"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">종료일</Label>
                      <Input
                        type="date"
                        className="h-8 text-sm"
                        value={editCouponForm.validUntil}
                        onChange={(e) => setEditCouponForm({ ...editCouponForm, validUntil: e.target.value })}
                        data-testid="input-edit-valid-until"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">연결 장소 (선택)</Label>
                    <Select
                      value={editCouponForm.placeId?.toString() || "none"}
                      onValueChange={(v) => setEditCouponForm({ ...editCouponForm, placeId: v === "none" ? null : Number(v) })}
                    >
                      <SelectTrigger className="h-8 text-xs" data-testid="select-edit-place">
                        <SelectValue placeholder="장소 선택 (선택사항)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">없음</SelectItem>
                        {(() => {
                          const categoryLabels: Record<string, string> = {
                            attraction: "관광명소",
                            korean_food: "한식",
                            local_food: "현지음식",
                            restaurant: "맛집",
                            cafe: "카페",
                            services: "서비스/마사지",
                            exchange: "환전소",
                          };
                          const grouped = allPlaces.reduce((acc, place) => {
                            const cat = place.category || "other";
                            if (!acc[cat]) acc[cat] = [];
                            acc[cat].push(place);
                            return acc;
                          }, {} as Record<string, typeof allPlaces>);
                          const order = ["attraction", "korean_food", "local_food", "restaurant", "cafe", "services", "exchange"];
                          const sortedCategories = Array.from(new Set([...order.filter(c => grouped[c]), ...Object.keys(grouped).filter(c => !order.includes(c))]));
                          return sortedCategories.map((cat) => (
                            <SelectGroup key={cat}>
                              <SelectLabel>{categoryLabels[cat] || "기타"}</SelectLabel>
                              {grouped[cat].map((place) => (
                                <SelectItem key={place.id} value={place.id.toString()}>
                                  {place.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    <input
                      type="checkbox"
                      id="editIsWelcomeCoupon"
                      checked={editCouponForm.isWelcomeCoupon}
                      onChange={(e) => setEditCouponForm({ ...editCouponForm, isWelcomeCoupon: e.target.checked })}
                      className="w-4 h-4"
                      data-testid="checkbox-edit-welcome-coupon"
                    />
                    <Label htmlFor="editIsWelcomeCoupon" className="text-xs cursor-pointer">
                      첫 로그인 쿠폰 (신규 회원 첫 로그인 시 자동 발급)
                    </Label>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => editingCoupon && updateCouponMutation.mutate({ id: editingCoupon.id, data: editCouponForm })}
                    disabled={updateCouponMutation.isPending}
                    data-testid="button-save-coupon"
                  >
                    {updateCouponMutation.isPending ? "저장 중..." : "저장"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="announcements" className="mt-0">
            <Card>
              <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-1">
                  <Bell className="w-4 h-4" />
                  공지 ({allAnnouncements.length}개)
                </CardTitle>
                <Dialog open={newAnnouncementOpen} onOpenChange={setNewAnnouncementOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-7 text-xs">
                      <Plus className="w-3 h-3 mr-1" />
                      새 공지
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="text-base">새 공지사항</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">제목</Label>
                        <Input
                          className="h-8 text-sm"
                          value={announcementForm.title}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                          placeholder="공지 제목"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">내용</Label>
                        <Textarea
                          className="text-sm min-h-[80px]"
                          value={announcementForm.content}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                          placeholder="공지 내용"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">유형</Label>
                        <Select
                          value={announcementForm.type}
                          onValueChange={(v) => setAnnouncementForm({ ...announcementForm, type: v })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="notice">공지</SelectItem>
                            <SelectItem value="event">이벤트</SelectItem>
                            <SelectItem value="promotion">프로모션</SelectItem>
                            <SelectItem value="urgent">긴급</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">이미지 URL (선택)</Label>
                        <Input
                          className="h-8 text-sm"
                          value={announcementForm.imageUrl}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, imageUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <div>
                        <Label className="text-xs">링크 URL (선택)</Label>
                        <Input
                          className="h-8 text-sm"
                          value={announcementForm.linkUrl}
                          onChange={(e) => setAnnouncementForm({ ...announcementForm, linkUrl: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                      <Button
                        className="w-full h-8 text-sm"
                        onClick={() => createAnnouncementMutation.mutate(announcementForm)}
                        disabled={!announcementForm.title || createAnnouncementMutation.isPending}
                      >
                        생성
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                {announcementsLoading ? (
                  <p className="text-muted-foreground text-sm p-2">로딩 중...</p>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={allAnnouncements.map((a) => a.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                        {allAnnouncements.map((ann) => (
                          <SortableAnnouncementItem
                            key={ann.id}
                            ann={ann}
                            onToggle={(id, isActive) => toggleAnnouncementMutation.mutate({ id, isActive })}
                            onDelete={(id) => deleteAnnouncementMutation.mutate(id)}
                            onEdit={handleEditAnnouncement}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 개별 쪽지 발송 다이얼로그 */}
      <Dialog open={sendMessageOpen} onOpenChange={setSendMessageOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">쪽지 보내기</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              받는 사람: <span className="font-medium text-foreground">{selectedUser?.firstName || selectedUser?.email}</span>
            </p>
            <div>
              <Label className="text-xs">제목</Label>
              <Input
                className="h-8 text-sm"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                placeholder="쪽지 제목"
              />
            </div>
            <div>
              <Label className="text-xs">내용</Label>
              <Textarea
                className="text-sm min-h-[80px]"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="쪽지 내용"
              />
            </div>
            <Button
              className="w-full h-8 text-sm"
              onClick={() => selectedUser && sendMessageMutation.mutate({ receiverId: selectedUser.id, title: messageTitle, content: messageContent })}
              disabled={!messageTitle || !messageContent || sendMessageMutation.isPending}
            >
              <Send className="w-3 h-3 mr-1" />
              보내기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 전체 쪽지 발송 다이얼로그 */}
      <Dialog open={broadcastMessageOpen} onOpenChange={setBroadcastMessageOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              전체 회원 쪽지
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              전체 <span className="font-medium text-foreground">{members.length}명</span>에게 쪽지를 보냅니다
            </p>
            <div>
              <Label className="text-xs">제목</Label>
              <Input
                className="h-8 text-sm"
                value={messageTitle}
                onChange={(e) => setMessageTitle(e.target.value)}
                placeholder="쪽지 제목"
              />
            </div>
            <div>
              <Label className="text-xs">내용</Label>
              <Textarea
                className="text-sm min-h-[80px]"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="쪽지 내용"
              />
            </div>
            <Button
              className="w-full h-8 text-sm"
              onClick={() => broadcastMessageMutation.mutate({ title: messageTitle, content: messageContent })}
              disabled={!messageTitle || !messageContent || broadcastMessageMutation.isPending}
            >
              <Megaphone className="w-3 h-3 mr-1" />
              전체 발송
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 개별 쿠폰 발급 다이얼로그 */}
      <Dialog open={sendCouponOpen} onOpenChange={setSendCouponOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">쿠폰 발급</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              받는 사람: <span className="font-medium text-foreground">{selectedUser?.firstName || selectedUser?.email}</span>
            </p>
            <div>
              <Label className="text-xs">쿠폰 선택</Label>
              <Select value={selectedCouponId} onValueChange={setSelectedCouponId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="쿠폰 선택" />
                </SelectTrigger>
                <SelectContent>
                  {allCoupons.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name} ({c.discountType === "percent" ? `${c.discountValue}%` : `${c.discountValue}원`})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full h-8 text-sm"
              onClick={() => selectedUser && selectedCouponId && sendCouponMutation.mutate({ userId: selectedUser.id, couponId: Number(selectedCouponId) })}
              disabled={!selectedCouponId || sendCouponMutation.isPending}
            >
              <Gift className="w-3 h-3 mr-1" />
              발급하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 전체 쿠폰 발급 다이얼로그 */}
      <Dialog open={broadcastCouponOpen} onOpenChange={setBroadcastCouponOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Gift className="w-4 h-4" />
              전체 회원 쿠폰
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              전체 <span className="font-medium text-foreground">{members.length}명</span>에게 쿠폰을 발급합니다
            </p>
            <div>
              <Label className="text-xs">쿠폰 선택</Label>
              <Select value={selectedCouponId} onValueChange={setSelectedCouponId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="쿠폰 선택" />
                </SelectTrigger>
                <SelectContent>
                  {allCoupons.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name} ({c.discountType === "percent" ? `${c.discountValue}%` : `${c.discountValue}원`})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full h-8 text-sm"
              onClick={() => selectedCouponId && broadcastCouponMutation.mutate({ couponId: Number(selectedCouponId) })}
              disabled={!selectedCouponId || broadcastCouponMutation.isPending}
            >
              <Megaphone className="w-3 h-3 mr-1" />
              전체 발급
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 공지사항 수정 다이얼로그 */}
      <Dialog open={editAnnouncementOpen} onOpenChange={setEditAnnouncementOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">공지사항 수정</DialogTitle>
          </DialogHeader>
          {editingAnnouncement && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">제목</Label>
                <Input
                  className="h-8 text-sm"
                  value={editingAnnouncement.title}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                  placeholder="공지 제목"
                />
              </div>
              <div>
                <Label className="text-xs">내용</Label>
                <Textarea
                  className="text-sm min-h-[80px]"
                  value={editingAnnouncement.content || ""}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, content: e.target.value })}
                  placeholder="공지 내용"
                />
              </div>
              <div>
                <Label className="text-xs">유형</Label>
                <Select
                  value={editingAnnouncement.type}
                  onValueChange={(v) => setEditingAnnouncement({ ...editingAnnouncement, type: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notice">공지</SelectItem>
                    <SelectItem value="event">이벤트</SelectItem>
                    <SelectItem value="promotion">프로모션</SelectItem>
                    <SelectItem value="urgent">긴급</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">이미지 URL (선택)</Label>
                <Input
                  className="h-8 text-sm"
                  value={editingAnnouncement.imageUrl || ""}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label className="text-xs">링크 URL (선택)</Label>
                <Input
                  className="h-8 text-sm"
                  value={editingAnnouncement.linkUrl || ""}
                  onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, linkUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <Button
                className="w-full h-8 text-sm"
                onClick={() => updateAnnouncementMutation.mutate({
                  id: editingAnnouncement.id,
                  title: editingAnnouncement.title,
                  content: editingAnnouncement.content,
                  type: editingAnnouncement.type,
                  imageUrl: editingAnnouncement.imageUrl,
                  linkUrl: editingAnnouncement.linkUrl,
                })}
                disabled={!editingAnnouncement.title || updateAnnouncementMutation.isPending}
              >
                <Edit2 className="w-3 h-3 mr-1" />
                수정
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
