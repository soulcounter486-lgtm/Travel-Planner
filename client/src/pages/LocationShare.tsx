import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/lib/i18n";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calculator,
  Eye,
  Wallet,
  MessageCircle,
  Sparkles,
  FileText,
  ShoppingBag,
  MapPin,
  Navigation,
  RefreshCw,
  Trash2,
  Clock,
  Users
} from "lucide-react";
import { motion } from "framer-motion";
import logoImg from "@assets/BackgroundEraser_20240323_103507859_1768275315346.png";
import type { UserLocation } from "@shared/schema";

export default function LocationShare() {
  const { language, t } = useLanguage();
  const queryClient = useQueryClient();
  const [myNickname] = useState(() => localStorage.getItem("chat_nickname") || "");
  const [isSharing, setIsSharing] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const { data: locations = [], isLoading, refetch } = useQuery<UserLocation[]>({
    queryKey: ["/api/locations"],
    refetchInterval: 30000,
  });

  const labels: Record<string, Record<string, string>> = {
    ko: {
      title: "위치 공유 지도",
      subtitle: "여행자들의 현재 위치를 확인하세요",
      shareLocation: "내 위치 공유",
      deleteLocation: "내 위치 삭제",
      noLocations: "공유된 위치가 없습니다",
      refresh: "새로고침",
      sharedLocations: "공유된 위치",
      expiresIn: "만료까지",
      hours: "시간",
      backToChat: "채팅방으로",
    },
    en: {
      title: "Location Sharing Map",
      subtitle: "See where travelers are right now",
      shareLocation: "Share My Location",
      deleteLocation: "Delete My Location",
      noLocations: "No shared locations",
      refresh: "Refresh",
      sharedLocations: "Shared Locations",
      expiresIn: "Expires in",
      hours: "hours",
      backToChat: "Back to Chat",
    },
    zh: {
      title: "位置共享地图",
      subtitle: "查看旅行者的当前位置",
      shareLocation: "分享我的位置",
      deleteLocation: "删除我的位置",
      noLocations: "没有共享位置",
      refresh: "刷新",
      sharedLocations: "共享位置",
      expiresIn: "到期",
      hours: "小时",
      backToChat: "返回聊天",
    },
    vi: {
      title: "Bản đồ chia sẻ vị trí",
      subtitle: "Xem vị trí hiện tại của du khách",
      shareLocation: "Chia sẻ vị trí",
      deleteLocation: "Xóa vị trí",
      noLocations: "Không có vị trí được chia sẻ",
      refresh: "Làm mới",
      sharedLocations: "Vị trí đã chia sẻ",
      expiresIn: "Hết hạn trong",
      hours: "giờ",
      backToChat: "Quay lại chat",
    },
    ru: {
      title: "Карта геолокации",
      subtitle: "Смотрите, где сейчас путешественники",
      shareLocation: "Поделиться местом",
      deleteLocation: "Удалить моё место",
      noLocations: "Нет доступных мест",
      refresh: "Обновить",
      sharedLocations: "Общие места",
      expiresIn: "Истекает через",
      hours: "часов",
      backToChat: "В чат",
    },
    ja: {
      title: "位置共有マップ",
      subtitle: "旅行者の現在地を確認",
      shareLocation: "位置を共有",
      deleteLocation: "位置を削除",
      noLocations: "共有された位置はありません",
      refresh: "更新",
      sharedLocations: "共有された位置",
      expiresIn: "期限まで",
      hours: "時間",
      backToChat: "チャットへ戻る",
    },
  };

  const label = labels[language] || labels.ko;

  const handleShareLocation = async () => {
    if (!navigator.geolocation) {
      alert(language === "ko" ? "위치 서비스를 지원하지 않는 브라우저입니다." : "Geolocation is not supported.");
      return;
    }
    
    if (!myNickname) {
      alert(language === "ko" ? "채팅방에서 먼저 닉네임을 설정해주세요." : "Please set your nickname in the chat room first.");
      return;
    }
    
    setIsSharing(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          await apiRequest("POST", "/api/locations", {
            nickname: myNickname,
            latitude,
            longitude,
            message: language === "ko" ? "현재 여기 있어요!" : "I'm here now!",
          });
          
          refetch();
        } catch (error) {
          console.error("Failed to share location:", error);
          alert(language === "ko" ? "위치 공유에 실패했습니다." : "Failed to share location.");
        } finally {
          setIsSharing(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsSharing(false);
        alert(language === "ko" ? "위치를 가져올 수 없습니다." : "Could not get your location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleDeleteLocation = async () => {
    if (!myNickname) return;
    
    try {
      await apiRequest("DELETE", `/api/locations/${encodeURIComponent(myNickname)}`);
      refetch();
    } catch (error) {
      console.error("Failed to delete location:", error);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const myLocation = locations.find(loc => loc.nickname === myNickname);

  const initMap = useCallback(() => {
    if (!window.google || locations.length === 0) return;
    
    const mapElement = document.getElementById("location-map");
    if (!mapElement) return;

    const center = locations.length > 0 
      ? { lat: parseFloat(locations[0].latitude), lng: parseFloat(locations[0].longitude) }
      : { lat: 10.3460, lng: 107.0843 };

    const map = new google.maps.Map(mapElement, {
      zoom: 14,
      center,
      mapTypeId: "roadmap",
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
      ],
    });

    locations.forEach((loc, index) => {
      const isMe = loc.nickname === myNickname;
      const marker = new google.maps.Marker({
        position: { lat: parseFloat(loc.latitude), lng: parseFloat(loc.longitude) },
        map,
        title: loc.nickname,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isMe ? 12 : 10,
          fillColor: isMe ? "#22c55e" : "#3b82f6",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3,
        },
        label: {
          text: loc.nickname.charAt(0).toUpperCase(),
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: "bold",
        },
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 150px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${loc.nickname}</div>
            ${loc.message ? `<div style="color: #666; font-size: 12px;">${loc.message}</div>` : ""}
            ${loc.placeName ? `<div style="color: #3b82f6; font-size: 12px; margin-top: 4px;">${loc.placeName}</div>` : ""}
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });
    });

    if (locations.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      locations.forEach(loc => {
        bounds.extend({ lat: parseFloat(loc.latitude), lng: parseFloat(loc.longitude) });
      });
      map.fitBounds(bounds);
    }
  }, [locations, myNickname]);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        return;
      }
      
      try {
        const response = await fetch("/api/maps-key");
        const data = await response.json();
        if (data.key) {
          const script = document.createElement("script");
          script.src = `https://maps.googleapis.com/maps/api/js?key=${data.key}&libraries=places`;
          script.async = true;
          script.defer = true;
          script.onload = () => setMapLoaded(true);
          document.head.appendChild(script);
        }
      } catch (error) {
        console.error("Failed to load Google Maps:", error);
      }
    };
    
    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (mapLoaded && locations.length > 0) {
      initMap();
    }
  }, [mapLoaded, locations, initMap]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={logoImg} alt="Logo" className="h-10 w-10 object-contain" />
            <span className="font-bold text-lg hidden sm:inline">{t("header.title")}</span>
          </Link>
          <nav className="flex gap-1.5 overflow-x-auto">
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-calculator">
                <Calculator className="w-3.5 h-3.5" />
                {t("nav.calculator")}
              </Button>
            </Link>
            <Link href="/guide">
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-guide">
                <Eye className="w-3.5 h-3.5" />
                {t("nav.guide")}
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-chat">
                <MessageCircle className="w-3.5 h-3.5" />
                {t("nav.chat")}
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <MapPin className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">{label.title}</h1>
          </div>
          <p className="text-muted-foreground">{label.subtitle}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-0">
              <div 
                id="location-map" 
                className="w-full h-[500px] rounded-lg bg-muted flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : locations.length === 0 ? (
                  <div className="text-center text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{label.noLocations}</p>
                  </div>
                ) : !mapLoaded ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Loading map...</span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    {myNickname || "Guest"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => refetch()}
                    data-testid="btn-refresh-locations"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleShareLocation}
                  disabled={isSharing || !myNickname}
                  data-testid="btn-share-my-location"
                >
                  {isSharing ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4 mr-2" />
                  )}
                  {label.shareLocation}
                </Button>
                
                {myLocation && (
                  <Button
                    variant="outline"
                    className="w-full text-red-500 hover:text-red-600"
                    onClick={handleDeleteLocation}
                    data-testid="btn-delete-my-location"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {label.deleteLocation}
                  </Button>
                )}

                <Link href="/chat">
                  <Button variant="outline" className="w-full" data-testid="btn-back-to-chat">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {label.backToChat}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {label.sharedLocations} ({locations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[280px]">
                  <div className="space-y-2">
                    {locations.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {label.noLocations}
                      </p>
                    ) : (
                      locations.map((loc) => (
                        <div
                          key={loc.id}
                          className={`p-3 rounded-lg ${
                            loc.nickname === myNickname ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{loc.nickname}</span>
                            {loc.nickname === myNickname && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                          {loc.message && (
                            <p className="text-xs text-muted-foreground mb-1">{loc.message}</p>
                          )}
                          {loc.placeName && (
                            <p className="text-xs text-primary">{loc.placeName}</p>
                          )}
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{label.expiresIn}: {getTimeRemaining(loc.expiresAt as unknown as string)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

declare global {
  interface Window {
    google: any;
  }
  const google: any;
}
