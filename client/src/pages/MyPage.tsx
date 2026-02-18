import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ArrowLeft, LogIn, User, Calendar, UserCircle, Pencil, Check, X } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function MyPage() {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { toast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
              <Button variant="ghost" size="icon" data-testid="button-back-home">
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
    if (userData?.loginMethod === "kakao") return "카카오";
    if (userData?.loginMethod === "google") return "Google";
    if (userData?.loginMethod === "email") return "이메일";
    if (userData?.loginMethod === "replit") return "Replit";
    return "이메일";
  };

  const handleStartEdit = () => {
    setNewNickname(getUserDisplayName());
    setIsEditingName(true);
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setNewNickname("");
  };

  const handleSaveNickname = async () => {
    if (!newNickname.trim() || newNickname.trim().length > 20) {
      toast({ title: "닉네임은 1~20자 사이여야 합니다.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/user/nickname", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: newNickname.trim() }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "닉네임이 변경되었습니다." });
        setIsEditingName(false);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      } else {
        toast({ title: data.message || "닉네임 변경에 실패했습니다.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "닉네임 변경에 실패했습니다.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back-home">
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
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newNickname}
                      onChange={(e) => setNewNickname(e.target.value)}
                      className="h-8 text-sm"
                      maxLength={20}
                      placeholder="새 닉네임 입력"
                      data-testid="input-nickname"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveNickname();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleSaveNickname}
                      disabled={isSaving}
                      data-testid="button-save-nickname"
                    >
                      <Check className="w-4 h-4 text-green-500" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCancelEdit}
                      data-testid="button-cancel-nickname"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-lg" data-testid="text-display-name">{getUserDisplayName()}</p>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleStartEdit}
                      data-testid="button-edit-nickname"
                    >
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
