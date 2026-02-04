import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Ticket, MessageSquare, CheckCircle2, Clock, Gift, Mail, MailOpen, X, MapPin, Navigation, Map, Bell, BellOff } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link, useSearch } from "wouter";
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
  placeId?: number;
  placeName?: string;
  placeAddress?: string;
  placeLatitude?: string;
  placeLongitude?: string;
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
  const { isSupported, isSubscribed, isLoading: pushLoading, subscribe, unsubscribe, permission } = usePushNotifications(true, !!user);
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const tabFromUrl = urlParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl === "messages" ? "messages" : "coupons");
  const [selectedCoupon, setSelectedCoupon] = useState<MyCoupon | null>(null);
  const [showUseConfirm, setShowUseConfirm] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showInlineMap, setShowInlineMap] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const handleNotificationToggle = async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast({ title: "알림이 해제되었습니다" });
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast({ title: "알림이 설정되었습니다", description: "새 쪽지나 쿠폰이 도착하면 알림을 받습니다" });
      } else if (permission === "denied") {
        toast({ title: "알림 권한이 거부되었습니다", description: "브라우저 설정에서 알림을 허용해주세요", variant: "destructive" });
      }
    }
  };

  useEffect(() => {
    if (tabFromUrl && ["coupons", "messages"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    if (showInlineMap && selectedCoupon?.placeLatitude && selectedCoupon?.placeLongitude && mapContainerRef.current) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      
      const lat = parseFloat(selectedCoupon.placeLatitude);
      const lng = parseFloat(selectedCoupon.placeLongitude);
      
      const map = L.map(mapContainerRef.current).setView([lat, lng], 16);
      mapInstanceRef.current = map;
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
      
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background: #3b82f6; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });
      
      L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`<strong>${selectedCoupon.placeName || "위치"}</strong><br/>${selectedCoupon.placeAddress || ""}`)
        .openPopup();
      
      setTimeout(() => map.invalidateSize(), 100);
    }
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [showInlineMap, selectedCoupon]);

  useEffect(() => {
    if (!showUseConfirm) {
      setShowInlineMap(false);
    }
  }, [showUseConfirm]);

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
          
          {/* 푸시 알림 토글 */}
          {isSupported && (
            <Button
              variant={isSubscribed ? "default" : "outline"}
              size="sm"
              onClick={handleNotificationToggle}
              disabled={pushLoading}
              className="ml-auto flex items-center gap-2"
              data-testid="button-notification-toggle"
            >
              {pushLoading ? (
                <span className="animate-spin">⏳</span>
              ) : isSubscribed ? (
                <>
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline">알림 ON</span>
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4" />
                  <span className="hidden sm:inline">알림 OFF</span>
                </>
              )}
            </Button>
          )}
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
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md mx-4">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-center">
              쿠폰 사용
              <span className="block text-sm font-normal text-muted-foreground mt-1">Sử dụng phiếu giảm giá</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4" asChild>
              <div>
                <div className="text-center py-6 mx-auto">
                  <div className="border-2 border-dashed border-primary/30 rounded-xl p-6 bg-gradient-to-b from-primary/5 to-transparent">
                    <p className="text-xl font-bold text-primary mb-3">{selectedCoupon?.name}</p>
                    <p className="text-3xl font-bold text-center leading-tight">
                      {selectedCoupon?.discountType === "percent"
                        ? `${selectedCoupon?.discountValue}% 할인`
                        : `${selectedCoupon?.discountValue.toLocaleString()}원 할인`}
                    </p>
                    <p className="text-2xl font-semibold text-primary/80 mt-1">
                      {selectedCoupon?.discountType === "percent"
                        ? `Giảm ${selectedCoupon?.discountValue}%`
                        : `Giảm ${selectedCoupon?.discountValue.toLocaleString()}₩`}
                    </p>
                  </div>
                </div>
                {selectedCoupon?.placeName && (
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>사용 가능 장소 / Địa điểm: {selectedCoupon.placeName}</span>
                    </div>
                    {selectedCoupon.placeAddress && (
                      <p className="text-xs text-muted-foreground ml-6">{selectedCoupon.placeAddress}</p>
                    )}
                    {selectedCoupon.placeLatitude && selectedCoupon.placeLongitude && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 mt-2 justify-center">
                          <Button
                            size="sm"
                            variant={showInlineMap ? "default" : "outline"}
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowInlineMap(!showInlineMap);
                            }}
                            data-testid="button-view-map"
                          >
                            <Map className="w-3 h-3 mr-1" />
                            {showInlineMap ? "지도닫기 / Đóng" : "지도보기 / Bản đồ"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedCoupon.placeLatitude},${selectedCoupon.placeLongitude}`, "_blank");
                            }}
                            data-testid="button-directions"
                          >
                            <Navigation className="w-3 h-3 mr-1" />
                            길찾기 / Chỉ đường
                          </Button>
                        </div>
                        {showInlineMap && (
                          <div 
                            ref={mapContainerRef}
                            className="w-full h-48 rounded-lg overflow-hidden border"
                            style={{ minHeight: "192px" }}
                            data-testid="inline-map-container"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
                <p className="text-center text-sm text-destructive mt-4">
                  쿠폰 사용 후에는 취소할 수 없습니다.<br />
                  <span className="text-xs text-muted-foreground">Sau khi sử dụng phiếu giảm giá, bạn không thể hủy.</span><br />
                  직원에게 이 화면을 보여주고 사용 버튼을 눌러주세요.<br />
                  <span className="text-xs text-muted-foreground">Vui lòng cho nhân viên xem màn hình này và nhấn nút sử dụng.</span>
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={useCouponMutation.isSuccess}>취소 / Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedCoupon && !useCouponMutation.isSuccess) {
                  useCouponMutation.mutate(selectedCoupon.id);
                }
              }}
              disabled={useCouponMutation.isPending || useCouponMutation.isSuccess}
              className={useCouponMutation.isSuccess ? "bg-green-600" : "bg-primary"}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {useCouponMutation.isSuccess ? "사용 완료 / Đã sử dụng" : "사용하기 / Sử dụng"}
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
