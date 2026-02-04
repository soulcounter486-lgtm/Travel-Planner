import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft, LogIn, User, Calendar, UserCircle } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function MyPage() {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-foreground">로딩 중...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold">마이페이지</h1>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <LogIn className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">로그인이 필요합니다</p>
              <a href="/api/auth/kakao">
                <Button className="bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E]">
                  카카오로 로그인
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const userData = user as any;
  
  const getUserDisplayName = () => {
    if (userData?.nickname) return userData.nickname;
    if (userData?.email) return userData.email.split('@')[0];
    return "회원";
  };

  const getLoginMethod = () => {
    if (userData?.kakaoId) return "카카오";
    if (userData?.googleId) return "Google";
    if (userData?.email) return "이메일";
    return "-";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold">마이페이지</h1>
        </div>

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <UserCircle className="w-5 h-5" />
              회원 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-lg">{getUserDisplayName()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={userData?.isAdmin ? "default" : "secondary"} className="h-5 text-[10px]">
                    {userData?.isAdmin ? "관리자" : "일반회원"}
                  </Badge>
                  <Badge variant="outline" className="h-5 text-[10px]">
                    {getLoginMethod()} 로그인
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {userData?.email && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">이메일</span>
                  <span>{userData.email}</span>
                </div>
              )}
              {userData?.phone && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">연락처</span>
                  <span>{userData.phone}</span>
                </div>
              )}
              {userData?.createdAt && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    가입일
                  </span>
                  <span>{format(new Date(userData.createdAt), "yyyy.MM.dd")}</span>
                </div>
              )}
            </div>

            <div className="pt-2 text-center">
              <p className="text-xs text-muted-foreground">
                회원정보 수정이 필요한 경우 관리자에게 문의해주세요
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
