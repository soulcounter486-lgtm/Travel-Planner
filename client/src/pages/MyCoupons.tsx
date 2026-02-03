import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Ticket, MessageSquare, CheckCircle2, Clock, Gift, Mail, MailOpen, X } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface MyCoupon {
  id: number;
  couponId: number;
  isUsed: boolean;
  usedAt?: string;
  issuedAt?: string;
  name: string;
  description?: string;
  discountType: string;
  discountValue: number;
  validFrom?: string;
  validUntil?: string;
}

interface Message {
  id: number;
  title: string;
  content: string;
  isRead: boolean;
  createdAt?: string;
}

export default function MyCoupons() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("coupons");
  const [selectedCoupon, setSelectedCoupon] = useState<MyCoupon | null>(null);
  const [showUseConfirm, setShowUseConfirm] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const { data: myCoupons = [], isLoading: couponsLoading } = useQuery<MyCoupon[]>({
    queryKey: ["/api/my-coupons"],
    enabled: !!user,
  });

  const { data: myMessages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    enabled: !!user,
  });

  const { data: unreadCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/messages/unread-count"],
    enabled: !!user,
  });

  const useCouponMutation = useMutation({
    mutationFn: async (couponId: number) => {
      const res = await fetch(`/api/my-coupons/${couponId}/use`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-coupons"] });
      setShowUseConfirm(false);
      setSelectedCoupon(null);
      toast({ title: "쿠폰이 사용되었습니다!" });
    },
    onError: () => {
      toast({ title: "쿠폰 사용 실패", variant: "destructive" });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await fetch(`/api/messages/${messageId}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages/unread-count"] });
    },
  });

  const availableCoupons = myCoupons.filter(c => !c.isUsed);
  const usedCoupons = myCoupons.filter(c => c.isUsed);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">로그인이 필요합니다</p>
          <Link href="/">
            <Button>홈으로</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto p-4">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">내 쿠폰 & 쪽지</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="coupons" className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              쿠폰 ({availableCoupons.length})
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2 relative">
              <MessageSquare className="w-4 h-4" />
              쪽지
              {unreadCount.count > 0 && (
                <Badge variant="destructive" className="ml-1 px-1.5 py-0 text-xs">
                  {unreadCount.count}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coupons">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  사용 가능한 쿠폰 ({availableCoupons.length})
                </h3>
                {couponsLoading ? (
                  <p className="text-muted-foreground text-center py-8">로딩 중...</p>
                ) : availableCoupons.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">사용 가능한 쿠폰이 없습니다</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {availableCoupons.map((coupon) => (
                      <Card
                        key={coupon.id}
                        className="cursor-pointer hover:border-primary transition-colors"
                        onClick={() => {
                          setSelectedCoupon(coupon);
                          setShowUseConfirm(true);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-lg">{coupon.name}</h4>
                              <p className="text-2xl font-bold text-primary mt-1">
                                {coupon.discountType === "percent"
                                  ? `${coupon.discountValue}% 할인`
                                  : `${coupon.discountValue.toLocaleString()}원 할인`}
                              </p>
                              {coupon.description && (
                                <p className="text-sm text-muted-foreground mt-1">{coupon.description}</p>
                              )}
                              {coupon.validUntil && (
                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(coupon.validUntil), "yyyy.MM.dd", { locale: ko })}까지
                                </p>
                              )}
                            </div>
                            <Button size="sm" className="shrink-0">
                              사용하기
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {usedCoupons.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    사용 완료 ({usedCoupons.length})
                  </h3>
                  <div className="space-y-2">
                    {usedCoupons.map((coupon) => (
                      <Card key={coupon.id} className="bg-muted/30 opacity-60">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium line-through">{coupon.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {coupon.usedAt && format(new Date(coupon.usedAt), "yyyy.MM.dd HH:mm", { locale: ko })} 사용
                              </p>
                            </div>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              사용완료
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="messages">
            {messagesLoading ? (
              <p className="text-muted-foreground text-center py-8">로딩 중...</p>
            ) : myMessages.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">받은 쪽지가 없습니다</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {myMessages.map((message) => (
                  <Card
                    key={message.id}
                    className={`cursor-pointer transition-colors ${!message.isRead ? "border-primary bg-primary/5" : ""}`}
                    onClick={() => {
                      setSelectedMessage(message);
                      if (!message.isRead) {
                        markAsReadMutation.mutate(message.id);
                      }
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        {message.isRead ? (
                          <MailOpen className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <Mail className="w-5 h-5 text-primary" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${!message.isRead ? "text-primary" : ""}`}>
                            {message.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {message.createdAt && format(new Date(message.createdAt), "yyyy.MM.dd HH:mm", { locale: ko })}
                          </p>
                        </div>
                        {!message.isRead && (
                          <Badge variant="default" className="shrink-0">NEW</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={showUseConfirm} onOpenChange={setShowUseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>쿠폰 사용</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="text-center py-4">
                <p className="text-2xl font-bold text-primary mb-2">{selectedCoupon?.name}</p>
                <p className="text-4xl font-bold">
                  {selectedCoupon?.discountType === "percent"
                    ? `${selectedCoupon?.discountValue}% 할인`
                    : `${selectedCoupon?.discountValue.toLocaleString()}원 할인`}
                </p>
              </div>
              <p className="text-center text-sm text-destructive">
                ⚠️ 쿠폰 사용 후에는 취소할 수 없습니다.<br />
                직원에게 이 화면을 보여주고 사용 버튼을 눌러주세요.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedCoupon) {
                  useCouponMutation.mutate(selectedCoupon.id);
                }
              }}
              disabled={useCouponMutation.isPending}
              className="bg-primary"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              사용 완료
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedMessage?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              {selectedMessage?.createdAt && format(new Date(selectedMessage.createdAt), "yyyy년 MM월 dd일 HH:mm", { locale: ko })}
            </p>
            <div className="whitespace-pre-wrap text-sm">
              {selectedMessage?.content}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
