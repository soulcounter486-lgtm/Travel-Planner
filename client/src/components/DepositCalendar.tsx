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
                  <div className="space-y-2">
                    {selectedQuotes.map(quote => (
                      <div
                        key={quote.id}
                        className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800"
                      >
                        <p className="font-medium text-green-800 dark:text-green-200">
                          {quote.customerName}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          ${quote.totalPrice.toLocaleString()}
                        </p>
                        {quote.checkInDate && quote.checkOutDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {quote.checkInDate} ~ {quote.checkOutDate}
                          </p>
                        )}
                      </div>
                    ))}
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
