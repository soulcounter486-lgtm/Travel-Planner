import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Mail, Ticket, ArrowLeft, Check, Gift, LogIn, User, Calendar, UserCircle, MapPin, Navigation } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface Message {
  id: number;
  senderId: string;
  receiverId: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface UserCoupon {
  id: number;
  couponId: number;
  name: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  validFrom: string | null;
  validUntil: string | null;
  isUsed: boolean;
  usedAt: string | null;
  issuedAt: string;
  placeId?: number;
  placeName?: string;
  placeAddress?: string;
  placeLatitude?: string;
  placeLongitude?: string;
}

export default function MyPage() {
  const { toast } = useToast();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [couponToUse, setCouponToUse] = useState<UserCoupon | null>(null);
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  // URL 쿼리에서 탭 파라미터 읽기
  const urlParams = new URLSearchParams(searchString);
  const tabFromUrl = urlParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "profile");

  // URL 파라미터 변경 시 탭 업데이트
  useEffect(() => {
    if (tabFromUrl && ["messages", "coupons", "profile"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/my-messages"],
    enabled: isAuthenticated,
  });

  const { data: coupons = [], isLoading: couponsLoading } = useQuery<UserCoupon[]>({
    queryKey: ["/api/my-coupons"],
    enabled: isAuthenticated,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/my-messages/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-notifications"] });
    },
  });

  const useCouponMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/my-coupons/${id}/use`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-coupons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-notifications"] });
      setCouponToUse(null);
      toast({ title: "쿠폰이 사용 처리되었습니다", description: "할인이 적용됩니다!" });
    },
  });

  const handleUseCoupon = (coupon: UserCoupon) => {
    setCouponToUse(coupon);
  };

  const confirmUseCoupon = () => {
    if (couponToUse) {
      useCouponMutation.mutate(couponToUse.id);
    }
  };

  const handleOpenMessage = (msg: Message) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      markAsReadMutation.mutate(msg.id);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-foreground">로딩 중...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold">마이페이지</h1>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <LogIn className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">로그인이 필요합니다</p>
              <a href="/api/auth/kakao">
                <Button className="bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E]">
                  카카오로 로그인
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const unreadCount = messages.filter((m) => !m.isRead).length;
  const unusedCouponCount = coupons.filter((c) => !c.isUsed).length;

  // 사용자 정보 표시 헬퍼
  const getUserDisplayName = () => {
    if (user?.nickname) return user.nickname;
    if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`;
    if (user?.firstName) return user.firstName;
    return "미설정";
  };

  const getGenderDisplay = () => {
    if (user?.gender === "male") return "남성";
    if (user?.gender === "female") return "여성";
    return "미설정";
  };

  const getLoginProvider = () => {
    if (user?.id?.startsWith("kakao_")) return "카카오";
    if (user?.id?.startsWith("google:")) return "구글";
    return "Replit";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">마이페이지</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="profile" className="text-sm" data-testid="tab-profile">
              <User className="w-4 h-4 mr-1" />
              회원정보
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-sm" data-testid="tab-messages">
              <Mail className="w-4 h-4 mr-1" />
              쪽지함
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="coupons" className="text-sm" data-testid="tab-coupons">
              <Ticket className="w-4 h-4 mr-1" />
              쿠폰함
              {unusedCouponCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                  {unusedCouponCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* 회원정보 탭 */}
          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <UserCircle className="w-5 h-5" />
                  회원 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">
                {/* 프로필 이미지 */}
                <div className="flex justify-center">
                  {user?.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="프로필" 
                      className="w-20 h-20 rounded-full border-2 border-primary/20"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* 회원 정보 목록 */}
                <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">로그인 방식</span>
                    <Badge variant="outline" className="text-xs">
                      {getLoginProvider()}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">이메일</span>
                    <span className="text-sm font-medium">{user?.email || "미설정"}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">성명(별명)</span>
                    <span className="text-sm font-medium">{getUserDisplayName()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">성별</span>
                    <span className="text-sm font-medium">{getGenderDisplay()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-sm text-muted-foreground">생년월일</span>
                    <span className="text-sm font-medium">
                      {user?.birthDate ? format(new Date(user.birthDate), "yyyy년 MM월 dd일") : "미설정"}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-muted-foreground">가입일</span>
                    <span className="text-sm font-medium">
                      {user?.createdAt ? format(new Date(user.createdAt), "yyyy년 MM월 dd일") : "-"}
                    </span>
                  </div>
                </div>

                {/* 계정 정보 안내 */}
                <div className="bg-primary/5 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    회원정보 수정이 필요한 경우 관리자에게 문의해주세요
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="mt-4">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">받은 쪽지 ({messages.length}개)</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {messagesLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">로딩 중...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">받은 쪽지가 없습니다</p>
                ) : (
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          msg.isRead ? "bg-muted/30" : "bg-primary/5 border-primary/30"
                        }`}
                        onClick={() => handleOpenMessage(msg)}
                        data-testid={`message-item-${msg.id}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {!msg.isRead && (
                                <Badge variant="default" className="h-4 px-1 text-[9px]">
                                  NEW
                                </Badge>
                              )}
                              <span className="font-medium text-sm truncate">{msg.title}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(msg.createdAt), "yyyy.MM.dd HH:mm")}
                            </p>
                          </div>
                          <Mail className={`w-4 h-4 shrink-0 ${msg.isRead ? "text-muted-foreground" : "text-primary"}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coupons" className="mt-4">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm">내 쿠폰 ({coupons.length}개)</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {couponsLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">로딩 중...</p>
                ) : coupons.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">보유한 쿠폰이 없습니다</p>
                ) : (
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {coupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className={`p-3 rounded-lg border ${
                          coupon.isUsed ? "bg-muted/50 opacity-60" : "bg-gradient-to-r from-primary/5 to-accent/5"
                        }`}
                        data-testid={`coupon-item-${coupon.id}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Gift className={`w-4 h-4 ${coupon.isUsed ? "text-muted-foreground" : "text-primary"}`} />
                              <span className={`font-medium text-sm ${coupon.isUsed ? "line-through" : ""}`}>
                                {coupon.name}
                              </span>
                              <Badge variant={coupon.isUsed ? "secondary" : "default"} className="h-5 px-1.5 text-[10px]">
                                {coupon.discountType === "percent"
                                  ? `${coupon.discountValue}% 할인`
                                  : `${coupon.discountValue.toLocaleString()}원 할인`}
                              </Badge>
                            </div>
                            {coupon.description && (
                              <p className="text-xs text-muted-foreground mt-1">{coupon.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                              <span>발급일: {format(new Date(coupon.issuedAt), "yyyy.MM.dd")}</span>
                              {coupon.validUntil && (
                                <span>· 유효기간: ~{format(new Date(coupon.validUntil), "yyyy.MM.dd")}</span>
                              )}
                            </div>
                          </div>
                          {coupon.isUsed ? (
                            <Badge variant="outline" className="shrink-0 text-xs">
                              <Check className="w-3 h-3 mr-1" />
                              사용완료
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="shrink-0 h-7 text-xs"
                              onClick={() => handleUseCoupon(coupon)}
                              disabled={useCouponMutation.isPending}
                              data-testid={`button-use-coupon-${coupon.id}`}
                            >
                              사용하기
                            </Button>
                          )}
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

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{selectedMessage?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {selectedMessage && format(new Date(selectedMessage.createdAt), "yyyy년 MM월 dd일 HH:mm")}
            </p>
            <div className="p-3 bg-muted/30 rounded-lg min-h-[100px]">
              <p className="text-sm whitespace-pre-wrap">{selectedMessage?.content}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!couponToUse} onOpenChange={() => setCouponToUse(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg text-center">
              쿠폰 사용 확인
              <span className="block text-sm font-normal text-muted-foreground mt-1">Xác nhận sử dụng phiếu giảm giá</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Gift className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-1">{couponToUse?.name}</h3>
              <Badge variant="default" className="text-sm px-3 py-1">
                {couponToUse?.discountType === "percent"
                  ? `${couponToUse?.discountValue}% 할인 / Giảm ${couponToUse?.discountValue}%`
                  : `${couponToUse?.discountValue?.toLocaleString()}원 할인 / Giảm ${couponToUse?.discountValue?.toLocaleString()}₩`}
              </Badge>
              {couponToUse?.description && (
                <p className="text-sm text-muted-foreground mt-3">{couponToUse.description}</p>
              )}
            </div>
            {couponToUse?.placeName && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>사용 가능 장소: {couponToUse.placeName}</span>
                </div>
                {couponToUse.placeAddress && (
                  <p className="text-xs text-muted-foreground ml-6">{couponToUse.placeAddress}</p>
                )}
                {couponToUse.placeLatitude && couponToUse.placeLongitude && (
                  <div className="flex gap-2 ml-6 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/guide?lat=${couponToUse.placeLatitude}&lng=${couponToUse.placeLongitude}&name=${encodeURIComponent(couponToUse.placeName || "")}`, "_blank");
                      }}
                      data-testid="button-view-map"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      지도보기
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${couponToUse.placeLatitude},${couponToUse.placeLongitude}`, "_blank");
                      }}
                      data-testid="button-directions"
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      길찾기
                    </Button>
                  </div>
                )}
              </div>
            )}
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
              <p className="text-sm text-destructive font-medium">
                사용 후에는 취소할 수 없습니다
              </p>
              <p className="text-xs text-destructive/80 mt-1">
                Không thể hủy sau khi sử dụng
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCouponToUse(null)}
                data-testid="button-cancel-coupon"
              >
                취소 / Hủy
              </Button>
              <Button
                className="flex-1"
                onClick={confirmUseCoupon}
                disabled={useCouponMutation.isPending}
                data-testid="button-confirm-coupon"
              >
                {useCouponMutation.isPending ? "처리 중..." : "사용하기 / Sử dụng"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
