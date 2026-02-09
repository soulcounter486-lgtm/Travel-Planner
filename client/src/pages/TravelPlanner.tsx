import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/lib/i18n";
import { 
  Utensils, 
  Palmtree, 
  CircleDot, 
  Mountain, 
  Landmark, 
  Users,
  CalendarIcon,
  Sparkles,
  MapPin,
  Clock,
  Lightbulb,
  RefreshCw,
  Loader2,
  Wallet,
  MessageCircle,
  Download,
  Music,
  ExternalLink,
  GripVertical,
  Plane,
  Heart,
  Briefcase,
  Baby,
  Car,
  DollarSign,
  Sun,
  CloudRain,
  Map,
  ChevronDown,
  ChevronUp,
  Navigation,
  Gift,
  Star,
  Save,
  FolderOpen,
  Trash2,
  LogIn,
  Eye
} from "lucide-react";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, getMonth } from "date-fns";
import type { Locale } from "date-fns";
import { ko, enUS, zhCN, vi, ru, ja } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/AppHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { FixedBottomBar } from "@/components/FixedBottomBar";
import type { Villa } from "@shared/schema";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface ScheduleItem {
  time: string;
  activity: string;
  place: string;
  placeVi?: string;
  type: string;
  note?: string;
  estimatedCost?: number;
  travelTime?: string;
  lat?: number;
  lng?: number;
  isPartner?: boolean;
  discountText?: string;
}

interface DayPlan {
  day: number;
  date: string;
  theme: string;
  schedule: ScheduleItem[];
}

interface TravelPlan {
  title: string;
  summary: string;
  days: DayPlan[];
  tips: string[];
  totalEstimatedCost?: number;
  vehicleRecommendation?: string;
  weatherNote?: string;
}

const purposeOptions = [
  { id: "gourmet", icon: Utensils, gradient: "from-orange-500 to-red-500" },
  { id: "relaxing", icon: Palmtree, gradient: "from-green-500 to-teal-500" },
  { id: "golf", icon: CircleDot, gradient: "from-emerald-500 to-green-600" },
  { id: "adventure", icon: Mountain, gradient: "from-blue-500 to-indigo-600" },
  { id: "culture", icon: Landmark, gradient: "from-purple-500 to-violet-600" },
  { id: "family", icon: Users, gradient: "from-pink-500 to-rose-500" },
  { id: "nightlife", icon: Music, gradient: "from-pink-600 to-purple-700" },
  { id: "casino", icon: DollarSign, gradient: "from-yellow-500 to-amber-600" },
];

const companionOptions = [
  { id: "solo", icon: Users, label: { ko: "혼자", en: "Solo", zh: "独自", vi: "Một mình", ru: "Один", ja: "一人" } },
  { id: "couple", icon: Heart, label: { ko: "커플", en: "Couple", zh: "情侣", vi: "Cặp đôi", ru: "Пара", ja: "カップル" } },
  { id: "family_kids", icon: Baby, label: { ko: "가족(아이동반)", en: "Family(Kids)", zh: "家庭(带小孩)", vi: "Gia đình(trẻ em)", ru: "Семья(дети)", ja: "家族(子連れ)" } },
  { id: "family_adults", icon: Users, label: { ko: "가족(성인)", en: "Family(Adults)", zh: "家庭(成人)", vi: "Gia đình(người lớn)", ru: "Семья(взрослые)", ja: "家族(大人)" } },
  { id: "friends_male", icon: Users, label: { ko: "남성 친구들", en: "Guy Friends", zh: "男性朋友", vi: "Bạn nam", ru: "Друзья(м)", ja: "男友達" } },
  { id: "friends_female", icon: Users, label: { ko: "여성 친구들", en: "Girl Friends", zh: "女性朋友", vi: "Bạn nữ", ru: "Подруги", ja: "女友達" } },
  { id: "workshop", icon: Briefcase, label: { ko: "워크샵/단체", en: "Workshop/Group", zh: "研讨会/团体", vi: "Workshop/Nhóm", ru: "Воркшоп", ja: "ワークショップ" } },
];

const travelStyleOptions = [
  { id: "packed", icon: Mountain, label: { ko: "빡빡한 관광형", en: "Packed Sightseeing", zh: "紧凑观光型", vi: "Tham quan dày đặc", ru: "Насыщенный", ja: "詰め込み観光" } },
  { id: "balanced", icon: Sun, label: { ko: "적당한 밸런스", en: "Balanced", zh: "均衡型", vi: "Cân bằng", ru: "Баланс", ja: "バランス型" } },
  { id: "relaxed", icon: Palmtree, label: { ko: "널널한 휴식형", en: "Relaxed & Easy", zh: "悠闲休息型", vi: "Thư giãn", ru: "Расслабленный", ja: "のんびり休息" } },
];

const arrivalTimeOptions = [
  { id: "morning", label: { ko: "오전 도착 (9시 이전)", en: "Morning (<9AM)", zh: "上午到达(<9点)", vi: "Sáng (<9h)", ru: "Утро (<9)", ja: "午前着(<9時)" } },
  { id: "midday", label: { ko: "낮 도착 (9시~14시)", en: "Midday (9AM~2PM)", zh: "中午到达(9-14点)", vi: "Trưa (9h-14h)", ru: "День (9-14)", ja: "昼着(9-14時)" } },
  { id: "afternoon", label: { ko: "오후 도착 (14시~18시)", en: "Afternoon (2~6PM)", zh: "下午到达(14-18点)", vi: "Chiều (14h-18h)", ru: "Вечер (14-18)", ja: "午後着(14-18時)" } },
  { id: "evening", label: { ko: "저녁 도착 (18시 이후)", en: "Evening (>6PM)", zh: "晚上到达(>18点)", vi: "Tối (>18h)", ru: "Вечер (>18)", ja: "夜着(>18時)" } },
];

const typeIcons: Record<string, React.ElementType> = {
  attraction: MapPin,
  restaurant: Utensils,
  cafe: Utensils,
  massage: Palmtree,
  golf: CircleDot,
  beach: Palmtree,
  club: Music,
  bar: Music,
  transfer: Car,
  shopping: Wallet,
  casino: DollarSign,
};

const typeColors: Record<string, string> = {
  attraction: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  restaurant: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  cafe: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  massage: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  golf: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  beach: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  club: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  bar: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  transfer: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
  shopping: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  casino: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
};

interface SavedPlan {
  id: number;
  userId: string;
  title: string;
  purpose: string;
  startDate: string;
  endDate: string;
  planData: TravelPlan;
  createdAt: string;
}

export default function TravelPlanner() {
  const { language, t } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);
  const [viewingSavedPlan, setViewingSavedPlan] = useState<SavedPlan | null>(null);
  const [showSavedList, setShowSavedList] = useState(false);
  const [companion, setCompanion] = useState<string>("");
  const [travelStyle, setTravelStyle] = useState<string>("balanced");
  const [arrivalTime, setArrivalTime] = useState<string>("");
  const [selectedVillaId, setSelectedVillaId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [travelPlan, setTravelPlan] = useState<TravelPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [dragState, setDragState] = useState<{ dayIdx: number; itemIdx: number } | null>(null);
  const [addToExpensePending, setAddToExpensePending] = useState(false);
  const [, setLocation] = useLocation();
  const planRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const { data: villas = [] } = useQuery<Villa[]>({
    queryKey: ["/api/villas"],
  });

  const activeVillas = villas.filter(v => v.isActive);

  const { data: savedPlans = [], isLoading: isLoadingSaved } = useQuery<SavedPlan[]>({
    queryKey: ["/api/saved-travel-plans"],
    enabled: isAuthenticated,
  });

  const savePlanMutation = useMutation({
    mutationFn: async (plan: TravelPlan) => {
      const planStartDate = plan.days?.[0]?.date || (startDate ? format(startDate, "yyyy-MM-dd") : "");
      const planEndDate = plan.days?.[plan.days.length - 1]?.date || (endDate ? format(endDate, "yyyy-MM-dd") : "");
      const response = await apiRequest("POST", "/api/saved-travel-plans", {
        title: plan.title || "My Travel Plan",
        purpose: selectedPurposes.join(", ") || "general",
        startDate: planStartDate,
        endDate: planEndDate,
        planData: plan,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-travel-plans"] });
      toast({ title: language === "ko" ? "일정이 저장되었습니다!" : "Plan saved!" });
    },
    onError: () => {
      toast({ title: language === "ko" ? "저장에 실패했습니다. 로그인 상태를 확인해주세요." : "Failed to save. Please check your login.", variant: "destructive" });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/saved-travel-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-travel-plans"] });
      toast({ title: language === "ko" ? "일정이 삭제되었습니다." : "Plan deleted." });
    },
    onError: () => {
      toast({ title: language === "ko" ? "삭제에 실패했습니다." : "Failed to delete.", variant: "destructive" });
    },
  });

  const locales: Record<string, Locale> = { ko, en: enUS, zh: zhCN, vi, ru, ja };
  const currentLocale = locales[language] || ko;

  const isRainySeason = startDate ? [4, 5, 6, 7, 8, 9].includes(getMonth(startDate)) : false;

  const togglePurpose = (purposeId: string) => {
    setSelectedPurposes((prev) =>
      prev.includes(purposeId)
        ? prev.filter((p) => p !== purposeId)
        : [...prev, purposeId]
    );
  };

  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      if (selectedPurposes.length === 0 || !startDate || !endDate) {
        throw new Error("Please fill all fields");
      }
      const selectedVilla = activeVillas.find(v => v.id === selectedVillaId);
      const response = await apiRequest("POST", "/api/travel-plan", {
        purpose: selectedPurposes.join(", "),
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        language,
        companion,
        travelStyle,
        arrivalTime,
        villaName: selectedVilla?.name || "",
        villaLat: selectedVilla?.latitude || "",
        villaLng: selectedVilla?.longitude || "",
        gender: user?.gender || "",
      });
      return response.json();
    },
    onError: (error: any) => {
      const msg = error?.message || "";
      if (msg.includes("429") || msg.includes("한도")) {
        toast({ title: language === "ko" ? "AI API 사용 한도를 초과했습니다. 약 1분 후 다시 시도해주세요." : "AI API rate limit exceeded. Please try again in about 1 minute.", variant: "destructive" });
      } else {
        toast({ title: language === "ko" ? "여행 일정 생성에 실패했습니다. 다시 시도해주세요." : "Failed to generate travel plan. Please try again.", variant: "destructive" });
      }
    },
    onSuccess: (data) => {
      const normalized: TravelPlan = {
        title: data.title || "",
        summary: data.summary || "",
        totalEstimatedCost: typeof data.totalEstimatedCost === "number" ? data.totalEstimatedCost : 0,
        vehicleRecommendation: data.vehicleRecommendation || "",
        weatherNote: data.weatherNote || "",
        tips: Array.isArray(data.tips) ? data.tips : [],
        days: Array.isArray(data.days) ? data.days.map((day: any) => ({
          day: day.day || 1,
          date: day.date || "",
          theme: day.theme || "",
          schedule: Array.isArray(day.schedule) ? day.schedule.map((item: any) => ({
            time: item.time || "",
            activity: item.activity || "",
            place: item.place || "",
            placeVi: item.placeVi || "",
            type: item.type || "attraction",
            note: item.note || "",
            estimatedCost: typeof item.estimatedCost === "number" ? item.estimatedCost : 0,
            travelTime: item.travelTime || "",
            lat: typeof item.lat === "number" ? item.lat : (parseFloat(item.lat) || 0),
            lng: typeof item.lng === "number" ? item.lng : (parseFloat(item.lng) || 0),
            isPartner: item.isPartner === true,
            discountText: item.discountText || "",
          })) : [],
        })) : [],
      };
      setTravelPlan(normalized);
      const allDays = new Set<number>(normalized.days.map((_: any, i: number) => i));
      setExpandedDays(allDays);
    },
  });

  const handleGenerate = () => {
    generatePlanMutation.mutate();
  };

  const handleRegenerate = () => {
    setTravelPlan(null);
    generatePlanMutation.mutate();
  };

  const handleSaveImage = async () => {
    if (!planRef.current) return;
    setIsSaving(true);
    try {
      const canvas = await html2canvas(planRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `VungTau_TravelPlan_${format(new Date(), "yyyyMMdd_HHmmss")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Failed to save image:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const moveScheduleItem = useCallback((dayIdx: number, fromIdx: number, toIdx: number) => {
    if (!travelPlan) return;
    const newPlan = { ...travelPlan };
    const newDays = [...newPlan.days];
    const newSchedule = [...newDays[dayIdx].schedule];
    const [moved] = newSchedule.splice(fromIdx, 1);
    newSchedule.splice(toIdx, 0, moved);
    newDays[dayIdx] = { ...newDays[dayIdx], schedule: newSchedule };
    newPlan.days = newDays;
    setTravelPlan(newPlan);
  }, [travelPlan]);

  const toggleDayExpanded = (dayIdx: number) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(dayIdx)) next.delete(dayIdx);
      else next.add(dayIdx);
      return next;
    });
  };

  const getDayCost = (day: DayPlan) => {
    return day.schedule.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  };

  const getTotalCost = () => {
    if (!travelPlan) return 0;
    return travelPlan.totalEstimatedCost || travelPlan.days.reduce((sum, day) => sum + getDayCost(day), 0);
  };

  useEffect(() => {
    if (!showMap || !mapContainerRef.current || !travelPlan) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const center: [number, number] = [10.346, 107.084];
    const map = L.map(mapContainerRef.current).setView(center, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);
    mapRef.current = map;

    const allPoints: [number, number][] = [];
    const colors = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"];

    travelPlan.days.forEach((day, dayIdx) => {
      const dayPoints: [number, number][] = [];
      day.schedule.forEach((item) => {
        if (item.lat && item.lng) {
          const point: [number, number] = [item.lat, item.lng];
          dayPoints.push(point);
          allPoints.push(point);

          const color = colors[dayIdx % colors.length];
          const sanitize = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
          L.circleMarker(point, {
            radius: 8,
            fillColor: color,
            color: "#fff",
            weight: 2,
            fillOpacity: 0.9,
          }).addTo(map).bindPopup(`<b>Day ${day.day}</b><br/>${sanitize(item.time)} ${sanitize(item.activity)}<br/><small>${sanitize(item.place)}</small>`);
        }
      });

      if (dayPoints.length > 1) {
        L.polyline(dayPoints, {
          color: colors[dayIdx % colors.length],
          weight: 3,
          opacity: 0.7,
          dashArray: "8, 8",
        }).addTo(map);
      }
    });

    const mapVilla = activeVillas.find(v => v.id === selectedVillaId);
    if (mapVilla?.latitude && mapVilla?.longitude) {
      const villaPoint: [number, number] = [parseFloat(mapVilla.latitude), parseFloat(mapVilla.longitude)];
      allPoints.push(villaPoint);
      const safeName = (mapVilla.name || "").replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
      L.marker(villaPoint, {
        icon: L.divIcon({
          className: "",
          html: `<div style="background:#3b82f6;color:white;padding:4px 8px;border-radius:8px;font-size:11px;font-weight:bold;white-space:nowrap;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${safeName}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
      }).addTo(map);
    }

    if (allPoints.length > 0) {
      map.fitBounds(L.latLngBounds(allPoints), { padding: [30, 30] });
    }

    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [showMap, travelPlan, selectedVillaId]);

  const lbl = (labels: Record<string, string>) => labels[language] || labels.ko;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <AppHeader />
      <TabNavigation language={language} />

      <main className="max-w-4xl mx-auto px-4 py-8 pb-40 overflow-x-hidden">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 to-purple-500/10 px-4 py-2 rounded-full mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{t("nav.planner")}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("planner.title")}</h1>
          <p className="text-muted-foreground">{t("planner.subtitle")}</p>
        </div>

        {!isAuthenticated && !travelPlan && !viewingSavedPlan && (
          <Card className="mb-4 border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 flex-wrap">
                <LogIn className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {language === "ko"
                      ? "로그인하면 생성한 여행 일정이 자동 저장되어 언제든 다시 확인할 수 있습니다!"
                      : "Log in to save your travel plans and access them anytime!"}
                  </p>
                </div>
                <a href="/api/login">
                  <Button size="sm" data-testid="btn-login-promo">
                    <LogIn className="h-3 w-3 mr-1" />
                    {language === "ko" ? "로그인" : "Log In"}
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {isAuthenticated && !travelPlan && !viewingSavedPlan && (
          <div className="mb-4">
            <Button
              variant={showSavedList ? "default" : "outline"}
              onClick={() => setShowSavedList(!showSavedList)}
              className="mb-3"
              data-testid="btn-toggle-saved-list"
            >
              <FolderOpen className="h-4 w-4 mr-1" />
              {language === "ko" ? `내 저장 일정 (${savedPlans.length})` : `My Saved Plans (${savedPlans.length})`}
            </Button>

            {showSavedList && (
              <div className="space-y-2">
                {isLoadingSaved && (
                  <p className="text-sm text-muted-foreground">{language === "ko" ? "불러오는 중..." : "Loading..."}</p>
                )}
                {!isLoadingSaved && savedPlans.length === 0 && (
                  <Card>
                    <CardContent className="py-6 text-center text-muted-foreground text-sm">
                      {language === "ko" ? "저장된 일정이 없습니다. 여행 일정을 생성하고 저장해보세요!" : "No saved plans. Generate and save a travel plan!"}
                    </CardContent>
                  </Card>
                )}
                {savedPlans.map((plan) => (
                  <Card key={plan.id} className="hover-elevate" data-testid={`saved-plan-${plan.id}`}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{plan.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {plan.startDate} ~ {plan.endDate} | {plan.purpose}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(plan.createdAt).toLocaleDateString(language === "ko" ? "ko-KR" : "en-US")}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              setViewingSavedPlan(plan);
                              setTravelPlan(plan.planData);
                              setShowSavedList(false);
                              const allDays = new Set<number>(plan.planData.days.map((_: any, i: number) => i));
                              setExpandedDays(allDays);
                            }}
                            data-testid={`btn-view-plan-${plan.id}`}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            {language === "ko" ? "보기" : "View"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-destructive"
                            onClick={() => {
                              if (confirm(language === "ko" ? "이 일정을 삭제하시겠습니까?" : "Delete this plan?")) {
                                deletePlanMutation.mutate(plan.id);
                              }
                            }}
                            data-testid={`btn-delete-plan-${plan.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {!travelPlan && !viewingSavedPlan && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  {t("planner.purpose")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {purposeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedPurposes.includes(option.id);
                    return (
                      <motion.button
                        key={option.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => togglePurpose(option.id)}
                        className={`relative p-3 rounded-xl border-2 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover-elevate"
                        }`}
                        data-testid={`purpose-${option.id}`}
                      >
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${option.gradient} flex items-center justify-center mx-auto mb-1.5`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-medium block whitespace-nowrap">
                          {t(`planner.purpose.${option.id}`)}
                        </span>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{selectedPurposes.indexOf(option.id) + 1}</span>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t("planner.startDate")}</label>
                    <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-testid="start-date-picker"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP", { locale: currentLocale }) : t("planner.selectDates")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => {
                            setStartDate(date);
                            if (date && (!endDate || endDate < date)) {
                              setEndDate(addDays(date, 2));
                            }
                            setStartDateOpen(false);
                          }}
                          disabled={(date) => date < new Date()}
                          locale={currentLocale}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">{t("planner.endDate")}</label>
                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-testid="end-date-picker"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP", { locale: currentLocale }) : t("planner.selectDates")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => {
                            setEndDate(date);
                            setEndDateOpen(false);
                          }}
                          disabled={(date) => date < (startDate || new Date())}
                          locale={currentLocale}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {startDate && isRainySeason && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                    <CloudRain className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="text-blue-700 dark:text-blue-300">
                      {language === "ko" ? "우기(5~10월)입니다. 실내 활동과 마사지/스파를 더 많이 포함합니다." : "Rainy season (May-Oct). More indoor activities & spa will be included."}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="cursor-pointer" onClick={() => setShowAdvanced(!showAdvanced)} data-testid="toggle-advanced">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    {language === "ko" ? "맞춤 설정" : "Personalize"}
                  </div>
                  {showAdvanced ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </CardTitle>
              </CardHeader>
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <CardContent className="space-y-5 pt-0">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          {language === "ko" ? "동반자 유형" : "Companion Type"}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {companionOptions.map((opt) => {
                            const Icon = opt.icon;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => setCompanion(companion === opt.id ? "" : opt.id)}
                                className={`flex items-center gap-1.5 p-2 rounded-lg border-2 text-xs transition-all ${
                                  companion === opt.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover-elevate"
                                }`}
                                data-testid={`companion-${opt.id}`}
                              >
                                <Icon className="h-4 w-4 shrink-0" />
                                <span className="whitespace-nowrap">{lbl(opt.label)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          {language === "ko" ? "여행 스타일" : "Travel Style"}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {travelStyleOptions.map((opt) => {
                            const Icon = opt.icon;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => setTravelStyle(opt.id)}
                                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-xs transition-all ${
                                  travelStyle === opt.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover-elevate"
                                }`}
                                data-testid={`style-${opt.id}`}
                              >
                                <Icon className="h-5 w-5" />
                                <span className="whitespace-nowrap">{lbl(opt.label)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          {language === "ko" ? "첫날 도착 시간" : "Arrival Time (Day 1)"}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {arrivalTimeOptions.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => setArrivalTime(arrivalTime === opt.id ? "" : opt.id)}
                              className={`flex items-center gap-1.5 p-2.5 rounded-lg border-2 text-xs transition-all ${
                                arrivalTime === opt.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover-elevate"
                              }`}
                              data-testid={`arrival-${opt.id}`}
                            >
                              <Plane className="h-4 w-4 shrink-0" />
                              <span className="whitespace-nowrap">{lbl(opt.label)}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {activeVillas.length > 0 && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            {language === "ko" ? "숙소 (동선 최적화)" : "Accommodation (Route Optimization)"}
                          </label>
                          <Select
                            value={selectedVillaId?.toString() || "none"}
                            onValueChange={(val) => setSelectedVillaId(val === "none" ? null : parseInt(val))}
                          >
                            <SelectTrigger data-testid="select-villa">
                              <SelectValue placeholder={language === "ko" ? "빌라 선택 (선택사항)" : "Select villa (optional)"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">{language === "ko" ? "선택 안함" : "Not selected"}</SelectItem>
                              {activeVillas.map((villa) => (
                                <SelectItem key={villa.id} value={villa.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    {villa.mainImage && (
                                      <img
                                        src={villa.mainImage}
                                        alt={villa.name}
                                        className="w-8 h-8 rounded-md object-cover shrink-0"
                                        data-testid={`img-villa-thumb-${villa.id}`}
                                      />
                                    )}
                                    <span>{villa.name} ({villa.bedrooms}{language === "ko" ? "룸" : "R"})</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedVillaId && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Navigation className="h-3 w-3" />
                              {language === "ko" ? "숙소 위치 기준으로 가까운 장소를 우선 배치합니다" : "Nearby places prioritized based on villa location"}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={selectedPurposes.length === 0 || !startDate || !endDate || generatePlanMutation.isPending}
              data-testid="generate-plan-btn"
            >
              {generatePlanMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t("planner.generating")}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  {t("planner.generate")}
                </>
              )}
            </Button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {travelPlan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={generatePlanMutation.isPending} data-testid="regenerate-btn">
                  <RefreshCw className={`h-4 w-4 mr-1 ${generatePlanMutation.isPending ? 'animate-spin' : ''}`} />
                  {t("planner.regenerate")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowMap(!showMap)} data-testid="toggle-map-btn">
                  <Map className="h-4 w-4 mr-1" />
                  {showMap ? (language === "ko" ? "지도 숨기기" : "Hide Map") : (language === "ko" ? "경로 지도" : "Route Map")}
                </Button>
                <Button variant="default" size="sm" onClick={handleSaveImage} disabled={isSaving} data-testid="save-image-btn">
                  {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                  {language === "ko" ? "이미지 저장" : "Save Image"}
                </Button>
              </div>

              {showMap && (
                <Card className="overflow-hidden">
                  <div ref={mapContainerRef} className="h-[300px] w-full" data-testid="plan-map" />
                </Card>
              )}

              {travelPlan.vehicleRecommendation && (
                <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-3">
                      <Car className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{travelPlan.vehicleRecommendation}</p>
                        <a
                          href="http://pf.kakao.com/_TuxoxfG"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 mt-3 w-full px-4 py-3 rounded-lg bg-[#FEE500] text-[#3C1E1E] font-bold text-sm shadow-md hover:brightness-95 transition-all"
                          data-testid="link-kakao-vehicle-booking"
                        >
                          <MessageCircle className="h-5 w-5" />
                          {language === "ko" ? "카톡으로 차량 예약 문의" : "Book via KakaoTalk"}
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {travelPlan.weatherNote && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
                  {isRainySeason ? <CloudRain className="h-4 w-4 text-amber-500 shrink-0" /> : <Sun className="h-4 w-4 text-amber-500 shrink-0" />}
                  <span className="text-amber-700 dark:text-amber-300">{travelPlan.weatherNote}</span>
                </div>
              )}

              <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-500" />
                      <span className="text-sm font-medium">{language === "ko" ? "예상 총 비용" : "Estimated Total Cost"}</span>
                    </div>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      ${getTotalCost().toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === "ko" ? "* 예상 비용은 참고용이며 실제와 다를 수 있습니다" : "* Estimated costs are for reference only"}
                  </p>
                </CardContent>
              </Card>

              <div ref={planRef} className="space-y-4 bg-white dark:bg-background p-4 rounded-lg">
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl">{travelPlan.title}</CardTitle>
                    <p className="text-muted-foreground text-sm mt-1">{travelPlan.summary}</p>
                  </CardHeader>
                </Card>

                {travelPlan.days.map((day, dayIndex) => {
                  const isExpanded = expandedDays.has(dayIndex);
                  const dayCost = getDayCost(day);
                  return (
                    <motion.div
                      key={day.day}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: dayIndex * 0.05 }}
                    >
                      <Card>
                        <CardHeader
                          className="pb-2 cursor-pointer"
                          onClick={() => toggleDayExpanded(dayIndex)}
                          data-testid={`day-header-${dayIndex}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                                {day.day}
                              </div>
                              <div>
                                <CardTitle className="text-base">
                                  {t("planner.day")} {day.day} - {day.theme}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">{day.date}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {dayCost > 0 && (
                                <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-300">
                                  ${dayCost}
                                </Badge>
                              )}
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </div>
                        </CardHeader>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <CardContent className="pt-0">
                                <div className="space-y-3">
                                  {day.schedule.map((item, itemIndex) => {
                                    const TypeIcon = typeIcons[item.type] || MapPin;
                                    const typeColor = typeColors[item.type] || "bg-gray-100 text-gray-700";
                                    return (
                                      <div
                                        key={itemIndex}
                                        className="flex gap-3 items-start group"
                                        data-testid={`schedule-item-${dayIndex}-${itemIndex}`}
                                      >
                                        <div
                                          className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                                          draggable
                                          onDragStart={() => setDragState({ dayIdx: dayIndex, itemIdx: itemIndex })}
                                          onDragOver={(e) => e.preventDefault()}
                                          onDrop={() => {
                                            if (dragState && dragState.dayIdx === dayIndex && dragState.itemIdx !== itemIndex) {
                                              moveScheduleItem(dayIndex, dragState.itemIdx, itemIndex);
                                            }
                                            setDragState(null);
                                          }}
                                        >
                                          <GripVertical className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col items-center shrink-0">
                                          <Badge variant="outline" className="font-mono text-[10px] px-1.5">
                                            <Clock className="h-3 w-3 mr-0.5" />
                                            {item.time}
                                          </Badge>
                                          {item.travelTime && (
                                            <span className="text-[9px] text-muted-foreground mt-1 flex items-center gap-0.5">
                                              <Car className="h-2.5 w-2.5" />{item.travelTime}
                                            </span>
                                          )}
                                          {itemIndex < day.schedule.length - 1 && (
                                            <div className="w-px h-6 bg-border mt-1" />
                                          )}
                                        </div>
                                        <div className={`flex-1 min-w-0 rounded-lg p-2.5 transition-all border ${item.isPartner ? "bg-amber-50/80 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700" : "bg-muted/50 border-transparent"}`}>
                                          <div className="flex items-start gap-1.5 flex-wrap">
                                            {item.isPartner && (
                                              <Badge className="bg-amber-500 text-white text-[10px] no-default-hover-elevate no-default-active-elevate shrink-0">
                                                <Star className="h-3 w-3 mr-0.5" />
                                                {language === "ko" ? "협력업체" : "Partner"}
                                              </Badge>
                                            )}
                                            <Badge className={`${typeColor} shrink-0`}>
                                              <TypeIcon className="h-3 w-3 mr-0.5" />
                                              {item.type}
                                            </Badge>
                                            {item.estimatedCost !== undefined && item.estimatedCost > 0 && (
                                              <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-300 text-[10px] shrink-0">
                                                ${item.estimatedCost}
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="font-medium text-sm mt-1 break-words">{item.activity}</p>
                                          <p className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                                            <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
                                            <span className="break-words min-w-0">
                                              {item.place}
                                              {item.placeVi && <span className="text-[10px]"> ({item.placeVi})</span>}
                                            </span>
                                          </p>
                                          {item.note && (
                                            <p className="text-[11px] text-muted-foreground mt-1 italic break-words">{item.note}</p>
                                          )}
                                          <div className="mt-2 flex gap-2 flex-wrap">
                                            <a
                                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.placeVi || item.place)}+Vung+Tau+Vietnam`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              data-testid={`map-link-${dayIndex}-${itemIndex}`}
                                            >
                                              <Button size="sm" variant="outline" className="text-xs" data-testid={`btn-map-${dayIndex}-${itemIndex}`}>
                                                <ExternalLink className="h-3 w-3 mr-1" />
                                                {language === "ko" ? "지도 보기" : "View Map"}
                                              </Button>
                                            </a>
                                            {item.isPartner && (
                                              <a
                                                href="http://pf.kakao.com/_TuxoxfG"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                data-testid={`partner-kakao-link-${dayIndex}-${itemIndex}`}
                                              >
                                                <Button size="sm" variant="default" className="text-xs" data-testid={`btn-partner-inquiry-${dayIndex}-${itemIndex}`}>
                                                  <MessageCircle className="h-3 w-3 mr-1" />
                                                  {language === "ko" ? "쿠폰,예약/카톡문의" : "Coupon & Booking / KakaoTalk"}
                                                </Button>
                                              </a>
                                            )}
                                          </div>
                                          {item.isPartner && item.discountText && (
                                            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mt-1.5 flex items-start gap-1 break-words">
                                              <Gift className="h-3 w-3 shrink-0 mt-0.5" />
                                              <span className="min-w-0">{item.discountText}</span>
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  );
                })}

                {travelPlan.tips && travelPlan.tips.length > 0 && (
                  <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-base">
                        <Lightbulb className="h-5 w-5" />
                        {t("planner.tips")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1.5">
                        {travelPlan.tips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-amber-600 dark:text-amber-400 font-bold">{index + 1}.</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="flex justify-center gap-2 flex-wrap">
                {isAuthenticated && !viewingSavedPlan && (
                  <Button
                    variant="default"
                    onClick={() => {
                      if (travelPlan) savePlanMutation.mutate(travelPlan);
                    }}
                    disabled={savePlanMutation.isPending || savePlanMutation.isSuccess}
                    data-testid="btn-save-plan"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {savePlanMutation.isPending
                      ? (language === "ko" ? "저장 중..." : "Saving...")
                      : savePlanMutation.isSuccess
                        ? (language === "ko" ? "저장 완료!" : "Saved!")
                        : (language === "ko" ? "일정 저장" : "Save Plan")}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setTravelPlan(null);
                    setViewingSavedPlan(null);
                    savePlanMutation.reset();
                  }}
                  data-testid="new-plan-btn"
                >
                  {viewingSavedPlan
                    ? (language === "ko" ? "목록으로" : "Back to List")
                    : t("planner.selectPurpose")}
                </Button>
                <Button
                  variant="outline"
                  data-testid="goto-expense-btn"
                  disabled={addToExpensePending}
                  onClick={async () => {
                    if (!travelPlan || !user) {
                      toast({ title: language === "ko" ? "로그인이 필요합니다" : "Login required", variant: "destructive" });
                      return;
                    }
                    setAddToExpensePending(true);
                    try {
                      let usdToVnd = 25500;
                      try {
                        const rateRes = await fetch("/api/exchange-rates");
                        if (rateRes.ok) {
                          const rateData = await rateRes.json();
                          if (rateData.rates?.VND) usdToVnd = rateData.rates.VND;
                        }
                      } catch {}
                      const totalBudgetVnd = Math.round((travelPlan.totalEstimatedCost || 0) * usdToVnd);
                      const res = await apiRequest("POST", "/api/expense-groups", {
                        name: travelPlan.title || (language === "ko" ? "AI 여행 일정" : "AI Travel Plan"),
                        participants: [user.nickname || user.email || "나"],
                        budget: totalBudgetVnd,
                      });
                      const group = await res.json();
                      for (const day of travelPlan.days) {
                        for (const item of day.schedule) {
                          if (item.estimatedCost && item.estimatedCost > 0) {
                            const categoryMap: Record<string, string> = {
                              restaurant: "food", cafe: "food", attraction: "activity",
                              massage: "activity", golf: "activity", beach: "activity",
                              club: "activity", bar: "food", casino: "activity",
                              transfer: "transport", shopping: "shopping",
                            };
                            const amountVnd = Math.round(item.estimatedCost * usdToVnd);
                            await apiRequest("POST", `/api/expense-groups/${group.id}/expenses`, {
                              description: `${item.place} (Day ${day.day}) - $${item.estimatedCost}`,
                              amount: amountVnd,
                              category: categoryMap[item.type] || "other",
                              paidBy: user.nickname || user.email || "나",
                              splitAmong: [user.nickname || user.email || "나"],
                              date: day.date,
                              memo: item.note || "",
                            });
                          }
                        }
                      }
                      queryClient.invalidateQueries({ queryKey: ["/api/expense-groups"] });
                      toast({ title: language === "ko" ? "가계부에 추가되었습니다! (USD→VND 환율 적용)" : "Added to expense tracker! (USD→VND converted)" });
                      setLocation("/expenses");
                    } catch (err) {
                      toast({ title: language === "ko" ? "가계부 추가 실패" : "Failed to add", variant: "destructive" });
                    } finally {
                      setAddToExpensePending(false);
                    }
                  }}
                >
                  <Wallet className="h-4 w-4 mr-1" />
                  {addToExpensePending
                    ? (language === "ko" ? "추가 중..." : "Adding...")
                    : (language === "ko" ? "가계부에 추가" : "Add to Tracker")}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <FixedBottomBar />
    </div>
  );
}
