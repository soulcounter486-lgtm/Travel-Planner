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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  // 드롭다운 열림 상태 (controlled)
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // 회원가입 Dialog 상태
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  // 단일 화면 상태 관리: 'default' | 'emailLogin' | 'register' | 'forgotPassword' | 'emailVerification'
  const [authScreen, setAuthScreen] = useState<'default' | 'emailLogin' | 'register' | 'forgotPassword' | 'emailVerification'>('default');
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
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

  // 이메일로 회원가입
  const handleEmailRegister = async () => {
    if (!registerData.email || !registerData.password) {
      setRegisterError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (registerData.password.length < 6) {
      setRegisterError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }
    if (registerData.password !== registerData.passwordConfirm) {
      setRegisterError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!registerData.gender) {
      setRegisterError("성별을 선택해주세요.");
      return;
    }
    
    setRegisterLoading(true);
    setRegisterError("");
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(registerData),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // 이미 등록되었지만 인증이 필요한 경우
        if (data.needsVerification) {
          setVerificationEmail(data.email);
          setAuthScreen('emailVerification');
          setRegisterError("");
          return;
        }
        setRegisterError(data.error || "회원가입에 실패했습니다.");
        return;
      }
      
      // 회원가입 성공 - 이메일 인증 화면으로 이동
      if (data.needsVerification) {
        setVerificationEmail(data.email);
        setAuthScreen('emailVerification');
        setRegisterError("");
      } else {
        window.location.reload();
      }
    } catch (err) {
      setRegisterError("회원가입 처리 중 오류가 발생했습니다.");
    } finally {
      setRegisterLoading(false);
    }
  };

  // 이메일 인증 코드 확인
  const handleVerifyEmail = async () => {
    if (!verificationCode) {
      setRegisterError("인증 코드를 입력해주세요.");
      return;
    }
    
    setRegisterLoading(true);
    setRegisterError("");
    
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: verificationEmail, code: verificationCode }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setRegisterError(data.error || "인증에 실패했습니다.");
        return;
      }
      
      // 인증 성공 - 페이지 새로고침
      window.location.reload();
    } catch (err) {
      setRegisterError("인증 처리 중 오류가 발생했습니다.");
    } finally {
      setRegisterLoading(false);
    }
  };

  // 인증 이메일 재발송
  const handleResendVerification = async () => {
    if (!verificationEmail) {
      setRegisterError("이메일 주소가 없습니다.");
      return;
    }
    
    setRegisterLoading(true);
    setRegisterError("");
    
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setRegisterError(data.error || "재발송에 실패했습니다.");
        return;
      }
      
      setRegisterError("");
      toast({
        title: "인증 이메일 재발송",
        description: "인증 코드가 이메일로 다시 발송되었습니다.",
      });
    } catch (err) {
      setRegisterError("재발송 처리 중 오류가 발생했습니다.");
    } finally {
      setRegisterLoading(false);
    }
  };

  // 이메일로 로그인
  const handleEmailLogin = async () => {
    if (!registerData.email || !registerData.password) {
      setRegisterError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    
    setRegisterLoading(true);
    setRegisterError("");
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: registerData.email, password: registerData.password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // 이메일 인증이 필요한 경우
        if (data.needsVerification) {
          setVerificationEmail(data.email);
          setAuthScreen('emailVerification');
          setRegisterError("");
          return;
        }
        setRegisterError(data.error || "로그인에 실패했습니다.");
        return;
      }
      
      // 로그인 성공 - 페이지 새로고침
      window.location.reload();
    } catch (err) {
      setRegisterError("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setRegisterLoading(false);
    }
  };

  // 비밀번호 찾기
  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      setRegisterError("이메일을 입력해주세요.");
      return;
    }
    
    setRegisterLoading(true);
    setRegisterError("");
    setForgotPasswordSuccess("");
    
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setRegisterError(data.error || "비밀번호 찾기에 실패했습니다.");
        return;
      }
      
      setForgotPasswordSuccess("임시 비밀번호가 이메일로 발송되었습니다.");
      setForgotPasswordEmail("");
    } catch (err) {
      setRegisterError("비밀번호 찾기 처리 중 오류가 발생했습니다.");
    } finally {
      setRegisterLoading(false);
    }
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
              <Popover 
                open={dropdownOpen} 
                modal={false}
                onOpenChange={(open) => {
                  console.log('Popover onOpenChange 호출:', open, 'current authScreen:', authScreen);
                  // 내부 클릭 시 닫히는 것을 방지하기 위해, 닫힘 요청이 오면 무시
                  // 사용자가 외부를 클릭하거나 명시적으로 닫을 때만 처리
                  if (open) {
                    setDropdownOpen(true);
                  }
                  // 닫힐 때는 onInteractOutside에서 처리
                }}
              >
                <PopoverTrigger asChild>
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
                </PopoverTrigger>
                <PopoverContent 
                  align="end" 
                  className="w-72 p-3"
                  avoidCollisions={false}
                  side="bottom"
                  sideOffset={5}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onInteractOutside={() => {
                    console.log('Popover onInteractOutside 호출');
                    setDropdownOpen(false);
                    setAuthScreen('default');
                    setRegisterError("");
                    setForgotPasswordSuccess("");
                    setVerificationCode("");
                  }}
                  onEscapeKeyDown={() => {
                    console.log('Popover onEscapeKeyDown 호출');
                    setDropdownOpen(false);
                    setAuthScreen('default');
                    setRegisterError("");
                    setForgotPasswordSuccess("");
                    setVerificationCode("");
                  }}
                >
                  {authScreen === 'emailVerification' ? (
                    <>
                      {/* 이메일 인증 화면 */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm">이메일 인증</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setAuthScreen('default');
                              setVerificationCode("");
                              setRegisterError("");
                            }}
                          >
                            ← 뒤로
                          </Button>
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            <strong>{verificationEmail}</strong>로 6자리 인증 코드가 발송되었습니다.
                            <br />30분 내에 아래 입력란에 코드를 입력해주세요.
                          </p>
                        </div>
                        
                        {registerError && (
                          <p className="text-xs text-red-500 text-center">{registerError}</p>
                        )}
                        
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor="verify-code" className="text-xs">인증 코드 (6자리)</Label>
                            <Input
                              id="verify-code"
                              type="text"
                              placeholder="123456"
                              className="h-10 text-lg text-center tracking-widest font-mono"
                              maxLength={6}
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="input-verification-code"
                            />
                          </div>
                        </div>
                        
                        <Button
                          className="w-full h-9"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleVerifyEmail();
                          }}
                          disabled={registerLoading || verificationCode.length !== 6}
                          data-testid="button-verify-email"
                        >
                          {registerLoading ? "인증 중..." : "인증 확인"}
                        </Button>
                        
                        <div className="text-center">
                          <button 
                            type="button"
                            className="text-xs text-muted-foreground underline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleResendVerification();
                            }}
                            disabled={registerLoading}
                            data-testid="button-resend-verification"
                          >
                            인증 코드 다시 받기
                          </button>
                        </div>
                      </div>
                    </>
                  ) : authScreen === 'forgotPassword' ? (
                    <>
                      {/* 비밀번호 찾기 화면 */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm">비밀번호 찾기</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setAuthScreen('emailLogin');
                              setRegisterError("");
                              setForgotPasswordSuccess("");
                            }}
                          >
                            ← 뒤로
                          </Button>
                        </div>
                        
                        {registerError && (
                          <p className="text-xs text-red-500 text-center">{registerError}</p>
                        )}
                        
                        {forgotPasswordSuccess && (
                          <p className="text-xs text-green-600 text-center">{forgotPasswordSuccess}</p>
                        )}
                        
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor="forgot-email" className="text-xs">가입한 이메일</Label>
                            <Input
                              id="forgot-email"
                              type="email"
                              placeholder="email@example.com"
                              className="h-8 text-sm"
                              value={forgotPasswordEmail}
                              onChange={(e) => setForgotPasswordEmail(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="input-forgot-email"
                            />
                          </div>
                        </div>
                        
                        <Button
                          className="w-full h-9"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleForgotPassword();
                          }}
                          disabled={registerLoading}
                          data-testid="button-send-temp-password"
                        >
                          {registerLoading ? "발송 중..." : "임시 비밀번호 발송"}
                        </Button>
                        
                        <p className="text-xs text-muted-foreground text-center">
                          임시 비밀번호가 이메일로 발송됩니다.<br />
                          로그인 후 비밀번호를 변경해주세요.
                        </p>
                      </div>
                    </>
                  ) : authScreen === 'default' ? (
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
                        <Button
                          variant="secondary"
                          className="w-full h-9"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setAuthScreen('emailLogin');
                            setRegisterError("");
                          }}
                          data-testid="button-show-email-login"
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          이메일로 로그인
                        </Button>
                      </div>
                      
                      <DropdownMenuSeparator className="my-3" />
                      
                      <Button
                        variant="ghost"
                        className="w-full h-9 text-primary"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDropdownOpen(false);
                          setRegisterDialogOpen(true);
                          setRegisterError("");
                        }}
                        data-testid="button-show-register"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        회원가입
                      </Button>
                    </>
                  ) : authScreen === 'emailLogin' ? (
                    <>
                      {/* 이메일 로그인 화면 */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-sm">이메일 로그인</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setAuthScreen('default');
                              setRegisterError("");
                            }}
                          >
                            ← 뒤로
                          </Button>
                        </div>
                        
                        {registerError && (
                          <p className="text-xs text-red-500 text-center">{registerError}</p>
                        )}
                        
                        <div className="space-y-2">
                          <div>
                            <Label htmlFor="login-email" className="text-xs">이메일</Label>
                            <Input
                              id="login-email"
                              type="email"
                              placeholder="email@example.com"
                              className="h-8 text-sm"
                              value={registerData.email}
                              onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="input-login-email"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="login-password" className="text-xs">비밀번호</Label>
                            <Input
                              id="login-password"
                              type="password"
                              placeholder="••••••"
                              className="h-8 text-sm"
                              value={registerData.password}
                              onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                              onClick={(e) => e.stopPropagation()}
                              data-testid="input-login-password"
                            />
                          </div>
                        </div>
                        
                        <Button
                          className="w-full h-9"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEmailLogin();
                          }}
                          disabled={registerLoading}
                          data-testid="button-email-login"
                        >
                          {registerLoading ? "로그인 중..." : "로그인"}
                        </Button>
                        
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <button 
                            type="button"
                            className="text-primary underline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('비밀번호 찾기 클릭, authScreen 변경 시도');
                              setAuthScreen('forgotPassword');
                              setRegisterError("");
                              setForgotPasswordSuccess("");
                            }}
                            data-testid="button-forgot-password"
                          >
                            비밀번호 찾기
                          </button>
                          <button 
                            type="button"
                            className="text-primary underline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDropdownOpen(false);
                              setRegisterDialogOpen(true);
                              setRegisterError("");
                            }}
                          >
                            회원가입
                          </button>
                        </div>
                      </div>
                    </>
                  ) : null}
                </PopoverContent>
              </Popover>
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
      
      {/* 회원가입 Dialog */}
      <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>회원가입</DialogTitle>
          </DialogHeader>
          
          {registerError && (
            <p className="text-sm text-red-500 text-center">{registerError}</p>
          )}
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="dialog-reg-email">이메일 *</Label>
              <Input
                id="dialog-reg-email"
                type="email"
                placeholder="email@example.com"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                data-testid="input-register-email"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dialog-reg-password">비밀번호 * (6자↑)</Label>
                <Input
                  id="dialog-reg-password"
                  type="password"
                  placeholder="••••••"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  data-testid="input-register-password"
                />
              </div>
              <div>
                <Label htmlFor="dialog-reg-password-confirm">비밀번호 확인 *</Label>
                <Input
                  id="dialog-reg-password-confirm"
                  type="password"
                  placeholder="••••••"
                  value={registerData.passwordConfirm}
                  onChange={(e) => setRegisterData({...registerData, passwordConfirm: e.target.value})}
                  data-testid="input-register-password-confirm"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dialog-reg-nickname">닉네임</Label>
                <Input
                  id="dialog-reg-nickname"
                  type="text"
                  placeholder="별명"
                  value={registerData.nickname}
                  onChange={(e) => setRegisterData({...registerData, nickname: e.target.value})}
                  data-testid="input-register-nickname"
                />
              </div>
              <div>
                <Label htmlFor="dialog-reg-gender">성별</Label>
                <Select
                  value={registerData.gender}
                  onValueChange={(value) => setRegisterData({...registerData, gender: value})}
                >
                  <SelectTrigger data-testid="select-register-gender">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">남성</SelectItem>
                    <SelectItem value="female">여성</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button
              className="w-full"
              onClick={() => {
                handleEmailRegister();
              }}
              disabled={registerLoading}
              data-testid="button-email-register"
            >
              {registerLoading ? "가입 중..." : "이메일로 가입"}
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">또는 소셜 계정으로 가입</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                className="w-full bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] border-0"
                onClick={() => {
                  handleRegisterAndLogin('kakao');
                }}
                data-testid="button-register-kakao"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.477 3 2 6.463 2 10.714c0 2.683 1.74 5.028 4.348 6.385-.19.71-.69 2.576-.788 2.976-.12.49.18.483.379.352.156-.103 2.484-1.69 3.502-2.378.85.126 1.723.192 2.559.192 5.523 0 10-3.463 10-7.714C22 6.463 17.523 3 12 3z"/>
                </svg>
                카카오로 가입
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  handleRegisterAndLogin('google');
                }}
                data-testid="button-register-google"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                구글로 가입
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              이미 계정이 있으신가요?{" "}
              <button 
                type="button"
                className="text-primary underline"
                onClick={() => {
                  setRegisterDialogOpen(false);
                  setDropdownOpen(true);
                  setAuthScreen('emailLogin');
                }}
              >
                로그인
              </button>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
