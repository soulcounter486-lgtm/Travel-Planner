import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, Info, Save, Users, AlertTriangle } from "lucide-react";
import { type QuoteBreakdown } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import { useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import logoImage from "@assets/BackgroundEraser_20240323_103507859_1768997960669.png";
import { useAuth } from "@/hooks/use-auth";

interface QuoteSummaryProps {
  breakdown: QuoteBreakdown | null;
  isLoading: boolean;
  onSave: () => void;
  isSaving: boolean;
}

export function QuoteSummary({ breakdown, isLoading, onSave, isSaving }: QuoteSummaryProps) {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const summaryRef = useRef<HTMLDivElement>(null);
  const [personCount, setPersonCount] = useState<string>("");
  const [villaAdjustments, setVillaAdjustments] = useState<Record<number, number>>({});
  const [vehicleAdjustments, setVehicleAdjustments] = useState<Record<number, number>>({});
  const [isCapturing, setIsCapturing] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>("");
  
  const { data: adminCheck } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
  });
  const isAdmin = adminCheck?.isAdmin || false;
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

  // 빌라 날짜별 금액 파싱 함수
  const parseVillaPrice = (detail: string): number => {
    const match = detail.match(/\$(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  // 차량 날짜별 금액 파싱 함수
  const parseVehiclePrice = (detail: string): number => {
    const match = detail.match(/\$(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  // 조정된 빌라 총액 계산
  const getAdjustedVillaTotal = () => {
    if (!breakdown) return 0;
    let total = 0;
    breakdown.villa.details.forEach((detail, idx) => {
      const originalPrice = parseVillaPrice(detail);
      total += villaAdjustments[idx] !== undefined ? villaAdjustments[idx] : originalPrice;
    });
    return total;
  };

  // 조정된 차량 총액 계산
  const getAdjustedVehicleTotal = () => {
    if (!breakdown || !breakdown.vehicle.description) return breakdown?.vehicle.price || 0;
    const details = breakdown.vehicle.description.split(" | ");
    let total = 0;
    details.forEach((detail, idx) => {
      const originalPrice = parseVehiclePrice(detail);
      total += vehicleAdjustments[idx] !== undefined ? vehicleAdjustments[idx] : originalPrice;
    });
    return total;
  };

  // 조정된 전체 총액 계산
  const adjustedVillaTotal = breakdown ? getAdjustedVillaTotal() : 0;
  const villaAdjustment = breakdown ? adjustedVillaTotal - breakdown.villa.price : 0;
  const adjustedVehicleTotal = breakdown ? getAdjustedVehicleTotal() : 0;
  const vehicleAdjustment = breakdown ? adjustedVehicleTotal - breakdown.vehicle.price : 0;
  const adjustedGrandTotal = breakdown ? breakdown.total + villaAdjustment + vehicleAdjustment : 0;
  
  const finalTotal = adjustedGrandTotal;
  
  const formatLocalCurrency = (usd: number) => {
    if (currencyInfo.code === "USD") return `$ ${usd.toLocaleString()}`;
    const converted = Math.round(usd * exchangeRate);
    return `${currencyInfo.symbol} ${new Intl.NumberFormat(currencyInfo.locale).format(converted)}`;
  };

  const handleDownloadImage = async () => {
    if (!summaryRef.current || !breakdown) return;
    
    try {
      setIsCapturing(true);
      // 상태 변경이 반영될 시간을 충분히 줌
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(summaryRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          // 클론된 문서에서 모든 flex 컨테이너를 block으로 강제 변경
          const clonedElement = clonedDoc.querySelector('[data-quote-summary]');
          if (clonedElement) {
            const allDivs = clonedElement.querySelectorAll('div');
            allDivs.forEach((div: Element) => {
              const htmlDiv = div as HTMLElement;
              const style = window.getComputedStyle(div);
              if (style.display === 'flex' && style.flexDirection === 'column') {
                htmlDiv.style.display = 'block';
              }
            });
          }
        }
      });
      
      setIsCapturing(false);
      const image = canvas.toDataURL("image/png", 1.0);
      
      // 모바일 호환성을 위한 다운로드 방식
      const filename = `${t("file.quoteName")}_${new Date().getTime()}.png`;
      
      // Blob 방식으로 다운로드 (더 안정적)
      const byteCharacters = atob(image.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      setIsCapturing(false);
      console.error("Image capture error:", error);
      alert(language === "ko" ? "이미지 저장에 실패했습니다. 다시 시도해주세요." : "Failed to save image. Please try again.");
    }
  };

  if (isLoading && !breakdown) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 text-center bg-white/50 backdrop-blur-sm rounded-xl border border-dashed border-primary/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">{t("quote.calculating")}</p>
      </div>
    );
  }

  if (!breakdown) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 text-center bg-white/50 backdrop-blur-sm rounded-xl border border-dashed border-primary/20">
        <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-primary/40" />
        </div>
        <h3 className="text-lg font-medium text-foreground">{t("quote.ready")}</h3>
        <p className="text-muted-foreground mt-2 max-w-xs">
          {t("quote.readyDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="sticky top-6 space-y-4">
      <div ref={summaryRef} data-quote-summary>
        <Card className="overflow-hidden border-0 shadow-xl shadow-primary/5 bg-white">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-primary" />
          <CardHeader className="bg-primary/5 pb-6">
            <div className="flex items-start justify-between gap-4">
              {isCapturing ? (
                <table style={{ borderCollapse: 'collapse', border: 'none' }}>
                  <tbody>
                    <tr>
                      <td style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', padding: '0 0 6px 0', border: 'none' }}>
                        {t("quote.title")}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontSize: '28px', fontWeight: 'bold', color: '#4f46e5', padding: '0 0 8px 0', border: 'none', lineHeight: '1.2' }}>
                        ${finalTotal.toLocaleString()}
                      </td>
                    </tr>
                    {currencyInfo.code !== "USD" && (
                      <>
                        <tr>
                          <td style={{ fontSize: '14px', fontWeight: 600, color: '#6366f1', padding: '0 0 6px 0', border: 'none', lineHeight: '1.2' }}>
                            ≈ {formatLocalCurrency(finalTotal)}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ fontSize: '9px', color: '#6b7280', padding: '0', border: 'none', lineHeight: '1.2' }}>
                            {t("common.exchangeRate")}: {currencyInfo.symbol} {exchangeRate.toLocaleString()}/USD
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              ) : (
                <CardTitle className="flex flex-col gap-1 flex-1">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("quote.title")}
                  </span>
                  <span className="text-4xl text-primary font-bold leading-tight">
                    ${finalTotal.toLocaleString()}
                  </span>
                  {currencyInfo.code !== "USD" && (
                    <div className="flex flex-col gap-0.5 mt-1">
                      <span className="text-lg text-primary/70 font-semibold leading-tight">
                        ≈ {formatLocalCurrency(finalTotal)}
                      </span>
                      <span className="text-[10px] text-muted-foreground leading-tight">
                        {t("common.exchangeRate")}: {currencyInfo.symbol} {exchangeRate.toLocaleString()}/USD
                      </span>
                    </div>
                  )}
                </CardTitle>
              )}
              <div className="flex flex-col items-center gap-1.5">
                <img 
                  src={logoImage} 
                  alt="붕따우 도깨비" 
                  className="w-20 h-20 object-contain"
                />
                <div 
                  className="flex items-center gap-1"
                  style={isCapturing ? { display: 'flex', alignItems: 'center', gap: '4px' } : {}}
                >
                  <div 
                    className={`rounded p-1 text-center ${isCapturing ? '' : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'}`}
                    style={isCapturing ? { backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '4px', padding: '4px' } : {}}
                  >
                    <span 
                      className="text-[8px] font-medium text-amber-700 dark:text-amber-300 block"
                      style={isCapturing ? { fontSize: '8px', fontWeight: 500, color: '#b45309', display: 'block' } : {}}
                    >
                      {language === "ko" ? "예약금" : "Deposit"}
                    </span>
                    {isCapturing ? (
                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#92400e' }}>
                        ${(depositAmount ? parseInt(depositAmount) : Math.round(finalTotal * 0.5)).toLocaleString()}
                      </span>
                    ) : isAdmin ? (
                      <div className="flex items-center justify-center">
                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200">$</span>
                        <Input
                          type="number"
                          min="0"
                          value={depositAmount || Math.round(finalTotal * 0.5)}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="w-12 h-5 text-center font-bold text-[10px] bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-700 p-0.5"
                          data-testid="input-deposit-amount"
                        />
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200">
                        ${(depositAmount ? parseInt(depositAmount) : Math.round(finalTotal * 0.5)).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div 
                    className={`rounded p-1 text-center ${isCapturing ? '' : 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'}`}
                    style={isCapturing ? { backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '4px', padding: '4px' } : {}}
                  >
                    <span 
                      className="text-[8px] font-medium text-green-700 dark:text-green-300 block"
                      style={isCapturing ? { fontSize: '8px', fontWeight: 500, color: '#15803d', display: 'block' } : {}}
                    >
                      {language === "ko" ? "잔금" : "Balance"}
                    </span>
                    <span 
                      className="text-[10px] font-bold text-green-800 dark:text-green-200"
                      style={isCapturing ? { fontSize: '10px', fontWeight: 'bold', color: '#166534' } : {}}
                    >
                      ${(finalTotal - (depositAmount ? parseInt(depositAmount) : Math.round(finalTotal * 0.5))).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <AnimatePresence mode="wait">
              {breakdown.villa.price > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>{t("quote.villa")}{breakdown.villa.rooms && breakdown.villa.rooms > 0 ? ` (${breakdown.villa.rooms}룸)` : ""}</span>
                      <span>${adjustedVillaTotal.toLocaleString()}</span>
                    </div>
                    {breakdown.villa.checkIn && breakdown.villa.checkOut && (
                      <div className="text-xs text-primary font-medium pl-1">
                        {language === "ko" ? "체크인" : "Check-in"}: {breakdown.villa.checkIn} ~ {language === "ko" ? "체크아웃" : "Check-out"}: {breakdown.villa.checkOut}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground space-y-1.5 pl-1">
                      {breakdown.villa.details.map((detail, idx) => {
                        const originalPrice = parseVillaPrice(detail);
                        const currentPrice = villaAdjustments[idx] !== undefined ? villaAdjustments[idx] : originalPrice;
                        if (originalPrice === 0 && currentPrice === 0 && !detail.match(/\$/)) return null;
                        const dateMatch = detail.match(/^([^:]+):/);
                        const dateLabel = dateMatch ? dateMatch[1] : `Day ${idx + 1}`;
                        
                        return (
                          <div key={idx} className="flex items-center gap-2 flex-wrap">
                            <span className="w-1 h-1 rounded-full bg-primary/40" />
                            <span className="flex-1">{dateLabel}</span>
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {isCapturing ? (
                                  <span>${currentPrice}</span>
                                ) : isAdmin ? (
                                  <>
                                    $
                                    <input
                                      type="number"
                                      min="0"
                                      value={currentPrice === 0 ? '' : currentPrice}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const newVal = val === '' ? 0 : parseInt(val);
                                        setVillaAdjustments(prev => ({ ...prev, [idx]: newVal }));
                                      }}
                                      className="w-14 text-center text-xs font-medium bg-transparent border-b border-slate-300 dark:border-slate-600 focus:outline-none focus:border-primary"
                                      data-testid={`input-villa-price-${idx}`}
                                    />
                                  </>
                                ) : (
                                  <span>${currentPrice}</span>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <Separator className="bg-border/50" />
                </motion.div>
              )}

              {breakdown.vehicle.price > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>{t("quote.vehicle")}</span>
                      <span>${adjustedVehicleTotal.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 pl-1 italic">
                      {breakdown.vehicle.description.split(" | ").map((detail, idx) => {
                        const originalPrice = parseVehiclePrice(detail);
                        const currentPrice = vehicleAdjustments[idx] !== undefined ? vehicleAdjustments[idx] : originalPrice;
                        const textWithoutPrice = detail.replace(/\s*\$\d+/, "");
                        
                        return (
                          <div key={idx} className="flex items-center justify-between gap-2">
                            <p className="flex items-center gap-2 flex-1">
                              <span className="w-1 h-1 rounded-full bg-blue-500/40" />
                              <span>{textWithoutPrice}</span>
                            </p>
                            <div className="flex items-center gap-1">
                              {isCapturing ? (
                                <span className="text-xs font-medium">${currentPrice}</span>
                              ) : isAdmin ? (
                                <>
                                  <span className="text-xs">$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={currentPrice === 0 ? '' : currentPrice}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const newVal = val === '' ? 0 : parseInt(val);
                                      setVehicleAdjustments(prev => ({
                                        ...prev,
                                        [idx]: newVal
                                      }));
                                    }}
                                    className="w-14 text-right text-xs font-medium bg-transparent border-b border-slate-300 focus:border-blue-500 focus:outline-none"
                                    data-testid={`input-vehicle-price-${idx}`}
                                  />
                                </>
                              ) : (
                                <span className="text-xs font-medium">${currentPrice}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <Separator className="bg-border/50" />
                </motion.div>
              )}

              {breakdown.golf.price > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <div className="flex items-center gap-1">
                        <span>{t("quote.golf")}</span>
                        <span className="text-[9px] text-orange-600 dark:text-orange-400 font-normal">
                          ({language === "ko" ? "캐디팁 별도" : "Caddy tip extra"})
                        </span>
                      </div>
                      <span>${breakdown.golf.price}</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-2 pl-1 italic">
                      {breakdown.golf.description.split(" | ").map((round, idx) => {
                        const parts = round.split(" / ");
                        return (
                          <div key={idx} className="space-y-0.5">
                            {parts.map((part, pIdx) => (
                              <p key={pIdx} className="flex items-center gap-2">
                                <span className={`w-1 h-1 rounded-full ${pIdx === 0 ? 'bg-emerald-500' : 'bg-emerald-500/40'}`} />
                                {part}
                              </p>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <Separator className="bg-border/50" />
                </motion.div>
              )}

              {breakdown.ecoGirl.price > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>{t("quote.ecoGirl")}</span>
                      <span>${breakdown.ecoGirl.price}</span>
                    </div>
                    {breakdown.ecoGirl.details && breakdown.ecoGirl.details.length > 0 && (
                      <div className="text-xs text-muted-foreground space-y-1 pl-1">
                        {breakdown.ecoGirl.details.map((detail, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-pink-400/60" />
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Separator className="bg-border/50" />
                </motion.div>
              )}

              {breakdown.guide.price > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>{t("quote.guide")}</span>
                      <span>${breakdown.guide.price}</span>
                    </div>
                    <p className="text-xs text-muted-foreground italic pl-1">
                      {breakdown.guide.description}
                    </p>
                  </div>
                  <Separator className="bg-border/50" />
                </motion.div>
              )}

              {breakdown.fastTrack.price > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>{language === "ko" ? "패스트트랙" : language === "en" ? "Fast Track" : language === "zh" ? "快速通道" : language === "vi" ? "Fast Track" : language === "ru" ? "Фаст-трек" : language === "ja" ? "ファストトラック" : "패스트트랙"}</span>
                      <span>${breakdown.fastTrack.price}</span>
                    </div>
                    <p className="text-xs text-muted-foreground italic pl-1">
                      {breakdown.fastTrack.description}
                    </p>
                  </div>
                  <Separator className="bg-border/50" />
                </motion.div>
              )}

              {(breakdown as any).customCategories && (breakdown as any).customCategories.length > 0 && (breakdown as any).customCategories.map((cat: any) => (
                <motion.div
                  key={`custom-summary-${cat.categoryId}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>{cat.name}</span>
                      <span>${cat.subtotal.toLocaleString()}</span>
                    </div>
                    {cat.schedules && cat.schedules.length > 0 ? (
                      <div className="text-xs text-muted-foreground italic pl-1 space-y-0.5">
                        {cat.schedules.map((sched: any, idx: number) => (
                          <div key={idx}>
                            {sched.selectedOption ? `${sched.selectedOption} ` : ""}
                            ${sched.optionPrice || cat.pricePerUnit} × {sched.quantity}
                            {sched.date ? ` (${sched.date})` : ""}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic pl-1">
                        ${cat.pricePerUnit} × {cat.quantity}
                      </p>
                    )}
                  </div>
                  <Separator className="bg-border/50" />
                </motion.div>
              ))}
            </AnimatePresence>

            <div 
              className={`rounded-xl p-2.5 border space-y-1.5 ${isCapturing ? '' : 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800'}`}
              style={isCapturing ? { backgroundColor: '#ffffff', border: '1px solid #c7d2fe' } : {}}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <Label className="text-xs font-semibold text-indigo-900 dark:text-indigo-100">
                    {language === "ko" ? "인원수" : 
                     language === "en" ? "People" :
                     language === "zh" ? "人数" :
                     language === "vi" ? "Số người" :
                     language === "ru" ? "Чел." :
                     language === "ja" ? "人数" : "인원수"}
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  {isCapturing ? (
                    <span 
                      style={{ 
                        fontWeight: 'bold',
                        fontSize: '14px',
                        color: '#312e81'
                      }}
                    >
                      {personCount || "-"}
                    </span>
                  ) : (
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={personCount}
                      onChange={(e) => setPersonCount(e.target.value)}
                      placeholder=""
                      className="w-14 h-7 text-center font-bold text-sm bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-700"
                      data-testid="input-person-count"
                    />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {language === "ko" ? "명" : 
                     language === "en" ? "" :
                     language === "zh" ? "人" :
                     language === "vi" ? "" :
                     language === "ru" ? "" :
                     language === "ja" ? "名" : "명"}
                  </span>
                </div>
              </div>
              {personCount && parseInt(personCount) > 1 && (
                isCapturing ? (
                  <div style={{ paddingTop: '6px', borderTop: '1px solid #c7d2fe' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
                      <tbody>
                        <tr>
                          <td style={{ fontSize: '11px', fontWeight: 500, color: '#312e81', padding: '0', border: 'none', verticalAlign: 'top' }}>
                            {language === "ko" ? "1인당" : "Per Person"}
                          </td>
                          <td style={{ textAlign: 'right', padding: '0', border: 'none', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#4f46e5', lineHeight: '1.3' }}>
                              ${Math.round(finalTotal / parseInt(personCount)).toLocaleString()}
                            </div>
                            {currencyInfo.code !== "USD" && (
                              <div style={{ fontSize: '9px', color: '#6366f1', lineHeight: '1.3', marginTop: '2px' }}>
                                ≈ {formatLocalCurrency(Math.round(finalTotal / parseInt(personCount)))}
                              </div>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="pt-1.5 border-t border-indigo-200 dark:border-indigo-700">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-indigo-900 dark:text-indigo-100">
                        {language === "ko" ? "1인당" : 
                         language === "en" ? "Per Person" :
                         language === "zh" ? "人均" :
                         language === "vi" ? "Mỗi người" :
                         language === "ru" ? "На чел." :
                         language === "ja" ? "1人" : "1인당"}
                      </span>
                      <div className="text-right flex flex-col items-end">
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 leading-tight">
                          ${Math.round(finalTotal / parseInt(personCount)).toLocaleString()}
                        </span>
                        {currencyInfo.code !== "USD" && (
                          <span className="text-[10px] text-indigo-500 dark:text-indigo-300 leading-tight">
                            ≈ {formatLocalCurrency(Math.round(finalTotal / parseInt(personCount)))}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 space-y-1">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                {t("quote.note")}
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-bold text-amber-900 dark:text-amber-100">
                  {language === "ko" ? "주의사항" : 
                   language === "en" ? "Notice" :
                   language === "zh" ? "注意事项" :
                   language === "vi" ? "Lưu ý" :
                   language === "ru" ? "Примечание" :
                   language === "ja" ? "注意事項" : "주의사항"}
                </span>
              </div>
              <div className="text-[10px] text-amber-800 dark:text-amber-200 space-y-2 leading-relaxed">
                <p>• {language === "ko" ? "저녁 10시 이후에는 소음을 자제해 주세요" : "Please keep noise to a minimum after 10 PM"}</p>
                <p>• {language === "ko" ? "주방기기 및 식기 사용 후 깨끗히 씻어서 보관해 주세요. 미세척시 30만동~50만동의 금액이 발생 할 수 있습니다." : "Please clean kitchenware after use. Cleaning fee 300,000-500,000 VND if not cleaned."}</p>
                <p>• {language === "ko" ? "체크아웃 지연시 시간당 25만동~60만동의 요금이 발생 할 수 있습니다. 오후 6시 이후 체크아웃 시 1박으로 계산" : "Late checkout: 250,000-600,000 VND/hour. After 6 PM counts as additional night."}</p>
                <p>• {language === "ko" ? "임대료에는 방청소(침실,수건)는 포함되어 있으나, 바베큐 청소 및 설거지 비용이 포함되어 있지 않습니다." : "Room cleaning included. BBQ cleaning and dishwashing not included."}</p>
                <p>• {language === "ko" ? "신분증(여권) 지참 후 체크인 부탁 드립니다." : "Please bring ID/passport for check-in."}</p>
                <p>• {language === "ko" ? "취소 시 현지 사정상 예약금은 환불 불가 합니다." : "Deposit is non-refundable upon cancellation."}</p>
              </div>
            </div>

            <div 
              className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700 text-center space-y-1"
              style={isCapturing ? { paddingTop: '16px', marginTop: '16px', borderTop: '1px solid #e2e8f0', textAlign: 'center' } : {}}
            >
              <span 
                className="text-sm font-bold text-slate-700 dark:text-slate-200 block"
                style={isCapturing ? { fontSize: '14px', fontWeight: 'bold', color: '#334155', display: 'block' } : {}}
              >
                붕따우 도깨비
              </span>
              <div 
                className="text-[11px] text-muted-foreground space-y-0.5"
                style={isCapturing ? { fontSize: '11px', color: '#64748b' } : {}}
              >
                <div style={isCapturing ? { marginBottom: '2px' } : {}}>📞 089.932.6273</div>
                <div style={isCapturing ? { marginBottom: '2px' } : {}}>💬 카카오톡 ID: vungtau</div>
                <div>🌐 vungtau.blog</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="sticky bottom-0 left-0 right-0 z-50 bg-background pt-3 pb-3 border-t border-slate-200 dark:border-slate-700 -mx-4 px-4 mt-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
        <div className="flex gap-2">
          <Button 
            className={`${isAuthenticated ? "flex-1" : "w-full"} h-12 text-base font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]`}
            onClick={handleDownloadImage}
            disabled={!breakdown || isCapturing}
            data-testid="button-save-quote"
          >
            {isCapturing ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Save className="mr-2 h-5 w-5" />
            )}
            {t("quote.save")}
          </Button>
          {isAuthenticated && (
            <Button 
              className="flex-1 h-12 text-base font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] bg-green-600 hover:bg-green-700"
              onClick={onSave}
              disabled={!breakdown || isSaving}
              data-testid="button-save-data"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <FileText className="mr-2 h-5 w-5" />
              )}
              {language === "ko" ? "데이터 저장" : "Save Data"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
