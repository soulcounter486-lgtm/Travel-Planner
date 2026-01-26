import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, FileText, Calendar, DollarSign, Trash2 } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { useQuotes } from "@/hooks/use-quotes";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { type QuoteBreakdown } from "@shared/schema";

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

  const formatLocalCurrency = (usd: number) => {
    if (currencyInfo.code === "USD") return `$ ${usd.toLocaleString()}`;
    const converted = Math.round(usd * exchangeRate);
    return `${currencyInfo.symbol} ${new Intl.NumberFormat(currencyInfo.locale).format(converted)}`;
  };

  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/quotes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
  });

  if (!quotes || quotes.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4 rounded-2xl border-slate-200 dark:border-slate-700 shadow-lg">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover-elevate rounded-t-2xl">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>{language === "ko" ? "저장된 견적서" : "Saved Quotes"}</span>
                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                  {quotes.length}
                </span>
              </div>
              {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                {language === "ko" ? "로딩 중..." : "Loading..."}
              </div>
            ) : (
              quotes.map((quote) => {
                const breakdown = quote.breakdown as QuoteBreakdown;
                return (
                  <div
                    key={quote.id}
                    className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
                    data-testid={`quote-item-${quote.id}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {quote.customerName}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          {quote.createdAt ? format(new Date(quote.createdAt), "yyyy-MM-dd HH:mm") : "-"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-bold text-primary text-lg flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {quote.totalPrice.toLocaleString()}
                          </div>
                          {currencyInfo.code !== "USD" && (
                            <div className="text-xs text-muted-foreground">
                              ≈ {formatLocalCurrency(quote.totalPrice)}
                            </div>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => deleteQuoteMutation.mutate(quote.id)}
                          disabled={deleteQuoteMutation.isPending}
                          data-testid={`button-delete-quote-${quote.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground space-y-1 border-t border-slate-200 dark:border-slate-600 pt-2 mt-2">
                      {breakdown?.villa?.price > 0 && (
                        <div className="flex justify-between">
                          <span>{language === "ko" ? "풀빌라" : "Villa"}</span>
                          <span>${breakdown.villa.price.toLocaleString()}</span>
                        </div>
                      )}
                      {breakdown?.villa?.checkIn && breakdown?.villa?.checkOut && (
                        <div className="text-primary/70 text-[10px]">
                          {breakdown.villa.checkIn} ~ {breakdown.villa.checkOut}
                        </div>
                      )}
                      {breakdown?.vehicle?.price > 0 && (
                        <div className="flex justify-between">
                          <span>{language === "ko" ? "차량" : "Vehicle"}</span>
                          <span>${breakdown.vehicle.price.toLocaleString()}</span>
                        </div>
                      )}
                      {breakdown?.golf?.price > 0 && (
                        <div className="flex justify-between">
                          <span>{language === "ko" ? "골프" : "Golf"}</span>
                          <span>${breakdown.golf.price.toLocaleString()}</span>
                        </div>
                      )}
                      {breakdown?.guide?.price > 0 && (
                        <div className="flex justify-between">
                          <span>{language === "ko" ? "가이드" : "Guide"}</span>
                          <span>${breakdown.guide.price.toLocaleString()}</span>
                        </div>
                      )}
                      {breakdown?.fastTrack?.price > 0 && (
                        <div className="flex justify-between">
                          <span>{language === "ko" ? "패스트트랙" : "Fast Track"}</span>
                          <span>${breakdown.fastTrack.price.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
