import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { WeatherWidget } from "@/components/WeatherWidget";
import { ExchangeRateWidget } from "@/components/ExchangeRateWidget";
import { useQuery } from "@tanstack/react-query";
import { LogIn, LogOut } from "lucide-react";
import logoImg from "@assets/BackgroundEraser_20240323_103507859_1768275315346.png";

interface ExchangeRates {
  rates: {
    KRW: number;
    VND: number;
    CNY: number;
    RUB: number;
    JPY: number;
  };
  lastUpdated: string;
}

export function AppHeader() {
  const { t, language } = useLanguage();
  const { isAuthenticated, logout, isLoading: isAuthLoading } = useAuth();

  const { data: exchangeRatesData } = useQuery<ExchangeRates>({
    queryKey: ["/api/exchange-rates"],
  });

  return (
    <div className="relative bg-white border-b border-border/40">
      <div className="absolute inset-0 bg-primary/5" />
      <div className="container mx-auto px-4 py-3 relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl flex items-center gap-3">
          <div className="flex flex-col items-center shrink-0">
            <a 
              href="/vungtau-dokkaebi.apk" 
              download="붕따우_도깨비.apk"
              className="cursor-pointer hover:scale-105 transition-transform flex flex-col items-center"
              data-testid="btn-download-apk"
            >
              <img src={logoImg} alt={t("header.title")} className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md" />
              <div className="flex flex-col items-center animate-bounce">
                <span className="text-[8px] text-primary font-medium whitespace-nowrap">↑ 앱 다운로드</span>
              </div>
            </a>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-sm sm:text-lg font-display font-bold text-primary mb-1 leading-tight">
                <span className="whitespace-nowrap">{t("header.title")}</span><br />
                <span className="whitespace-nowrap text-xs sm:text-base">{language === "ko" ? "실시간 여행견적" : "Live Travel Quote"}</span>
              </h1>
              {isAuthLoading ? null : isAuthenticated ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => logout()}
                  className="shrink-0 rounded-full h-6 px-2 text-[10px]"
                  data-testid="button-logout"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  {language === "ko" ? "로그아웃" : "Logout"}
                </Button>
              ) : (
                <div className="flex items-center gap-1">
                  <a href="/api/auth/kakao" data-testid="button-login-kakao">
                    <Button
                      size="sm"
                      className="shrink-0 rounded-full h-6 px-2 text-[10px] bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] border-0"
                    >
                      <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3C6.477 3 2 6.463 2 10.714c0 2.683 1.74 5.028 4.348 6.385-.19.71-.69 2.576-.788 2.976-.12.49.18.483.379.352.156-.103 2.484-1.69 3.502-2.378.85.126 1.723.192 2.559.192 5.523 0 10-3.463 10-7.714C22 6.463 17.523 3 12 3z"/>
                      </svg>
                      카카오
                    </Button>
                  </a>
                  <a href="/api/login" data-testid="button-login">
                    <Button
                      size="sm"
                      variant="default"
                      className="shrink-0 rounded-full h-6 px-2 text-[10px]"
                    >
                      <LogIn className="w-3 h-3 mr-1" />
                      Replit
                    </Button>
                  </a>
                </div>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-light leading-relaxed line-clamp-1">{t("header.description")}</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-2 flex items-center gap-2">
          <WeatherWidget language={language} />
          <ExchangeRateWidget language={language} rates={exchangeRatesData?.rates} />
        </motion.div>
      </div>
    </div>
  );
}
