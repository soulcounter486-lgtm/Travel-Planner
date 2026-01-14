import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/i18n";
import { MapPin, Phone, ExternalLink, Utensils, Coffee, Scissors, Building2, Camera, ChevronDown, ChevronUp, AlertTriangle, Calculator, MessageCircle, Eye, Download, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "@assets/BackgroundEraser_20240323_103507859_1768371269457.png";

interface Place {
  name: string;
  nameVi?: string;
  address?: string;
  phone?: string;
  mapUrl: string;
  note?: string;
  recommended?: boolean;
}

interface Category {
  id: string;
  icon: React.ElementType;
  gradient: string;
  places: Place[];
}

const placesData: Record<string, Category> = {
  attractions: {
    id: "attractions",
    icon: Camera,
    gradient: "from-blue-500 to-indigo-600",
    places: [
      { name: "붕따우 거대 예수상", nameVi: "Tượng Chúa Kitô", mapUrl: "https://maps.app.goo.gl/CgLqYEKGLxodn27B8" },
      { name: "붕따우 등대", nameVi: "Hải Đăng Vũng Tàu", mapUrl: "https://maps.app.goo.gl/HMJbSLCR3bzZxsxy8", note: "largeVehicleNo" },
      { name: "전쟁기념관", nameVi: "Bà Rịa–Vũng Tàu Provincial museum", phone: "0254 3852 421", mapUrl: "https://maps.app.goo.gl/YiF3HpgZvXtKTfMCA" },
      { name: "화이트 펠리스(띠우 별장)", nameVi: "Bạch Dinh (White Palace)", mapUrl: "https://maps.app.goo.gl/LDkeQHy1Watfec51A" },
      { name: "놀이동산", nameVi: "Ho May Amusement Park", mapUrl: "https://maps.app.goo.gl/vM6tXvAXi4tTNhUV6" },
      { name: "불교사찰", nameVi: "Chơn Không Monastery", mapUrl: "https://maps.app.goo.gl/THctAg3uEvx9q9ZLA", note: "largeVehicleNo" },
      { name: "붕따우 백비치", nameVi: "Bãi Sau", mapUrl: "https://maps.app.goo.gl/UCARs7msTkaUr2HW6" },
      { name: "붕따우 프론트 비치", nameVi: "Front Beach", mapUrl: "https://maps.app.goo.gl/Uz5gy2Tsg3kQm4QCA" },
      { name: "땀탕기념타워", nameVi: "Tháp Tầm", mapUrl: "https://maps.app.goo.gl/HHr2NF7upTr7Djhy9" },
      { name: "돼지언덕", nameVi: "Đồi Con Heo", mapUrl: "https://maps.app.goo.gl/Y8nMHFU7xAdXH7e48", note: "largeVehicleNo" },
      { name: "원숭이사원", nameVi: "Chùa Khỉ Viba", mapUrl: "https://maps.app.goo.gl/LmQ7U7VDgi9n8aGH8", note: "largeVehicleNo" },
      { name: "붕따우 해산물 시장", nameVi: "Seafood Market", mapUrl: "https://maps.app.goo.gl/BLVTP1tarzKrXZN28" },
      { name: "붕따우 시장", nameVi: "Chợ Vũng Tàu 1985", mapUrl: "https://maps.app.goo.gl/1Zpepi95K4garY268" },
    ]
  },
  localFood: {
    id: "localFood",
    icon: Utensils,
    gradient: "from-orange-500 to-red-500",
    places: [
      { name: "꼬바붕따우 1호점 (반콧,반쎄오)", nameVi: "Cô Ba Restaurant", phone: "0254 3526 165", mapUrl: "https://maps.app.goo.gl/LvFosNMLSi1LSRvz6", note: "crowded" },
      { name: "꼬바붕따우 2호점 (반콧,반쎄오)", nameVi: "Cô Ba Restaurant 2", mapUrl: "https://maps.app.goo.gl/ftQz4Z437ZJZn5g68", note: "spacious" },
      { name: "해산물 고급 식당", nameVi: "Gành Hào Seafood Restaurant", phone: "0254 3550 909", mapUrl: "https://maps.app.goo.gl/AVh5Qq9HMRNpbjzBA" },
      { name: "해산물 고급 식당 2호점", nameVi: "Gành Hào 2", mapUrl: "https://maps.app.goo.gl/JLXdK6XZC5SqHntC7" },
      { name: "해산물 야시장 로컬식당", nameVi: "Hải Sản Cô Thy 2", mapUrl: "https://maps.app.goo.gl/rWUGn1MYyzGH7Xg78" },
      { name: "88 Food Garden (레스토랑)", nameVi: "88 Food Garden", mapUrl: "https://maps.app.goo.gl/iwaEfxbuxutM9y2t9" },
      { name: "Panda BBQ (현지 바베큐)", address: "150 Hạ Long, Phường 2, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/9ruaWyxg9txKrJ6eA" },
      { name: "해산물 식당", nameVi: "Ốc Tự Nhiên 3", address: "20 Trần Phú, Phường 1, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/37gvjz6hhkzP6ip2A" },
      { name: "베트남 가정식", nameVi: "Cơm Niêu Quê Nhà", phone: "090 645 69 05", mapUrl: "https://maps.app.goo.gl/Qcx6sfwFh7jrm9HU9" },
      { name: "해산물 쌀국수", nameVi: "Old Man Cali - Hủ tiểu Mực", mapUrl: "https://maps.app.goo.gl/hBzPccq4d6E2ufj66", recommended: true },
      { name: "소고기 쌀국수 (에어컨)", mapUrl: "https://maps.app.goo.gl/9hYEyyeQ1HFFCqY7A" },
      { name: "로컬 식당 (껌땀)", nameVi: "Quán Cơm Tấm Lọ Lem", phone: "0254 3521 212", mapUrl: "https://maps.app.goo.gl/M5g8ya358jC1YNYh7" },
      { name: "오리국수 (오후 3시반 오픈)", mapUrl: "https://maps.app.goo.gl/HrorS5czrq91WqPUA" },
      { name: "토끼구이", mapUrl: "https://maps.app.goo.gl/Cxpum3ne3fnLiBDz6" },
    ]
  },
  koreanFood: {
    id: "koreanFood",
    icon: Utensils,
    gradient: "from-rose-500 to-pink-600",
    places: [
      { name: "이안 돌판 삼겹살", address: "300A Phan Chu Trinh, Phường 2, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/8FXU2u8Cn2AufLGz9", recommended: true },
      { name: "가보정", address: "B12-1/10 Khu Trung Tâm Chí Linh, Phường Nguyễn An Ninh", mapUrl: "https://maps.app.goo.gl/Mr1MXkLFMA5xfBjB6" },
      { name: "비원식당", address: "662A Nguyễn An Ninh, Phường 8, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/UrmsYuMjWGwMhAYq6" },
      { name: "뚱보집 (포차)", address: "151 Thùy Vân, Phường Thắng Tam, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/EXSWLjy4mdcwZkt36" },
    ]
  },
  buffet: {
    id: "buffet",
    icon: Utensils,
    gradient: "from-amber-500 to-orange-600",
    places: [
      { name: "GoGi House", phone: "0254 7300 339", mapUrl: "https://maps.app.goo.gl/Ra6gm28jZwnmWtWx9" },
      { name: "간하오 스시, 샤브샤브 뷔페", mapUrl: "https://maps.app.goo.gl/rrg1m5M57fpwKa5g6" },
      { name: "해산물 뷔페 (저녁 오픈)", note: "간하오 1층 안쪽", mapUrl: "https://maps.app.goo.gl/1xGUZjTk1jfzbDhd9" },
    ]
  },
  chineseFood: {
    id: "chineseFood",
    icon: Utensils,
    gradient: "from-red-600 to-red-700",
    places: [
      { name: "린차이나", address: "422/7 Lê Hồng Phong, Phường 8, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/XhJsqpTm5pjWhN6LA" },
    ]
  },
  exchange: {
    id: "exchange",
    icon: Building2,
    gradient: "from-emerald-500 to-teal-600",
    places: [
      { name: "환전소 (금은방)", nameVi: "Thong Phuong", mapUrl: "https://maps.app.goo.gl/NnvFeTaRFJ4mLMRC6" },
    ]
  },
  coffee: {
    id: "coffee",
    icon: Coffee,
    gradient: "from-amber-700 to-yellow-800",
    places: [
      { name: "Coffee Suối Bên Biển", mapUrl: "https://maps.app.goo.gl/Sd7JGZiZ1n6TrvmJ7" },
      { name: "KATINAT 커피", mapUrl: "https://maps.app.goo.gl/ptgkTbJnVzwUzYPGA" },
      { name: "Snow Cafe", phone: "0896 436 828", mapUrl: "https://maps.app.goo.gl/c3JzVQgq9XTXe9mQA" },
      { name: "Soho Coffee", phone: "094 641 40 31", mapUrl: "https://maps.app.goo.gl/fK1SdiHaNH9SoVeZ6" },
      { name: "Highlands Coffee", mapUrl: "https://maps.app.goo.gl/kuiVrXHGih2vkQQa9" },
      { name: "Sea & Sun 2", phone: "0822 056 419", mapUrl: "https://maps.app.goo.gl/VKm9bZifEX9Lob477" },
      { name: "Mi Amor Beach", mapUrl: "https://maps.app.goo.gl/o12qFzH1ggCwee5Y7" },
    ]
  },
  services: {
    id: "services",
    icon: Scissors,
    gradient: "from-purple-500 to-violet-600",
    places: [
      { name: "Rean 마사지", mapUrl: "https://maps.app.goo.gl/zGjF1ZoN5TJY5jdu8" },
      { name: "그랜드 마사지", mapUrl: "https://maps.app.goo.gl/4z3hEL8RF5acvtod7" },
      { name: "김마싸 (MASSAGE 12C2)", phone: "0779 090 882", mapUrl: "https://maps.app.goo.gl/WA7Wt63HWcsi5dVQA" },
      { name: "이발소 Salon Kimha", address: "26 Đinh Tiên Hoàng, Phường 2, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/q2HpipbVVMpvMHYj7" },
      { name: "Bi Roen 현지 고급 이발소", address: "518 Thống Nhất Mới, Phường 8, Vũng Tàu", mapUrl: "https://maps.app.goo.gl/yCMh6jYoLXLq8fgn7", recommended: true },
    ]
  }
};

const categoryLabels: Record<string, Record<string, string>> = {
  attractions: { ko: "관광명소", en: "Attractions", zh: "景点", vi: "Địa điểm du lịch", ru: "Достопримечательности", ja: "観光スポット" },
  localFood: { ko: "현지 음식점", en: "Local Restaurants", zh: "当地餐厅", vi: "Nhà hàng địa phương", ru: "Местные рестораны", ja: "ローカルレストラン" },
  koreanFood: { ko: "한식", en: "Korean Food", zh: "韩国料理", vi: "Món Hàn Quốc", ru: "Корейская еда", ja: "韓国料理" },
  buffet: { ko: "고기뷔페", en: "Buffet", zh: "自助餐", vi: "Buffet", ru: "Буфет", ja: "ビュッフェ" },
  chineseFood: { ko: "중식", en: "Chinese Food", zh: "中餐", vi: "Món Trung Quốc", ru: "Китайская еда", ja: "中華料理" },
  exchange: { ko: "환전소", en: "Currency Exchange", zh: "货币兑换", vi: "Đổi tiền", ru: "Обмен валюты", ja: "両替所" },
  coffee: { ko: "커피숍", en: "Coffee Shops", zh: "咖啡店", vi: "Quán cà phê", ru: "Кофейни", ja: "カフェ" },
  services: { ko: "마사지/이발소", en: "Massage & Barber", zh: "按摩/理发", vi: "Massage/Cắt tóc", ru: "Массаж/Парикмахерская", ja: "マッサージ/理髪店" }
};

const noteLabels: Record<string, Record<string, string>> = {
  largeVehicleNo: { ko: "대형차량 진입불가", en: "No large vehicles", zh: "大型车辆禁入", vi: "Xe lớn không vào được", ru: "Большие авто запрещены", ja: "大型車両進入禁止" },
  crowded: { ko: "붐빔", en: "Often crowded", zh: "经常拥挤", vi: "Thường đông", ru: "Часто многолюдно", ja: "混雑あり" },
  spacious: { ko: "쾌적", en: "Spacious", zh: "宽敞", vi: "Thoáng mát", ru: "Просторно", ja: "快適" }
};

function PlaceCard({ place, language }: { place: Place; language: string }) {
  const [showMap, setShowMap] = useState(false);
  const noteText = place.note ? (noteLabels[place.note]?.[language] || place.note) : null;

  const embedUrl = place.mapUrl.includes("goo.gl") 
    ? `https://www.google.com/maps?q=${encodeURIComponent(place.nameVi || place.name)},Vung Tau&output=embed`
    : place.mapUrl.replace("/maps/", "/maps/embed?");

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-foreground truncate">{place.name}</h3>
              {place.nameVi && <p className="text-xs text-muted-foreground truncate">{place.nameVi}</p>}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {place.recommended && (
                <Badge variant="default" className="bg-rose-500 text-[10px] px-1.5">
                  {language === "ko" ? "추천" : "Best"}
                </Badge>
              )}
            </div>
          </div>

          {noteText && (
            <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded">
              <AlertTriangle className="w-3 h-3" />
              {noteText}
            </div>
          )}

          {place.address && (
            <p className="text-[11px] text-muted-foreground flex items-start gap-1">
              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{place.address}</span>
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {place.phone && (
              <a href={`tel:${place.phone.replace(/\s/g, "")}`} className="flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
                <Phone className="w-3 h-3" />
                {place.phone}
              </a>
            )}
            <a href={place.mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-emerald-600 hover:underline">
              <ExternalLink className="w-3 h-3" />
              Google Maps
            </a>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full mt-1 text-xs h-8"
            onClick={() => setShowMap(!showMap)}
            data-testid={`button-toggle-map-${place.name.replace(/\s/g, "-")}`}
          >
            {showMap ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
            {showMap ? (language === "ko" ? "지도 닫기" : "Hide Map") : (language === "ko" ? "지도 보기" : "View Map")}
          </Button>

          <AnimatePresence>
            {showMap && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 200, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden rounded-lg"
              >
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-lg"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlacesGuide() {
  const { language, t } = useLanguage();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["attractions", "localFood"]));
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    apiRequest("POST", "/api/visitor-count/increment")
      .then(res => res.json())
      .then(data => setVisitorCount(data.count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setInstallPrompt(null);
    };

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setIsAppInstalled(true);
    }
    setInstallPrompt(null);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const pageTitle: Record<string, string> = {
    ko: "붕따우 관광/맛집 가이드",
    en: "Vung Tau Travel Guide",
    zh: "头顿旅游指南",
    vi: "Hướng dẫn du lịch Vũng Tàu",
    ru: "Путеводитель по Вунгтау",
    ja: "ブンタウ観光ガイド"
  };

  const navLabels = {
    calculator: { ko: "견적 계산기", en: "Quote Calculator", zh: "报价计算器", vi: "Báo giá", ru: "Калькулятор", ja: "見積計算機" },
    guide: { ko: "관광/맛집", en: "Travel Guide", zh: "旅游指南", vi: "Du lịch", ru: "Гид", ja: "ガイド" }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <div className="relative bg-white border-b border-border/40">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl flex items-center gap-4">
            <img src={logoImg} alt="붕따우 도깨비" className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-md" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary">{pageTitle[language] || pageTitle.ko}</h1>
              <p className="text-sm text-muted-foreground">
                {language === "ko" ? "붕따우 도깨비가 추천하는 관광명소와 맛집" : "Recommended spots by Vung Tau Dokkaebi"}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="outline" className="flex items-center gap-2" data-testid="nav-calculator">
                  <Calculator className="w-4 h-4" />
                  {navLabels.calculator[language as keyof typeof navLabels.calculator] || navLabels.calculator.ko}
                </Button>
              </Link>
              <Link href="/guide">
                <Button variant="default" className="flex items-center gap-2" data-testid="nav-guide">
                  <MapPin className="w-4 h-4" />
                  {navLabels.guide[language as keyof typeof navLabels.guide] || navLabels.guide.ko}
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              {installPrompt && !isAppInstalled && (
                <Button 
                  onClick={handleInstallClick}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                  data-testid="button-install-app-guide"
                >
                  <Download className="w-4 h-4" />
                  {language === "ko" ? "앱 설치" : 
                   language === "en" ? "Install App" :
                   language === "zh" ? "安装应用" :
                   language === "vi" ? "Cài đặt" :
                   language === "ru" ? "Установить" :
                   language === "ja" ? "アプリ" : "앱 설치"}
                </Button>
              )}
              <a href="/vungtau-dokkaebi.apk" download>
                <Button 
                  variant="outline"
                  className="flex items-center gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                  data-testid="button-download-apk-guide"
                >
                  <Smartphone className="w-4 h-4" />
                  {language === "ko" ? "APK 다운로드" : 
                   language === "en" ? "APK Download" :
                   language === "zh" ? "下载APK" :
                   language === "vi" ? "Tải APK" :
                   language === "ru" ? "Скачать APK" :
                   language === "ja" ? "APKダウンロード" : "APK 다운로드"}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-8">

        <div className="space-y-4">
          {Object.entries(placesData).map(([key, category]) => {
            const Icon = category.icon;
            const isExpanded = expandedCategories.has(key);
            const label = categoryLabels[key]?.[language] || categoryLabels[key]?.ko || key;

            return (
              <Card key={key} className="overflow-hidden">
                <CardHeader
                  className={`cursor-pointer bg-gradient-to-r ${category.gradient} text-white py-3 px-4`}
                  onClick={() => toggleCategory(key)}
                  data-testid={`category-header-${key}`}
                >
                  <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      <span>{label}</span>
                      <Badge variant="secondary" className="bg-white/20 text-white text-[10px]">
                        {category.places.length}
                      </Badge>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </CardTitle>
                </CardHeader>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {category.places.map((place, idx) => (
                            <PlaceCard key={idx} place={place} language={language} />
                          ))}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>

        <div className="h-20" />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 border-t shadow-lg">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-black">
                {language === "ko" ? "예약 문의" : 
                 language === "en" ? "Reservation" :
                 language === "zh" ? "预约" :
                 language === "vi" ? "Đặt chỗ" :
                 language === "ru" ? "Бронь" :
                 language === "ja" ? "予約" : "예약 문의"}
              </span>
              <a
                href="http://pf.kakao.com/_TuxoxfG"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-kakao-reservation"
              >
                <Button size="sm" className="bg-black hover:bg-black/90 text-yellow-400 font-bold gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  {language === "ko" ? "카카오톡 문의" : 
                   language === "en" ? "KakaoTalk" :
                   language === "zh" ? "KakaoTalk" :
                   language === "vi" ? "KakaoTalk" :
                   language === "ru" ? "KakaoTalk" :
                   language === "ja" ? "カカオトーク" : "카카오톡 문의"}
                </Button>
              </a>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 text-center py-1">
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Eye className="w-3 h-3" />
            {language === "ko" ? `방문자 ${visitorCount.toLocaleString()}명` : 
             language === "en" ? `${visitorCount.toLocaleString()} visitors` :
             language === "zh" ? `访客 ${visitorCount.toLocaleString()}` :
             language === "vi" ? `${visitorCount.toLocaleString()} lượt xem` :
             language === "ru" ? `${visitorCount.toLocaleString()} посетителей` :
             language === "ja" ? `訪問者 ${visitorCount.toLocaleString()}人` : `방문자 ${visitorCount.toLocaleString()}명`}
          </span>
        </div>
      </div>
    </div>
  );
}
