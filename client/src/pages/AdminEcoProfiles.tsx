import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Users, Upload, Plus, Trash2, CheckSquare, Square, XSquare } from "lucide-react";
import { Link } from "wouter";
import type { EcoProfile } from "@shared/schema";

export default function AdminEcoProfiles() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profileUploading, setProfileUploading] = useState<number | null>(null);
  const [addingProfile, setAddingProfile] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const { data: ecoProfilesList = [], isLoading } = useQuery<EcoProfile[]>({
    queryKey: ["/api/admin/eco-profiles"],
    enabled: isAdmin,
  });

  const isSelectMode = selectedIds.size > 0;

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
      setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    } catch {
      toast({ title: "삭제 실패", variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map(id =>
        fetch(`/api/admin/eco-profiles/${id}`, { method: "DELETE", credentials: "include" })
      ));
      queryClient.invalidateQueries({ queryKey: ["/api/admin/eco-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/eco-profiles"] });
      toast({ title: `${ids.length}개 프로필이 삭제되었습니다` });
      setSelectedIds(new Set());
    } catch {
      toast({ title: "삭제 실패", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === ecoProfilesList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ecoProfilesList.map(p => p.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  const uploadSingleFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
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
          resolve(data.url);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error("Read failed"));
      reader.readAsDataURL(file);
    });
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setBulkUploading(true);
    let successCount = 0;
    let failCount = 0;
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadSingleFile(files[i]);
        const res = await fetch("/api/admin/eco-profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: "", imageUrl: url }),
        });
        if (res.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }
    queryClient.invalidateQueries({ queryKey: ["/api/admin/eco-profiles"] });
    queryClient.invalidateQueries({ queryKey: ["/api/eco-profiles"] });
    toast({ title: `${successCount}개 업로드 완료${failCount > 0 ? `, ${failCount}개 실패` : ""}` });
    setBulkUploading(false);
    if (bulkInputRef.current) bulkInputRef.current.value = "";
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
            프로필 사진 목록 ({ecoProfilesList.length}개)
          </CardTitle>
          <p className="text-sm text-muted-foreground">사용자가 선택할 수 있는 에코 프로필 사진을 관리합니다</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => bulkInputRef.current?.click()} disabled={bulkUploading} data-testid="button-bulk-upload">
              {bulkUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              여러장 업로드
            </Button>
            <input ref={bulkInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleBulkUpload} />
            <Button variant={selectedIds.size === ecoProfilesList.length && ecoProfilesList.length > 0 ? "default" : "outline"} onClick={handleSelectAll} disabled={ecoProfilesList.length === 0} data-testid="button-select-all">
              {selectedIds.size === ecoProfilesList.length && ecoProfilesList.length > 0 ? <CheckSquare className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2" />}
              전체선택
            </Button>
            {isSelectMode && (
              <>
                <Button variant="outline" onClick={() => setSelectedIds(new Set())} data-testid="button-deselect">
                  <XSquare className="w-4 h-4 mr-2" />
                  선택해제
                </Button>
                <Button variant="destructive" onClick={handleBulkDelete} disabled={deleting} data-testid="button-bulk-delete">
                  {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  {selectedIds.size}개 삭제
                </Button>
              </>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {ecoProfilesList.map((profile) => (
              <div
                key={profile.id}
                className={`relative border rounded-md p-2 space-y-2 transition-all ${selectedIds.has(profile.id) ? "ring-2 ring-pink-500 border-pink-500" : ""}`}
                data-testid={`eco-profile-${profile.id}`}
              >
                <button
                  type="button"
                  className="absolute top-1 left-1 z-10"
                  onClick={() => toggleSelect(profile.id)}
                  data-testid={`checkbox-profile-${profile.id}`}
                >
                  {selectedIds.has(profile.id) ? (
                    <CheckSquare className="w-5 h-5 text-pink-500" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  )}
                </button>
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
