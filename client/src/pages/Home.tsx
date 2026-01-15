import { useState, useEffect, useMemo } from "react";
import { format, addDays, parseISO, getDay } from "date-fns";
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
  Camera
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [breakdown, setBreakdown] = useState<QuoteBreakdown | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
  const [visitorCount, setVisitorCount] = useState<number>(0);

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
      ecoGirl: { enabled: false, count: "" as any, nights: "" as any },
      guide: { enabled: false, days: "" as any, groupSize: 4 },
    },
  });

  const calculateMutation = useCalculateQuote();
  const createQuoteMutation = useCreateQuote();
  const values = form.watch();

  const villaEstimate = useMemo(() => {
    if (!values.villa?.enabled || !values.villa?.checkIn || !values.villa?.checkOut) {
      return { price: 0, nights: 0, details: [] as { day: string; price: number }[] };
    }
    try {
      let current = parseISO(values.villa.checkIn);
      const end = parseISO(values.villa.checkOut);
      if (isNaN(current.getTime()) || isNaN(end.getTime()) || current >= end) {
        return { price: 0, nights: 0, details: [] as { day: string; price: number }[] };
      }
      let totalPrice = 0;
      const details: { day: string; price: number }[] = [];
      while (current < end) {
        const dayOfWeek = getDay(current);
        let dailyPrice = 350;
        let dayName = format(current, "M/d");
        if (dayOfWeek === 5) {
          dailyPrice = 380;
          dayName += ` (${t("villa.friday")})`;
        } else if (dayOfWeek === 6) {
          dailyPrice = 500;
          dayName += ` (${t("villa.saturday")})`;
        }
        totalPrice += dailyPrice;
        details.push({ day: dayName, price: dailyPrice });
        current = addDays(current, 1);
      }
      return { price: totalPrice, nights: details.length, details };
    } catch {
      return { price: 0, nights: 0, details: [] as { day: string; price: number }[] };
    }
  }, [values.villa?.enabled, values.villa?.checkIn, values.villa?.checkOut, t]);

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
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const players = Number(selection.players) || 1;
        let price = 0;
        let tip = "";
        let courseName = "";
        switch (selection.course) {
          case "paradise":
            price = isWeekend ? 100 : 80;
            tip = "40만동";
            courseName = t("golf.course.paradise");
            break;
          case "chouduc":
            price = isWeekend ? 120 : 80;
            tip = "50만동";
            courseName = t("golf.course.chouduc");
            break;
          case "hocham":
            price = isWeekend ? 200 : 130;
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

  useEffect(() => {
    const subscription = form.watch((value) => {
      const timer = setTimeout(() => {
        // Manually build a valid payload for calculation
        // This avoids Zod validation errors blocking the update
        const payload: any = {
          villa: value.villa?.enabled && value.villa.checkIn && value.villa.checkOut 
            ? { enabled: true, checkIn: value.villa.checkIn, checkOut: value.villa.checkOut } 
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
          ecoGirl: value.ecoGirl?.enabled 
            ? { enabled: true, count: value.ecoGirl.count || 0, nights: value.ecoGirl.nights || 0 }
            : { enabled: false },
          guide: value.guide?.enabled
            ? { enabled: true, days: value.guide.days || 0, groupSize: value.guide.groupSize || 1 }
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
  }, [form.watch, calculateMutation]);

  const handleSaveQuote = () => {
    if (!breakdown) return;
    setIsCustomerDialogOpen(true);
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
        <div className="container mx-auto px-4 py-12 relative z-10">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl flex items-center gap-6">
            <img src={logoImg} alt={t("header.title")} className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-md" />
            <div>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-primary mb-4 leading-tight">{t("header.title")}<br className="md:hidden" /> {t("header.subtitle")}</h1>
              <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed">{t("header.description")}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4 max-w-xs">
            <WeatherWidget language={language} />
          </motion.div>
        </div>
      </div>

      <div className="bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 py-3">
            <Link href="/">
              <Button variant="default" className="flex items-center gap-2" data-testid="nav-calculator">
                <Calculator className="w-4 h-4" />
                {t("nav.calculator")}
              </Button>
            </Link>
            <Link href="/guide">
              <Button variant="outline" className="flex items-center gap-2" data-testid="nav-guide">
                <MapPin className="w-4 h-4" />
                {t("nav.guide")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6 pb-20">
            <Controller
              control={form.control}
              name="villa.enabled"
              render={({ field }) => (
                <SectionCard title={t("villa.title")} icon={Plane} isEnabled={field.value ?? false} onToggle={field.onChange} gradient="from-blue-500/10">
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
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t("villa.checkIn")}</Label>
                        <Controller
                          control={form.control}
                          name="villa.checkIn"
                          render={({ field }) => (
                            <Popover open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
                              <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-12 rounded-xl", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(new Date(field.value), "PPP") : <span>{t("villa.selectDate")}</span>}</Button></PopoverTrigger>
                              <PopoverContent className="w-auto p-0 z-[9999]" align="start"><Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={(date) => { field.onChange(date ? format(date, "yyyy-MM-dd") : ""); setIsCheckInOpen(false); }} initialFocus /></PopoverContent>
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
                            <Popover open={isCheckOutOpen} onOpenChange={setIsCheckOutOpen}>
                              <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-12 rounded-xl", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(new Date(field.value), "PPP") : <span>{t("villa.selectDate")}</span>}</Button></PopoverTrigger>
                              <PopoverContent className="w-auto p-0 z-[9999]" align="start"><Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={(date) => { field.onChange(date ? format(date, "yyyy-MM-dd") : ""); setIsCheckOutOpen(false); }} initialFocus /></PopoverContent>
                            </Popover>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50/80 p-4 rounded-xl text-sm text-slate-700 border border-blue-100 shadow-sm">
                    <p><strong>{t("villa.weekday")}:</strong> $350 | <strong>{t("villa.friday")}:</strong> $380 | <strong>{t("villa.saturday")}:</strong> $500</p>
                    <p className="mt-1 text-xs text-blue-600/80">{t("villa.priceNote")}</p>
                  </div>
                  {villaEstimate.price > 0 && (
                    <div className="mt-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 rounded-xl shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{t("villa.estimatedPrice")}</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold">${villaEstimate.price}</span>
                          {currencyInfo.code !== "USD" && (
                            <div className="text-sm text-blue-200">≈ {formatLocalCurrency(villaEstimate.price)}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-blue-100 space-y-0.5">
                        {villaEstimate.details.map((d, i) => (
                          <div key={i} className="flex justify-between">
                            <span>{d.day}</span>
                            <span>${d.price}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-blue-400/30 text-xs text-blue-100 flex justify-between">
                        <span>{villaEstimate.nights}{t("villa.nightsTotal")}</span>
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
                                <SelectTrigger className="h-10 rounded-lg text-sm bg-white border-slate-200"><SelectValue placeholder={t("vehicle.select")} /></SelectTrigger>
                                <SelectContent className="z-[9999] bg-white border shadow-lg opacity-100">
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
                                          "7_seater": { city: 100, oneway: 80, hocham_oneway: 80, phanthiet_oneway: 130, roundtrip: 150, city_pickup_drop: 150 },
                                          "16_seater": { city: 130, oneway: 130, hocham_oneway: 130, phanthiet_oneway: Math.round(130 * 1.6 * 0.85), roundtrip: 250, city_pickup_drop: 195 },
                                          "9_limo": { city: 160, oneway: 160, hocham_oneway: 160, phanthiet_oneway: Math.round(160 * 1.6 * 0.85), roundtrip: 300, city_pickup_drop: 240 },
                                          "9_lux_limo": { city: 210, oneway: 210, hocham_oneway: 210, phanthiet_oneway: Math.round(210 * 1.6 * 0.85), roundtrip: 400, city_pickup_drop: 315 },
                                          "12_lux_limo": { city: 250, oneway: 250, hocham_oneway: 250, phanthiet_oneway: Math.round(250 * 1.6 * 0.85), roundtrip: 480, city_pickup_drop: 375 },
                                          "16_lux_limo": { city: 280, oneway: 280, hocham_oneway: 280, phanthiet_oneway: Math.round(280 * 1.6 * 0.85), roundtrip: 530, city_pickup_drop: 420 },
                                          "29_seater": { city: 230, oneway: 230, hocham_oneway: 230, phanthiet_oneway: Math.round(230 * 1.6 * 0.85), roundtrip: 430, city_pickup_drop: 345 },
                                          "45_seater": { city: 280, oneway: 290, hocham_oneway: 290, phanthiet_oneway: Math.round(290 * 1.6 * 0.85), roundtrip: 550, city_pickup_drop: 420 },
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
                          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs font-semibold text-slate-500">{t("vehicle.route")}</Label><Controller control={form.control} name={`vehicle.selections.${index}.route`} render={({ field }) => (<Select onValueChange={(value) => { field.onChange(value); if (document.activeElement instanceof HTMLElement) { document.activeElement.blur(); } }} defaultValue={field.value}><SelectTrigger className="h-10 rounded-lg text-sm bg-white border-slate-200"><SelectValue placeholder={t("vehicle.select")} /></SelectTrigger><SelectContent className="z-[9999] bg-white border shadow-lg opacity-100"><SelectItem value="city">{t("route.city")}</SelectItem><SelectItem value="oneway">{t("route.oneway")}</SelectItem><SelectItem value="hocham_oneway">{t("route.hocham_oneway")}</SelectItem><SelectItem value="phanthiet_oneway">{t("route.phanthiet_oneway")}</SelectItem><SelectItem value="roundtrip">{t("route.roundtrip")}</SelectItem><SelectItem value="city_pickup_drop">{t("route.city_pickup_drop")}</SelectItem></SelectContent></Select>)} /></div>
                          <div className="md:col-span-1 flex justify-end"><Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 h-10 w-10 rounded-lg" onClick={() => handleRemoveVehicleDay(index)} type="button"><div className="w-4 h-0.5 bg-current rounded-full" /></Button></div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" className="w-full h-12 rounded-xl border-dashed border-2 hover:border-primary hover:text-primary transition-all bg-white" onClick={handleAddVehicleDay}><Plus className="mr-2 h-4 w-4" /> {t("vehicle.addDay")}</Button>
                    </div>
                  </div>
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
                          <div className="md:col-span-4 space-y-1.5"><Label className="text-xs font-semibold text-slate-500">{t("golf.courseSelect")}</Label><Controller control={form.control} name={`golf.selections.${index}.course`} render={({ field }) => (<Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger className="h-10 rounded-lg text-sm bg-white border-slate-200 w-full"><SelectValue placeholder={t("vehicle.select")} /></SelectTrigger><SelectContent className="z-[9999] bg-white border shadow-lg opacity-100"><SelectItem value="paradise">{t("golf.course.paradise_price")}</SelectItem><SelectItem value="chouduc">{t("golf.course.chouduc_price")}</SelectItem><SelectItem value="hocham">{t("golf.course.hocham_price")}</SelectItem></SelectContent></Select>)} /></div>
                          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs font-semibold text-slate-500">{t("golf.players")}</Label><Controller control={form.control} name={`golf.selections.${index}.players`} render={({ field }) => (<Input type="number" min="1" {...field} value={field.value ?? ""} onChange={(e) => { const val = e.target.value; field.onChange(val === "" ? "" : parseInt(val)); }} className="h-10 rounded-lg text-sm border-slate-200 w-full" />)} /></div>
                          <div className="md:col-span-1 flex justify-end"><Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 h-10 w-10 rounded-lg" onClick={() => handleRemoveGolfDay(index)} type="button"><div className="w-4 h-0.5 bg-current rounded-full" /></Button></div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" className="w-full h-12 rounded-xl border-dashed border-2 hover:border-primary hover:text-primary transition-all bg-white" onClick={handleAddGolfDay}><Plus className="mr-2 h-4 w-4" /> {t("golf.addDay")}</Button>
                    </div>
                  </div>
                  {golfEstimate.price > 0 && (
                    <div className="mt-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white p-4 rounded-xl shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{t("golf.estimatedPrice")}</span>
                        <div className="text-right">
                          <span className="text-2xl font-bold">${golfEstimate.price}</span>
                          {currencyInfo.code !== "USD" && (
                            <div className="text-sm text-emerald-200">≈ {formatLocalCurrency(golfEstimate.price)}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-emerald-100 space-y-1">
                        {golfEstimate.details.map((d, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <span>{d.date} {d.course}</span>
                            <span>${d.unitPrice} × {d.players}{t("golf.person")} = ${d.subtotal}</span>
                          </div>
                        ))}
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
          </div>
          <div className="lg:col-span-4"><QuoteSummary breakdown={breakdown} isLoading={calculateMutation.isPending} onSave={handleSaveQuote} isSaving={createQuoteMutation.isPending} /></div>
        </div>
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
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("contact.vietnam")}</p>
                    <a href="tel:0899326273" className="text-xl font-mono font-bold text-slate-200 hover:text-blue-400 transition-colors">089.932.6273</a>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                    <Phone className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("contact.korea")}</p>
                    <a href="tel:01090774860" className="text-xl font-mono font-bold text-slate-200 hover:text-indigo-400 transition-colors">010.9077.4860</a>
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
              <span className="hover:text-slate-300 cursor-pointer transition-colors">개인정보처리방침</span>
            </div>
          </div>
        </div>
      </footer>
      
      <LanguageSelector />

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
                data-testid="link-kakao-reservation-home"
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
