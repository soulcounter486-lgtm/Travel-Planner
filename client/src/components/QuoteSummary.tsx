import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Info, Save } from "lucide-react";
import { type QuoteBreakdown } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import { useRef } from "react";
import { useLanguage } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";

interface QuoteSummaryProps {
  breakdown: QuoteBreakdown | null;
  isLoading: boolean;
  onSave: () => void;
  isSaving: boolean;
}

export function QuoteSummary({ breakdown, isLoading, onSave, isSaving }: QuoteSummaryProps) {
  const { t } = useLanguage();
  const summaryRef = useRef<HTMLDivElement>(null);

  const { data: exchangeRateData } = useQuery<{ rate: number; timestamp: number }>({
    queryKey: ["/api/exchange-rate"],
    staleTime: 12 * 60 * 60 * 1000,
  });
  const exchangeRate = exchangeRateData?.rate || 1350;
  const formatKRW = (usd: number) => {
    const krw = Math.round(usd * exchangeRate);
    return new Intl.NumberFormat("ko-KR").format(krw);
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
            <CardTitle className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">{t("quote.title")}</span>
              <span className="text-4xl text-primary font-bold">
                ${breakdown.total.toLocaleString()}
              </span>
              <span className="text-xl text-primary/70 font-semibold">
                ≈ ₩{formatKRW(breakdown.total)}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {t("common.exchangeRate")}: ₩{exchangeRate.toLocaleString()}/USD
              </span>
            </CardTitle>
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
                      <span>${breakdown.villa.price}</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5 pl-1">
                      {breakdown.villa.details.map((detail, idx) => (
                        <p key={idx} className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-primary/40" />
                          {detail}
                        </p>
                      ))}
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
                    <p className="text-xs text-muted-foreground leading-relaxed italic pl-1">
                      {breakdown.vehicle.description}
                    </p>
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
                    <div className="text-xs text-muted-foreground space-y-0.5 pl-1 italic">
                      {breakdown.golf.description.split(" | ").map((detail, idx) => (
                        <p key={idx} className="flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-emerald-500/40" />
                          {detail}
                        </p>
                      ))}
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
            </AnimatePresence>

            <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                {t("quote.note")}
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
