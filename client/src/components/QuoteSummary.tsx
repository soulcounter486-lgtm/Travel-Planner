import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Info, Save } from "lucide-react";
import { type QuoteBreakdown } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import { useRef } from "react";

interface QuoteSummaryProps {
  breakdown: QuoteBreakdown | null;
  isLoading: boolean;
  onSave: () => void;
  isSaving: boolean;
}

export function QuoteSummary({ breakdown, isLoading, onSave, isSaving }: QuoteSummaryProps) {
  const summaryRef = useRef<HTMLDivElement>(null);

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
      link.download = `붕따우_도깨비_견적서_${new Date().getTime()}.png`;
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
        <p className="text-muted-foreground">견적을 계산하고 있습니다...</p>
      </div>
    );
  }

  if (!breakdown) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-12 text-center bg-white/50 backdrop-blur-sm rounded-xl border border-dashed border-primary/20">
        <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-primary/40" />
        </div>
        <h3 className="text-lg font-medium text-foreground">준비되셨나요?</h3>
        <p className="text-muted-foreground mt-2 max-w-xs">
          왼쪽 옵션을 조정하여 맞춤 여행 견적을 실시간으로 확인하세요.
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
              <span className="text-sm font-medium text-muted-foreground">예상 견적 금액</span>
              <span className="text-4xl text-primary font-bold">
                ${breakdown.total.toLocaleString()}
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
                      <span>풀빌라 숙박</span>
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
                      <span>차량 서비스</span>
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
                      <span>골프 라운딩</span>
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
                      <span>에코 가이드</span>
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
                      <span>한국어 가이드</span>
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
                실제 가격은 현지 상황에 따라 다를 수 있습니다.
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
        견적서 저장
      </Button>
    </div>
  );
}
