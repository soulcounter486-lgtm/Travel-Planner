import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Users,
  Radio,
  Search,
  Utensils,
  Coffee,
  Camera,
  Star,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import logoImg from "@assets/BackgroundEraser_20240323_103507859_1768275315346.png";
import type { UserLocation } from "@shared/schema";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function LocationShare() {
  const { language, t } = useLanguage();
  const queryClient = useQueryClient();
  const [myNickname] = useState(() => localStorage.getItem("chat_nickname") || "");
  const [isSharing, setIsSharing] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const [selectedPlaceType, setSelectedPlaceType] = useState<"restaurant" | "cafe" | "tourist">("restaurant");
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

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
      realTimeTracking: "실시간 트래킹",
      trackingOn: "2초마다 위치 자동 업데이트",
      trackingOff: "수동 공유 모드",
      nearbyPlaces: "주변 장소 검색",
      restaurant: "맛집",
      cafe: "카페",
      tourist: "관광지",
      searchNearby: "주변 검색",
      noPlacesFound: "검색 결과가 없습니다",
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
      realTimeTracking: "Real-time Tracking",
      trackingOn: "Auto-update every 2 seconds",
      trackingOff: "Manual sharing mode",
      nearbyPlaces: "Nearby Places",
      restaurant: "Restaurants",
      cafe: "Cafes",
      tourist: "Attractions",
      searchNearby: "Search Nearby",
      noPlacesFound: "No places found",
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
      realTimeTracking: "实时跟踪",
      trackingOn: "每2秒自动更新",
      trackingOff: "手动分享模式",
      nearbyPlaces: "附近地点",
      restaurant: "餐厅",
      cafe: "咖啡厅",
      tourist: "景点",
      searchNearby: "搜索附近",
      noPlacesFound: "未找到地点",
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
      realTimeTracking: "Theo dõi thời gian thực",
      trackingOn: "Tự động cập nhật mỗi 2 giây",
      trackingOff: "Chế độ chia sẻ thủ công",
      nearbyPlaces: "Địa điểm gần đây",
      restaurant: "Nhà hàng",
      cafe: "Quán cà phê",
      tourist: "Điểm du lịch",
      searchNearby: "Tìm gần đây",
      noPlacesFound: "Không tìm thấy",
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
      realTimeTracking: "Отслеживание в реальном времени",
      trackingOn: "Авто-обновление каждые 2 секунды",
      trackingOff: "Ручной режим",
      nearbyPlaces: "Ближайшие места",
      restaurant: "Рестораны",
      cafe: "Кафе",
      tourist: "Достопримечательности",
      searchNearby: "Искать рядом",
      noPlacesFound: "Места не найдены",
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
      realTimeTracking: "リアルタイム追跡",
      trackingOn: "2秒ごとに自動更新",
      trackingOff: "手動共有モード",
      nearbyPlaces: "近くの場所",
      restaurant: "レストラン",
      cafe: "カフェ",
      tourist: "観光地",
      searchNearby: "近くを検索",
      noPlacesFound: "場所が見つかりません",
    },
  };

  const label = labels[language] || labels.ko;

  // Search nearby places using SerpAPI
  const searchNearbyPlaces = async () => {
    if (!myLocation) {
      alert(language === "ko" ? "먼저 내 위치를 공유해주세요." : "Please share your location first.");
      return;
    }
    
    setIsSearchingPlaces(true);
    try {
      const typeQuery = selectedPlaceType === "restaurant" ? "restaurants" : 
                        selectedPlaceType === "cafe" ? "cafe" : "tourist attractions";
      
      const response = await fetch(
        `/api/nearby-places?lat=${myLocation.latitude}&lng=${myLocation.longitude}&type=${selectedPlaceType}&query=${encodeURIComponent(typeQuery + " Vung Tau")}`
      );
      const data = await response.json();
      
      if (data.places) {
        setNearbyPlaces(data.places);
        
        // Add markers to map
        if (mapRef.current) {
          data.places.forEach((place: any) => {
            if (place.latitude && place.longitude) {
              const marker = L.circleMarker([place.latitude, place.longitude], {
                radius: 8,
                fillColor: selectedPlaceType === "restaurant" ? "#ef4444" : 
                           selectedPlaceType === "cafe" ? "#f59e0b" : "#8b5cf6",
                fillOpacity: 0.8,
                color: "#ffffff",
                weight: 2,
              }).addTo(mapRef.current!);
              
              marker.bindPopup(`
                <div style="min-width: 150px;">
                  <b>${place.name}</b>
                  ${place.rating ? `<div>⭐ ${place.rating} (${place.reviews || 0})</div>` : ""}
                  ${place.address ? `<div style="font-size: 11px; color: #666;">${place.address}</div>` : ""}
                </div>
              `);
            }
          });
        }
      }
    } catch (error) {
      console.error("Search places error:", error);
    } finally {
      setIsSearchingPlaces(false);
    }
  };

  // Update location once (used by both manual and tracking)
  const updateMyLocation = useCallback(async () => {
    if (!navigator.geolocation || !myNickname) return;
    
    return new Promise<void>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            await apiRequest("POST", "/api/locations", {
              nickname: myNickname,
              latitude,
              longitude,
              message: isTracking 
                ? (language === "ko" ? "실시간 트래킹 중" : "Live tracking")
                : (language === "ko" ? "현재 여기 있어요!" : "I'm here now!"),
            });
            refetch();
            resolve();
          } catch (error) {
            console.error("Failed to update location:", error);
            reject(error);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
      );
    });
  }, [myNickname, isTracking, language, refetch]);

  // Real-time tracking effect
  useEffect(() => {
    if (isTracking && myNickname) {
      // Initial update
      updateMyLocation().catch(console.error);
      
      // Set interval for continuous updates
      trackingIntervalRef.current = setInterval(() => {
        updateMyLocation().catch(console.error);
      }, 2000); // Update every 2 seconds
      
      // Also refetch locations more frequently when tracking
      const locationsInterval = setInterval(() => {
        refetch();
      }, 2000); // Refresh list every 2 seconds
      
      return () => {
        if (trackingIntervalRef.current) {
          clearInterval(trackingIntervalRef.current);
          trackingIntervalRef.current = null;
        }
        clearInterval(locationsInterval);
      };
    } else {
      // Clean up when tracking stops
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
        trackingIntervalRef.current = null;
      }
    }
  }, [isTracking, myNickname, updateMyLocation, refetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

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
        let message = "";
        if (error.code === 1) {
          message = language === "ko" 
            ? "위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요." 
            : "Location permission denied. Please allow location access in browser settings.";
        } else if (error.code === 2) {
          message = language === "ko" 
            ? "위치 정보를 사용할 수 없습니다. GPS를 켜주세요." 
            : "Location unavailable. Please enable GPS.";
        } else if (error.code === 3) {
          message = language === "ko" 
            ? "위치 요청 시간이 초과되었습니다. 다시 시도해주세요." 
            : "Location request timed out. Please try again.";
        } else {
          message = language === "ko" ? "위치를 가져올 수 없습니다." : "Could not get your location.";
        }
        alert(message);
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

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Create map if not exists
    if (!mapRef.current) {
      const defaultCenter: L.LatLngExpression = [10.3460, 107.0843]; // Vung Tau
      mapRef.current = L.map(mapContainerRef.current).setView(defaultCenter, 14);
      
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapRef.current?.removeLayer(layer);
      }
    });

    // Add markers for each location
    locations.forEach((loc) => {
      const isMe = loc.nickname === myNickname;
      const lat = parseFloat(loc.latitude);
      const lng = parseFloat(loc.longitude);

      // Create custom circle marker
      const marker = L.circleMarker([lat, lng], {
        radius: isMe ? 12 : 10,
        fillColor: isMe ? "#22c55e" : "#3b82f6",
        fillOpacity: 1,
        color: "#ffffff",
        weight: 3,
      }).addTo(mapRef.current!);

      // Add popup
      const popupContent = `
        <div style="padding: 4px; min-width: 120px;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${loc.nickname}</div>
          ${loc.message ? `<div style="color: #666; font-size: 12px;">${loc.message}</div>` : ""}
          ${loc.placeName ? `<div style="color: #3b82f6; font-size: 12px; margin-top: 4px;">${loc.placeName}</div>` : ""}
        </div>
      `;
      marker.bindPopup(popupContent);

      // Add label
      const label = L.divIcon({
        className: "leaflet-label",
        html: `<div style="background: ${isMe ? "#22c55e" : "#3b82f6"}; color: white; font-weight: bold; font-size: 11px; padding: 2px 6px; border-radius: 4px; white-space: nowrap; transform: translateX(-50%);">${loc.nickname}</div>`,
        iconSize: [0, 0],
        iconAnchor: [0, -15],
      });
      L.marker([lat, lng], { icon: label }).addTo(mapRef.current!);
    });

    // Fit bounds if multiple locations
    if (locations.length > 0) {
      const bounds = L.latLngBounds(
        locations.map((loc) => [parseFloat(loc.latitude), parseFloat(loc.longitude)] as L.LatLngTuple)
      );
      if (locations.length > 1) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      } else {
        mapRef.current.setView([parseFloat(locations[0].latitude), parseFloat(locations[0].longitude)], 14);
      }
    }
  }, [locations, myNickname]);

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
            <CardContent className="p-0 relative">
              <div 
                ref={mapContainerRef}
                className="w-full h-[500px] rounded-lg z-0"
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </div>
              )}
              {!isLoading && locations.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg pointer-events-none">
                  <div className="text-center text-muted-foreground">
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{label.noLocations}</p>
                  </div>
                </div>
              )}
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
                {/* Real-time tracking toggle */}
                <div className={`flex items-center justify-between p-3 rounded-lg border ${isTracking ? "bg-green-500/10 border-green-500/30" : "bg-muted/30"}`}>
                  <div className="flex items-center gap-2">
                    <Radio className={`w-4 h-4 ${isTracking ? "text-green-500 animate-pulse" : "text-muted-foreground"}`} />
                    <div>
                      <Label htmlFor="tracking-switch" className="text-sm font-medium cursor-pointer">
                        {label.realTimeTracking}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {isTracking ? label.trackingOn : label.trackingOff}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="tracking-switch"
                    checked={isTracking}
                    onCheckedChange={setIsTracking}
                    disabled={!myNickname}
                    data-testid="switch-tracking"
                  />
                </div>

                {!isTracking && (
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
                )}
                
                {myLocation && !isTracking && (
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

            {/* Nearby Places Search */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  {label.nearbyPlaces}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={selectedPlaceType === "restaurant" ? "default" : "outline"}
                    onClick={() => setSelectedPlaceType("restaurant")}
                    className="flex-1 text-xs"
                  >
                    <Utensils className="w-3 h-3 mr-1" />
                    {label.restaurant}
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedPlaceType === "cafe" ? "default" : "outline"}
                    onClick={() => setSelectedPlaceType("cafe")}
                    className="flex-1 text-xs"
                  >
                    <Coffee className="w-3 h-3 mr-1" />
                    {label.cafe}
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedPlaceType === "tourist" ? "default" : "outline"}
                    onClick={() => setSelectedPlaceType("tourist")}
                    className="flex-1 text-xs"
                  >
                    <Camera className="w-3 h-3 mr-1" />
                    {label.tourist}
                  </Button>
                </div>
                <Button
                  className="w-full"
                  onClick={searchNearbyPlaces}
                  disabled={isSearchingPlaces || !myLocation}
                  data-testid="btn-search-nearby"
                >
                  {isSearchingPlaces ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 mr-2" />
                  )}
                  {label.searchNearby}
                </Button>
                
                {nearbyPlaces.length > 0 && (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {nearbyPlaces.map((place, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-muted/50 text-xs">
                          <div className="font-medium">{place.name}</div>
                          {place.rating && (
                            <div className="flex items-center gap-1 text-yellow-500">
                              <Star className="w-3 h-3 fill-current" />
                              <span>{place.rating}</span>
                              <span className="text-muted-foreground">({place.reviews || 0})</span>
                            </div>
                          )}
                          {place.address && (
                            <div className="text-muted-foreground truncate">{place.address}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
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
