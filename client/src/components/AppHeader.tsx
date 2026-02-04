import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { WeatherWidget } from "@/components/WeatherWidget";
import { ExchangeRateWidget } from "@/components/ExchangeRateWidget";
import { useQuery } from "@tanstack/react-query";
import { LogIn, LogOut, Settings, ChevronDown, Users, RefreshCw, User, UserPlus, Mail, Ticket } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    email: "",
    nickname: "",
    gender: "",
    birthDate: ""
  });

  const { data: exchangeRatesData } = useQuery<ExchangeRates>({
    queryKey: ["/api/exchange-rates"],
  });

  const { data: notifications, refetch: refetchNotifications } = useQuery<Notifications>({
    queryKey: ["/api/my-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/my-notifications", { credentials: "include" });
      if (!res.ok) return { unreadMessagesCount: 0, unusedCouponsCount: 0 };
      return res.json();
    },
    enabled: !!isAuthenticated,
    refetchInterval: 30000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      refetchNotifications();
    }
  }, [isAuthenticated, isAuthLoading, refetchNotifications]);

  const handleRegisterAndLogin = (provider: 'kakao' | 'google') => {
    if (registerData.email || registerData.nickname || registerData.gender || registerData.birthDate) {
      localStorage.setItem('pendingRegistration', JSON.stringify(registerData));
    }
    window.location.href = provider === 'kakao' ? '/api/auth/kakao' : '/api/login';
  };

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
                
                {/* 쪽지함 버튼 */}
                <Link href="/mypage?tab=messages">
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 rounded-full h-6 px-2 text-[10px] relative"
                    data-testid="button-messages"
                  >
                    <Mail className="w-3 h-3 mr-1" />
                    쪽지함
                    {(notifications?.unreadMessagesCount || 0) > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-1 animate-pulse">
                        {notifications!.unreadMessagesCount > 9 ? "9+" : notifications!.unreadMessagesCount}
                      </span>
                    )}
                  </Button>
                </Link>
                
                {/* 쿠폰함 버튼 */}
                <Link href="/mypage?tab=coupons">
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 rounded-full h-6 px-2 text-[10px] relative"
                    data-testid="button-coupons"
                  >
                    <Ticket className="w-3 h-3 mr-1" />
                    쿠폰함
                    {(notifications?.unusedCouponsCount || 0) > 0 && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] font-bold rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-1">
                        {notifications!.unusedCouponsCount > 9 ? "9+" : notifications!.unusedCouponsCount}
                      </span>
                    )}
                  </Button>
                </Link>
                
                {/* 마이페이지 버튼 */}
                <Link href="/mypage">
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 rounded-full h-6 px-2 text-[10px]"
                    data-testid="button-mypage"
                  >
                    <User className="w-3 h-3 mr-1" />
                    마이페이지
                  </Button>
                </Link>
                
                {/* 계정 드롭다운 (계정변경 + 로그아웃 통합) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 rounded-full h-6 px-2 text-[10px]"
                      data-testid="button-account-menu"
                    >
                      계정
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem asChild>
                      <a href="/api/auth/kakao/relogin" className="flex items-center cursor-pointer" data-testid="button-switch-account">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        계정변경
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => logout()}
                      className="cursor-pointer text-red-600"
                      data-testid="button-logout"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="default"
                    className="shrink-0 rounded-full h-6 px-2 text-[10px]"
                    data-testid="button-login-dropdown"
                  >
                    <LogIn className="w-3 h-3 mr-1" />
                    로그인
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 p-3">
                  {!showRegister ? (
                    <>
                      <div className="space-y-2">
                        <a href="/api/auth/kakao" className="block" data-testid="button-login-kakao">
                          <Button
                            className="w-full h-9 bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] border-0"
                          >
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 3C6.477 3 2 6.463 2 10.714c0 2.683 1.74 5.028 4.348 6.385-.19.71-.69 2.576-.788 2.976-.12.49.18.483.379.352.156-.103 2.484-1.69 3.502-2.378.85.126 1.723.192 2.559.192 5.523 0 10-3.463 10-7.714C22 6.463 17.523 3 12 3z"/>
                            </svg>
                            카카오로 로그인
                          </Button>
                        </a>
                        <a href="/api/login" className="block" data-testid="button-login-google">
                          <Button
                            variant="outline"
                            className="w-full h-9"
                          >
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            구글로 로그인
                          </Button>
                        </a>
                      </div>
                      
                      <DropdownMenuSeparator className="my-3" />
                      
                      <Button
                        variant="ghost"
                        className="w-full h-9 text-primary"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowRegister(true);
                        }}
                        data-testid="button-show-register"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        회원가입
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm">회원가입</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowRegister(false);
                            }}
                          >
                            ← 뒤로
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor="reg-email" className="text-xs">이메일</Label>
                            <Input
                              id="reg-email"
                              type="email"
                              placeholder="email@example.com"
                              className="h-8 text-sm"
                              value={registerData.email}
                              onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="input-register-email"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="reg-nickname" className="text-xs">성명(별명)</Label>
                            <Input
                              id="reg-nickname"
                              type="text"
                              placeholder="홍길동"
                              className="h-8 text-sm"
                              value={registerData.nickname}
                              onChange={(e) => setRegisterData({...registerData, nickname: e.target.value})}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="input-register-nickname"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="reg-gender" className="text-xs">성별</Label>
                            <Select
                              value={registerData.gender}
                              onValueChange={(value) => setRegisterData({...registerData, gender: value})}
                            >
                              <SelectTrigger className="h-8 text-sm" data-testid="select-register-gender">
                                <SelectValue placeholder="성별 선택" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">남성</SelectItem>
                                <SelectItem value="female">여성</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="reg-birthdate" className="text-xs">생년월일</Label>
                            <Input
                              id="reg-birthdate"
                              type="date"
                              className="h-8 text-sm"
                              value={registerData.birthDate}
                              onChange={(e) => setRegisterData({...registerData, birthDate: e.target.value})}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="input-register-birthdate"
                            />
                          </div>
                        </div>
                        
                        <DropdownMenuSeparator />
                        
                        <p className="text-xs text-muted-foreground text-center">
                          위 정보 입력 후 아래 로그인을 진행하세요
                        </p>
                        
                        <div className="space-y-2">
                          <Button
                            className="w-full h-9 bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] border-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRegisterAndLogin('kakao');
                            }}
                            data-testid="button-register-kakao"
                          >
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 3C6.477 3 2 6.463 2 10.714c0 2.683 1.74 5.028 4.348 6.385-.19.71-.69 2.576-.788 2.976-.12.49.18.483.379.352.156-.103 2.484-1.69 3.502-2.378.85.126 1.723.192 2.559.192 5.523 0 10-3.463 10-7.714C22 6.463 17.523 3 12 3z"/>
                            </svg>
                            카카오로 가입
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full h-9"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRegisterAndLogin('google');
                            }}
                            data-testid="button-register-google"
                          >
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            구글로 가입
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
