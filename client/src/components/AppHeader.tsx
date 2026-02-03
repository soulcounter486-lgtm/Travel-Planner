import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { WeatherWidget } from "@/components/WeatherWidget";
import { ExchangeRateWidget } from "@/components/ExchangeRateWidget";
import { useQuery } from "@tanstack/react-query";
import { LogIn, LogOut, Settings, ChevronDown, Users, Ticket, Bell, RefreshCw, Gift, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import logoImg from "@assets/BackgroundEraser_20240323_103507859_1768275315346.png";

interface Notifications {
  unreadMessagesCount: number;
  unusedCouponsCount: number;
}

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
  const { isAuthenticated, logout, isLoading: isAuthLoading, isAdmin } = useAuth();

  const { data: exchangeRatesData } = useQuery<ExchangeRates>({
    queryKey: ["/api/exchange-rates"],
  });

  const { data: notifications } = useQuery<Notifications>({
    queryKey: ["/api/my-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/my-notifications", { credentials: "include" });
      if (!res.ok) return { unreadMessagesCount: 0, unusedCouponsCount: 0 };
      return res.json();
    },
    enabled: isAuthenticated && !isAuthLoading,
    refetchInterval: 30000,
  });

  const totalNotifications = (notifications?.unreadMessagesCount || 0) + (notifications?.unusedCouponsCount || 0);

  return (
    <div className="relative bg-white border-b border-border/40">
      <div className="absolute inset-0 bg-primary/5" />
      <div className="container mx-auto px-4 py-2 relative z-10">
        {/* 로그인/관리자 버튼 - 제목 위에 한 줄로 배치 */}
        {isAuthLoading ? null : (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-end gap-1 mb-2 overflow-x-auto">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="default"
                        className="shrink-0 rounded-full h-6 px-2 text-[10px] bg-orange-500 hover:bg-orange-600"
                        data-testid="button-admin-menu"
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        관리자
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href="/admin/members" className="flex items-center cursor-pointer" data-testid="link-admin-members">
                          <Users className="w-4 h-4 mr-2" />
                          고객관리
                          <span className="ml-1 text-[10px] text-muted-foreground">(회원/쿠폰/공지)</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/villas" className="flex items-center cursor-pointer" data-testid="link-admin-villas">
                          <Settings className="w-4 h-4 mr-2" />
                          빌라관리
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/places" className="flex items-center cursor-pointer" data-testid="link-admin-places">
                          <Settings className="w-4 h-4 mr-2" />
                          관광지관리
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Link href="/mypage">
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 rounded-full h-6 px-2 text-[10px] relative"
                    data-testid="button-mypage"
                  >
                    <User className="w-3 h-3 mr-1" />
                    마이페이지
                    {totalNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-1 animate-pulse">
                        {totalNotifications > 9 ? "9+" : totalNotifications}
                      </span>
                    )}
                  </Button>
                </Link>
                <a href="/api/auth/kakao/relogin" data-testid="button-switch-account">
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 rounded-full h-6 px-2 text-[10px]"
                    title="다른 아이디로 로그인"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    계정변경
                  </Button>
                </a>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => logout()}
                  className="shrink-0 rounded-full h-6 px-2 text-[10px]"
                  data-testid="button-logout"
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  로그아웃
                </Button>
              </>
            ) : (
              <>
                <a href="/api/auth/kakao" data-testid="button-login-kakao">
                  <Button
                    size="sm"
                    className="shrink-0 rounded-full h-6 px-2 text-[10px] bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] border-0"
                  >
                    <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3C6.477 3 2 6.463 2 10.714c0 2.683 1.74 5.028 4.348 6.385-.19.71-.69 2.576-.788 2.976-.12.49.18.483.379.352.156-.103 2.484-1.69 3.502-2.378.85.126 1.723.192 2.559.192 5.523 0 10-3.463 10-7.714C22 6.463 17.523 3 12 3z"/>
                    </svg>
                    카톡로그인
                  </Button>
                </a>
                <a href="/api/login" data-testid="button-login">
                  <Button
                    size="sm"
                    variant="default"
                    className="shrink-0 rounded-full h-6 px-2 text-[10px]"
                  >
                    <LogIn className="w-3 h-3 mr-1" />
                    로그인
                  </Button>
                </a>
              </>
            )}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
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
            <h1 className="text-sm sm:text-lg font-display font-bold text-primary mb-1 leading-tight">
              <span className="whitespace-nowrap">{t("header.title")}</span><br />
              <span className="whitespace-nowrap text-xs sm:text-base">{language === "ko" ? "실시간 여행견적" : "Live Travel Quote"}</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-light leading-relaxed line-clamp-2">{t("header.description")}</p>
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
