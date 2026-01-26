import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, FileText, Calendar, DollarSign, Trash2, Download, ChevronRight } from "lucide-react";
import { useState, useRef } from "react";
import { useLanguage } from "@/lib/i18n";
import { useQuotes } from "@/hooks/use-quotes";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { type QuoteBreakdown, type Quote } from "@shared/schema";
import { toPng } from "html-to-image";

interface QuoteItemProps {
  quote: Quote;
  language: string;
  currencyInfo: { code: string; symbol: string; locale: string };
  exchangeRate: number;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}

function QuoteItem({ quote, language, currencyInfo, exchangeRate, onDelete, isDeleting }: QuoteItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const breakdown = quote.breakdown as QuoteBreakdown;

  const formatLocalCurrency = (usd: number) => {
    if (currencyInfo.code === "USD") return `$ ${usd.toLocaleString()}`;
    const converted = Math.round(usd * exchangeRate);
    return `${currencyInfo.symbol} ${new Intl.NumberFormat(currencyInfo.locale).format(converted)}`;
  };

  const handleDownloadImage = async () => {
    if (!detailRef.current) return;
    try {
      const dataUrl = await toPng(detailRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        style: {
          padding: "16px",
        },
      });
      const link = document.createElement("a");
      link.download = `quote-${quote.customerName}-${format(new Date(), "yyyyMMdd")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  return (
    <div
      className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
      data-testid={`quote-item-${quote.id}`}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 cursor-pointer hover-elevate">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                {quote.customerName}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-bold text-primary">
                ${quote.totalPrice.toLocaleString()}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(quote.id);
                }}
                disabled={isDeleting}
                data-testid={`button-delete-quote-${quote.id}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-slate-200 dark:border-slate-600 p-3 space-y-3">
            <div 
              ref={detailRef}
              className="bg-white dark:bg-slate-900 rounded-lg p-4 space-y-3"
            >
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 text-lg">
                    {quote.customerName}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {quote.createdAt ? format(new Date(quote.createdAt), "yyyy-MM-dd HH:mm") : "-"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary text-xl flex items-center gap-1">
                    <DollarSign className="w-5 h-5" />
                    {quote.totalPrice.toLocaleString()}
                  </div>
                  {currencyInfo.code !== "USD" && (
                    <div className="text-sm text-muted-foreground">
                      ≈ {formatLocalCurrency(quote.totalPrice)}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                {breakdown?.villa?.price > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{language === "ko" ? "풀빌라" : "Villa"}</span>
                    <span className="font-medium">${breakdown.villa.price.toLocaleString()}</span>
                  </div>
                )}
                {breakdown?.villa?.checkIn && breakdown?.villa?.checkOut && (
                  <div className="text-xs text-primary/70 ml-4">
                    {breakdown.villa.checkIn} ~ {breakdown.villa.checkOut}
                  </div>
                )}
                {breakdown?.vehicle?.price > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{language === "ko" ? "차량" : "Vehicle"}</span>
                    <span className="font-medium">${breakdown.vehicle.price.toLocaleString()}</span>
                  </div>
                )}
                {breakdown?.golf?.price > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{language === "ko" ? "골프" : "Golf"}</span>
                    <span className="font-medium">${breakdown.golf.price.toLocaleString()}</span>
                  </div>
                )}
                {breakdown?.guide?.price > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{language === "ko" ? "가이드" : "Guide"}</span>
                    <span className="font-medium">${breakdown.guide.price.toLocaleString()}</span>
                  </div>
                )}
                {breakdown?.fastTrack?.price > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{language === "ko" ? "패스트트랙" : "Fast Track"}</span>
                    <span className="font-medium">${breakdown.fastTrack.price.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleDownloadImage}
              className="w-full"
              variant="outline"
              data-testid={`button-download-quote-${quote.id}`}
            >
              <Download className="w-4 h-4 mr-2" />
              {language === "ko" ? "이미지 다운로드" : "Download Image"}
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function SavedQuotesList() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const { data: quotes, isLoading } = useQuotes();
  const queryClient = useQueryClient();

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

  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/quotes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
  });

  const quoteCount = quotes?.length || 0;

  return (
    <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-lg bg-background relative z-0">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover-elevate rounded-t-2xl bg-background">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>{language === "ko" ? "저장된 견적서" : "Saved Quotes"}</span>
                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                  {quoteCount}
                </span>
              </div>
              {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-2 max-h-80 overflow-y-auto bg-background rounded-b-2xl">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                {language === "ko" ? "로딩 중..." : "Loading..."}
              </div>
            ) : quoteCount === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                {language === "ko" ? "저장된 견적서가 없습니다.\n견적서를 저장하면 여기에 표시됩니다." : "No saved quotes.\nSaved quotes will appear here."}
              </div>
            ) : (
              quotes?.map((quote) => (
                <QuoteItem
                  key={quote.id}
                  quote={quote}
                  language={language}
                  currencyInfo={currencyInfo}
                  exchangeRate={exchangeRate}
                  onDelete={(id) => deleteQuoteMutation.mutate(id)}
                  isDeleting={deleteQuoteMutation.isPending}
                />
              ))
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
