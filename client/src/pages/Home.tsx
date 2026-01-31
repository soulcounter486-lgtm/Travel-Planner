import { useState, useEffect, useMemo, useRef } from "react";
import { format, addDays, parseISO, getDay } from "date-fns";
import { ko, enUS, zhCN, vi, ru, ja } from "date-fns/locale";

// 베트남 공휴일 목록 (2025-2028)
const VIETNAM_HOLIDAYS: string[] = [
  // 2025년
  "2025-01-01", // 새해
  "2025-01-29", "2025-01-30", "2025-01-31", "2025-02-01", "2025-02-02", "2025-02-03", "2025-02-04", // 뗏 (설날, 음력 1월 1일 = 1/29)
  "2025-04-10", // 훙왕 기념일
  "2025-04-30", // 통일의 날
  "2025-05-01", // 노동절
  "2025-09-02", // 국경일
  // 2026년
  "2026-01-01", // 새해
  "2026-02-14", "2026-02-15", "2026-02-16", "2026-02-17", "2026-02-18", "2026-02-19", "2026-02-20", "2026-02-21", "2026-02-22", // 뗏 (설날, 음력 1월 1일 = 2/17)
  "2026-04-28", // 훙왕 기념일
  "2026-04-30", // 통일의 날
  "2026-05-01", // 노동절
  "2026-09-02", // 국경일
  "2026-11-24", // 베트남 문화의 날 (신설)
  // 2027년
  "2027-01-01", // 새해
  "2027-02-07", "2027-02-08", "2027-02-09", "2027-02-10", "2027-02-11", "2027-02-12", "2027-02-13", // 뗏 (설날, 음력 1월 1일 = 2/7)
  "2027-04-18", // 훙왕 기념일
  "2027-04-30", // 통일의 날
  "2027-05-01", // 노동절
  "2027-09-02", // 국경일
  "2027-11-24", // 베트남 문화의 날
  // 2028년
  "2028-01-01", // 새해
  "2028-01-26", "2028-01-27", "2028-01-28", "2028-01-29", "2028-01-30", "2028-01-31", "2028-02-01", // 뗏 (설날, 음력 1월 1일 = 1/26)
  "2028-04-06", // 훙왕 기념일
  "2028-04-30", // 통일의 날
  "2028-05-01", // 노동절
  "2028-09-02", // 국경일
  "2028-11-24", // 베트남 문화의 날
];

function isVietnamHoliday(date: Date): boolean {
  const dateStr = format(date, "yyyy-MM-dd");
  return VIETNAM_HOLIDAYS.includes(dateStr);
}
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

import { useLanguage } from "@/lib/i18n";
import { useCalculateQuote, useCreateQuote } from "@/hooks/use-quotes";
import { calculateQuoteSchema, type CalculateQuoteRequest, type QuoteBreakdown } from "@shared/schema";

import { SectionCard } from "@/components/SectionCard";
import { QuoteSummary } from "@/components/QuoteSummary";
import { SavedQuotesList } from "@/components/SavedQuotesList";
import { DepositCalendar } from "@/components/DepositCalendar";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import logoImg from "@assets/BackgroundEraser_20240323_103507859_1768275315346.png";
import villaImg from "@assets/900＿IMG＿1762947034771＿1762948444789_1768281401898.jpg";
import vehicleImg from "@assets/Photo＿1725451852943-1_1768289649378.jpg";
import { WeatherWidget } from "@/components/WeatherWidget";
import { ExchangeRateWidget } from "@/components/ExchangeRateWidget";
import { TabNavigation } from "@/components/TabNavigation";

import { 
  Plane, 
  Car, 
  Users, 
  User, 
  Calendar as CalendarIcon, 
  Check, 
  Plus,
  Phone,
  MessageSquare,
  ExternalLink,
  Globe,
  Flag,
  MapPin,
  Calculator,
  MessageCircle,
  Eye,
  Camera,
  Wallet,
  Navigation,
  Sparkles,
  UserPlus,
  ShoppingBag,
  Download,
  Smartphone
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { LogIn, LogOut, ChevronRight, ChevronLeft, Settings, X } from "lucide-react";
import type { Villa } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { user, isAuthenticated, isAdmin, logout, isLoading: isAuthLoading } = useAuth();
  
  // 빌라 목록 조회
  const { data: villas = [] } = useQuery<Villa[]>({
    queryKey: ["/api/villas"],
  });
  const [selectedVillaId, setSelectedVillaId] = useState<number | null>(null);
  const selectedVilla = villas.find(v => v.id === selectedVillaId) || null;
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 언어별 달력 locale 매핑
  const calendarLocale = useMemo(() => {
    switch (language) {
      case "ko": return ko;
      case "zh": return zhCN;
      case "vi": return vi;
      case "ru": return ru;
      case "ja": return ja;
      default: return enUS;
    }
  }, [language]);
  
  const [breakdown, setBreakdown] = useState<QuoteBreakdown | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [loadedQuoteId, setLoadedQuoteId] = useState<number | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const isLoadingQuoteRef = useRef(false);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [checkOutCalendarMonth, setCheckOutCalendarMonth] = useState<Date | undefined>(undefined);
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      window.open('https://www.pwabuilder.com/', '_blank');
    }
  };

  useEffect(() => {
    apiRequest("POST", "/api/visitor-count/increment")
      .then(res => res.json())
      .then(data => setVisitorCount(data.count))
      .catch(() => {});
  }, []);

  const { data: exchangeRatesData } = useQuery<{ rates: Record<string, number>; timestamp: number }>({
    queryKey: ["/api/exchange-rates"],
    staleTime: 12 * 60 * 60 * 1000,
  });

  const languageCurrencyMap: Record<string, { code: string; symbol: string; locale: string }> = {
    ko: { code: "KRW", symbol: "₩", locale: "ko-KR" },
    en: { code: "USD", symbol: "$", locale: "en-US" },
    zh: { code: "CNY", symbol: "¥", locale: "zh-CN" },
    vi: { code: "VND", symbol: "₫", locale: "vi-VN" },
    ru: { code: "RUB", symbol: "₽", locale: "ru-RU" },
    ja: { code: "JPY", symbol: "¥", locale: "ja-JP" },
  };

  const currencyInfo = languageCurrencyMap[language] || languageCurrencyMap.ko;
  const exchangeRate = exchangeRatesData?.rates?.[currencyInfo.code] || 1;
  
  const formatLocalCurrency = (usd: number) => {
    if (currencyInfo.code === "USD") return `$${usd.toLocaleString()}`;
    const converted = Math.round(usd * exchangeRate);
    return `${currencyInfo.symbol}${new Intl.NumberFormat(currencyInfo.locale).format(converted)}`;
  };

  const form = useForm<CalculateQuoteRequest>({
    resolver: zodResolver(calculateQuoteSchema),
    defaultValues: {
      villa: { enabled: true },
      vehicle: { enabled: false, selections: [] },
      golf: { enabled: false, selections: [] },
      ecoGirl: { enabled: false, selections: [] },
      guide: { enabled: false, days: "" as any, groupSize: 4 },
      fastTrack: { enabled: false, type: "oneway" as const, persons: "" as any },
    },
  });

  const calculateMutation = useCalculateQuote();
  const createQuoteMutation = useCreateQuote();
  const values = form.watch();

  const villaEstimate = useMemo(() => {
    if (!values.villa?.enabled || !values.villa?.checkIn || !values.villa?.checkOut) {
      return { price: 0, nights: 0, details: [] as { day: string; price: number }[], rooms: 1, villaName: "" };
    }
    try {
      let current = parseISO(values.villa.checkIn);
      const end = parseISO(values.villa.checkOut);
      if (isNaN(current.getTime()) || isNaN(end.getTime()) || current >= end) {
        return { price: 0, nights: 0, details: [] as { day: string; price: number }[], rooms: 1, villaName: "" };
      }
      let totalPrice = 0;
      const details: { day: string; price: number }[] = [];
      const rooms = values.villa.rooms || 1;
      
      // 선택된 빌라의 가격 사용 (없으면 기본값)
      const weekdayPrice = selectedVilla?.weekdayPrice ?? 350;
      const fridayPrice = selectedVilla?.fridayPrice ?? 380;
      const weekendPrice = selectedVilla?.weekendPrice ?? 500;
      const holidayPrice = selectedVilla?.holidayPrice ?? 550;
      
      while (current < end) {
        const dayOfWeek = getDay(current);
        const isHoliday = isVietnamHoliday(current);
        let dailyPrice = weekdayPrice;
        let dayName = format(current, "M/d");
        
        if (isHoliday) {
          dailyPrice = holidayPrice;
          dayName += ` (${t("villa.holiday") || "공휴일"})`;
        } else if (dayOfWeek === 5) {
          dailyPrice = fridayPrice;
          dayName += ` (${t("villa.friday")})`;
        } else if (dayOfWeek === 6 || dayOfWeek === 0) {
          dailyPrice = weekendPrice;
          dayName += ` (${t("villa.saturday")})`;
        }
        totalPrice += dailyPrice;
        details.push({ day: dayName, price: dailyPrice });
        current = addDays(current, 1);
      }
      return { price: totalPrice, nights: details.length, details, rooms, villaName: selectedVilla?.name || "" };
    } catch {
      return { price: 0, nights: 0, details: [] as { day: string; price: number }[], rooms: 1, villaName: "" };
    }
  }, [values.villa?.enabled, values.villa?.checkIn, values.villa?.checkOut, values.villa?.rooms, t, selectedVilla]);

  const golfEstimate = useMemo(() => {
    if (!values.golf?.enabled || !values.golf?.selections || values.golf.selections.length === 0) {
      return { price: 0, details: [] as { date: string; course: string; players: number; unitPrice: number; subtotal: number; tip: string }[] };
    }
    try {
      let totalPrice = 0;
      const details: { date: string; course: string; players: number; unitPrice: number; subtotal: number; tip: string }[] = [];
      for (const selection of values.golf.selections) {
        if (!selection?.date || !selection?.course) continue;
        const date = parseISO(selection.date);
        if (isNaN(date.getTime())) continue;
        const dayOfWeek = getDay(date);
        const isHoliday = isVietnamHoliday(date);
        const isWeekendOrHoliday = dayOfWeek === 0 || dayOfWeek === 6 || isHoliday;
        const players = Number(selection.players) || 1;
        let price = 0;
        let tip = "";
        let courseName = "";
        switch (selection.course) {
          case "paradise":
            price = isWeekendOrHoliday ? 110 : 90;
            tip = "40만동";
            courseName = t("golf.course.paradise");
            break;
          case "chouduc":
            price = isWeekendOrHoliday ? 120 : 80;
            tip = "50만동";
            courseName = t("golf.course.chouduc");
            break;
          case "hocham":
            price = isWeekendOrHoliday ? 200 : 150;
            tip = "50만동";
            courseName = t("golf.course.hocham");
            break;
        }
        const subtotal = price * players;
        totalPrice += subtotal;
        details.push({
          date: format(date, "M/d"),
          course: courseName,
          players,
          unitPrice: price,
          subtotal,
          tip
        });
      }
      return { price: totalPrice, details };
    } catch {
      return { price: 0, details: [] as { date: string; course: string; players: number; unitPrice: number; subtotal: number; tip: string }[] };
    }
  }, [values.golf?.enabled, JSON.stringify(values.golf?.selections), t]);

  const guideEstimate = useMemo(() => {
    if (!values.guide?.enabled) {
      return { price: 0, days: 0, groupSize: 0, baseRate: 0, extraRate: 0, extraPeople: 0 };
    }
    const baseRate = 120;
    const extraRate = 20;
    const days = Number(values.guide.days) || 0;
    const groupSize = Number(values.guide.groupSize) || 1;
    const extraPeople = Math.max(0, groupSize - 4);
    const dailyTotal = baseRate + (extraPeople * extraRate);
    const totalPrice = dailyTotal * days;
    return { price: totalPrice, days, groupSize, baseRate, extraRate, extraPeople, dailyTotal };
  }, [values.guide?.enabled, values.guide?.days, values.guide?.groupSize]);

  const fastTrackEstimate = useMemo(() => {
    if (!values.fastTrack?.enabled) {
      return { price: 0, persons: 0, type: "oneway" as const, pricePerPerson: 25 };
    }
    const pricePerPerson = 25;
    const persons = Number(values.fastTrack.persons) || 0;
    const type = values.fastTrack.type || "oneway";
    const multiplier = type === "roundtrip" ? 2 : 1;
    const totalPrice = pricePerPerson * persons * multiplier;
    return { price: totalPrice, persons, type, pricePerPerson };
  }, [values.fastTrack?.enabled, values.fastTrack?.persons, values.fastTrack?.type]);

  const ecoGirlEstimate = useMemo(() => {
    if (!values.ecoGirl?.enabled || !values.ecoGirl?.selections || values.ecoGirl.selections.length === 0) {
      return { price: 0, details: [] as { date: string; count: number; hours: string; price: number }[] };
    }
    const priceMap = { "12": 220, "22": 380 }; // 12시간: $220, 22시간: $380
    const details: { date: string; count: number; hours: string; price: number }[] = [];
    let totalPrice = 0;
    
    for (const selection of values.ecoGirl.selections) {
      const count = Number(selection.count) || 0;
      const hours = selection.hours || "12";
      const pricePerPerson = priceMap[hours as "12" | "22"] || 220;
      const price = count * pricePerPerson;
      details.push({ date: selection.date, count, hours, price });
      totalPrice += price;
    }
    
    return { price: totalPrice, details };
  }, [values.ecoGirl?.enabled, JSON.stringify(values.ecoGirl?.selections)]);

  const handleAddVehicleDay = () => {
    const currentSelections = form.getValues("vehicle.selections") || [];
    const lastDateStr = currentSelections.length > 0 
      ? currentSelections[currentSelections.length - 1].date
      : (values.villa?.checkIn ? values.villa.checkIn : format(new Date(), "yyyy-MM-dd"));
    const lastDate = new Date(lastDateStr);
    const nextDate = addDays(lastDate, currentSelections.length > 0 ? 1 : 0);
    const newSelections = [
      ...currentSelections,
      { date: format(nextDate, "yyyy-MM-dd"), type: "7_seater" as const, route: "city" as const }
    ];
    form.setValue("vehicle.selections", [...newSelections], { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };

  const handleRemoveVehicleDay = (index: number) => {
    const currentSelections = form.getValues("vehicle.selections") || [];
    form.setValue("vehicle.selections", currentSelections.filter((_, i) => i !== index));
  };

  const handleAddGolfDay = () => {
    const currentSelections = form.getValues("golf.selections") || [];
    const lastDateStr = currentSelections.length > 0 
      ? currentSelections[currentSelections.length - 1].date
      : (values.villa?.checkIn ? values.villa.checkIn : format(new Date(), "yyyy-MM-dd"));
    const lastDate = new Date(lastDateStr);
    const nextDate = addDays(lastDate, currentSelections.length > 0 ? 1 : 0);
    const newSelections = [
      ...currentSelections,
      { date: format(nextDate, "yyyy-MM-dd"), course: "paradise" as const, players: "" as any }
    ];
    form.setValue("golf.selections", [...newSelections], { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };

  const handleRemoveGolfDay = (index: number) => {
    const currentSelections = form.getValues("golf.selections") || [];
    form.setValue("golf.selections", currentSelections.filter((_, i) => i !== index));
  };

  const handleAddEcoDay = () => {
    const currentSelections = form.getValues("ecoGirl.selections") || [];
    const lastDateStr = currentSelections.length > 0 
      ? currentSelections[currentSelections.length - 1].date
      : (values.villa?.checkIn ? values.villa.checkIn : format(new Date(), "yyyy-MM-dd"));
    const lastDate = new Date(lastDateStr);
    const nextDate = addDays(lastDate, currentSelections.length > 0 ? 1 : 0);
    const newSelections = [
      ...currentSelections,
      { date: format(nextDate, "yyyy-MM-dd"), count: 1, hours: "12" as const }
    ];
    form.setValue("ecoGirl.selections", [...newSelections], { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };

  const handleRemoveEcoDay = (index: number) => {
    const currentSelections = form.getValues("ecoGirl.selections") || [];
    form.setValue("ecoGirl.selections", currentSelections.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const subscription = form.watch((value) => {
      // 견적서 불러오기 중이면 자동 계산 스킵
      if (isLoadingQuoteRef.current) return;
      
      const timer = setTimeout(() => {
        // Manually build a valid payload for calculation
        // This avoids Zod validation errors blocking the update
        const payload: any = {
          villa: value.villa?.enabled && value.villa.checkIn && value.villa.checkOut 
            ? { enabled: true, checkIn: value.villa.checkIn, checkOut: value.villa.checkOut, rooms: value.villa.rooms || 1, villaId: selectedVillaId || undefined } 
            : { enabled: false },
          vehicle: value.vehicle?.enabled && value.vehicle.selections && value.vehicle.selections.length > 0
            ? { 
                enabled: true, 
                selections: value.vehicle.selections.filter(s => s && s.date && s.type && s.route) 
              }
            : { enabled: false },
          golf: value.golf?.enabled && value.golf.selections && value.golf.selections.length > 0
            ? { 
                enabled: true, 
                selections: value.golf.selections
                  .filter((s): s is NonNullable<typeof s> => !!(s && s.date && s.course))
                  .map(s => ({ ...s, players: Number(s.players) || 1 }))
              }
            : { enabled: false },
          ecoGirl: value.ecoGirl?.enabled && value.ecoGirl.selections && value.ecoGirl.selections.length > 0
            ? { 
                enabled: true, 
                selections: value.ecoGirl.selections
                  .filter((s): s is NonNullable<typeof s> => !!(s && s.date))
                  .map(s => ({ ...s, count: Number(s.count) || 1 }))
              }
            : { enabled: false },
          guide: value.guide?.enabled
            ? { enabled: true, days: value.guide.days || 0, groupSize: value.guide.groupSize || 1 }
            : { enabled: false },
          fastTrack: value.fastTrack?.enabled
            ? { enabled: true, type: value.fastTrack.type || "oneway", persons: value.fastTrack.persons || 0 }
            : { enabled: false }
        };

        calculateMutation.mutate(payload, {
          onSuccess: (data) => setBreakdown(data),
          onError: (error) => console.error("Calculation error", error)
        });
      }, 300);
      return () => clearTimeout(timer);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, calculateMutation, isLoadingQuote]);

  const handleSaveQuote = async () => {
    if (!breakdown) return;
    
    // 불러온 견적서가 있으면 업데이트
    if (loadedQuoteId && customerName.trim()) {
      try {
        await apiRequest("PATCH", `/api/quotes/${loadedQuoteId}/total`, {
          totalPrice: breakdown.total,
          breakdown: breakdown
        });
        toast({ 
          title: language === "ko" ? "견적서 수정 완료" : "Quote Updated", 
          description: language === "ko" ? `"${customerName}" 견적서가 수정되었습니다.` : `Quote for "${customerName}" has been updated.`
        });
        // 캐시 무효화
        queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      } catch (err) {
        toast({ title: "Error", description: "Failed to update quote.", variant: "destructive" });
      }
    } else if (customerName.trim()) {
      // 고객명만 있고 불러온 견적서가 없으면 새로 저장
      createQuoteMutation.mutate({ customerName, totalPrice: breakdown.total, breakdown: breakdown }, {
        onSuccess: () => {
          toast({ title: language === "ko" ? "견적서 저장 완료" : "Quote Saved", description: `${customerName}` });
        },
        onError: () => toast({ title: "Error", description: "Failed to save quote.", variant: "destructive" })
      });
    } else {
      // 고객명 없으면 다이얼로그 열기
      setIsCustomerDialogOpen(true);
    }
  };

  // 저장된 견적서 불러오기
  const handleLoadQuote = (quote: any) => {
    isLoadingQuoteRef.current = true; // 자동 재계산 방지 (ref 사용)
    setIsLoadingQuote(true);
    const bd = quote.breakdown as QuoteBreakdown;
    
    // Villa 데이터 복원
    if (bd.villa && bd.villa.price > 0 && bd.villa.checkIn && bd.villa.checkOut) {
      form.setValue("villa.enabled", true);
      form.setValue("villa.checkIn", bd.villa.checkIn);
      form.setValue("villa.checkOut", bd.villa.checkOut);
      form.setValue("villa.rooms", bd.villa.rooms || 1);
    } else {
      form.setValue("villa.enabled", false);
    }

    // Vehicle 데이터 복원 (description 파싱)
    if (bd.vehicle && bd.vehicle.price > 0 && bd.vehicle.description) {
      const vehicleSelections: { date: string; type: string; route: string }[] = [];
      const vehicleParts = bd.vehicle.description.split(" | ");
      vehicleParts.forEach(part => {
        const dateMatch = part.match(/^(\d{4}-\d{2}-\d{2})/);
        const date = dateMatch ? dateMatch[1] : format(new Date(), "yyyy-MM-dd");
        // Parse vehicle type
        let type = "7_seater";
        if (part.includes("16인승")) type = "16_seater";
        else if (part.includes("12인승")) type = "12_lux_limo";
        else if (part.includes("9인승 럭스")) type = "9_lux_limo";
        else if (part.includes("9인승")) type = "9_limo";
        else if (part.includes("16인승 럭스")) type = "16_lux_limo";
        // Parse route
        let route = "city";
        if (part.includes("공항")) route = "airport";
        else if (part.includes("호치민")) route = "hochiminh";
        else if (part.includes("시내투어")) route = "city_tour";
        vehicleSelections.push({ date, type, route });
      });
      if (vehicleSelections.length > 0) {
        form.setValue("vehicle.enabled", true);
        form.setValue("vehicle.selections", vehicleSelections as any);
      }
    } else {
      form.setValue("vehicle.enabled", false);
      form.setValue("vehicle.selections", []);
    }

    // Golf 데이터 복원
    if (bd.golf && bd.golf.price > 0 && bd.golf.description) {
      const golfSelections: { date: string; course: string; players: number }[] = [];
      const golfParts = bd.golf.description.split(" | ");
      golfParts.forEach(part => {
        const dateMatch = part.match(/^(\d+\/\d+)/);
        const playersMatch = part.match(/x\s*(\d+)명/);
        const players = playersMatch ? parseInt(playersMatch[1]) : 1;
        let course = "paradise";
        if (part.toLowerCase().includes("chou") || part.includes("저우덕")) course = "chouduc";
        else if (part.toLowerCase().includes("ho") || part.includes("호참")) course = "hocham";
        
        // Get the date from villa checkIn or use today
        let golfDate = format(new Date(), "yyyy-MM-dd");
        if (bd.villa?.checkIn && dateMatch) {
          const villaStart = parseISO(bd.villa.checkIn);
          const [month, day] = dateMatch[1].split("/").map(Number);
          const year = villaStart.getFullYear();
          golfDate = format(new Date(year, month - 1, day), "yyyy-MM-dd");
        }
        golfSelections.push({ date: golfDate, course, players });
      });
      if (golfSelections.length > 0) {
        form.setValue("golf.enabled", true);
        form.setValue("golf.selections", golfSelections as any);
      }
    } else {
      form.setValue("golf.enabled", false);
      form.setValue("golf.selections", []);
    }

    // Guide 데이터 복원
    if (bd.guide && bd.guide.price > 0 && bd.guide.description) {
      const daysMatch = bd.guide.description.match(/(\d+)\s*(일|days?)/i);
      const groupMatch = bd.guide.description.match(/(\d+)\s*(명|人|people)/i);
      form.setValue("guide.enabled", true);
      form.setValue("guide.days", daysMatch ? parseInt(daysMatch[1]) : 1);
      form.setValue("guide.groupSize", groupMatch ? parseInt(groupMatch[1]) : 4);
    } else {
      form.setValue("guide.enabled", false);
    }

    // FastTrack 데이터 복원
    if (bd.fastTrack && bd.fastTrack.price > 0 && bd.fastTrack.description) {
      const personsMatch = bd.fastTrack.description.match(/(\d+)\s*(명|人|people)/i);
      const isRoundtrip = bd.fastTrack.description.includes("왕복") || bd.fastTrack.description.toLowerCase().includes("roundtrip");
      form.setValue("fastTrack.enabled", true);
      form.setValue("fastTrack.persons", personsMatch ? parseInt(personsMatch[1]) : 1);
      form.setValue("fastTrack.type", isRoundtrip ? "roundtrip" : "oneway");
    } else {
      form.setValue("fastTrack.enabled", false);
    }

    // EcoGirl 데이터 복원
    if (bd.ecoGirl && bd.ecoGirl.price > 0 && bd.ecoGirl.description) {
      const ecoSelections: { date: string; count: number }[] = [];
      if (bd.ecoGirl.details && Array.isArray(bd.ecoGirl.details)) {
        bd.ecoGirl.details.forEach(detail => {
          const dateMatch = detail.match(/^(\d+\/\d+)/);
          const countMatch = detail.match(/(\d+)\s*(명|人|people)/i);
          let ecoDate = format(new Date(), "yyyy-MM-dd");
          if (bd.villa?.checkIn && dateMatch) {
            const villaStart = parseISO(bd.villa.checkIn);
            const [month, day] = dateMatch[1].split("/").map(Number);
            const year = villaStart.getFullYear();
            ecoDate = format(new Date(year, month - 1, day), "yyyy-MM-dd");
          }
          ecoSelections.push({ date: ecoDate, count: countMatch ? parseInt(countMatch[1]) : 1 });
        });
      }
      if (ecoSelections.length > 0) {
        form.setValue("ecoGirl.enabled", true);
        form.setValue("ecoGirl.selections", ecoSelections as any);
      }
    } else {
      form.setValue("ecoGirl.enabled", false);
      form.setValue("ecoGirl.selections", []);
    }

    setBreakdown(bd);
    setCustomerName(quote.customerName); // 고객명 설정
    setLoadedQuoteId(quote.id); // 불러온 견적서 ID 저장
    
    // 폼 값 설정 완료 후 자동 계산 다시 활성화 (다음 틱에서)
    setTimeout(() => {
      isLoadingQuoteRef.current = false;
      setIsLoadingQuote(false);
    }, 500);
    
    toast({
      title: language === "ko" ? "견적서 불러옴" : "Quote Loaded",
      description: language === "ko" 
        ? `"${quote.customerName}" 견적서를 불러왔습니다. 수정 후 저장하면 기존 견적서가 업데이트됩니다.`
        : `Loaded quote for "${quote.customerName}". Changes will update the existing quote.`
    });

    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmSaveQuote = () => {
    if (!customerName.trim() || !breakdown) return;
    createQuoteMutation.mutate({ customerName, totalPrice: breakdown.total, breakdown: breakdown }, {
      onSuccess: () => {
        setIsCustomerDialogOpen(false);
        toast({ title: "Quote Saved Successfully", description: `Quote for ${customerName} has been saved.` });
        setCustomerName("");
      },
      onError: () => toast({ title: "Error", description: "Failed to save quote.", variant: "destructive" })
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="relative bg-white border-b border-border/40">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="container mx-auto px-4 py-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl flex items-center gap-6">
            <div className="flex flex-col items-center">
              <a 
                href="/vungtau-dokkaebi.apk" 
                download="붕따우_도깨비.apk"
                className="cursor-pointer hover:scale-105 transition-transform flex flex-col items-center"
                data-testid="btn-download-apk"
              >
                <img src={logoImg} alt={t("header.title")} className="w-28 h-28 sm:w-36 sm:h-36 md:w-52 md:h-52 lg:w-60 lg:h-60 object-contain drop-shadow-md" />
                <div className="flex flex-col items-center mt-1 animate-bounce">
                  <span className="text-[10px] text-primary font-medium whitespace-nowrap">↑ 앱 다운로드</span>
                </div>
              </a>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-display font-bold text-primary mb-3 leading-tight">
                  <span className="whitespace-nowrap">{t("header.title")}</span><br />
                  <span className="whitespace-nowrap text-base sm:text-xl md:text-2xl">{language === "ko" ? "실시간 여행견적" : "Live Travel Quote"}</span>
                </h1>
                {isAuthLoading ? null : isAuthenticated ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => logout()}
                    className="shrink-0 rounded-full h-6 px-2 text-[10px]"
                    data-testid="button-logout"
                  >
                    <LogOut className="w-3 h-3 mr-1" />
                    {language === "ko" ? "로그아웃" : "Logout"}
                  </Button>
                ) : (
                  <div className="flex items-center gap-1">
                    <a href="/api/auth/kakao" data-testid="button-login-kakao">
                      <Button
                        size="sm"
                        className="shrink-0 rounded-full h-6 px-2 text-[10px] bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] border-0"
                      >
                        <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3C6.477 3 2 6.463 2 10.714c0 2.683 1.74 5.028 4.348 6.385-.19.71-.69 2.576-.788 2.976-.12.49.18.483.379.352.156-.103 2.484-1.69 3.502-2.378.85.126 1.723.192 2.559.192 5.523 0 10-3.463 10-7.714C22 6.463 17.523 3 12 3z"/>
                        </svg>
                        카카오로그인
                      </Button>
                    </a>
                    <a href="/api/login" data-testid="button-login">
                      <Button
                        size="sm"
                        variant="default"
                        className="shrink-0 rounded-full h-6 px-2 text-[10px]"
                      >
                        <LogIn className="w-3 h-3 mr-1" />
                        로그인
                      </Button>
                    </a>
                  </div>
                )}
              </div>
              <p className="text-sm md:text-base text-muted-foreground font-light leading-relaxed">{t("header.description")}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-2 flex items-center gap-2">
            <WeatherWidget language={language} />
            <ExchangeRateWidget language={language} rates={exchangeRatesData?.rates} />
          </motion.div>
        </div>
      </div>
      <TabNavigation language={language} />

      <div className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6 pb-20">
            <Controller
              control={form.control}
              name="villa.enabled"
              render={({ field }) => (
                <SectionCard title={t("villa.title")} icon={Plane} isEnabled={field.value ?? false} onToggle={field.onChange} gradient="from-blue-500/10">
                  {/* 빌라 선택 갤러리 */}
                  {villas.length > 0 ? (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-sm font-medium">
                          {language === "ko" ? "풀빌라 선택" : "Select Villa"}
                        </Label>
                        {isAdmin && (
                          <Link href="/admin/villas">
                            <Button variant="ghost" size="sm" className="text-xs">
                              <Settings className="h-3 w-3 mr-1" />
                              관리
                            </Button>
                          </Link>
                        )}
                      </div>
                      {/* 작은 썸네일 리스트 */}
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {villas.map((villa) => (
                          <div
                            key={villa.id}
                            onClick={() => setSelectedVillaId(selectedVillaId === villa.id ? null : villa.id)}
                            className={cn(
                              "relative flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all w-16 h-16",
                              selectedVillaId === villa.id 
                                ? "border-primary ring-2 ring-primary/30" 
                                : "border-slate-200 hover:border-slate-300"
                            )}
                            data-testid={`villa-thumb-${villa.id}`}
                          >
                            {villa.mainImage ? (
                              <img 
                                src={villa.mainImage} 
                                alt={villa.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Camera className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            {selectedVillaId === villa.id && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <Check className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            {/* 룸 수 표시 */}
                            {villa.bedrooms && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] text-center py-0.5">
                                {villa.bedrooms}룸
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* 선택된 빌라 큰 사진 및 세부사항 */}
                      {selectedVilla && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 shadow-md">
                          <div 
                            className="aspect-[16/9] relative cursor-pointer group"
                            onClick={() => {
                              if (selectedVilla.images && selectedVilla.images.length > 0) {
                                setGalleryIndex(0);
                                setGalleryOpen(true);
                              }
                            }}
                            data-testid="villa-main-image"
                          >
                            {selectedVilla.mainImage ? (
                              <img 
                                src={selectedVilla.mainImage} 
                                alt={selectedVilla.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Camera className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                            {/* 이미지 개수 표시 및 클릭 안내 */}
                            {selectedVilla.images && selectedVilla.images.length > 1 && (
                              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <Camera className="w-3 h-3" />
                                {selectedVilla.images.length}장
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                              <h3 className="text-white text-lg font-bold">{selectedVilla.name}</h3>
                              {selectedVilla.maxGuests && selectedVilla.bedrooms && (
                                <p className="text-white/80 text-sm">
                                  최대 {selectedVilla.maxGuests}명 | {selectedVilla.bedrooms}개 침실
                                </p>
                              )}
                            </div>
                            {/* 호버 시 "사진 더보기" 표시 */}
                            {selectedVilla.images && selectedVilla.images.length > 0 && (
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
                                  📷 사진 보기
                                </span>
                              </div>
                            )}
                          </div>
                          {/* 사진 클릭 안내 */}
                          {selectedVilla.images && selectedVilla.images.length > 1 && (
                            <p className="text-center text-xs text-muted-foreground py-1.5 bg-muted/30">
                              👆 더 많은 사진을 보려면 클릭하세요
                            </p>
                          )}
                          <div className="p-4 bg-card">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">{t("villa.weekday")}</span>
                                <span className="font-medium">${selectedVilla.weekdayPrice}</span>
                              </div>
                              <div className="flex justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">{t("villa.friday")}</span>
                                <span className="font-medium">${selectedVilla.fridayPrice}</span>
                              </div>
                              <div className="flex justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">{t("villa.saturday")}</span>
                                <span className="font-medium">${selectedVilla.weekendPrice}</span>
                              </div>
                              <div className="flex justify-between p-2 bg-muted/50 rounded">
                                <span className="text-muted-foreground">{t("villa.holiday")}</span>
                                <span className="font-medium">${selectedVilla.holidayPrice}</span>
                              </div>
                            </div>
                            {selectedVilla.notes && (
                              <p className="text-xs text-muted-foreground mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                                📝 {selectedVilla.notes}
                              </p>
                            )}
                            {selectedVilla.address && (
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                📍 {selectedVilla.address}
                              </p>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="mt-2 text-xs text-muted-foreground"
                              onClick={() => setSelectedVillaId(null)}
                              data-testid="button-deselect-villa"
                            >
                              ✕ 선택 해제
                            </Button>
                          </div>
                        </div>
                      )}
                      <a 
                        href="https://m.blog.naver.com/vungtausaver?categoryNo=16&tab=1" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center justify-center gap-1 text-xs text-primary hover:underline"
                        data-testid="link-villa-blog"
                      >
                        <Camera className="w-3 h-3" />
                        {language === "ko" ? "블로그에서 더 많은 사진 보기" : "View more photos on blog"}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {isAdmin && (
                        <Link href="/admin/villas">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3 w-full border-primary/30 text-primary hover:bg-primary/10"
                            data-testid="button-admin-villa-manage"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            {language === "ko" ? "빌라 관리하기 (관리자)" : "Manage Villas (Admin)"}
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <>
                      <a 
                        href="https://m.blog.naver.com/vungtausaver?categoryNo=16&tab=1" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block relative group overflow-hidden rounded-xl border border-slate-200 shadow-md mb-4 cursor-pointer"
                        data-testid="link-villa-gallery"
                      >
                        <div className="aspect-[16/9] md:aspect-[21/9]">
                          <img 
                            src={villaImg} 
                            alt="럭셔리 풀빌라" 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col items-center justify-end pb-4">
                          <div className="bg-white/95 hover:bg-white text-primary px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
                            <Camera className="w-3.5 h-3.5" />
                            {language === "ko" ? "사진 더보기 (클릭)" : 
                             language === "en" ? "View More Photos" :
                             language === "zh" ? "查看更多照片" :
                             language === "vi" ? "Xem thêm ảnh" :
                             language === "ru" ? "Больше фото" :
                             language === "ja" ? "写真をもっと見る" : "사진 더보기"}
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </div>
                      </a>
                      {isAdmin && (
                        <Link href="/admin/villas">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full border-primary/30 text-primary hover:bg-primary/10"
                            data-testid="button-admin-villa-manage-empty"
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            {language === "ko" ? "빌라 관리하기 (관리자)" : "Manage Villas (Admin)"}
                          </Button>
                        </Link>
                      )}
                    </>
                  )}
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("villa.checkIn")}</Label>
                        <Controller
                          control={form.control}
                          name="villa.checkIn"
                          render={({ field }) => (
                            <Popover open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
                              <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-12 rounded-xl", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(new Date(field.value), "PPP", { locale: calendarLocale }) : <span>{t("villa.selectDate")}</span>}</Button></PopoverTrigger>
                              <PopoverContent className="w-auto p-0 z-[9999]" align="start"><Calendar mode="single" locale={calendarLocale} selected={field.value ? new Date(field.value) : undefined} onSelect={(date) => { field.onChange(date ? format(date, "yyyy-MM-dd") : ""); setIsCheckInOpen(false); }} initialFocus /></PopoverContent>
                            </Popover>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("villa.checkOut")}</Label>
                        <Controller
                          control={form.control}
                          name="villa.checkOut"
                          render={({ field }) => (
                            <Popover open={isCheckOutOpen} onOpenChange={(open) => {
                              setIsCheckOutOpen(open);
                              if (open && form.watch("villa.checkIn")) {
                                setCheckOutCalendarMonth(new Date(form.watch("villa.checkIn")));
                              }
                            }}>
                              <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-12 rounded-xl", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(new Date(field.value), "PPP", { locale: calendarLocale }) : <span>{t("villa.selectDate")}</span>}</Button></PopoverTrigger>
                              <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                                <Calendar 
                                  mode="single" 
                                  locale={calendarLocale} 
                                  selected={field.value ? new Date(field.value) : undefined} 
                                  month={checkOutCalendarMonth}
                                  onMonthChange={setCheckOutCalendarMonth}
                                  fromDate={form.watch("villa.checkIn") ? new Date(form.watch("villa.checkIn")) : undefined} 
                                  onSelect={(date) => { field.onChange(date ? format(date, "yyyy-MM-dd") : ""); setIsCheckOutOpen(false); }} 
                                  initialFocus 
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50/80 p-4 rounded-xl text-sm text-slate-700 border border-blue-100 shadow-sm">
                    <p>
                      <strong>{t("villa.weekday")}:</strong> ${selectedVilla?.weekdayPrice ?? 350} | 
                      <strong> {t("villa.friday")}:</strong> ${selectedVilla?.fridayPrice ?? 380} | 
                      <strong> {t("villa.saturday")}:</strong> ${selectedVilla?.weekendPrice ?? 500} | 
                      <strong> {t("villa.holiday") || "공휴일"}:</strong> ${selectedVilla?.holidayPrice ?? 550}
                    </p>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        <span className="text-amber-500 mt-0.5">📌</span>
                        <span>가격은 방 오픈 갯수와 성수기(6,7,8,9월) 공휴일에 따라 상이 할 수 있습니다.</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 p-2 rounded-lg border border-green-200">
                        <span className="text-green-500 mt-0.5">💰</span>
                        <span><strong>최저가 보장!</strong> 어플가격이 더 싸다면 링크 보내주시면 더 저렴하게 부킹 해 드립니다.</span>
                      </div>
                    </div>
                  </div>
                  {(villaEstimate.price > 0 || (loadedQuoteId && breakdown?.villa?.price)) && (
                    <div className="mt-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 rounded-xl shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{t("villa.estimatedPrice")}</span>
                          <div className="flex items-center gap-1 bg-blue-700/50 rounded-lg px-2 py-0.5">
                            <span className="text-xs text-blue-100">{language === "ko" ? "룸" : "Rooms"}:</span>
                            <Controller
                              control={form.control}
                              name="villa.rooms"
                              render={({ field }) => (
                                <input
                                  type="number"
                                  min={1}
                                  max={10}
                                  className="w-10 bg-white/20 text-white text-center text-sm rounded border-0 focus:outline-none focus:ring-1 focus:ring-white/50"
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    field.onChange(val === "" ? undefined : parseInt(val) || 1);
                                  }}
                                  onBlur={(e) => {
                                    if (!e.target.value || parseInt(e.target.value) < 1) {
                                      field.onChange(1);
                                    }
                                  }}
                                  data-testid="input-villa-rooms"
                                />
                              )}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold">${loadedQuoteId && breakdown?.villa?.price ? breakdown.villa.price : villaEstimate.price}</span>
                          {currencyInfo.code !== "USD" && (
                            <div className="text-sm text-blue-200">≈ {formatLocalCurrency(loadedQuoteId && breakdown?.villa?.price ? breakdown.villa.price : villaEstimate.price)}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-blue-100 space-y-0.5">
                        {loadedQuoteId && breakdown?.villa?.details && breakdown.villa.details.length > 0 ? (
                          breakdown.villa.details.map((d: string, i: number) => {
                            const parts = d.split(": $");
                            return (
                              <div key={i} className="flex justify-between">
                                <span>{parts[0]}</span>
                                <span>${parts[1]}</span>
                              </div>
                            );
                          })
                        ) : (
                          villaEstimate.details.map((d, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{d.day}</span>
                              <span>${d.price}</span>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="mt-2 pt-2 border-t border-blue-400/30 text-xs text-blue-100 flex justify-between">
                        <span>{villaEstimate.nights}{t("villa.nightsTotal")}{(values.villa?.rooms && values.villa.rooms > 1) ? ` (${values.villa.rooms}룸)` : ""}</span>
                        {currencyInfo.code !== "USD" && (
                          <span className="text-blue-200">{t("common.exchangeRate")}: {currencyInfo.symbol}{exchangeRate.toLocaleString()}/USD</span>
                        )}
                      </div>
                    </div>
                  )}
                </SectionCard>
              )}
            />

            <Controller
              control={form.control}
              name="vehicle.enabled"
              render={({ field }) => (
                <SectionCard
                  title={t("vehicle.title")}
                  icon={Car}
                  isEnabled={field.value ?? false}
                  onToggle={field.onChange}
                  gradient="from-indigo-500/10"
                >
                  <div className="space-y-4 max-h-[500px] overflow-y-auto p-1 pr-2 custom-scrollbar">
                    <a 
                      href="https://m.blog.naver.com/vungtausaver/223352172674" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block relative group overflow-hidden rounded-xl border border-slate-200 shadow-md mb-4 cursor-pointer"
                      data-testid="link-vehicle-gallery"
                    >
                      <div className="aspect-[16/9] md:aspect-[21/9]">
                        <img 
                          src={vehicleImg} 
                          alt="프라이빗 차량 서비스" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col items-center justify-end pb-4">
                        <div className="bg-white/95 hover:bg-white text-primary px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg">
                          <Camera className="w-3.5 h-3.5" />
                          {language === "ko" ? "사진 더보기 (클릭)" : 
                           language === "en" ? "View More Photos" :
                           language === "zh" ? "查看更多照片" :
                           language === "vi" ? "Xem thêm ảnh" :
                           language === "ru" ? "Больше фото" :
                           language === "ja" ? "写真をもっと見る" : "사진 더보기"}
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </div>
                    </a>
                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 mb-4">
                      <h4 className="text-xs font-bold text-indigo-900 mb-2">{t("vehicle.info")}</h4>
                      <div className="grid grid-cols-2 gap-3 text-[10px]">
                        <div>
                          <p className="font-semibold text-indigo-900 mb-0.5">{t("vehicle.included")}</p>
                          <ul className="text-indigo-700 space-y-0 list-disc list-inside">
                            {t("vehicle.includedItems").split("|").map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-indigo-900 mb-0.5">{t("vehicle.notIncluded")}</p>
                          <ul className="text-indigo-700 space-y-0 list-disc list-inside">
                            {t("vehicle.notIncludedItems").split("|").map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {values.vehicle?.selections?.map((selection, index) => (
                        <div key={`vehicle-day-${index}`} className="grid grid-cols-1 md:grid-cols-7 gap-3 p-4 bg-white rounded-xl border border-slate-200 relative group shadow-sm items-end">
                          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs font-semibold text-slate-500">{t("vehicle.date")}</Label><Controller control={form.control} name={`vehicle.selections.${index}.date`} render={({ field }) => (<Input type="date" {...field} className="h-10 rounded-lg text-sm border-slate-200 focus:ring-primary/20" />)} /></div>
                          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs font-semibold text-slate-500">{t("vehicle.type")}</Label><Controller control={form.control} name={`vehicle.selections.${index}.type`} render={({ field }) => (
                            <div className="space-y-2">
                              <Select onValueChange={(value) => { field.onChange(value); if (document.activeElement instanceof HTMLElement) { document.activeElement.blur(); } }} defaultValue={field.value}>
                                <SelectTrigger className="h-10 rounded-lg text-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 dark:text-slate-100"><SelectValue placeholder={t("vehicle.select")} /></SelectTrigger>
                                <SelectContent className="z-[9999] bg-white dark:bg-slate-800 border shadow-lg opacity-100 dark:border-slate-600">
                                  <SelectItem value="7_seater">{t("vehicle.7_seater")}</SelectItem>
                                  <SelectItem value="16_seater">{t("vehicle.16_seater")}</SelectItem>
                                  <SelectItem value="9_limo">{t("vehicle.9_limo")}</SelectItem>
                                  <SelectItem value="9_lux_limo">{t("vehicle.9_lux_limo")}</SelectItem>
                                  <SelectItem value="12_lux_limo">{t("vehicle.12_lux_limo")}</SelectItem>
                                  <SelectItem value="16_lux_limo">{t("vehicle.16_lux_limo")}</SelectItem>
                                  <SelectItem value="29_seater">{t("vehicle.29_seater")}</SelectItem>
                                  <SelectItem value="45_seater">{t("vehicle.45_seater")}</SelectItem>
                                </SelectContent>
                              </Select>
                              {field.value && (
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[10px] leading-relaxed text-slate-600 space-y-1">
                                  {/* Pricing display for selected vehicle */}
                                  <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-200">
                                    <span className="font-bold text-slate-700">{t("vehicle.estimatedPrice")}:</span>
                                    <div className="text-right">
                                      {(() => {
                                        const type = values.vehicle?.selections?.[index]?.type;
                                        const route = values.vehicle?.selections?.[index]?.route;
                                        if (!type || !route) return <span className="text-lg font-bold text-primary">-</span>;
                                        
                                        const prices: Record<string, any> = {
                                          "7_seater": { city: 100, oneway: 80, hocham_oneway: 80, phanthiet_oneway: 130, roundtrip: 150, city_pickup_drop: 120 },
                                          "16_seater": { city: 130, oneway: 130, hocham_oneway: 130, phanthiet_oneway: Math.round(130 * 1.6 * 0.85), roundtrip: 250, city_pickup_drop: 190 },
                                          "9_limo": { city: 160, oneway: 160, hocham_oneway: 160, phanthiet_oneway: Math.round(160 * 1.6 * 0.85), roundtrip: 300, city_pickup_drop: 230 },
                                          "9_lux_limo": { city: 210, oneway: 210, hocham_oneway: 210, phanthiet_oneway: Math.round(210 * 1.6 * 0.85), roundtrip: 400, city_pickup_drop: 300 },
                                          "12_lux_limo": { city: 250, oneway: 250, hocham_oneway: 250, phanthiet_oneway: Math.round(250 * 1.6 * 0.85), roundtrip: 480, city_pickup_drop: 350 },
                                          "16_lux_limo": { city: 280, oneway: 280, hocham_oneway: 280, phanthiet_oneway: Math.round(280 * 1.6 * 0.85), roundtrip: 530, city_pickup_drop: 400 },
                                          "29_seater": { city: 230, oneway: 230, hocham_oneway: 230, phanthiet_oneway: Math.round(230 * 1.6 * 0.85), roundtrip: 430, city_pickup_drop: 330 },
                                          "45_seater": { city: 280, oneway: 290, hocham_oneway: 290, phanthiet_oneway: Math.round(290 * 1.6 * 0.85), roundtrip: 550, city_pickup_drop: 410 },
                                        };
                                        
                                        const price = prices[type]?.[route];
                                        if (!price) return <span className="text-lg font-bold text-primary">-</span>;
                                        return (
                                          <>
                                            <span className="text-lg font-bold text-primary">${price}</span>
                                            {currencyInfo.code !== "USD" && (
                                              <div className="text-xs text-indigo-600">≈ {formatLocalCurrency(price)}</div>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                  {field.value && (
                                    <div className="space-y-0.5">
                                      {t(`vehicle.desc.${field.value}`).split("|").map((line, i) => (
                                        <p key={i} className={i === 0 ? "font-bold text-slate-700" : ""}>{line}</p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )} /></div>
                          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs font-semibold text-slate-500">{t("vehicle.route")}</Label><Controller control={form.control} name={`vehicle.selections.${index}.route`} render={({ field }) => (<Select onValueChange={(value) => { field.onChange(value); if (document.activeElement instanceof HTMLElement) { document.activeElement.blur(); } }} defaultValue={field.value}><SelectTrigger className="h-10 rounded-lg text-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 dark:text-slate-100"><SelectValue placeholder={t("vehicle.select")} /></SelectTrigger><SelectContent className="z-[9999] bg-white dark:bg-slate-800 border shadow-lg opacity-100 dark:border-slate-600"><SelectItem value="city">{t("route.city")}</SelectItem><SelectItem value="oneway">{t("route.oneway")}</SelectItem><SelectItem value="hocham_oneway">{t("route.hocham_oneway")}</SelectItem><SelectItem value="phanthiet_oneway">{t("route.phanthiet_oneway")}</SelectItem><SelectItem value="roundtrip">{t("route.roundtrip")}</SelectItem><SelectItem value="city_pickup_drop">{t("route.city_pickup_drop")}</SelectItem></SelectContent></Select>)} /></div>
                          <div className="md:col-span-1 flex justify-end"><Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 h-10 w-10 rounded-lg" onClick={() => handleRemoveVehicleDay(index)} type="button"><div className="w-4 h-0.5 bg-current rounded-full" /></Button></div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" className="w-full h-12 rounded-xl border-dashed border-2 hover:border-primary hover:text-primary transition-all bg-white" onClick={handleAddVehicleDay}><Plus className="mr-2 h-4 w-4" /> {t("vehicle.addDay")}</Button>
                    </div>
                  </div>
                  {/* 차량 예상 금액 요약 */}
                  {(loadedQuoteId && breakdown?.vehicle?.price) || (values.vehicle?.selections && values.vehicle.selections.length > 0) ? (
                    <div className="mt-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white p-4 rounded-xl shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{t("vehicle.estimatedPrice")}</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold">
                            ${loadedQuoteId && breakdown?.vehicle?.price 
                              ? breakdown.vehicle.price 
                              : (() => {
                                  const prices: Record<string, any> = {
                                    "7_seater": { city: 100, oneway: 80, hocham_oneway: 80, phanthiet_oneway: 110, roundtrip: 150, city_pickup_drop: 120 },
                                    "16_seater": { city: 130, oneway: 130, hocham_oneway: 130, phanthiet_oneway: 177, roundtrip: 250, city_pickup_drop: 190 },
                                    "9_limo": { city: 160, oneway: 160, hocham_oneway: 160, phanthiet_oneway: 217, roundtrip: 300, city_pickup_drop: 230 },
                                    "9_lux_limo": { city: 210, oneway: 210, hocham_oneway: 210, phanthiet_oneway: 285, roundtrip: 400, city_pickup_drop: 300 },
                                    "12_lux_limo": { city: 250, oneway: 250, hocham_oneway: 250, phanthiet_oneway: 340, roundtrip: 480, city_pickup_drop: 350 },
                                    "16_lux_limo": { city: 280, oneway: 280, hocham_oneway: 280, phanthiet_oneway: 380, roundtrip: 530, city_pickup_drop: 400 },
                                    "29_seater": { city: 230, oneway: 230, hocham_oneway: 230, phanthiet_oneway: 312, roundtrip: 430, city_pickup_drop: 330 },
                                    "45_seater": { city: 280, oneway: 290, hocham_oneway: 290, phanthiet_oneway: 394, roundtrip: 550, city_pickup_drop: 410 },
                                  };
                                  return values.vehicle?.selections?.reduce((sum, sel) => {
                                    if (!sel?.type || !sel?.route) return sum;
                                    return sum + (prices[sel.type]?.[sel.route] || 0);
                                  }, 0) || 0;
                                })()
                            }
                          </span>
                          {currencyInfo.code !== "USD" && (
                            <div className="text-sm text-indigo-200">
                              ≈ {formatLocalCurrency(loadedQuoteId && breakdown?.vehicle?.price 
                                ? breakdown.vehicle.price 
                                : values.vehicle?.selections?.reduce((sum, sel) => {
                                    const prices: Record<string, any> = {
                                      "7_seater": { city: 100, oneway: 80, hocham_oneway: 80, phanthiet_oneway: 110, roundtrip: 150, city_pickup_drop: 120 },
                                      "16_seater": { city: 130, oneway: 130, hocham_oneway: 130, phanthiet_oneway: 177, roundtrip: 250, city_pickup_drop: 190 },
                                      "9_limo": { city: 160, oneway: 160, hocham_oneway: 160, phanthiet_oneway: 217, roundtrip: 300, city_pickup_drop: 230 },
                                      "9_lux_limo": { city: 210, oneway: 210, hocham_oneway: 210, phanthiet_oneway: 285, roundtrip: 400, city_pickup_drop: 300 },
                                      "12_lux_limo": { city: 250, oneway: 250, hocham_oneway: 250, phanthiet_oneway: 340, roundtrip: 480, city_pickup_drop: 350 },
                                      "16_lux_limo": { city: 280, oneway: 280, hocham_oneway: 280, phanthiet_oneway: 380, roundtrip: 530, city_pickup_drop: 400 },
                                      "29_seater": { city: 230, oneway: 230, hocham_oneway: 230, phanthiet_oneway: 312, roundtrip: 430, city_pickup_drop: 330 },
                                      "45_seater": { city: 280, oneway: 290, hocham_oneway: 290, phanthiet_oneway: 394, roundtrip: 550, city_pickup_drop: 410 },
                                    };
                                    if (!sel?.type || !sel?.route) return sum;
                                    return sum + (prices[sel.type]?.[sel.route] || 0);
                                  }, 0) || 0
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-indigo-100 space-y-1">
                        {loadedQuoteId && breakdown?.vehicle?.description ? (
                          breakdown.vehicle.description.split(" | ").map((d, i) => {
                            const parts = d.split(" / ");
                            return (
                              <div key={i} className="flex justify-between items-center">
                                <span>{parts[0]} {parts[1]}</span>
                                <span>{parts[3]}</span>
                              </div>
                            );
                          })
                        ) : (
                          values.vehicle?.selections?.map((sel, i) => {
                            if (!sel?.type || !sel?.route) return null;
                            const prices: Record<string, any> = {
                              "7_seater": { city: 100, oneway: 80, hocham_oneway: 80, phanthiet_oneway: 110, roundtrip: 150, city_pickup_drop: 120 },
                              "16_seater": { city: 130, oneway: 130, hocham_oneway: 130, phanthiet_oneway: 177, roundtrip: 250, city_pickup_drop: 190 },
                              "9_limo": { city: 160, oneway: 160, hocham_oneway: 160, phanthiet_oneway: 217, roundtrip: 300, city_pickup_drop: 230 },
                              "9_lux_limo": { city: 210, oneway: 210, hocham_oneway: 210, phanthiet_oneway: 285, roundtrip: 400, city_pickup_drop: 300 },
                              "12_lux_limo": { city: 250, oneway: 250, hocham_oneway: 250, phanthiet_oneway: 340, roundtrip: 480, city_pickup_drop: 350 },
                              "16_lux_limo": { city: 280, oneway: 280, hocham_oneway: 280, phanthiet_oneway: 380, roundtrip: 530, city_pickup_drop: 400 },
                              "29_seater": { city: 230, oneway: 230, hocham_oneway: 230, phanthiet_oneway: 312, roundtrip: 430, city_pickup_drop: 330 },
                              "45_seater": { city: 280, oneway: 290, hocham_oneway: 290, phanthiet_oneway: 394, roundtrip: 550, city_pickup_drop: 410 },
                            };
                            const price = prices[sel.type]?.[sel.route] || 0;
                            return (
                              <div key={i} className="flex justify-between items-center">
                                <span>{sel.date} {t(`vehicle.${sel.type}`)}</span>
                                <span>${price}</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ) : null}
                </SectionCard>
              )}
            />

            <Controller
              control={form.control}
              name="golf.enabled"
              render={({ field }) => (
                <SectionCard title={t("golf.title")} icon={Flag} isEnabled={field.value ?? false} onToggle={field.onChange} gradient="from-emerald-600/10">
                  <div className="max-h-[600px] overflow-y-auto p-1 pr-2 custom-scrollbar flex flex-col gap-4">
                    <div className="p-4 bg-emerald-50 rounded-xl text-xs text-emerald-800 space-y-1 border border-emerald-100 shadow-sm sticky top-0 z-20">
                      <p><strong>{t("golf.info.included")}</strong></p>
                      <p><strong>{t("golf.info.notIncluded")}</strong></p>
                      <p><strong>{t("golf.info.weekend")}</strong></p>
                    </div>
                    <div className="space-y-4">
                      {values.golf?.selections?.map((selection, index) => (
                        <div key={`golf-day-${index}`} className="grid grid-cols-1 md:grid-cols-9 gap-3 p-4 bg-white rounded-xl border border-slate-200 relative group shadow-sm items-end overflow-hidden">
                          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs font-semibold text-slate-500">{t("golf.date")}</Label><Controller control={form.control} name={`golf.selections.${index}.date`} render={({ field }) => (<Input type="date" {...field} className="h-10 rounded-lg text-sm border-slate-200 focus:ring-primary/20 w-full" />)} /></div>
                          <div className="md:col-span-4 space-y-1.5"><Label className="text-xs font-semibold text-slate-500">{t("golf.courseSelect")}</Label><Controller control={form.control} name={`golf.selections.${index}.course`} render={({ field }) => (<Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger className="h-10 rounded-lg text-sm bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 dark:text-slate-100 w-full"><SelectValue placeholder={t("vehicle.select")} /></SelectTrigger><SelectContent className="z-[9999] bg-white dark:bg-slate-800 border shadow-lg opacity-100 dark:border-slate-600"><SelectItem value="paradise">{t("golf.course.paradise_price")}</SelectItem><SelectItem value="chouduc">{t("golf.course.chouduc_price")}</SelectItem><SelectItem value="hocham">{t("golf.course.hocham_price")}</SelectItem></SelectContent></Select>)} /></div>
                          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs font-semibold text-slate-500">{t("golf.players")}</Label><Controller control={form.control} name={`golf.selections.${index}.players`} render={({ field }) => (<Input type="number" min="1" {...field} value={field.value ?? ""} onChange={(e) => { const val = e.target.value; field.onChange(val === "" ? "" : parseInt(val)); }} className="h-10 rounded-lg text-sm border-slate-200 w-full" />)} /></div>
                          <div className="md:col-span-1 flex justify-end"><Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 h-10 w-10 rounded-lg" onClick={() => handleRemoveGolfDay(index)} type="button"><div className="w-4 h-0.5 bg-current rounded-full" /></Button></div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" className="w-full h-12 rounded-xl border-dashed border-2 hover:border-primary hover:text-primary transition-all bg-white" onClick={handleAddGolfDay}><Plus className="mr-2 h-4 w-4" /> {t("golf.addDay")}</Button>
                    </div>
                  </div>
                  {(golfEstimate.price > 0 || (loadedQuoteId && breakdown?.golf?.price)) && (
                    <div className="mt-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-4 rounded-xl shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{t("golf.estimatedPrice")}</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold">${loadedQuoteId && breakdown?.golf?.price ? breakdown.golf.price : golfEstimate.price}</span>
                          {currencyInfo.code !== "USD" && (
                            <div className="text-sm text-emerald-200">≈ {formatLocalCurrency(loadedQuoteId && breakdown?.golf?.price ? breakdown.golf.price : golfEstimate.price)}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-emerald-100 space-y-1">
                        {loadedQuoteId && breakdown?.golf?.description ? (
                          breakdown.golf.description.split(" | ").map((d, i) => (
                            <div key={i} className="flex justify-between items-center">
                              <span>{d.split(" / ")[0]} {d.split(" / ")[1]}</span>
                              <span>{d.split(" / ")[2]?.split(" (")[0]}</span>
                            </div>
                          ))
                        ) : (
                          golfEstimate.details.map((d, i) => (
                            <div key={i} className="flex justify-between items-center">
                              <span>{d.date} {d.course}</span>
                              <span>${d.unitPrice} × {d.players}{t("golf.person")} = ${d.subtotal}</span>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="mt-2 pt-2 border-t border-emerald-400/30 text-xs text-emerald-100 flex justify-between">
                        <span>{t("golf.caddyTipNote")}</span>
                        {currencyInfo.code !== "USD" && (
                          <span className="text-emerald-200">{t("common.exchangeRate")}: {currencyInfo.symbol}{exchangeRate.toLocaleString()}/USD</span>
                        )}
                      </div>
                    </div>
                  )}
                </SectionCard>
              )}
            />

            <Controller control={form.control} name="guide.enabled" render={({ field }) => (<SectionCard title={t("guide.title")} icon={Users} isEnabled={field.value ?? false} onToggle={field.onChange} gradient="from-emerald-500/10"><div className="grid md:grid-cols-2 gap-6"><div className="space-y-2"><Label>{t("guide.days")}</Label><Controller control={form.control} name="guide.days" render={({ field }) => (<Input type="number" min="0" {...field} value={field.value ?? ""} onChange={(e) => { const val = e.target.value; field.onChange(val === "" ? "" : parseInt(val)); }} className="h-12 rounded-xl" />)} /></div><div className="space-y-2"><Label>{t("guide.groupSize")}</Label><Controller control={form.control} name="guide.groupSize" render={({ field }) => (<Input type="number" min="1" {...field} value={field.value ?? ""} onChange={(e) => { const val = e.target.value; field.onChange(val === "" ? "" : parseInt(val)); }} className="h-12 rounded-xl" />)} /></div></div><div className="mt-2 text-sm text-emerald-600 font-medium">{t("guide.infoText")}</div>
                  {guideEstimate.price > 0 && (
                    <div className="mt-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white p-4 rounded-xl shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{t("guide.estimatedPrice")}</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold">${guideEstimate.price}</span>
                          {currencyInfo.code !== "USD" && (
                            <div className="text-sm text-teal-200">≈ {formatLocalCurrency(guideEstimate.price)}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-teal-100 space-y-1">
                        <div className="flex justify-between">
                          <span>{t("guide.baseRate")}</span>
                          <span>${guideEstimate.baseRate}/{t("guide.perDay")}</span>
                        </div>
                        {guideEstimate.extraPeople > 0 && (
                          <div className="flex justify-between">
                            <span>{t("guide.extraCharge")} ({guideEstimate.extraPeople}{t("golf.person")})</span>
                            <span>+${guideEstimate.extraPeople * guideEstimate.extraRate}/{t("guide.perDay")}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1 border-t border-teal-400/30">
                          <span>{guideEstimate.days}{t("guide.daysTotal")}</span>
                          <span>${guideEstimate.dailyTotal} × {guideEstimate.days} = ${guideEstimate.price}</span>
                        </div>
                        {currencyInfo.code !== "USD" && (
                          <div className="flex justify-end pt-1 text-teal-200">
                            <span>{t("common.exchangeRate")}: {currencyInfo.symbol}{exchangeRate.toLocaleString()}/USD</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </SectionCard>)} />

            <Controller control={form.control} name="fastTrack.enabled" render={({ field }) => (
              <SectionCard 
                title={language === "ko" ? "패스트트랙" : language === "en" ? "Fast Track" : language === "zh" ? "快速通道" : language === "vi" ? "Fast Track" : language === "ru" ? "Фаст-трек" : language === "ja" ? "ファストトラック" : "패스트트랙"} 
                icon={Plane} 
                isEnabled={field.value ?? false} 
                onToggle={field.onChange} 
                gradient="from-amber-500/10"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>{language === "ko" ? "유형" : language === "en" ? "Type" : language === "zh" ? "类型" : language === "vi" ? "Loại" : language === "ru" ? "Тип" : language === "ja" ? "タイプ" : "유형"}</Label>
                    <Controller 
                      control={form.control} 
                      name="fastTrack.type" 
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-12 rounded-xl" data-testid="select-fasttrack-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="oneway">
                              {language === "ko" ? "편도 ($25/인)" : language === "en" ? "One Way ($25/person)" : language === "zh" ? "单程 ($25/人)" : language === "vi" ? "Một chiều ($25/người)" : language === "ru" ? "В одну сторону ($25/чел)" : language === "ja" ? "片道 ($25/名)" : "편도 ($25/인)"}
                            </SelectItem>
                            <SelectItem value="roundtrip">
                              {language === "ko" ? "왕복 ($50/인)" : language === "en" ? "Round Trip ($50/person)" : language === "zh" ? "往返 ($50/人)" : language === "vi" ? "Khứ hồi ($50/người)" : language === "ru" ? "Туда и обратно ($50/чел)" : language === "ja" ? "往復 ($50/名)" : "왕복 ($50/인)"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ko" ? "인원수" : language === "en" ? "Number of People" : language === "zh" ? "人数" : language === "vi" ? "Số người" : language === "ru" ? "Количество" : language === "ja" ? "人数" : "인원수"}</Label>
                    <Controller 
                      control={form.control} 
                      name="fastTrack.persons" 
                      render={({ field }) => (
                        <Input 
                          type="number" 
                          min="0" 
                          {...field} 
                          value={field.value ?? ""} 
                          onChange={(e) => { 
                            const val = e.target.value; 
                            field.onChange(val === "" ? "" : parseInt(val)); 
                          }} 
                          className="h-12 rounded-xl" 
                          data-testid="input-fasttrack-persons"
                        />
                      )} 
                    />
                  </div>
                </div>
                <div className="mt-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
                  {language === "ko" ? "공항 출입국 시 전용 라인으로 빠르게 이동" : language === "en" ? "Expedited airport immigration via priority lane" : language === "zh" ? "机场出入境专用通道快速通行" : language === "vi" ? "Di chuyển nhanh qua làn ưu tiên tại sân bay" : language === "ru" ? "Быстрый проход через приоритетную линию" : language === "ja" ? "専用レーンで空港出入国を迅速に" : "공항 출입국 시 전용 라인으로 빠르게 이동"}
                </div>
                {fastTrackEstimate.price > 0 && (
                  <div className="mt-4 bg-gradient-to-r from-amber-600 to-amber-500 text-white p-4 rounded-xl shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{language === "ko" ? "예상 금액" : language === "en" ? "Estimated Price" : language === "zh" ? "预估价格" : language === "vi" ? "Giá dự kiến" : language === "ru" ? "Ориентировочная цена" : language === "ja" ? "見積もり金額" : "예상 금액"}</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold">${fastTrackEstimate.price}</span>
                        {currencyInfo.code !== "USD" && (
                          <div className="text-sm text-amber-200">≈ {formatLocalCurrency(fastTrackEstimate.price)}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-amber-100 space-y-1">
                      <div className="flex justify-between">
                        <span>{fastTrackEstimate.type === "roundtrip" ? (language === "ko" ? "왕복" : "Round Trip") : (language === "ko" ? "편도" : "One Way")}</span>
                        <span>${fastTrackEstimate.pricePerPerson}{fastTrackEstimate.type === "roundtrip" ? " × 2" : ""} × {fastTrackEstimate.persons}{language === "ko" ? "명" : ""}</span>
                      </div>
                      {currencyInfo.code !== "USD" && (
                        <div className="flex justify-end pt-1 text-amber-200">
                          <span>{t("common.exchangeRate")}: {currencyInfo.symbol}{exchangeRate.toLocaleString()}/USD</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </SectionCard>
            )} />

            {(isAdmin || (isAuthenticated && user?.gender === 'male')) && (
              <Controller control={form.control} name="ecoGirl.enabled" render={({ field }) => (
                <SectionCard 
                  title={language === "ko" ? "에코" : language === "en" ? "Eco" : language === "zh" ? "生态" : language === "vi" ? "Eco" : language === "ru" ? "Эко" : language === "ja" ? "エコ" : "에코"} 
                  icon={Users} 
                  isEnabled={field.value ?? false} 
                  onToggle={field.onChange} 
                  gradient="from-pink-500/10"
                >
                  <div className="mb-4 text-sm text-pink-600 dark:text-pink-400 font-medium space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span>$220/인</span>
                      <span className="text-xs text-pink-400 dark:text-pink-500">{language === "ko" ? "12시간 기준, 18~06시" : "12h, 18:00-06:00"}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span>$380/인</span>
                      <span className="text-xs text-pink-400 dark:text-pink-500">{language === "ko" ? "22시간 기준, 12~10시" : "22h, 12:00-10:00"}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {values.ecoGirl?.selections?.map((selection, index) => (
                      <div key={`eco-day-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 relative group shadow-sm items-end">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-500">{language === "ko" ? "날짜" : "Date"}</Label>
                          <Controller 
                            control={form.control} 
                            name={`ecoGirl.selections.${index}.date`} 
                            render={({ field }) => (
                              <Input type="date" {...field} className="h-10 rounded-lg text-sm border-slate-200 focus:ring-primary/20" />
                            )} 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-500">{language === "ko" ? "시간" : "Hours"}</Label>
                          <Controller 
                            control={form.control} 
                            name={`ecoGirl.selections.${index}.hours`} 
                            render={({ field }) => (
                              <Select value={field.value || "12"} onValueChange={field.onChange}>
                                <SelectTrigger className="h-10 rounded-lg text-sm border-slate-200" data-testid={`select-eco-hours-${index}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="12">{language === "ko" ? "12시간 ($220)" : "12h ($220)"}</SelectItem>
                                  <SelectItem value="22">{language === "ko" ? "22시간 ($380)" : "22h ($380)"}</SelectItem>
                                </SelectContent>
                              </Select>
                            )} 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-500">{language === "ko" ? "인원수" : "Count"}</Label>
                          <Controller 
                            control={form.control} 
                            name={`ecoGirl.selections.${index}.count`} 
                            render={({ field }) => (
                              <Input 
                                type="number" 
                                min="1" 
                                {...field} 
                                value={field.value ?? ""} 
                                onChange={(e) => { 
                                  const val = e.target.value; 
                                  field.onChange(val === "" ? "" : parseInt(val)); 
                                }} 
                                className="h-10 rounded-lg text-sm border-slate-200 focus:ring-primary/20" 
                                data-testid={`input-eco-count-${index}`}
                              />
                            )} 
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 h-10 w-10 rounded-lg" 
                            onClick={() => handleRemoveEcoDay(index)} 
                            type="button"
                          >
                            <div className="w-4 h-0.5 bg-current rounded-full" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      className="w-full h-12 rounded-xl border-dashed border-2 border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30" 
                      onClick={handleAddEcoDay} 
                      type="button"
                      data-testid="button-add-eco-day"
                    >
                      <Plus className="mr-2 h-4 w-4" /> {language === "ko" ? "날짜 추가" : "Add Date"}
                    </Button>
                  </div>
                  {ecoGirlEstimate.price > 0 && (
                    <div className="mt-4 bg-gradient-to-r from-pink-600 to-pink-500 text-white p-4 rounded-xl shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{language === "ko" ? "예상 금액" : language === "en" ? "Estimated Price" : language === "zh" ? "预估价格" : language === "vi" ? "Giá dự kiến" : language === "ru" ? "Ориентировочная цена" : language === "ja" ? "見積もり金額" : "예상 금액"}</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold">${ecoGirlEstimate.price}</span>
                          {currencyInfo.code !== "USD" && (
                            <div className="text-sm text-pink-200">≈ {formatLocalCurrency(ecoGirlEstimate.price)}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-pink-100 space-y-1">
                        {ecoGirlEstimate.details.map((detail, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{detail.date} ({detail.hours}{language === "ko" ? "시간" : "h"} x {detail.count}{language === "ko" ? "명" : ""})</span>
                            <span>${detail.price}</span>
                          </div>
                        ))}
                        {currencyInfo.code !== "USD" && (
                          <div className="flex justify-end pt-1 text-pink-200">
                            <span>{t("common.exchangeRate")}: {currencyInfo.symbol}{exchangeRate.toLocaleString()}/USD</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </SectionCard>
              )} />
            )}
          </div>
          <div className="lg:col-span-4">
            <QuoteSummary breakdown={breakdown} isLoading={calculateMutation.isPending} onSave={handleSaveQuote} isSaving={createQuoteMutation.isPending} />
          </div>
        </div>
        
        {isAuthenticated && (
          <div className="mt-8">
            <p className="text-xs text-muted-foreground text-center mb-2">
              {language === "ko" 
                ? (isAdmin ? "저장된 견적서 관리 (관리자)" : "내 저장된 견적서") 
                : (isAdmin ? "Saved Quotes (Admin)" : "My Saved Quotes")}
            </p>
            <SavedQuotesList onLoad={handleLoadQuote} />
          </div>
        )}
        
        {isAdmin && (
          <div className="mt-8">
            <DepositCalendar />
          </div>
        )}
      </div>

      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl"><DialogHeader><DialogTitle>{t("dialog.saveQuote")}</DialogTitle><DialogDescription>{t("dialog.enterName")}</DialogDescription></DialogHeader><div className="py-4"><Label htmlFor="name" className="text-right">{t("dialog.customerName")}</Label><Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={t("dialog.enterName")} className="mt-2 h-12 rounded-xl" autoFocus /></div><DialogFooter><Button variant="outline" onClick={() => setIsCustomerDialogOpen(false)} className="rounded-xl">{t("dialog.cancel")}</Button><Button onClick={confirmSaveQuote} className="rounded-xl"><Check className="mr-2 h-4 w-4" /> {t("dialog.save")}</Button></DialogFooter></DialogContent>
      </Dialog>

      <footer className="bg-slate-900 text-white mt-24 pb-12 pt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center mb-10 space-y-2">
            <h2 className="text-2xl font-display font-bold">{t("contact.title")}</h2>
            <p className="text-slate-400 max-w-lg text-sm">{t("header.description")}</p>
          </div>
          
          <div className="bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-slate-700/50 shadow-xl max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <Phone className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("contact.vietnam")}</p>
                      <span className="text-xl font-mono font-bold text-slate-200">089.932.6273</span>
                    </div>
                    <a 
                      href="tel:0899326273" 
                      className="bg-blue-500 hover:bg-blue-400 text-white p-2 rounded-lg transition-colors shadow-lg shadow-blue-500/20"
                      data-testid="button-call-vietnam"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                    <MessageSquare className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("contact.kakao")}</p>
                      <p className="text-xl font-bold text-slate-200">vungtau</p>
                    </div>
                    <a href="http://pf.kakao.com/_TuxoxfG" target="_blank" rel="noopener noreferrer" className="bg-yellow-500 text-slate-900 px-5 py-2 rounded-xl font-bold hover:bg-yellow-400 transition-all flex items-center gap-2 text-sm shadow-lg shadow-yellow-500/10">
                      <ExternalLink className="w-4 h-4" /> {t("footer.connect")}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <Globe className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("contact.blog")}</p>
                      <p className="text-xl font-bold text-slate-200">Vung Tau Saver</p>
                    </div>
                    <a href="https://m.blog.naver.com/vungtausaver" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-2 transition-colors">
                      {t("footer.visit")} <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs">
            <div>© 2026 Vung Tau Travel Saver. All rights reserved.</div>
            <div className="flex gap-6">
              <span className="hover:text-slate-300 cursor-pointer transition-colors">이용약관</span>
              <Link href="/privacy" className="hover:text-slate-300 cursor-pointer transition-colors" data-testid="link-privacy">개인정보처리방침</Link>
            </div>
          </div>
        </div>
      </footer>
      
      {!isAppInstalled && deferredPrompt && (
        <Button
          onClick={handleInstallClick}
          className="fixed top-4 right-20 z-50 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg gap-2"
          size="sm"
          data-testid="button-install-app"
        >
          <Smartphone className="w-4 h-4" />
          {language === "ko" ? "앱 설치" :
           language === "en" ? "Install App" :
           language === "zh" ? "安装应用" :
           language === "vi" ? "Cài đặt" :
           language === "ru" ? "Установить" :
           language === "ja" ? "アプリ" : "앱 설치"}
        </Button>
      )}
      
      <LanguageSelector />

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-gradient-to-r from-yellow-400 to-amber-500 border-t shadow-lg">
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-black whitespace-nowrap">
                {language === "ko" ? "예약/환전/부동산 문의" : 
                 language === "en" ? "Reservation / Exchange / Real Estate" :
                 language === "zh" ? "预约/换汇/房产" :
                 language === "vi" ? "Đặt chỗ / Đổi tiền / Bất động sản" :
                 language === "ru" ? "Бронь / Обмен / Недвижимость" :
                 language === "ja" ? "予約/両替/不動産" : "예약/환전/부동산 문의"}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="http://qr.kakao.com/talk/5tbdn6_YLR1F7MHQC58jo_O5Gqo-"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-kakao-friend-home"
                >
                  <Button size="sm" className="bg-black hover:bg-black/90 text-yellow-400 font-bold gap-1.5">
                    <UserPlus className="w-4 h-4" />
                    {language === "ko" ? "카톡친추" : 
                     language === "en" ? "Add Friend" :
                     language === "zh" ? "加好友" :
                     language === "vi" ? "Kết bạn" :
                     language === "ru" ? "Добавить" :
                     language === "ja" ? "友達追加" : "카톡친추"}
                  </Button>
                </a>
                <a
                  href="http://pf.kakao.com/_TuxoxfG"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-kakao-reservation-home"
                >
                  <Button size="sm" className="bg-black hover:bg-black/90 text-yellow-400 font-bold gap-1.5">
                    <MessageCircle className="w-4 h-4" />
                    {language === "ko" ? "카톡채널문의" : 
                     language === "en" ? "Channel" :
                     language === "zh" ? "频道咨询" :
                     language === "vi" ? "Kênh" :
                     language === "ru" ? "Канал" :
                     language === "ja" ? "チャンネル" : "카톡채널문의"}
                  </Button>
                </a>
              </div>
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

      {/* 빌라 이미지 갤러리 - 전체 화면 오버레이 */}
      {galleryOpen && selectedVilla?.images && (
        <div 
          className="fixed inset-0 z-[9999] bg-black flex flex-col"
          style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}
        >
          {/* 상단 바 */}
          <div className="flex items-center justify-between p-3 bg-black/90">
            <div className="text-white text-sm font-medium">
              {galleryIndex + 1} / {selectedVilla.images.length}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setGalleryOpen(false)}
              data-testid="button-close-gallery"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
          
          {/* 메인 이미지 영역 */}
          <div 
            className="flex-1 relative flex items-center justify-center overflow-hidden"
            style={{ minHeight: 0 }}
            onTouchStart={(e) => {
              setTouchEnd(null);
              setTouchStart(e.targetTouches[0].clientX);
            }}
            onTouchMove={(e) => {
              setTouchEnd(e.targetTouches[0].clientX);
            }}
            onTouchEnd={() => {
              if (!touchStart || !touchEnd || isAnimating) return;
              const distance = touchStart - touchEnd;
              const minSwipeDistance = 50;
              if (Math.abs(distance) > minSwipeDistance) {
                if (distance > 0) {
                  // 왼쪽으로 스와이프 → 다음 이미지
                  setGalleryIndex(prev => prev < selectedVilla.images!.length - 1 ? prev + 1 : 0);
                } else {
                  // 오른쪽으로 스와이프 → 이전 이미지
                  setGalleryIndex(prev => prev > 0 ? prev - 1 : selectedVilla.images!.length - 1);
                }
              }
              setTouchStart(null);
              setTouchEnd(null);
            }}
          >
            {/* 모든 이미지를 미리 렌더링하고 현재 이미지만 보이게 */}
            {selectedVilla.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${selectedVilla.name} - ${idx + 1}`}
                className="absolute max-w-full max-h-full object-contain select-none transition-opacity duration-300 ease-in-out"
                style={{ 
                  maxHeight: '100%', 
                  maxWidth: '100%',
                  opacity: idx === galleryIndex ? 1 : 0,
                  pointerEvents: idx === galleryIndex ? 'auto' : 'none'
                }}
                draggable={false}
                data-testid={idx === galleryIndex ? `gallery-image-${idx}` : undefined}
              />
            ))}
            
            {/* 네비게이션 버튼 */}
            {selectedVilla.images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 h-12 w-12 rounded-full"
                  onClick={() => setGalleryIndex(prev => prev > 0 ? prev - 1 : selectedVilla.images!.length - 1)}
                  data-testid="button-gallery-prev"
                >
                  <ChevronLeft className="w-8 h-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70 h-12 w-12 rounded-full"
                  onClick={() => setGalleryIndex(prev => prev < selectedVilla.images!.length - 1 ? prev + 1 : 0)}
                  data-testid="button-gallery-next"
                >
                  <ChevronRight className="w-8 h-8" />
                </Button>
              </>
            )}
          </div>
          
          {/* 썸네일 리스트 */}
          {selectedVilla.images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto justify-center bg-black/90 flex-shrink-0">
              {selectedVilla.images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setGalleryIndex(idx)}
                  className={cn(
                    "flex-shrink-0 w-14 h-14 rounded-md overflow-hidden cursor-pointer border-2 transition-all",
                    idx === galleryIndex ? "border-primary ring-2 ring-primary/50" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                  data-testid={`gallery-thumb-${idx}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
