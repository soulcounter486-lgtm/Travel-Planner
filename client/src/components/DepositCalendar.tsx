import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n";
import { type Quote } from "@shared/schema";
import { format, parseISO, isWithinInterval, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";

export function DepositCalendar() {
  const { language } = useLanguage();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const { data: adminCheck } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
  });
  const isAdmin = adminCheck?.isAdmin || false;

  const { data: depositPaidQuotes } = useQuery<Quote[]>({
    queryKey: ["/api/quotes/deposit-paid"],
    enabled: isAdmin,
  });

  if (!isAdmin) return null;

  const getQuotesForDate = (date: Date) => {
    if (!depositPaidQuotes) return [];
    return depositPaidQuotes.filter(quote => {
      if (!quote.checkInDate || !quote.checkOutDate) return false;
      try {
        const checkIn = startOfDay(parseISO(quote.checkInDate));
        const checkOut = startOfDay(parseISO(quote.checkOutDate));
        const targetDate = startOfDay(date);
        return isWithinInterval(targetDate, { start: checkIn, end: checkOut });
      } catch {
        return false;
      }
    });
  };

  const hasQuotes = (date: Date) => getQuotesForDate(date).length > 0;

  const selectedQuotes = selectedDate ? getQuotesForDate(selectedDate) : [];

  return (
    <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-lg bg-background">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="w-5 h-5 text-green-500" />
          <span>{language === "ko" ? "예약 일정 (입금완료)" : "Booking Schedule (Paid)"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={language === "ko" ? ko : undefined}
            className="rounded-md border"
            modifiers={{
              booked: (date) => hasQuotes(date),
            }}
            modifiersClassNames={{
              booked: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold",
            }}
          />
          <div className="flex-1 min-w-0">
            {selectedDate && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {format(selectedDate, language === "ko" ? "yyyy년 M월 d일" : "MMM d, yyyy")}
                </p>
                {selectedQuotes.length > 0 ? (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {selectedQuotes.map(quote => {
                      const breakdown = quote.breakdown as any;
                      return (
                        <div
                          key={quote.id}
                          className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-medium text-green-800 dark:text-green-200">
                              {quote.customerName}
                            </p>
                            <p className="text-sm font-bold text-green-600 dark:text-green-400">
                              ${quote.totalPrice.toLocaleString()}
                            </p>
                          </div>
                          {quote.checkInDate && quote.checkOutDate && (
                            <p className="text-xs text-muted-foreground mb-1">
                              {quote.checkInDate} ~ {quote.checkOutDate}
                            </p>
                          )}
                          
                          <div className="flex gap-3 text-xs mb-2">
                            <div className="flex items-center gap-1">
                              <span className="text-orange-600 dark:text-orange-400 font-medium">
                                {language === "ko" ? "예약금" : "Deposit"}:
                              </span>
                              <span className="text-orange-700 dark:text-orange-300 font-bold">
                                ${(quote.depositAmount || Math.round(quote.totalPrice * 0.5)).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-blue-600 dark:text-blue-400 font-medium">
                                {language === "ko" ? "잔금" : "Balance"}:
                              </span>
                              <span className="text-blue-700 dark:text-blue-300 font-bold">
                                ${(quote.totalPrice - (quote.depositAmount || Math.round(quote.totalPrice * 0.5))).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-xs border-t border-green-200 dark:border-green-700 pt-2 mt-2">
                            {breakdown?.villa?.price > 0 && (
                              <div>
                                <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300">
                                  <span>{language === "ko" ? "풀빌라" : "Villa"}</span>
                                  <span>${breakdown.villa.price.toLocaleString()}</span>
                                </div>
                                {breakdown.villa.details?.length > 0 && (
                                  <div className="text-[10px] text-muted-foreground pl-2 mt-1">
                                    {breakdown.villa.details.map((detail: string, idx: number) => (
                                      <div key={idx} className="flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-green-400" />
                                        <span>{detail}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {breakdown?.vehicle?.price > 0 && (
                              <div>
                                <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300">
                                  <span>{language === "ko" ? "차량" : "Vehicle"}</span>
                                  <span>${breakdown.vehicle.price.toLocaleString()}</span>
                                </div>
                                {breakdown.vehicle.description && (
                                  <div className="text-[10px] text-muted-foreground pl-2 mt-1">
                                    {breakdown.vehicle.description.split(" | ").map((detail: string, idx: number) => (
                                      <div key={idx} className="flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-green-400" />
                                        <span>{detail}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {breakdown?.golf?.price > 0 && (
                              <div>
                                <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300">
                                  <span>{language === "ko" ? "골프" : "Golf"}</span>
                                  <span>${breakdown.golf.price.toLocaleString()}</span>
                                </div>
                                {breakdown.golf.description && (
                                  <div className="text-[10px] text-muted-foreground pl-2 mt-1 space-y-1">
                                    {breakdown.golf.description.split(" | ").map((detail: string, idx: number) => {
                                      const parts = detail.split(" / ");
                                      const date = parts[0] || "";
                                      const courseName = parts[1] || "";
                                      const priceInfo = parts[2] || "";
                                      const tipMatch = priceInfo.match(/캐디팁: ([^)]+)/);
                                      const caddyTip = tipMatch ? tipMatch[1] : "";
                                      const subtotalMatch = priceInfo.match(/= \$(\d+)/);
                                      const subtotal = subtotalMatch ? subtotalMatch[1] : "";
                                      
                                      return (
                                        <div key={idx} className="border-l-2 border-green-300 pl-2 py-0.5">
                                          <div className="font-medium">{date}</div>
                                          <div>{courseName} - ${subtotal}</div>
                                          {caddyTip && (
                                            <div className="text-amber-600 dark:text-amber-400">
                                              {language === "ko" ? "캐디팁" : "Caddy"}: {caddyTip}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {breakdown?.guide?.price > 0 && (
                              <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300">
                                <span>{language === "ko" ? "가이드" : "Guide"}</span>
                                <span>${breakdown.guide.price.toLocaleString()}</span>
                              </div>
                            )}
                            
                            {breakdown?.ecoGirl?.price > 0 && (
                              <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300">
                                <span>{language === "ko" ? "에코걸" : "Eco Girl"}</span>
                                <span>${breakdown.ecoGirl.price.toLocaleString()}</span>
                              </div>
                            )}
                            
                            {breakdown?.fastTrack?.price > 0 && (
                              <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300">
                                <span>{language === "ko" ? "패스트트랙" : "Fast Track"}</span>
                                <span>${breakdown.fastTrack.price.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                          
                          {quote.memo && (
                            <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-700">
                              <p className="text-[10px] text-muted-foreground">
                                <span className="font-medium">{language === "ko" ? "메모" : "Memo"}:</span> {quote.memo}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {language === "ko" ? "예약 없음" : "No bookings"}
                  </p>
                )}
              </div>
            )}
            {!selectedDate && (
              <p className="text-sm text-muted-foreground">
                {language === "ko" ? "날짜를 선택하면 예약 정보를 볼 수 있습니다" : "Select a date to view bookings"}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
