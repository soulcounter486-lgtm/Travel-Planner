import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { AnnouncementBanner } from "@/components/AnnouncementBanner";

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
import { LogIn, LogOut, ChevronRight, ChevronLeft, Settings, X, List, Pencil, ChevronDown, RefreshCw, Mail, Ticket } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import type { Villa, VillaAmenity } from "@shared/schema";
import { villaAmenities, villaAmenityLabels } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";

export default function Home() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { user, isAuthenticated, isAdmin, logout, isLoading: isAuthLoading } = useAuth();
  
  // 이메일 로그인/회원가입 상태
  const [loginPopoverOpen, setLoginPopoverOpen] = useState(false);
  const [authScreen, setAuthScreen] = useState<'default' | 'emailLogin' | 'register' | 'forgotPassword' | 'emailVerification'>('default');
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    nickname: "",
    gender: "",
    birthDate: ""
  });

  // 알림 데이터 조회 (쪽지함/쿠폰함)
  const { data: notifications } = useQuery<{unreadMessagesCount: number; unusedCouponsCount: number}>({
    queryKey: ["/api/my-notifications"],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  // 이메일로 로그인
  const handleEmailLogin = async () => {
    if (!registerData.email || !registerData.password) {
      setRegisterError("이메일과 비밀번호를 입력해주세요");
      return;
    }
    setRegisterLoading(true);
    setRegisterError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: registerData.email, password: registerData.password })
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.needsVerification) {
          setVerificationEmail(registerData.email);
          setAuthScreen('emailVerification');
          toast({
            title: "이메일 인증 필요",
            description: "회원가입 시 발송된 인증 코드를 입력해주세요.",
          });
        } else {
          setRegisterError(data.message || "로그인에 실패했습니다");
        }
        return;
      }
      window.location.reload();
    } catch {
      setRegisterError("로그인 중 오류가 발생했습니다");
    } finally {
      setRegisterLoading(false);
    }
  };

  // 이메일로 회원가입
  const handleEmailRegister = async () => {
    if (!registerData.email || !registerData.password) {
      setRegisterError("이메일과 비밀번호를 입력해주세요");
      return;
    }
    if (registerData.password.length < 6) {
      setRegisterError("비밀번호는 6자 이상이어야 합니다");
      return;
    }
    if (registerData.password !== registerData.passwordConfirm) {
      setRegisterError("비밀번호가 일치하지 않습니다");
      return;
    }
    setRegisterLoading(true);
    setRegisterError("");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(registerData)
      });
      const data = await response.json();
      if (!response.ok) {
        setRegisterError(data.error || data.message || "회원가입에 실패했습니다");
        return;
      }
      // 이메일 인증 화면으로 전환
      setVerificationEmail(registerData.email);
      setAuthScreen('emailVerification');
      toast({
        title: "인증 코드 발송됨",
        description: "이메일로 발송된 6자리 인증 코드를 입력해주세요.",
      });
    } catch {
      setRegisterError("회원가입 중 오류가 발생했습니다");
    } finally {
      setRegisterLoading(false);
    }
  };

  // 이메일 인증 확인
  const handleVerifyEmail = async () => {
    if (verificationCode.length !== 6) {
      setRegisterError("6자리 인증 코드를 입력해주세요");
      return;
    }
    setRegisterLoading(true);
    setRegisterError("");
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: verificationEmail, code: verificationCode })
      });
      const data = await response.json();
      if (!response.ok) {
        setRegisterError(data.error || data.message || "인증에 실패했습니다");
        return;
      }
      toast({
        title: "인증 완료",
        description: "이메일 인증이 완료되었습니다. 자동으로 로그인됩니다.",
      });
      window.location.reload();
    } catch {
      setRegisterError("인증 중 오류가 발생했습니다");
    } finally {
      setRegisterLoading(false);
    }
  };

  // 인증 코드 재발송
  const handleResendVerification = async () => {
    setRegisterLoading(true);
    setRegisterError("");
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: verificationEmail })
      });
      const data = await response.json();
      if (!response.ok) {
        setRegisterError(data.error || data.message || "재발송에 실패했습니다");
        return;
      }
      toast({
        title: "인증 코드 재발송됨",
        description: "새로운 인증 코드가 이메일로 발송되었습니다.",
      });
    } catch {
      setRegisterError("재발송 중 오류가 발생했습니다");
    } finally {
      setRegisterLoading(false);
    }
  };

  // 비밀번호 찾기
  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      setRegisterError("이메일을 입력해주세요");
      return;
    }
    setRegisterLoading(true);
    setRegisterError("");
    setForgotPasswordSuccess("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: forgotPasswordEmail })
      });
      const data = await response.json();
      if (!response.ok) {
        setRegisterError(data.error || "비밀번호 찾기에 실패했습니다");
        return;
      }
      setForgotPasswordSuccess("임시 비밀번호가 이메일로 발송되었습니다");
      setForgotPasswordEmail("");
    } catch {
      setRegisterError("비밀번호 찾기 중 오류가 발생했습니다");
    } finally {
      setRegisterLoading(false);
    }
  };
  
  // 빌라 목록 조회
  const { data: villas = [] } = useQuery<Villa[]>({
    queryKey: ["/api/villas"],
  });
  
  // 사이트 설정 조회
  const { data: siteSettingsData = {} } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
  });
  
  // 기본값 설정
  const villaPriceNote = siteSettingsData["villa_price_note"] || "가격은 방 오픈 갯수와 성수기(6,7,8,9월) 공휴일에 따라 상이 할 수 있습니다.";
  const lowestPriceGuarantee = siteSettingsData["lowest_price_guarantee"] || "최저가 보장! 어플가격이 더 싸다면 링크 보내주시면 더 저렴하게 부킹 해 드립니다.";
  const [selectedVillaId, setSelectedVillaId] = useState<number | null>(null);
  const [amenityFilters, setAmenityFilters] = useState<VillaAmenity[]>([]);
  const [showAmenityFilters, setShowAmenityFilters] = useState(false);
  
  // 편의사항 필터가 적용된 빌라 목록
  const filteredVillas = villas.filter(villa => {
    if (amenityFilters.length === 0) return true;
    return amenityFilters.every(filter => villa.amenities?.includes(filter));
  });
  
  const selectedVilla = villas.find(v => v.id === selectedVillaId) || null;
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 빌라 뷰 모드 (list/map)
  const [villaViewMode, setVillaViewMode] = useState<"list" | "map">("list");
  const villaMapContainerRef = useRef<HTMLDivElement>(null);
  const villaMapRef = useRef<L.Map | null>(null);
  const villaMarkersRef = useRef<L.Marker[]>([]);
  
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
  const [totalVisitorCount, setTotalVisitorCount] = useState<number>(15000);
  const [realVisitorCount, setRealVisitorCount] = useState<number>(0);
  const [realTotalVisitorCount, setRealTotalVisitorCount] = useState<number>(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  
  // 관리자 공지사항 수정 상태
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editPriceNote, setEditPriceNote] = useState("");
  const [editLowestPriceGuarantee, setEditLowestPriceGuarantee] = useState("");
  
  // 공지사항 수정 mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await apiRequest("PUT", "/api/admin/site-settings", { key, value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
    }
  });

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
    const hasVisited = sessionStorage.getItem('visitor_counted');
    if (hasVisited) {
      // 이미 카운트된 경우 GET으로 현재 값만 가져옴
      fetch("/api/visitor-count")
        .then(res => res.json())
        .then(data => {
          setVisitorCount(data.count);
          setTotalVisitorCount(data.totalCount || 15000);
          setRealVisitorCount(data.realCount || 0);
          setRealTotalVisitorCount(data.realTotalCount || 0);
        })
        .catch(() => {});
    } else {
      // 처음 방문 시에만 카운트 증가
      apiRequest("POST", "/api/visitor-count/increment")
        .then(res => res.json())
        .then(data => {
          setVisitorCount(data.count);
          setTotalVisitorCount(data.totalCount || 15000);
          setRealVisitorCount(data.realCount || 0);
          setRealTotalVisitorCount(data.realTotalCount || 0);
          sessionStorage.setItem('visitor_counted', 'true');
        })
        .catch(() => {});
    }
  }, []);

  // 빌라 선택 이벤트 리스너 (팝업에서 선택하기 버튼 클릭 시)
  useEffect(() => {
    const handleSelectVilla = (e: CustomEvent<number>) => {
      setSelectedVillaId(e.detail);
      setVillaViewMode("list"); // 선택 후 리스트 뷰로 전환
    };
    
    window.addEventListener('selectVilla', handleSelectVilla as EventListener);
    return () => {
      window.removeEventListener('selectVilla', handleSelectVilla as EventListener);
    };
  }, []);
  
  // 빌라 지도 초기화
  useEffect(() => {
    if (villaViewMode !== "map" || !villaMapContainerRef.current) return;
    
    // 이미 초기화된 경우 스킵
    if (villaMapRef.current) {
      villaMapRef.current.invalidateSize();
      return;
    }
    
    // 붕따우 중심 좌표
    const center: [number, number] = [10.3456, 107.0844];
    
    const map = L.map(villaMapContainerRef.current).setView(center, 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    
    villaMapRef.current = map;
    
    return () => {
      if (villaMapRef.current) {
        villaMapRef.current.remove();
        villaMapRef.current = null;
      }
    };
  }, [villaViewMode]);
  
  // 빌라 마커 업데이트
  useEffect(() => {
    if (!villaMapRef.current || villaViewMode !== "map") return;
    
    // 기존 마커 제거
    villaMarkersRef.current.forEach(marker => marker.remove());
    villaMarkersRef.current = [];
    
    // 위치 정보가 있는 빌라만 마커 추가
    const villasWithLocation = villas.filter(v => v.latitude && v.longitude && v.isActive);
    
    villasWithLocation.forEach(villa => {
      const lat = parseFloat(villa.latitude!);
      const lng = parseFloat(villa.longitude!);
      
      if (isNaN(lat) || isNaN(lng)) return;
      
      // 썸네일 이미지가 있는 커스텀 마커
      const iconHtml = villa.mainImage 
        ? `<div class="villa-marker ${selectedVillaId === villa.id ? 'selected' : ''}" style="
            width: 50px; height: 50px; border-radius: 8px; overflow: hidden; 
            border: 3px solid ${selectedVillaId === villa.id ? '#3b82f6' : '#fff'}; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer;
            background: white;
          ">
            <img src="${villa.mainImage}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>`
        : `<div style="
            width: 50px; height: 50px; border-radius: 8px; 
            background: ${selectedVillaId === villa.id ? '#3b82f6' : '#64748b'}; 
            display: flex; align-items: center; justify-content: center;
            border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer;
          ">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 3L2 12h3v9h6v-6h2v6h6v-9h3L12 3z"/>
            </svg>
          </div>`;
      
      const customIcon = L.divIcon({
        className: 'custom-villa-marker',
        html: iconHtml,
        iconSize: [50, 50],
        iconAnchor: [25, 50],
      });
      
      // 빌라 상세 팝업 HTML 생성
      const amenityLabels: Record<string, Record<string, string>> = {
        privatePool: { ko: "개인 수영장", en: "Private Pool" },
        oceanView: { ko: "오션뷰", en: "Ocean View" },
        bbqArea: { ko: "BBQ 시설", en: "BBQ Area" },
        karaoke: { ko: "노래방", en: "Karaoke" },
        outskirts: { ko: "외곽지역", en: "Outskirts" },
        livingAC: { ko: "거실 에어컨", en: "Living AC" },
        wifi: { ko: "WiFi", en: "WiFi" },
        parking: { ko: "주차장", en: "Parking" },
      };
      
      const amenitiesText = (villa.amenities || [])
        .slice(0, 4)
        .map(a => amenityLabels[a]?.[language] || amenityLabels[a]?.ko || a)
        .join(", ");
      
      const villaPopupHtml = `
        <div style="min-width: 220px; max-width: 300px;">
          ${villa.mainImage ? `
            <img src="${villa.mainImage}" 
              style="width: 100%; height: 140px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;" 
              onerror="this.style.display='none'" />
          ` : ""}
          <h3 style="font-weight: 600; font-size: 16px; margin: 0 0 8px 0; color: #1f2937;">${villa.name}</h3>
          <div style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
            ${villa.bedrooms ? `<span style="background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 4px; font-size: 11px;">🛏 ${villa.bedrooms} ${language === "ko" ? "침실" : "Bedrooms"}</span>` : ""}
            ${villa.maxGuests ? `<span style="background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 4px; font-size: 11px;">👥 ${language === "ko" ? "최대" : "Max"} ${villa.maxGuests}${language === "ko" ? "명" : ""}</span>` : ""}
          </div>
          ${amenitiesText ? `<p style="font-size: 11px; color: #6b7280; margin: 0 0 8px 0;">✨ ${amenitiesText}</p>` : ""}
          <div style="background: #f1f5f9; padding: 8px; border-radius: 6px; margin-bottom: 10px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px;">
              <span style="color: #64748b;">${language === "ko" ? "평일" : "Weekday"}:</span>
              <span style="font-weight: 600; color: #1e40af;">$${villa.weekdayPrice || 0}</span>
              <span style="color: #64748b;">${language === "ko" ? "금요일" : "Friday"}:</span>
              <span style="font-weight: 600; color: #1e40af;">$${villa.fridayPrice || 0}</span>
              <span style="color: #64748b;">${language === "ko" ? "주말" : "Weekend"}:</span>
              <span style="font-weight: 600; color: #1e40af;">$${villa.weekendPrice || 0}</span>
              <span style="color: #64748b;">${language === "ko" ? "공휴일" : "Holiday"}:</span>
              <span style="font-weight: 600; color: #dc2626;">$${villa.holidayPrice || 0}</span>
            </div>
          </div>
          ${villa.notes ? `<p style="font-size: 11px; color: #374151; margin: 0 0 10px 0; line-height: 1.4;">${villa.notes.slice(0, 80)}${villa.notes.length > 80 ? "..." : ""}</p>` : ""}
          <div style="display: flex; gap: 6px;">
            ${villa.mapUrl ? `
              <a href="${villa.mapUrl}" target="_blank" rel="noopener noreferrer" 
                style="flex: 1; text-align: center; background: #3b82f6; color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; text-decoration: none; font-weight: 500;">
                📍 ${language === "ko" ? "길찾기" : "Directions"}
              </a>
            ` : ""}
            <button onclick="window.dispatchEvent(new CustomEvent('selectVilla', {detail: ${villa.id}}))" 
              style="flex: 1; text-align: center; background: #22c55e; color: white; padding: 8px 12px; border-radius: 6px; font-size: 12px; border: none; cursor: pointer; font-weight: 500;">
              ✓ ${language === "ko" ? "선택하기" : "Select"}
            </button>
          </div>
        </div>
      `;
      
      const marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(villaMapRef.current!)
        .on('click', () => {
          setSelectedVillaId(villa.id);
        });
      
      // 툴팁으로 빌라 이름만 표시
      marker.bindTooltip(villa.name, { 
        permanent: false, 
        direction: 'top',
        offset: [0, -50]
      });
      
      villaMarkersRef.current.push(marker);
    });
    
    // 마커가 있으면 지도 범위 조정
    if (villasWithLocation.length > 0) {
      const bounds = L.latLngBounds(
        villasWithLocation
          .map(v => [parseFloat(v.latitude!), parseFloat(v.longitude!)] as [number, number])
          .filter(coords => !isNaN(coords[0]) && !isNaN(coords[1]))
      );
      if (bounds.isValid()) {
        villaMapRef.current.fitBounds(bounds, { padding: [30, 30] });
      }
    }
  }, [villas, villaViewMode, selectedVillaId]);

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
  }, [form.watch, calculateMutation, isLoadingQuote, selectedVillaId]);

  // 빌라 선택 변경 시 즉시 재계산 트리거
  useEffect(() => {
    if (isLoadingQuoteRef.current) return;
    const value = form.getValues();
    
    if (value.villa?.enabled && value.villa.checkIn && value.villa.checkOut) {
      const payload: any = {
        villa: { enabled: true, checkIn: value.villa.checkIn, checkOut: value.villa.checkOut, rooms: value.villa.rooms || 1, villaId: selectedVillaId || undefined },
        vehicle: value.vehicle?.enabled && value.vehicle.selections && value.vehicle.selections.length > 0
          ? { enabled: true, selections: value.vehicle.selections.filter(s => s && s.date && s.type && s.route) }
          : { enabled: false },
        golf: value.golf?.enabled && value.golf.selections && value.golf.selections.length > 0
          ? { enabled: true, selections: value.golf.selections.filter((s): s is NonNullable<typeof s> => !!(s && s.date && s.course)).map(s => ({ ...s, players: Number(s.players) || 1 })) }
          : { enabled: false },
        ecoGirl: value.ecoGirl?.enabled && value.ecoGirl.selections && value.ecoGirl.selections.length > 0
          ? { enabled: true, selections: value.ecoGirl.selections.filter((s): s is NonNullable<typeof s> => !!(s && s.date)).map(s => ({ ...s, count: Number(s.count) || 1 })) }
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
    }
  }, [selectedVillaId]);

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
          {isAuthLoading ? null : isAuthenticated ? (
            <div className="flex items-center gap-0.5 mb-2 justify-end">
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="default"
                      className="shrink-0 rounded-full h-5 px-1.5 text-[8px] bg-orange-500 hover:bg-orange-600"
                      data-testid="button-admin-menu"
                    >
                      <Settings className="w-2.5 h-2.5 mr-0.5" />
                      관리자
                      <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/admin/members" className="flex items-center cursor-pointer" data-testid="link-admin-members">
                        <Users className="w-4 h-4 mr-2" />
                        고객관리
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/villas" className="flex items-center cursor-pointer" data-testid="link-admin-villas">
                        <Settings className="w-4 h-4 mr-2" />
                        빌라관리
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/places" className="flex items-center cursor-pointer" data-testid="link-admin-places">
                        <Settings className="w-4 h-4 mr-2" />
                        관광지관리
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {/* 쪽지함 버튼 */}
              <Link href="/mypage?tab=messages">
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 rounded-full h-5 px-1.5 text-[8px] relative"
                  data-testid="button-messages"
                >
                  <Mail className="w-2.5 h-2.5 mr-0.5" />
                  쪽지함
                  {(notifications?.unreadMessagesCount || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[6px] font-bold rounded-full min-w-[12px] h-[12px] flex items-center justify-center px-0.5 animate-pulse">
                      {notifications!.unreadMessagesCount > 9 ? "9+" : notifications!.unreadMessagesCount}
                    </span>
                  )}
                </Button>
              </Link>
              {/* 쿠폰함 버튼 */}
              <Link href="/mypage?tab=coupons">
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 rounded-full h-5 px-1.5 text-[8px] relative"
                  data-testid="button-coupons"
                >
                  <Ticket className="w-2.5 h-2.5 mr-0.5" />
                  쿠폰함
                  {(notifications?.unusedCouponsCount || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[6px] font-bold rounded-full min-w-[12px] h-[12px] flex items-center justify-center px-0.5">
                      {notifications!.unusedCouponsCount > 9 ? "9+" : notifications!.unusedCouponsCount}
                    </span>
                  )}
                </Button>
              </Link>
              {/* 마이페이지 버튼 */}
              <Link href="/mypage">
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 rounded-full h-5 px-1.5 text-[8px]"
                  data-testid="button-mypage"
                >
                  <User className="w-2.5 h-2.5 mr-0.5" />
                  마이페이지
                </Button>
              </Link>
              {/* 계정 드롭다운 (계정변경 + 로그아웃 통합) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 rounded-full h-5 px-1.5 text-[8px]"
                    data-testid="button-account-menu"
                  >
                    <Settings className="w-2.5 h-2.5 mr-0.5" />
                    계정
                    <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem asChild>
                    <a href="/api/auth/kakao/relogin" className="flex items-center cursor-pointer">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      계정변경
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => logout()}
                    className="cursor-pointer text-red-600"
                    data-testid="button-logout"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-0.5 mb-2 justify-end">
              <Popover 
                open={loginPopoverOpen} 
                modal={false}
                onOpenChange={(open) => {
                  if (open) {
                    setLoginPopoverOpen(true);
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="default"
                    className="shrink-0 rounded-full h-5 px-1.5 text-[8px]"
                    data-testid="button-login-dropdown"
                  >
                    <LogIn className="w-2.5 h-2.5 mr-0.5" />
                    로그인
                    <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  align="end" 
                  className="w-64 p-3"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onInteractOutside={() => {
                    setLoginPopoverOpen(false);
                    setAuthScreen('default');
                    setRegisterError("");
                    setForgotPasswordSuccess("");
                    setVerificationCode("");
                  }}
                  onEscapeKeyDown={() => {
                    setLoginPopoverOpen(false);
                    setAuthScreen('default');
                    setRegisterError("");
                    setForgotPasswordSuccess("");
                    setVerificationCode("");
                  }}
                >
                  {authScreen === 'emailVerification' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-xs">이메일 인증</h3>
                        <Button type="button" variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAuthScreen('default'); setVerificationCode(""); setRegisterError(""); }}>
                          ← 뒤로
                        </Button>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md">
                        <p className="text-[10px] text-blue-700 dark:text-blue-300">
                          <strong>{verificationEmail}</strong>로 6자리 인증 코드가 발송되었습니다.
                        </p>
                      </div>
                      {registerError && <p className="text-[10px] text-red-500 text-center">{registerError}</p>}
                      <div>
                        <Label htmlFor="verify-code-home" className="text-[10px]">인증 코드 (6자리)</Label>
                        <Input
                          id="verify-code-home"
                          type="text"
                          placeholder="123456"
                          className="h-8 text-base text-center tracking-widest font-mono"
                          maxLength={6}
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          onClick={(e) => e.stopPropagation()}
                          data-testid="input-verification-code"
                        />
                      </div>
                      <Button className="w-full h-7 text-xs" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVerifyEmail(); }} disabled={registerLoading || verificationCode.length !== 6} data-testid="button-verify-email">
                        {registerLoading ? "인증 중..." : "인증 확인"}
                      </Button>
                      <div className="text-center">
                        <button type="button" className="text-[10px] text-muted-foreground underline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleResendVerification(); }} disabled={registerLoading} data-testid="button-resend-verification">
                          인증 코드 다시 받기
                        </button>
                      </div>
                    </div>
                  ) : authScreen === 'forgotPassword' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-xs">비밀번호 재설정</h3>
                        <Button type="button" variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAuthScreen('emailLogin'); setRegisterError(""); setForgotPasswordSuccess(""); }}>
                          ← 뒤로
                        </Button>
                      </div>
                      {registerError && <p className="text-[10px] text-red-500 text-center">{registerError}</p>}
                      {forgotPasswordSuccess && <p className="text-[10px] text-green-600 text-center">{forgotPasswordSuccess}</p>}
                      <div>
                        <Label htmlFor="forgot-email-home" className="text-[10px]">가입한 이메일</Label>
                        <Input id="forgot-email-home" type="email" placeholder="email@example.com" className="h-7 text-xs" value={forgotPasswordEmail} onChange={(e) => setForgotPasswordEmail(e.target.value)} onClick={(e) => e.stopPropagation()} data-testid="input-forgot-email" />
                      </div>
                      <Button className="w-full h-7 text-xs" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleForgotPassword(); }} disabled={registerLoading} data-testid="button-send-temp-password">
                        {registerLoading ? "발송 중..." : "임시 비밀번호 발송"}
                      </Button>
                      <p className="text-[10px] text-muted-foreground text-center">
                        임시 비밀번호가 이메일로 발송됩니다.
                      </p>
                    </div>
                  ) : authScreen === 'emailLogin' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-xs">이메일 로그인</h3>
                        <Button type="button" variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAuthScreen('default'); setRegisterError(""); }}>
                          ← 뒤로
                        </Button>
                      </div>
                      {registerError && <p className="text-[10px] text-red-500 text-center">{registerError}</p>}
                      <div>
                        <Label htmlFor="login-email-home" className="text-[10px]">이메일</Label>
                        <Input id="login-email-home" type="email" placeholder="email@example.com" className="h-7 text-xs" value={registerData.email} onChange={(e) => setRegisterData({...registerData, email: e.target.value})} onClick={(e) => e.stopPropagation()} data-testid="input-email" />
                      </div>
                      <div>
                        <Label htmlFor="login-password-home" className="text-[10px]">비밀번호</Label>
                        <Input id="login-password-home" type="password" placeholder="••••••" className="h-7 text-xs" value={registerData.password} onChange={(e) => setRegisterData({...registerData, password: e.target.value})} onClick={(e) => e.stopPropagation()} data-testid="input-password" />
                      </div>
                      <Button className="w-full h-7 text-xs" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEmailLogin(); }} disabled={registerLoading} data-testid="button-login">
                        {registerLoading ? "로그인 중..." : "로그인"}
                      </Button>
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <button type="button" className="text-primary underline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAuthScreen('forgotPassword'); setRegisterError(""); setForgotPasswordSuccess(""); }} data-testid="button-forgot-password">
                          비밀번호 찾기
                        </button>
                        <button type="button" className="text-primary underline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAuthScreen('register'); setRegisterError(""); }} data-testid="button-goto-register">
                          회원가입
                        </button>
                      </div>
                    </div>
                  ) : authScreen === 'register' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-xs">회원가입</h3>
                        <Button type="button" variant="ghost" size="sm" className="h-5 px-1.5 text-[10px]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAuthScreen('default'); setRegisterError(""); }}>
                          ← 뒤로
                        </Button>
                      </div>
                      {registerError && <p className="text-[10px] text-red-500 text-center">{registerError}</p>}
                      <div>
                        <Label htmlFor="reg-email-home" className="text-[10px]">이메일 *</Label>
                        <Input id="reg-email-home" type="email" placeholder="email@example.com" className="h-7 text-xs" value={registerData.email} onChange={(e) => setRegisterData({...registerData, email: e.target.value})} onClick={(e) => e.stopPropagation()} data-testid="input-register-email" />
                      </div>
                      <div>
                        <Label htmlFor="reg-password-home" className="text-[10px]">비밀번호 * (6자 이상)</Label>
                        <Input id="reg-password-home" type="password" placeholder="••••••" className="h-7 text-xs" value={registerData.password} onChange={(e) => setRegisterData({...registerData, password: e.target.value})} onClick={(e) => e.stopPropagation()} data-testid="input-register-password" />
                      </div>
                      <div>
                        <Label htmlFor="reg-password-confirm-home" className="text-[10px]">비밀번호 확인 *</Label>
                        <Input id="reg-password-confirm-home" type="password" placeholder="••••••" className="h-7 text-xs" value={registerData.passwordConfirm} onChange={(e) => setRegisterData({...registerData, passwordConfirm: e.target.value})} onClick={(e) => e.stopPropagation()} data-testid="input-register-password-confirm" />
                      </div>
                      <div>
                        <Label htmlFor="reg-nickname-home" className="text-[10px]">닉네임</Label>
                        <Input id="reg-nickname-home" type="text" placeholder="별명" className="h-7 text-xs" value={registerData.nickname} onChange={(e) => setRegisterData({...registerData, nickname: e.target.value})} onClick={(e) => e.stopPropagation()} data-testid="input-register-nickname" />
                      </div>
                      <Button className="w-full h-7 text-xs" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEmailRegister(); }} disabled={registerLoading} data-testid="button-register">
                        {registerLoading ? "가입 중..." : "이메일로 가입"}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <a href="/api/auth/kakao" className="block" data-testid="button-login-kakao">
                          <Button className="w-full h-7 bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] border-0 text-xs">
                            <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 3C6.477 3 2 6.463 2 10.714c0 2.683 1.74 5.028 4.348 6.385-.19.71-.69 2.576-.788 2.976-.12.49.18.483.379.352.156-.103 2.484-1.69 3.502-2.378.85.126 1.723.192 2.559.192 5.523 0 10-3.463 10-7.714C22 6.463 17.523 3 12 3z"/>
                            </svg>
                            카카오로 로그인
                          </Button>
                        </a>
                        <a href="/api/auth/google/login" className="block" data-testid="button-login-google">
                          <Button variant="outline" className="w-full h-7 text-xs">
                            <svg className="w-3.5 h-3.5 mr-1.5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            구글로 로그인
                          </Button>
                        </a>
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full h-7 text-xs"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAuthScreen('emailLogin'); }}
                          data-testid="button-show-email-login"
                        >
                          <Mail className="w-3.5 h-3.5 mr-1.5" />
                          이메일로 로그인
                        </Button>
                      </div>
                      <DropdownMenuSeparator className="my-2" />
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full h-7 text-xs text-primary"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAuthScreen('register'); }}
                        data-testid="button-show-register"
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                        회원가입
                      </Button>
                    </>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          )}
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
              <h1 className="text-lg sm:text-2xl md:text-3xl font-display font-bold text-primary mb-1 leading-tight">
                <span className="whitespace-nowrap">{t("header.title")}</span><br />
                <span className="whitespace-nowrap text-base sm:text-xl md:text-2xl">{language === "ko" ? "실시간 여행견적" : "Live Travel Quote"}</span>
              </h1>
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
      <AnnouncementBanner />

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
                      <div className="flex items-center gap-1.5 mb-3 flex-nowrap overflow-x-auto">
                        <Label className="text-xs font-medium whitespace-nowrap">
                          {language === "ko" ? "풀빌라" : "Villa"}
                        </Label>
                        {/* 리스트/지도 토글 */}
                        <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                          <button
                            onClick={() => setVillaViewMode("list")}
                            className={cn(
                              "px-1.5 py-1 text-[10px] flex items-center gap-0.5 transition-colors",
                              villaViewMode === "list" 
                                ? "bg-primary text-white" 
                                : "bg-muted hover:bg-muted/80"
                            )}
                            data-testid="villa-view-list"
                          >
                            <List className="h-3 w-3" />
                            {language === "ko" ? "목록" : "List"}
                          </button>
                          <button
                            onClick={() => setVillaViewMode("map")}
                            className={cn(
                              "px-1.5 py-1 text-[10px] flex items-center gap-0.5 transition-colors",
                              villaViewMode === "map" 
                                ? "bg-primary text-white" 
                                : "bg-muted hover:bg-muted/80"
                            )}
                            data-testid="villa-view-map"
                          >
                            <MapPin className="h-3 w-3" />
                            {language === "ko" ? "지도" : "Map"}
                          </button>
                        </div>
                        {/* 필터 버튼 */}
                        <button
                          onClick={() => setShowAmenityFilters(!showAmenityFilters)}
                          className={cn(
                            "px-1.5 py-1 text-[10px] rounded-lg border transition-colors flex-shrink-0",
                            amenityFilters.length > 0 
                              ? "bg-primary text-white border-primary" 
                              : "bg-muted border-slate-200 hover:bg-muted/80"
                          )}
                          data-testid="button-villa-filter"
                        >
                          {language === "ko" ? "필터" : "Filter"}{amenityFilters.length > 0 && `(${amenityFilters.length})`}
                        </button>
                        {isAdmin && (
                          <Link href="/admin/villas" className="flex-shrink-0">
                            <Button variant="ghost" size="sm" className="text-[10px] h-6 px-1.5">
                              <Settings className="h-3 w-3 mr-0.5" />
                              관리
                            </Button>
                          </Link>
                        )}
                      </div>
                      
                      {/* 편의사항 필터 */}
                      {showAmenityFilters && (
                        <div className="mb-3 p-3 bg-muted/50 rounded-lg">
                          <div className="flex flex-wrap gap-2">
                            {villaAmenities.map((amenity) => (
                              <label 
                                key={amenity}
                                className={cn(
                                  "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs cursor-pointer transition-colors border",
                                  amenityFilters.includes(amenity)
                                    ? "bg-primary text-white border-primary"
                                    : "bg-background border-slate-200 hover:bg-muted"
                                )}
                              >
                                <Checkbox
                                  checked={amenityFilters.includes(amenity)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setAmenityFilters([...amenityFilters, amenity]);
                                    } else {
                                      setAmenityFilters(amenityFilters.filter(a => a !== amenity));
                                    }
                                  }}
                                  className="h-3 w-3"
                                  data-testid={`checkbox-filter-${amenity}`}
                                />
                                {villaAmenityLabels[amenity]}
                              </label>
                            ))}
                          </div>
                          {amenityFilters.length > 0 && (
                            <button
                              onClick={() => setAmenityFilters([])}
                              className="mt-2 text-xs text-muted-foreground hover:text-foreground"
                              data-testid="button-clear-filters"
                            >
                              {language === "ko" ? "필터 초기화" : "Clear filters"}
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* 지도 뷰 */}
                      {villaViewMode === "map" && (
                        <div className="mb-4">
                          <div 
                            ref={villaMapContainerRef} 
                            className="h-[250px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
                            data-testid="villa-map-container"
                          />
                          
                          {/* 선택된 빌라 상세 패널 */}
                          {selectedVillaId && (() => {
                            const villa = villas.find(v => v.id === selectedVillaId);
                            if (!villa) return null;
                            
                            const amenityLabels: Record<string, Record<string, string>> = {
                              privatePool: { ko: "개인 수영장", en: "Private Pool" },
                              oceanView: { ko: "오션뷰", en: "Ocean View" },
                              bbqArea: { ko: "BBQ 시설", en: "BBQ Area" },
                              karaoke: { ko: "노래방", en: "Karaoke" },
                              outskirts: { ko: "외곽지역", en: "Outskirts" },
                              livingAC: { ko: "거실 에어컨", en: "Living AC" },
                              wifi: { ko: "WiFi", en: "WiFi" },
                              parking: { ko: "주차장", en: "Parking" },
                              pool: { ko: "수영장", en: "Pool" },
                              downtown: { ko: "시내", en: "Downtown" },
                              portableSpeaker: { ko: "포터블 스피커", en: "Speaker" },
                            };
                            
                            return (
                              <div className="mt-3 p-3 bg-card rounded-xl border shadow-sm">
                                <div className="flex gap-3">
                                  {villa.mainImage && (
                                    <img 
                                      src={villa.mainImage} 
                                      alt={villa.name}
                                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className="font-semibold text-sm truncate">{villa.name}</h4>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 flex-shrink-0"
                                        onClick={() => setSelectedVillaId(null)}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {villa.bedrooms && (
                                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                                          🛏 {villa.bedrooms} {language === "ko" ? "침실" : "BR"}
                                        </span>
                                      )}
                                      {villa.maxGuests && (
                                        <span className="text-[10px] bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                                          👥 {language === "ko" ? "최대" : "Max"} {villa.maxGuests}
                                        </span>
                                      )}
                                    </div>
                                    {(villa.amenities || []).length > 0 && (
                                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                                        ✨ {(villa.amenities || []).slice(0, 3).map(a => 
                                          amenityLabels[a]?.[language] || amenityLabels[a]?.ko || a
                                        ).join(", ")}
                                      </p>
                                    )}
                                    <div className="grid grid-cols-4 gap-1 mt-2 text-[10px]">
                                      <div className="text-center">
                                        <div className="text-muted-foreground">{language === "ko" ? "평일" : "Wkday"}</div>
                                        <div className="font-semibold text-blue-600">${villa.weekdayPrice || 0}</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-muted-foreground">{language === "ko" ? "금" : "Fri"}</div>
                                        <div className="font-semibold text-blue-600">${villa.fridayPrice || 0}</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-muted-foreground">{language === "ko" ? "주말" : "Wkend"}</div>
                                        <div className="font-semibold text-blue-600">${villa.weekendPrice || 0}</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-muted-foreground">{language === "ko" ? "공휴일" : "Hol"}</div>
                                        <div className="font-semibold text-red-600">${villa.holidayPrice || 0}</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                  {villa.mapUrl && (
                                    <a 
                                      href={villa.mapUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex-1 text-center bg-blue-500 text-white py-2 rounded-lg text-xs font-medium"
                                    >
                                      📍 {language === "ko" ? "길찾기" : "Directions"}
                                    </a>
                                  )}
                                  <Button
                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                                    size="sm"
                                    onClick={() => setVillaViewMode("list")}
                                  >
                                    ✓ {language === "ko" ? "선택하기" : "Select"}
                                  </Button>
                                </div>
                              </div>
                            );
                          })()}
                          
                          {!selectedVillaId && (
                            <p className="text-xs text-muted-foreground text-center mt-2">
                              {language === "ko" 
                                ? "빌라를 클릭하면 상세 정보를 확인할 수 있습니다" 
                                : "Click on a villa to see details"}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* 작은 썸네일 그리드 (3열, 최대 2행 보이고 스크롤) */}
                      {villaViewMode === "list" && (
                      <div className="max-h-[220px] overflow-y-auto pb-2">
                        <div className="grid grid-cols-3 gap-2">
                          {filteredVillas.map((villa) => (
                            <div
                              key={villa.id}
                              onClick={() => setSelectedVillaId(selectedVillaId === villa.id ? null : villa.id)}
                              className={cn(
                                "relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all aspect-square",
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
                      </div>
                      )}
                      
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
                            {/* 편의사항 표시 */}
                            {selectedVilla.amenities && (selectedVilla.amenities as string[]).length > 0 && (
                              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                                <div className="flex flex-wrap gap-1.5">
                                  {(selectedVilla.amenities as string[]).map((amenity) => (
                                    <span 
                                      key={amenity}
                                      className="px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 text-[10px] rounded-full"
                                    >
                                      ✓ {(villaAmenityLabels as Record<string, string>)[amenity] || amenity}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
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
                      {isEditingNotes ? (
                        <>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-600">가격 안내 문구</label>
                            <textarea
                              value={editPriceNote}
                              onChange={(e) => setEditPriceNote(e.target.value)}
                              className="w-full text-xs p-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-700"
                              rows={2}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-600">최저가 보장 문구</label>
                            <textarea
                              value={editLowestPriceGuarantee}
                              onChange={(e) => setEditLowestPriceGuarantee(e.target.value)}
                              className="w-full text-xs p-2 rounded-lg border border-green-200 bg-green-50 text-green-700"
                              rows={2}
                            />
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={async () => {
                                await updateSettingMutation.mutateAsync({ key: "villa_price_note", value: editPriceNote });
                                await updateSettingMutation.mutateAsync({ key: "lowest_price_guarantee", value: editLowestPriceGuarantee });
                                setIsEditingNotes(false);
                                toast({ title: "저장 완료" });
                              }}
                              disabled={updateSettingMutation.isPending}
                            >
                              {updateSettingMutation.isPending ? "저장 중..." : "저장"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsEditingNotes(false)}
                            >
                              취소
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                            <span className="text-amber-500 mt-0.5">📌</span>
                            <span className="whitespace-pre-line">{villaPriceNote}</span>
                          </div>
                          <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 p-2 rounded-lg border border-green-200">
                            <span className="text-green-500 mt-0.5">💰</span>
                            <span className="whitespace-pre-line">{lowestPriceGuarantee}</span>
                          </div>
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-slate-500 h-6"
                              onClick={() => {
                                setEditPriceNote(villaPriceNote);
                                setEditLowestPriceGuarantee(lowestPriceGuarantee);
                                setIsEditingNotes(true);
                              }}
                            >
                              <Pencil className="w-3 h-3 mr-1" />
                              문구 수정 (관리자)
                            </Button>
                          )}
                        </>
                      )}
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
            <div className="text-xs text-slate-400 mt-2">사업자등록번호: 붕따우 도깨비 350-70-00679</div>
          </div>
        </div>
      </footer>
      
      
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
        <div className="bg-slate-800 py-1 px-3 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {language === "ko" ? `오늘 ${visitorCount.toLocaleString()}명` : 
             language === "en" ? `Today ${visitorCount.toLocaleString()}` :
             language === "zh" ? `今日 ${visitorCount.toLocaleString()}` :
             language === "vi" ? `Hôm nay ${visitorCount.toLocaleString()}` :
             language === "ru" ? `Сегодня ${visitorCount.toLocaleString()}` :
             language === "ja" ? `今日 ${visitorCount.toLocaleString()}人` : `오늘 ${visitorCount.toLocaleString()}명`}
          </span>
          {isAdmin && (
            <span className="text-[10px] text-green-400 flex items-center gap-1">
              실제: {realVisitorCount.toLocaleString()} / {realTotalVisitorCount.toLocaleString()}
            </span>
          )}
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            {language === "ko" ? `누적 ${totalVisitorCount.toLocaleString()}명` : 
             language === "en" ? `Total ${totalVisitorCount.toLocaleString()}` :
             language === "zh" ? `累计 ${totalVisitorCount.toLocaleString()}` :
             language === "vi" ? `Tổng ${totalVisitorCount.toLocaleString()}` :
             language === "ru" ? `Всего ${totalVisitorCount.toLocaleString()}` :
             language === "ja" ? `累計 ${totalVisitorCount.toLocaleString()}人` : `누적 ${totalVisitorCount.toLocaleString()}명`}
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
