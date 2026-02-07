import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, Globe, Type, Search } from "lucide-react";
import { Link } from "wouter";

export default function AdminSettings() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: settings = {}, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
    enabled: isAdmin,
  });

  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroDescription, setHeroDescription] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");

  useEffect(() => {
    if (settings) {
      setHeroTitle(settings["hero_title"] || "");
      setHeroSubtitle(settings["hero_subtitle"] || "");
      setHeroDescription(settings["hero_description"] || "");
      setSeoTitle(settings["seo_title"] || "");
      setSeoDescription(settings["seo_description"] || "");
      setSeoKeywords(settings["seo_keywords"] || "");
    }
  }, [settings]);

  const saveSetting = async (key: string, value: string) => {
    const res = await fetch("/api/admin/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) throw new Error("Failed to save");
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const entries = [
        ["hero_title", heroTitle],
        ["hero_subtitle", heroSubtitle],
        ["hero_description", heroDescription],
        ["seo_title", seoTitle],
        ["seo_description", seoDescription],
        ["seo_keywords", seoKeywords],
      ];
      for (const [key, value] of entries) {
        await saveSetting(key, value.trim());
      }
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      toast({ title: "설정이 저장되었습니다" });
    } catch {
      toast({ title: "저장 실패", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">관리자 권한이 필요합니다</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back-home">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold flex-1">사이트 설정</h1>
          <Button onClick={handleSaveAll} disabled={saving} data-testid="button-save-settings">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            전체 저장
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5" />
              히어로 섹션 텍스트
            </CardTitle>
            <p className="text-sm text-muted-foreground">홈 화면 상단에 표시되는 제목과 설명을 수정합니다</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heroTitle">사이트 제목</Label>
              <Input
                id="heroTitle"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                placeholder="붕따우 도깨비"
                data-testid="input-hero-title"
              />
              <p className="text-xs text-muted-foreground">비워두면 기본값 "붕따우 도깨비"가 표시됩니다</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroSubtitle">부제목</Label>
              <Input
                id="heroSubtitle"
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="실시간 여행견적"
                data-testid="input-hero-subtitle"
              />
              <p className="text-xs text-muted-foreground">비워두면 기본값 "실시간 여행견적"이 표시됩니다</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="heroDescription">설명</Label>
              <Textarea
                id="heroDescription"
                value={heroDescription}
                onChange={(e) => setHeroDescription(e.target.value)}
                placeholder="풀빌라, 차량, 가이드 서비스 등 나만의 맞춤 여행 견적을 실시간으로 확인하세요."
                rows={3}
                data-testid="input-hero-description"
              />
              <p className="text-xs text-muted-foreground">비워두면 기본값이 표시됩니다</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              SEO 설정 (검색 엔진 최적화)
            </CardTitle>
            <p className="text-sm text-muted-foreground">구글, 네이버 검색 결과에 표시되는 정보를 설정합니다</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">검색 제목 (title)</Label>
              <Input
                id="seoTitle"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="베트남 붕따우 도깨비"
                data-testid="input-seo-title"
              />
              <p className="text-xs text-muted-foreground">구글/네이버 검색 결과에 표시되는 제목</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDescription">검색 설명 (description)</Label>
              <Textarea
                id="seoDescription"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="베트남 붕따우 여행의 모든것, 실시간 견적서 확인, 관광명소 및 맛집 소개"
                rows={3}
                data-testid="input-seo-description"
              />
              <p className="text-xs text-muted-foreground">검색 결과에서 제목 아래에 표시되는 설명 (160자 이내 권장)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoKeywords">검색 키워드 (keywords)</Label>
              <Textarea
                id="seoKeywords"
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="붕따우, 베트남, 여행, 붕따우 여행, 붕따우 관광, 붕따우 맛집, 베트남 골프, 붕따우 풀빌라"
                rows={3}
                data-testid="input-seo-keywords"
              />
              <p className="text-xs text-muted-foreground">쉼표(,)로 구분하여 입력. 구글/네이버에서 검색될 단어들</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              미리보기
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-md p-4 bg-muted/30">
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                {seoTitle || "베트남 붕따우 도깨비"}
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mb-1">vungtau.blog</p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {seoDescription || "베트남 붕따우 여행의 모든것, 실시간 견적서 확인, 관광명소 및 맛집 소개"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              위 미리보기는 구글 검색 결과에서 보이는 모습의 예시입니다.
              변경사항은 저장 후 재배포해야 검색엔진에 반영됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
