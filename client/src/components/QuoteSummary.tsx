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

interface QuoteSummaryProps {
  breakdown: QuoteBreakdown | null;
  isLoading: boolean;
  onSave: () => void;
  isSaving: boolean;
}

export function QuoteSummary({ breakdown, isLoading, onSave, isSaving }: QuoteSummaryProps) {
  const { t, language } = useLanguage();
  const summaryRef = useRef<HTMLDivElement>(null);
  const [personCount, setPersonCount] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<string>("");
  const [villaAdjustments, setVillaAdjustments] = useState<Record<number, number>>({});
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

  // 조정된 전체 총액 계산
  const adjustedVillaTotal = breakdown ? getAdjustedVillaTotal() : 0;
  const villaAdjustment = breakdown ? adjustedVillaTotal - breakdown.villa.price : 0;
  const adjustedGrandTotal = breakdown ? breakdown.total + villaAdjustment : 0;
  
  const discountRate = parseFloat(discountPercent) || 0;
  const finalTotal = adjustedGrandTotal;
  const discountedTotal = Math.round(finalTotal * (1 - discountRate / 100));
  
  const formatLocalCurrency = (usd: number) => {
    if (currencyInfo.code === "USD") return `$${usd.toLocaleString()}`;
    const converted = Math.round(usd * exchangeRate);
    return `${currencyInfo.symbol}${new Intl.NumberFormat(currencyInfo.locale).format(converted)}`;
  };

  const handleDownloadImage = async () => {
    if (!summaryRef.current || !breakdown) return;
    
    try {
      const canvas = await html2canvas(summaryRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.download = `${t("file.quoteName")}_${new Date().getTime()}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error("Image capture error:", error);
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
      <div ref={summaryRef}>
        <Card className="overflow-hidden border-0 shadow-xl shadow-primary/5 bg-white">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-primary" />
          <CardHeader className="bg-primary/5 pb-6">
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="flex flex-col gap-1 flex-1">
                <span className="text-sm font-medium text-muted-foreground">{t("quote.title")}</span>
                {discountRate > 0 ? (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      ${finalTotal.toLocaleString()}
                    </span>
                    <span className="text-4xl text-primary font-bold">
                      ${discountedTotal.toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="text-4xl text-primary font-bold">
                    ${finalTotal.toLocaleString()}
                  </span>
                )}
                {currencyInfo.code !== "USD" && (
                  <>
                    <span className="text-xl text-primary/70 font-semibold">
                      ≈ {formatLocalCurrency(discountRate > 0 ? discountedTotal : finalTotal)}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {t("common.exchangeRate")}: {currencyInfo.symbol}{exchangeRate.toLocaleString()}/USD
                    </span>
                  </>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-green-700 dark:text-green-400">
                    {language === "ko" ? "할인" : "Discount"}
                  </span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    placeholder="0"
                    className="w-14 h-7 text-center text-sm font-bold bg-white dark:bg-slate-800 border-green-300 dark:border-green-700"
                    data-testid="input-discount-percent"
                  />
                  <span className="text-xs text-green-700 dark:text-green-400">%</span>
                </div>
              </CardTitle>
              <img 
                src={logoImage} 
                alt="붕따우 도깨비" 
                className="w-20 h-20 object-contain"
              />
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
                      <span>{t("quote.villa")}</span>
                      <span className={villaAdjustment !== 0 ? "text-orange-600" : ""}>
                        ${adjustedVillaTotal.toLocaleString()}
                        {villaAdjustment !== 0 && (
                          <span className="text-xs ml-1">
                            ({villaAdjustment > 0 ? "+" : ""}{villaAdjustment})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1.5 pl-1">
                      {breakdown.villa.details.map((detail, idx) => {
                        const originalPrice = parseVillaPrice(detail);
                        const currentPrice = villaAdjustments[idx] !== undefined ? villaAdjustments[idx] : originalPrice;
                        const dateMatch = detail.match(/^([^:]+):/);
                        const dateLabel = dateMatch ? dateMatch[1] : `Day ${idx + 1}`;
                        
                        return (
                          <div key={idx} className="flex items-center gap-2 flex-wrap">
                            <span className="w-1 h-1 rounded-full bg-primary/40" />
                            <span className="flex-1">{dateLabel}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">$</span>
                              <Input
                                type="number"
                                min="0"
                                value={currentPrice}
                                onChange={(e) => {
                                  const newVal = parseInt(e.target.value) || 0;
                                  setVillaAdjustments(prev => ({ ...prev, [idx]: newVal }));
                                }}
                                className="w-16 h-6 text-center text-xs font-medium bg-white dark:bg-slate-800 border-orange-200 dark:border-orange-700"
                                data-testid={`input-villa-price-${idx}`}
                              />
                              {villaAdjustments[idx] !== undefined && villaAdjustments[idx] !== originalPrice && (
                                <span className="text-[10px] text-orange-500">
                                  (${originalPrice})
                                </span>
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
                      <span>${breakdown.vehicle.price}</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5 pl-1 italic">
                      {breakdown.vehicle.description.split(" | ").map((detail, idx) => (
                        <p key={idx} className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-blue-500/40" />
                          {detail}
                        </p>
                      ))}
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
                      <span>{t("quote.golf")}</span>
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
                    <p className="text-xs text-muted-foreground italic pl-1">
                      {breakdown.ecoGirl.description}
                    </p>
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
            </AnimatePresence>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl p-4 border border-indigo-200 dark:border-indigo-800 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <Label className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                  {language === "ko" ? "인원수" : 
                   language === "en" ? "Number of People" :
                   language === "zh" ? "人数" :
                   language === "vi" ? "Số người" :
                   language === "ru" ? "Количество человек" :
                   language === "ja" ? "人数" : "인원수"}
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={personCount}
                  onChange={(e) => setPersonCount(e.target.value)}
                  placeholder=""
                  className="w-20 h-10 text-center font-bold text-lg bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-700"
                  data-testid="input-person-count"
                />
                <span className="text-sm text-muted-foreground">
                  {language === "ko" ? "명" : 
                   language === "en" ? "people" :
                   language === "zh" ? "人" :
                   language === "vi" ? "người" :
                   language === "ru" ? "чел." :
                   language === "ja" ? "名" : "명"}
                </span>
              </div>
              {personCount && parseInt(personCount) > 1 && (
                <div className="pt-2 border-t border-indigo-200 dark:border-indigo-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                      {language === "ko" ? "1인당 경비" : 
                       language === "en" ? "Per Person" :
                       language === "zh" ? "人均费用" :
                       language === "vi" ? "Chi phí/người" :
                       language === "ru" ? "На человека" :
                       language === "ja" ? "1人あたり" : "1인당 경비"}
                    </span>
                    <div className="text-right">
                      <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        ${Math.round((discountRate > 0 ? discountedTotal : breakdown.total) / parseInt(personCount)).toLocaleString()}
                      </div>
                      {currencyInfo.code !== "USD" && (
                        <div className="text-sm text-indigo-500 dark:text-indigo-300">
                          ≈ {formatLocalCurrency(Math.round((discountRate > 0 ? discountedTotal : breakdown.total) / parseInt(personCount)))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 space-y-1">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                {t("quote.note")}
              </div>
              <div className="text-[10px] text-primary font-semibold flex items-center gap-1 pl-4">
                • {t("quote.actualLower")}
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
          </CardContent>
        </Card>
      </div>

      <Button 
        className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" 
        onClick={handleDownloadImage}
        disabled={!breakdown}
      >
        <Save className="mr-2 h-6 w-6" />
        {t("quote.save")}
      </Button>
    </div>
  );
}
