import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Users, Upload, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";
import type { EcoProfile } from "@shared/schema";

export default function AdminEcoProfiles() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profileUploading, setProfileUploading] = useState<number | null>(null);
  const [addingProfile, setAddingProfile] = useState(false);

  const { data: ecoProfilesList = [], isLoading } = useQuery<EcoProfile[]>({
    queryKey: ["/api/admin/eco-profiles"],
    enabled: isAdmin,
  });

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
    <div className="max-w-2xl mx-auto p-4 pb-20 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/settings">
          <Button variant="ghost" size="icon" data-testid="button-back-eco-profiles">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">에코 프로필 관리</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            프로필 사진 목록
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
          <p className="text-xs text-muted-foreground">사진을 올리면 사용자가 날짜별로 인원수에 따라 A, B, C...별 1지망~3지망을 선택할 수 있습니다</p>
        </CardContent>
      </Card>
    </div>
  );
}
