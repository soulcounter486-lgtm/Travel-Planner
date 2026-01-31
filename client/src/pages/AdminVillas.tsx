import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Plus, Pencil, Trash2, Image, Save, X, GripVertical } from "lucide-react";
import { Link } from "wouter";
import type { Villa } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminVillas() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVilla, setEditingVilla] = useState<Villa | null>(null);

  const { data: villas = [], isLoading } = useQuery<Villa[]>({
    queryKey: ["/api/admin/villas"],
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Villa>) => {
      const res = await fetch("/api/admin/villas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/villas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/villas"] });
      setIsAddOpen(false);
      toast({ title: "풀빌라가 추가되었습니다" });
    },
    onError: () => {
      toast({ title: "추가 실패", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Villa> }) => {
      const res = await fetch(`/api/admin/villas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/villas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/villas"] });
      setEditingVilla(null);
      toast({ title: "풀빌라가 수정되었습니다" });
    },
    onError: () => {
      toast({ title: "수정 실패", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/villas/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/villas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/villas"] });
      toast({ title: "풀빌라가 삭제되었습니다" });
    },
    onError: () => {
      toast({ title: "삭제 실패", variant: "destructive" });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6">
          <p className="text-muted-foreground">로그인이 필요합니다</p>
          <Link href="/">
            <Button className="mt-4">홈으로 돌아가기</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6">
          <p className="text-muted-foreground">관리자 권한이 필요합니다</p>
          <Link href="/">
            <Button className="mt-4">홈으로 돌아가기</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">풀빌라 관리</h1>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="ml-auto" data-testid="button-add-villa">
                <Plus className="h-4 w-4 mr-2" />
                새 풀빌라 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>새 풀빌라 추가</DialogTitle>
              </DialogHeader>
              <VillaForm
                onSubmit={(data) => createMutation.mutate(data)}
                isLoading={createMutation.isPending}
                onCancel={() => setIsAddOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : villas.length === 0 ? (
          <Card className="p-12 text-center">
            <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">등록된 풀빌라가 없습니다</p>
            <Button onClick={() => setIsAddOpen(true)}>첫 풀빌라 추가하기</Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {villas.map((villa) => (
              <Card key={villa.id} className={`${!villa.isActive ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    </div>
                    {villa.mainImage ? (
                      <img
                        src={villa.mainImage}
                        alt={villa.name}
                        className="w-24 h-24 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-muted rounded-md flex items-center justify-center">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{villa.name}</h3>
                        {!villa.isActive && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">비활성</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        <span className="mr-4">평일: ${villa.weekdayPrice}</span>
                        <span className="mr-4">금요일: ${villa.fridayPrice}</span>
                        <span className="mr-4">주말: ${villa.weekendPrice}</span>
                        <span>공휴일: ${villa.holidayPrice}</span>
                      </div>
                      {villa.address && (
                        <p className="text-sm text-muted-foreground truncate">{villa.address}</p>
                      )}
                      {villa.notes && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{villa.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={editingVilla?.id === villa.id} onOpenChange={(open) => !open && setEditingVilla(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setEditingVilla(villa)}
                            data-testid={`button-edit-villa-${villa.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>풀빌라 수정</DialogTitle>
                          </DialogHeader>
                          <VillaForm
                            villa={editingVilla}
                            onSubmit={(data) => updateMutation.mutate({ id: villa.id, data })}
                            isLoading={updateMutation.isPending}
                            onCancel={() => setEditingVilla(null)}
                          />
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            data-testid={`button-delete-villa-${villa.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>풀빌라 삭제</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{villa.name}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(villa.id)}
                              className="bg-destructive text-destructive-foreground hover-elevate"
                            >
                              삭제
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface VillaFormProps {
  villa?: Villa | null;
  onSubmit: (data: Partial<Villa>) => void;
  isLoading: boolean;
  onCancel: () => void;
}

function VillaForm({ villa, onSubmit, isLoading, onCancel }: VillaFormProps) {
  const [formData, setFormData] = useState({
    name: villa?.name || "",
    mainImage: villa?.mainImage || "",
    images: villa?.images || [],
    weekdayPrice: villa?.weekdayPrice || 350,
    fridayPrice: villa?.fridayPrice || 380,
    weekendPrice: villa?.weekendPrice || 500,
    holidayPrice: villa?.holidayPrice || 550,
    address: villa?.address || "",
    mapUrl: villa?.mapUrl || "",
    notes: villa?.notes || "",
    maxGuests: villa?.maxGuests || 10,
    bedrooms: villa?.bedrooms || 3,
    isActive: villa?.isActive ?? true,
    sortOrder: villa?.sortOrder || 0,
  });

  const [newImageUrl, setNewImageUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addGalleryImage = () => {
    if (newImageUrl.trim()) {
      setFormData({
        ...formData,
        images: [...formData.images, newImageUrl.trim()],
      });
      setNewImageUrl("");
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_: string, i: number) => i !== index),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">빌라 이름 *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="예: 오션뷰 럭셔리 풀빌라"
            required
            data-testid="input-villa-name"
          />
        </div>

        <div>
          <Label htmlFor="mainImage">대표 사진 URL</Label>
          <Input
            id="mainImage"
            value={formData.mainImage}
            onChange={(e) => setFormData({ ...formData, mainImage: e.target.value })}
            placeholder="https://example.com/image.jpg"
            data-testid="input-villa-main-image"
          />
          {formData.mainImage && (
            <img
              src={formData.mainImage}
              alt="미리보기"
              className="mt-2 h-32 object-cover rounded-md"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
        </div>

        <div>
          <Label>갤러리 이미지</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="이미지 URL 입력"
              data-testid="input-gallery-image-url"
            />
            <Button type="button" onClick={addGalleryImage} variant="outline">
              추가
            </Button>
          </div>
          {formData.images.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {formData.images.map((img: string, idx: number) => (
                <div key={idx} className="relative">
                  <img
                    src={img}
                    alt={`갤러리 ${idx + 1}`}
                    className="h-20 w-full object-cover rounded-md"
                    onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => removeGalleryImage(idx)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="weekdayPrice">평일 가격 (USD)</Label>
            <Input
              id="weekdayPrice"
              type="text"
              inputMode="numeric"
              value={formData.weekdayPrice === 0 ? "" : formData.weekdayPrice}
              onChange={(e) => setFormData({ ...formData, weekdayPrice: e.target.value === "" ? 0 : Number(e.target.value) || 0 })}
              data-testid="input-price-weekday"
            />
          </div>
          <div>
            <Label htmlFor="fridayPrice">금요일 가격 (USD)</Label>
            <Input
              id="fridayPrice"
              type="text"
              inputMode="numeric"
              value={formData.fridayPrice === 0 ? "" : formData.fridayPrice}
              onChange={(e) => setFormData({ ...formData, fridayPrice: e.target.value === "" ? 0 : Number(e.target.value) || 0 })}
              data-testid="input-price-friday"
            />
          </div>
          <div>
            <Label htmlFor="weekendPrice">주말 가격 (USD)</Label>
            <Input
              id="weekendPrice"
              type="text"
              inputMode="numeric"
              value={formData.weekendPrice === 0 ? "" : formData.weekendPrice}
              onChange={(e) => setFormData({ ...formData, weekendPrice: e.target.value === "" ? 0 : Number(e.target.value) || 0 })}
              data-testid="input-price-weekend"
            />
          </div>
          <div>
            <Label htmlFor="holidayPrice">공휴일 가격 (USD)</Label>
            <Input
              id="holidayPrice"
              type="text"
              inputMode="numeric"
              value={formData.holidayPrice === 0 ? "" : formData.holidayPrice}
              onChange={(e) => setFormData({ ...formData, holidayPrice: e.target.value === "" ? 0 : Number(e.target.value) || 0 })}
              data-testid="input-price-holiday"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="maxGuests">최대 인원</Label>
            <Input
              id="maxGuests"
              type="text"
              inputMode="numeric"
              value={formData.maxGuests === 0 ? "" : formData.maxGuests}
              onChange={(e) => setFormData({ ...formData, maxGuests: e.target.value === "" ? 0 : Number(e.target.value) || 0 })}
              data-testid="input-max-guests"
            />
          </div>
          <div>
            <Label htmlFor="bedrooms">침실 수</Label>
            <Input
              id="bedrooms"
              type="text"
              inputMode="numeric"
              value={formData.bedrooms === 0 ? "" : formData.bedrooms}
              onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value === "" ? 0 : Number(e.target.value) || 0 })}
              data-testid="input-bedrooms"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="address">위치/주소</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="예: 붕따우 백비치 인근"
            data-testid="input-address"
          />
        </div>

        <div>
          <Label htmlFor="mapUrl">지도 URL (Google Maps 등)</Label>
          <Input
            id="mapUrl"
            value={formData.mapUrl}
            onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
            placeholder="https://maps.google.com/..."
            data-testid="input-map-url"
          />
        </div>

        <div>
          <Label htmlFor="notes">참고사항</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="수영장, 바베큐 시설, 주차 가능 등"
            rows={3}
            data-testid="input-notes"
          />
        </div>

        <div>
          <Label htmlFor="sortOrder">정렬 순서</Label>
          <Input
            id="sortOrder"
            type="number"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
            data-testid="input-sort-order"
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            data-testid="switch-is-active"
          />
          <Label htmlFor="isActive">활성화 (사용자에게 표시)</Label>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          취소
        </Button>
        <Button type="submit" disabled={isLoading || !formData.name} data-testid="button-save-villa">
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          저장
        </Button>
      </div>
    </form>
  );
}
