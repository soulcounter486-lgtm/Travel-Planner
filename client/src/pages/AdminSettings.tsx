import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, Globe, Type, Search, Users, DollarSign, Upload, X, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";
import type { EcoProfile } from "@shared/schema";

export default function AdminSettings() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: settings = {}, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
    enabled: isAdmin,
  });

  const { data: ecoProfilesList = [] } = useQuery<EcoProfile[]>({
    queryKey: ["/api/admin/eco-profiles"],
    enabled: isAdmin,
  });

  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroDescription, setHeroDescription] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [ecoPrice12, setEcoPrice12] = useState("220");
  const [ecoPrice22, setEcoPrice22] = useState("380");
  const [ecoDescription, setEcoDescription] = useState("");
  const [ecoImageUrl, setEcoImageUrl] = useState("");
  const [ecoImageUploading, setEcoImageUploading] = useState(false);
  const [profileUploading, setProfileUploading] = useState<number | null>(null);
  const [addingProfile, setAddingProfile] = useState(false);

  useEffect(() => {
    if (settings) {
      setHeroTitle(settings["hero_title"] || "");
      setHeroSubtitle(settings["hero_subtitle"] || "");
      setHeroDescription(settings["hero_description"] || "");
      setSeoTitle(settings["seo_title"] || "");
      setSeoDescription(settings["seo_description"] || "");
      setSeoKeywords(settings["seo_keywords"] || "");
      setEcoPrice12(settings["eco_price_12"] || "220");
      setEcoPrice22(settings["eco_price_22"] || "380");
      setEcoDescription(settings["eco_description"] || "");
      setEcoImageUrl(settings["eco_image_url"] || "");
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
        ["eco_price_12", ecoPrice12],
        ["eco_price_22", ecoPrice22],
        ["eco_description", ecoDescription],
        ["eco_image_url", ecoImageUrl],
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

  const handleEcoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEcoImageUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await fetch("/api/upload-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ base64Data, fileName: file.name, contentType: file.type }),
          });
          if (!res.ok) throw new Error("Upload failed");
          const data = await res.json();
          setEcoImageUrl(data.url);
          toast({ title: "이미지 업로드 완료" });
        } catch {
          toast({ title: "이미지 업로드 실패", variant: "destructive" });
        } finally {
          setEcoImageUploading(false);
        }
      };
      reader.onerror = () => {
        toast({ title: "이미지 업로드 실패", variant: "destructive" });
        setEcoImageUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: "이미지 업로드 실패", variant: "destructive" });
      setEcoImageUploading(false);
    }
  };

  const handleAddProfile = async () => {
    setAddingProfile(true);
    try {
      const res = await fetch("/api/admin/eco-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: "", imageUrl: "" }),
      });
      if (!res.ok) throw new Error("Failed");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/eco-profiles"] });
      toast({ title: "프로필이 추가되었습니다" });
    } catch {
      toast({ title: "추가 실패", variant: "destructive" });
    } finally {
      setAddingProfile(false);
    }
  };

  const handleDeleteProfile = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/eco-profiles/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/eco-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/eco-profiles"] });
      toast({ title: "프로필이 삭제되었습니다" });
    } catch {
      toast({ title: "삭제 실패", variant: "destructive" });
    }
  };

  const handleUpdateProfile = async (id: number, updates: Partial<EcoProfile>) => {
    try {
      const res = await fetch(`/api/admin/eco-profiles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/eco-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/eco-profiles"] });
    } catch {
      toast({ title: "수정 실패", variant: "destructive" });
    }
  };

  const handleProfileImageUpload = async (profileId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileUploading(profileId);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await fetch("/api/upload-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ base64Data, fileName: file.name, contentType: file.type }),
          });
          if (!res.ok) throw new Error("Upload failed");
          const data = await res.json();
          await handleUpdateProfile(profileId, { imageUrl: data.url });
          toast({ title: "사진 업로드 완료" });
        } catch {
          toast({ title: "사진 업로드 실패", variant: "destructive" });
        } finally {
          setProfileUploading(null);
        }
      };
      reader.onerror = () => {
        toast({ title: "사진 업로드 실패", variant: "destructive" });
        setProfileUploading(null);
      };
      reader.readAsDataURL(file);
    } catch {
      toast({ title: "사진 업로드 실패", variant: "destructive" });
      setProfileUploading(null);
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
              <Users className="w-5 h-5" />
              에코 설정
            </CardTitle>
            <p className="text-sm text-muted-foreground">에코 서비스 이미지, 설명, 가격을 관리합니다</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>에코 대표 이미지</Label>
              {ecoImageUrl ? (
                <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                  <img src={ecoImageUrl} alt="에코" className="w-full h-full object-cover" data-testid="img-eco-preview" />
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-black/50 text-white" onClick={() => setEcoImageUrl("")} data-testid="button-remove-eco-image">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/30 transition-colors" data-testid="label-eco-image-upload">
                  {ecoImageUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">이미지 업로드</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleEcoImageUpload} data-testid="input-eco-image-upload" />
                </label>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="ecoDescription">에코 설명</Label>
              <Textarea
                id="ecoDescription"
                value={ecoDescription}
                onChange={(e) => setEcoDescription(e.target.value)}
                placeholder="에코 서비스에 대한 설명을 입력하세요"
                rows={3}
                data-testid="input-eco-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ecoPrice12" className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  12시간 가격 (USD)
                </Label>
                <Input
                  id="ecoPrice12"
                  type="number"
                  min="0"
                  value={ecoPrice12}
                  onChange={(e) => setEcoPrice12(e.target.value)}
                  placeholder="220"
                  data-testid="input-eco-price-12"
                />
                <p className="text-xs text-muted-foreground">기본값: $220 (18~06시)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ecoPrice22" className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  22시간 가격 (USD)
                </Label>
                <Input
                  id="ecoPrice22"
                  type="number"
                  min="0"
                  value={ecoPrice22}
                  onChange={(e) => setEcoPrice22(e.target.value)}
                  placeholder="380"
                  data-testid="input-eco-price-22"
                />
                <p className="text-xs text-muted-foreground">기본값: $380 (12~10시)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              에코 프로필 관리
            </CardTitle>
            <p className="text-sm text-muted-foreground">사용자가 선택할 수 있는 에코 프로필 사진을 관리합니다</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {ecoProfilesList.map((profile) => (
                <div key={profile.id} className="relative border rounded-md p-2 space-y-2" data-testid={`eco-profile-${profile.id}`}>
                  {profile.imageUrl ? (
                    <div className="relative aspect-square rounded-md overflow-hidden">
                      <img src={profile.imageUrl} alt={profile.name || "에코"} className="w-full h-full object-cover" data-testid={`img-eco-profile-${profile.id}`} />
                      <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer" data-testid={`label-change-profile-${profile.id}`}>
                        <span className="text-white text-xs font-medium">변경</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProfileImageUpload(profile.id, e)} />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/30 transition-colors" data-testid={`label-upload-profile-${profile.id}`}>
                      {profileUploading === profile.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      ) : (
                        <Upload className="w-5 h-5 text-muted-foreground" />
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProfileImageUpload(profile.id, e)} />
                    </label>
                  )}
                  <Input
                    value={profile.name || ""}
                    onChange={(e) => handleUpdateProfile(profile.id, { name: e.target.value })}
                    placeholder="이름"
                    className="text-xs h-8"
                    data-testid={`input-profile-name-${profile.id}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 text-muted-foreground"
                    onClick={() => handleDeleteProfile(profile.id)}
                    data-testid={`button-delete-profile-${profile.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={handleAddProfile}
              disabled={addingProfile}
              data-testid="button-add-eco-profile"
            >
              {addingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              프로필 추가
            </Button>
            <p className="text-xs text-muted-foreground">사진을 올리면 사용자가 날짜별로 1지망, 2지망, 3지망을 선택할 수 있습니다</p>
          </CardContent>
        </Card>

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
