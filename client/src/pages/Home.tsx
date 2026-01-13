import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";

import { useCalculateQuote, useCreateQuote } from "@/hooks/use-quotes";
import { calculateQuoteSchema, type CalculateQuoteRequest, type QuoteBreakdown } from "@shared/schema";

import { SectionCard } from "@/components/SectionCard";
import { QuoteSummary } from "@/components/QuoteSummary";
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
  Flag
} from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const [breakdown, setBreakdown] = useState<QuoteBreakdown | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);

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
            <img src={logoImg} alt="붕따우 도깨비 로고" className="w-24 h-24 md:w-32 md:h-32 object-contain drop-shadow-md" />
            <div>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-primary mb-4 leading-tight">붕따우 도깨비<br className="md:hidden" /> 여행견적</h1>
              <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed">풀빌라, 차량, 가이드 서비스 등 나만의 맞춤 여행 견적을 실시간으로 확인하세요.</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6 pb-20">
            <Controller
              control={form.control}
              name="villa.enabled"
              render={({ field }) => (
                <SectionCard title="럭셔리 풀빌라 숙박" icon={Plane} isEnabled={field.value ?? false} onToggle={field.onChange} gradient="from-blue-500/10">
                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="relative group overflow-hidden rounded-xl border border-slate-200 shadow-sm aspect-video">
                      <img 
                        src={villaImg} 
                        alt="럭셔리 풀빌라" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <a 
                          href="https://m.blog.naver.com/vungtausaver?categoryNo=16&tab=1" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-white/90 hover:bg-white text-primary px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                        >
                          실제 빌라 사진 더보기 <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>체크인 날짜</Label>
                        <Controller
                          control={form.control}
                          name="villa.checkIn"
                          render={({ field }) => (
                            <Popover open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
                              <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-12 rounded-xl", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(new Date(field.value), "PPP") : <span>날짜 선택</span>}</Button></PopoverTrigger>
                              <PopoverContent className="w-auto p-0 z-[9999]" align="start"><Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={(date) => { field.onChange(date ? format(date, "yyyy-MM-dd") : ""); setIsCheckInOpen(false); }} initialFocus /></PopoverContent>
                            </Popover>
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>체크아웃 날짜</Label>
                        <Controller
                          control={form.control}
                          name="villa.checkOut"
                          render={({ field }) => (
                            <Popover open={isCheckOutOpen} onOpenChange={setIsCheckOutOpen}>
                              <PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal h-12 rounded-xl", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(new Date(field.value), "PPP") : <span>날짜 선택</span>}</Button></PopoverTrigger>
                              <PopoverContent className="w-auto p-0 z-[9999]" align="start"><Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={(date) => { field.onChange(date ? format(date, "yyyy-MM-dd") : ""); setIsCheckOutOpen(false); }} initialFocus /></PopoverContent>
                            </Popover>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50/80 p-4 rounded-xl text-sm text-slate-700 border border-blue-100 shadow-sm">
                    <p><strong>평일(일-목):</strong> $350 | <strong>금요일:</strong> $380 | <strong>토요일:</strong> $500</p>
                    <p className="mt-1 text-xs text-blue-600/80">* 빌라 방갯수와 컨디션에 따라 가격은 변경될 수 있습니다.</p>
                  </div>
                </SectionCard>
              )}
            />

            <Controller
              control={form.control}
              name="vehicle.enabled"
              render={({ field }) => (
                <SectionCard
                  title="프라이빗 차량 (일자별 선택)"
                  icon={Car}
                  isEnabled={field.value ?? false}
                  onToggle={field.onChange}
                  gradient="from-indigo-500/10"
                >
                  <div className="space-y-4 max-h-[500px] overflow-y-auto p-1 pr-2 custom-scrollbar">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="relative group overflow-hidden rounded-xl border border-slate-200 shadow-sm aspect-video">
                        <img 
                          src={vehicleImg} 
                          alt="프라이빗 차량 서비스" 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <a 
                            href="https://m.blog.naver.com/vungtausaver/223352172674" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white/90 hover:bg-white text-primary px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                          >
                            실제 차량 사진 더보기 <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                      <div className="flex flex-col justify-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                        <h4 className="font-bold text-indigo-900 mb-2 underline underline-offset-4 decoration-indigo-200">차량 서비스 안내</h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-bold text-indigo-900 mb-1">[포함 사항]</p>
                            <ul className="text-[11px] text-indigo-800 space-y-0.5 list-disc list-inside">
                              <li>운전기사, 유류비, 통행료 및 팁</li>
                              <li>대기료, 야간 할증</li>
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-indigo-900 mb-1">[불포함 사항]</p>
                            <ul className="text-[11px] text-indigo-800 space-y-0.5 list-disc list-inside">
                              <li>개별 여행자 보험</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {values.vehicle?.selections?.map((selection, index) => (
                        <div key={`vehicle-day-${index}`} className="grid grid-cols-1 md:grid-cols-7 gap-3 p-4 bg-white rounded-xl border border-slate-200 relative group shadow-sm items-end">
                          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs font-semibold text-slate-500">날짜</Label><Controller control={form.control} name={`vehicle.selections.${index}.date`} render={({ field }) => (<Input type="date" {...field} className="h-10 rounded-lg text-sm border-slate-200 focus:ring-primary/20" />)} /></div>
                          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs font-semibold text-slate-500">차량 종류</Label><Controller control={form.control} name={`vehicle.selections.${index}.type`} render={({ field }) => (
                            <div className="space-y-2">
                              <Select onValueChange={(value) => { field.onChange(value); if (document.activeElement instanceof HTMLElement) { document.activeElement.blur(); } }} defaultValue={field.value}>
                                <SelectTrigger className="h-10 rounded-lg text-sm bg-white border-slate-200"><SelectValue placeholder="선택" /></SelectTrigger>
                                <SelectContent className="z-[9999] bg-white border shadow-lg opacity-100">
                                  <SelectItem value="7_seater">7인승 SUV</SelectItem>
                                  <SelectItem value="16_seater">16인승 밴</SelectItem>
                                  <SelectItem value="9_limo">9인승 리무진</SelectItem>
                                  <SelectItem value="9_lux_limo">9인승 럭셔리 리무진</SelectItem>
                                  <SelectItem value="12_lux_limo">12인승 럭셔리 리무진</SelectItem>
                                  <SelectItem value="16_lux_limo">16인승 럭셔리 리무진</SelectItem>
                                  <SelectItem value="29_seater">29인승 버스</SelectItem>
                                  <SelectItem value="45_seater">45인승 버스</SelectItem>
                                </SelectContent>
                              </Select>
                              {field.value && (
                                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-[10px] leading-relaxed text-slate-600 space-y-1">
                                  {/* Pricing display for selected vehicle */}
                                  <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-200">
                                    <span className="font-bold text-slate-700">이용 금액 (예상):</span>
                                    <span className="text-lg font-bold text-primary">
                                      {(() => {
                                        const type = values.vehicle?.selections?.[index]?.type;
                                        const route = values.vehicle?.selections?.[index]?.route;
                                        if (!type || !route) return "-";
                                        
                                        const prices: Record<string, any> = {
                                          "7_seater": { city: 100, oneway: 110, hocham_oneway: 110, phanthiet_oneway: 150, roundtrip: 150, city_pickup_drop: 150 },
                                          "16_seater": { city: 130, oneway: 130, hocham_oneway: 130, phanthiet_oneway: Math.round(130 * 1.6 * 0.85), roundtrip: 250, city_pickup_drop: 195 },
                                          "9_limo": { city: 160, oneway: 160, hocham_oneway: 160, phanthiet_oneway: Math.round(160 * 1.6 * 0.85), roundtrip: 300, city_pickup_drop: 240 },
                                          "9_lux_limo": { city: 210, oneway: 210, hocham_oneway: 210, phanthiet_oneway: Math.round(210 * 1.6 * 0.85), roundtrip: 400, city_pickup_drop: 315 },
                                          "12_lux_limo": { city: 250, oneway: 250, hocham_oneway: 250, phanthiet_oneway: Math.round(250 * 1.6 * 0.85), roundtrip: 480, city_pickup_drop: 375 },
                                          "16_lux_limo": { city: 280, oneway: 280, hocham_oneway: 280, phanthiet_oneway: Math.round(280 * 1.6 * 0.85), roundtrip: 530, city_pickup_drop: 420 },
                                          "29_seater": { city: 230, oneway: 230, hocham_oneway: 230, phanthiet_oneway: Math.round(230 * 1.6 * 0.85), roundtrip: 430, city_pickup_drop: 345 },
                                          "45_seater": { city: 280, oneway: 290, hocham_oneway: 290, phanthiet_oneway: Math.round(290 * 1.6 * 0.85), roundtrip: 550, city_pickup_drop: 420 },
                                        };
                                        
                                        const price = prices[type]?.[route];
                                        return price ? `$${price}` : "-";
                                      })()}
                                    </span>
                                  </div>
                                  {field.value === "7_seater" && (
                                    <>
                                      <p className="font-bold text-slate-700">- 7인승 SUV 차량(2,3인 추천)</p>
                                      <p>- 최대 4인+캐리어 4개</p>
                                      <p>- 골프백 이용 시 최대 3인(골프백3개 + 캐리어 3개)</p>
                                      <p>- 요청 주신 픽업,드랍장소로 진행</p>
                                      <p>- 기사 포함, 추가금 없음(지연, 대기, 야간 일체)</p>
                                    </>
                                  )}
                                  {field.value === "16_seater" && (
                                    <>
                                      <p className="font-bold text-slate-700">- 16인승 미니밴 차량(4~6인 추천, 최대 8인)</p>
                                      <p>- 6인(골프백 6개 + 캐리어 6개)</p>
                                      <p>- 9인(캐리어 9개)</p>
                                      <p>- 요청 주신 픽업,드랍장소로 진행</p>
                                      <p>- 기사 포함, 추가금 없음(지연, 대기, 야간 일체)</p>
                                    </>
                                  )}
                                  {(field.value === "9_limo" || field.value === "9_lux_limo") && (
                                    <>
                                      <p className="font-bold text-slate-700">- 9인승 미니밴 차량(4~6인 추천, 최대 6인)</p>
                                      <p>- 4인(골프백 4개 + 캐리어 4개)</p>
                                      <p>- 요청 주신 픽업,드랍장소로 진행</p>
                                      <p>- 기사 포함, 추가금 없음(지연, 대기, 야간 일체)</p>
                                    </>
                                  )}
                                  {field.value === "12_lux_limo" && (
                                    <>
                                      <p className="font-bold text-slate-700">- 12인승 VIP리무진 밴 차량(6~8인 추천, 최대 8인)</p>
                                      <p>- 6인(골프백 6개 + 캐리어 6개)</p>
                                      <p>- 요청 주신 픽업,드랍장소로 진행</p>
                                      <p>- 기사 포함, 추가금 없음(지연, 대기, 야간 일체)</p>
                                    </>
                                  )}
                                  {field.value === "16_lux_limo" && (
                                    <>
                                      <p className="font-bold text-slate-700">- 16인승 미니밴 차량(10인 이상 추천, 최대 16인)</p>
                                      <p>- 16인(골프백 16개 + 캐리어 16개)</p>
                                      <p>- 요청 주신 픽업,드랍장소로 진행</p>
                                      <p>- 기사 포함, 추가금 없음(지연, 대기, 야간 일체)</p>
                                    </>
                                  )}
                                  {field.value === "29_seater" && (
                                    <>
                                      <p className="font-bold text-slate-700">- 29인승 미니밴 차량(10인 이상 추천, 최대 25인)</p>
                                      <p>- 15인(골프백 15개 + 캐리어 15개)</p>
                                      <p>- 요청 주신 픽업,드랍장소로 진행</p>
                                      <p>- 기사 포함, 추가금 없음(지연, 대기, 야간 일체)</p>
                                    </>
                                  )}
                                  {field.value === "45_seater" && (
                                    <>
                                      <p className="font-bold text-slate-700">- 45인승 대형 버스 차량(20인 이상 추천, 최대 40인)</p>
                                      <p>- 20인(골프백 20개 + 캐리어 20개)</p>
                                      <p>- 요청 주신 픽업,드랍장소로 진행</p>
                                      <p>- 기사 포함, 추가금 없음(지연, 대기, 야간 일체)</p>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )} /></div>
                          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs font-semibold text-slate-500">이동 경로</Label><Controller control={form.control} name={`vehicle.selections.${index}.route`} render={({ field }) => (<Select onValueChange={(value) => { field.onChange(value); if (document.activeElement instanceof HTMLElement) { document.activeElement.blur(); } }} defaultValue={field.value}><SelectTrigger className="h-10 rounded-lg text-sm bg-white border-slate-200"><SelectValue placeholder="선택" /></SelectTrigger><SelectContent className="z-[9999] bg-white border shadow-lg opacity-100"><SelectItem value="city">붕따우 시내투어</SelectItem><SelectItem value="oneway">호치민 ↔ 붕따우 (편도)</SelectItem><SelectItem value="hocham_oneway">호치민 ↔ 호짬 (편도)</SelectItem><SelectItem value="phanthiet_oneway">호치민 ↔ 판티엣 (편도)</SelectItem><SelectItem value="roundtrip">호치민 ↔ 붕따우 (왕복)</SelectItem><SelectItem value="city_pickup_drop">픽업/드랍 + 시내</SelectItem></SelectContent></Select>)} /></div>
                          <div className="md:col-span-1 flex justify-end"><Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 h-10 w-10 rounded-lg" onClick={() => handleRemoveVehicleDay(index)} type="button"><div className="w-4 h-0.5 bg-current rounded-full" /></Button></div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" className="w-full h-12 rounded-xl border-dashed border-2 hover:border-primary hover:text-primary transition-all bg-white" onClick={handleAddVehicleDay}><Plus className="mr-2 h-4 w-4" /> 차량 이용일 추가</Button>
                    </div>
                  </div>
                </SectionCard>
              )}
            />

            <Controller
              control={form.control}
              name="golf.enabled"
              render={({ field }) => (
                <SectionCard title="골프 라운딩 견적 (선택)" icon={Flag} isEnabled={field.value ?? false} onToggle={field.onChange} gradient="from-emerald-600/10">
                  <div className="max-h-[600px] overflow-y-auto p-1 pr-2 custom-scrollbar flex flex-col gap-4">
                    <div className="p-4 bg-emerald-50 rounded-xl text-xs text-emerald-800 space-y-1 border border-emerald-100 shadow-sm sticky top-0 z-20">
                      <p><strong>* 포함사항:</strong> 그린피, 카트피(2인 1카트), 캐디피</p>
                      <p><strong>* 불포함(현장지불):</strong> 캐디팁 (파라다이스 40만동 / 쩌우득·호짬 50만동)</p>
                      <p><strong>* 주말요금 적용:</strong> 토요일, 일요일</p>
                    </div>
                    <div className="space-y-4">
                      {values.golf?.selections?.map((selection, index) => (
                        <div key={`golf-day-${index}`} className="grid grid-cols-1 md:grid-cols-9 gap-3 p-4 bg-white rounded-xl border border-slate-200 relative group shadow-sm items-end overflow-hidden">
                          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs font-semibold text-slate-500">날짜</Label><Controller control={form.control} name={`golf.selections.${index}.date`} render={({ field }) => (<Input type="date" {...field} className="h-10 rounded-lg text-sm border-slate-200 focus:ring-primary/20 w-full" />)} /></div>
                          <div className="md:col-span-4 space-y-1.5"><Label className="text-xs font-semibold text-slate-500">골프장 선택</Label><Controller control={form.control} name={`golf.selections.${index}.course`} render={({ field }) => (<Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger className="h-10 rounded-lg text-sm bg-white border-slate-200 w-full"><SelectValue placeholder="선택" /></SelectTrigger><SelectContent className="z-[9999] bg-white border shadow-lg opacity-100"><SelectItem value="paradise">파라다이스 (평일 $80 / 주말 $100)</SelectItem><SelectItem value="chouduc">쩌우득 (평일 $80 / 주말 $120)</SelectItem><SelectItem value="hocham">호짬 (평일 $130 / 주말 $200)</SelectItem></SelectContent></Select>)} /></div>
                          <div className="md:col-span-2 space-y-1.5"><Label className="text-xs font-semibold text-slate-500">인원수</Label><Controller control={form.control} name={`golf.selections.${index}.players`} render={({ field }) => (<Input type="number" min="1" {...field} value={field.value ?? ""} onChange={(e) => { const val = e.target.value; field.onChange(val === "" ? "" : parseInt(val)); }} className="h-10 rounded-lg text-sm border-slate-200 w-full" />)} /></div>
                          <div className="md:col-span-1 flex justify-end"><Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 h-10 w-10 rounded-lg" onClick={() => handleRemoveGolfDay(index)} type="button"><div className="w-4 h-0.5 bg-current rounded-full" /></Button></div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" className="w-full h-12 rounded-xl border-dashed border-2 hover:border-primary hover:text-primary transition-all bg-white" onClick={handleAddGolfDay}><Plus className="mr-2 h-4 w-4" /> 라운딩 일정 추가</Button>
                    </div>
                  </div>
                </SectionCard>
              )}
            />

            <Controller control={form.control} name="guide.enabled" render={({ field }) => (<SectionCard title="한국어 투어 가이드" icon={Users} isEnabled={field.value ?? false} onToggle={field.onChange} gradient="from-emerald-500/10"><div className="grid md:grid-cols-2 gap-6"><div className="space-y-2"><Label>이용 일수 (일)</Label><Controller control={form.control} name="guide.days" render={({ field }) => (<Input type="number" min="0" {...field} value={field.value ?? ""} onChange={(e) => { const val = e.target.value; field.onChange(val === "" ? "" : parseInt(val)); }} className="h-12 rounded-xl" />)} /></div><div className="space-y-2"><Label>그룹 인원</Label><Controller control={form.control} name="guide.groupSize" render={({ field }) => (<Input type="number" min="1" {...field} value={field.value ?? ""} onChange={(e) => { const val = e.target.value; field.onChange(val === "" ? "" : parseInt(val)); }} className="h-12 rounded-xl" />)} /></div></div><div className="mt-2 text-sm text-emerald-600 font-medium">요금: 1일 $120 (4인 기준) + 4인 초과 시 1인당 $20 추가</div></SectionCard>)} />
          </div>
          <div className="lg:col-span-4"><QuoteSummary breakdown={breakdown} isLoading={calculateMutation.isPending} onSave={handleSaveQuote} isSaving={createQuoteMutation.isPending} /></div>
        </div>
      </div>

      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl"><DialogHeader><DialogTitle>견적 저장하기</DialogTitle><DialogDescription>이 견적을 나중에 다시 확인하려면 고객 이름을 입력하세요.</DialogDescription></DialogHeader><div className="py-4"><Label htmlFor="name" className="text-right">고객 이름</Label><Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="예: 홍길동" className="mt-2 h-12 rounded-xl" autoFocus /></div><DialogFooter><Button variant="outline" onClick={() => setIsCustomerDialogOpen(false)} className="rounded-xl">취소</Button><Button onClick={confirmSaveQuote} className="rounded-xl"><Check className="mr-2 h-4 w-4" /> 견적 저장</Button></DialogFooter></DialogContent>
      </Dialog>

      <footer className="bg-slate-900 text-white mt-24 pb-12 pt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center mb-10 space-y-2">
            <h2 className="text-2xl font-display font-bold">도움이 필요하신가요?</h2>
            <p className="text-slate-400 max-w-lg text-sm">베트남 여행 전문가가 실시간으로 상담해 드립니다. 궁금한 점이 있다면 언제든 문의주세요.</p>
          </div>
          
          <div className="bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-slate-700/50 shadow-xl max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <Phone className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">베트남 현지</p>
                    <a href="tel:0899326273" className="text-xl font-mono font-bold text-slate-200 hover:text-blue-400 transition-colors">089.932.6273</a>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                    <Phone className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">한국 직통</p>
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
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">카카오톡 ID</p>
                      <p className="text-xl font-bold text-slate-200">vungtau</p>
                    </div>
                    <a href="http://pf.kakao.com/_TuxoxfG" target="_blank" rel="noopener noreferrer" className="bg-yellow-500 text-slate-900 px-5 py-2 rounded-xl font-bold hover:bg-yellow-400 transition-all flex items-center gap-2 text-sm shadow-lg shadow-yellow-500/10">
                      <ExternalLink className="w-4 h-4" /> 채널 연결
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                    <Globe className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">공식 블로그</p>
                      <p className="text-xl font-bold text-slate-200">Vung Tau Saver</p>
                    </div>
                    <a href="https://m.blog.naver.com/vungtausaver" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-2 transition-colors">
                      방문하기 <ExternalLink className="w-4 h-4" />
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
    </div>
  );
}
