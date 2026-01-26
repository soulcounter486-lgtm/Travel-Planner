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
      <div className="container mx-auto px-4 py-8 sm:py-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl flex items-center gap-4 sm:gap-6">
          <div className="flex flex-col items-center shrink-0">
            <a 
              href="/vungtau-dokkaebi.apk" 
              download="붕따우_도깨비.apk"
              className="cursor-pointer hover:scale-105 transition-transform flex flex-col items-center"
              data-testid="btn-download-apk"
            >
              <img src={logoImg} alt={t("header.title")} className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 object-contain drop-shadow-md" />
              <div className="flex flex-col items-center mt-1 animate-bounce">
                <span className="text-[9px] sm:text-[10px] text-primary font-medium whitespace-nowrap">↑ 앱 다운로드</span>
              </div>
            </a>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-base sm:text-2xl md:text-3xl font-display font-bold text-primary mb-2 sm:mb-3 leading-tight">
                <span className="whitespace-nowrap">{t("header.title")}</span><br />
                <span className="whitespace-nowrap text-sm sm:text-xl md:text-2xl">{language === "ko" ? "실시간 여행견적" : "Live Travel Quote"}</span>
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
                <a href="/api/login" data-testid="button-login">
                  <Button
                    size="sm"
                    variant="default"
                    className="shrink-0 rounded-full h-6 px-2 text-[10px]"
                  >
                    <LogIn className="w-3 h-3 mr-1" />
                    {language === "ko" ? "로그인" : "Login"}
                  </Button>
                </a>
              )}
            </div>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground font-light leading-relaxed line-clamp-2">{t("header.description")}</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-3 sm:mt-4 flex items-center gap-2">
          <WeatherWidget language={language} />
          <ExchangeRateWidget language={language} rates={exchangeRatesData?.rates} />
        </motion.div>
      </div>
    </div>
  );
}
