import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Upload, Loader2, ChevronUp, ChevronDown, ImageIcon } from "lucide-react";
import { Link } from "wouter";
import type { QuoteCategory } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface CategoryForm {
  name: string;
  description: string;
  images: string[];
  pricePerUnit: string;
  unitLabel: string;
  isActive: boolean;
  sortOrder: number;
}

const defaultForm: CategoryForm = {
  name: "",
  description: "",
  images: [],
  pricePerUnit: "0",
  unitLabel: "인",
  isActive: true,
  sortOrder: 0,
};

export default function AdminQuoteCategories() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<QuoteCategory | null>(null);
  const [form, setForm] = useState<CategoryForm>(defaultForm);
  const [isUploading, setIsUploading] = useState(false);

  const { data: categories = [], isLoading } = useQuery<QuoteCategory[]>({
    queryKey: ["/api/admin/quote-categories"],
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CategoryForm) => {
      const res = await fetch("/api/admin/quote-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          pricePerUnit: Number(data.pricePerUnit) || 0,
          imageUrl: data.images[0] || "",
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quote-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quote-categories"] });
      setIsAddOpen(false);
      setForm(defaultForm);
      toast({ title: "카테고리가 추가되었습니다" });
    },
    onError: () => {
      toast({ title: "추가 실패", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CategoryForm> }) => {
      const res = await fetch(`/api/admin/quote-categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          pricePerUnit: Number(data.pricePerUnit) || 0,
          imageUrl: data.images?.[0] || "",
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quote-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quote-categories"] });
      setEditingCategory(null);
      setForm(defaultForm);
      toast({ title: "카테고리가 수정되었습니다" });
    },
    onError: () => {
      toast({ title: "수정 실패", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/quote-categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quote-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quote-categories"] });
      toast({ title: "카테고리가 삭제되었습니다" });
    },
    onError: () => {
      toast({ title: "삭제 실패", variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: number; direction: "up" | "down" }) => {
      const sorted = [...categories].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      const idx = sorted.findIndex(c => c.id === id);
      if (idx < 0) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;

      const currentOrder = sorted[idx].sortOrder || 0;
      const swapOrder = sorted[swapIdx].sortOrder || 0;

      await Promise.all([
        fetch(`/api/admin/quote-categories/${sorted[idx].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sortOrder: swapOrder }),
        }),
        fetch(`/api/admin/quote-categories/${sorted[swapIdx].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sortOrder: currentOrder }),
        }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quote-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quote-categories"] });
    },
    onError: () => {
      toast({ title: "순서 변경 실패", variant: "destructive" });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const res = await fetch("/api/upload-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            base64Data: base64,
            fileName: file.name,
            contentType: file.type,
          }),
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        uploaded.push(data.url);
      }
      setForm(prev => ({ ...prev, images: [...prev.images, ...uploaded] }));
      toast({ title: `${uploaded.length}개 이미지 업로드 완료` });
    } catch {
      toast({ title: "이미지 업로드 실패", variant: "destructive" });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const openEdit = (category: QuoteCategory) => {
    setEditingCategory(category);
    const imgs: string[] = [];
    if (category.images && Array.isArray(category.images) && category.images.length > 0) {
      imgs.push(...category.images.filter(Boolean));
    } else if (category.imageUrl) {
      imgs.push(category.imageUrl);
    }
    setForm({
      name: category.name,
      description: category.description || "",
      images: imgs,
      pricePerUnit: String(category.pricePerUnit || 0),
      unitLabel: category.unitLabel || "인",
      isActive: category.isActive !== false,
      sortOrder: category.sortOrder || 0,
    });
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: "카테고리 이름을 입력해주세요", variant: "destructive" });
      return;
    }
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  if (!isAdmin) {
    return <div className="p-4 text-center">관리자 권한이 필요합니다</div>;
  }

  const isDialogOpen = isAddOpen || !!editingCategory;
  const sortedCategories = [...categories].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  const getCategoryImages = (category: QuoteCategory): string[] => {
    if (category.images && Array.isArray(category.images) && category.images.length > 0) {
      return category.images.filter(Boolean) as string[];
    }
    if (category.imageUrl) return [category.imageUrl];
    return [];
  };

  const formContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>카테고리 이름 *</Label>
        <Input
          data-testid="input-category-name"
          value={form.name}
          onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="예: 시티투어, 스파 패키지"
        />
      </div>
      <div className="space-y-2">
        <Label>설명</Label>
        <Input
          data-testid="input-category-description"
          value={form.description}
          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="카테고리 설명"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>단가 (USD) *</Label>
          <Input
            data-testid="input-category-price"
            type="text"
            inputMode="numeric"
            value={form.pricePerUnit}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, "");
              setForm(prev => ({ ...prev, pricePerUnit: val }));
            }}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label>단위</Label>
          <Input
            data-testid="input-category-unit"
            value={form.unitLabel}
            onChange={(e) => setForm(prev => ({ ...prev, unitLabel: e.target.value }))}
            placeholder="인, 회, 팀, 건"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>이미지 ({form.images.length}개)</Label>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} disabled={isUploading} />
            <Button variant="outline" size="sm" asChild disabled={isUploading} data-testid="button-upload-image">
              <span>{isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isUploading ? "업로드 중..." : "이미지 추가"}</span>
            </Button>
          </label>
        </div>
        {form.images.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {form.images.map((img, idx) => (
              <div key={idx} className="relative group">
                <img src={img} alt={`image-${idx}`} className="w-full h-20 object-cover rounded-md" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-80 hover:opacity-100"
                  data-testid={`button-remove-image-${idx}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Switch
          data-testid="switch-category-active"
          checked={form.isActive}
          onCheckedChange={(checked) => setForm(prev => ({ ...prev, isActive: checked }))}
        />
        <Label>활성화</Label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => { setIsAddOpen(false); setEditingCategory(null); setForm(defaultForm); }} data-testid="button-cancel">
          <X className="w-4 h-4 mr-1" /> 취소
        </Button>
        <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-category">
          <Save className="w-4 h-4 mr-1" /> {editingCategory ? "수정" : "추가"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-lg font-bold flex-1">견적 카테고리 관리</h1>
        <Button size="sm" onClick={() => { setForm(defaultForm); setIsAddOpen(true); }} data-testid="button-add-category">
          <Plus className="w-4 h-4 mr-1" /> 추가
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          등록된 카테고리가 없습니다
        </div>
      ) : (
        <div className="space-y-3">
          {sortedCategories.map((category, idx) => {
            const catImages = getCategoryImages(category);
            return (
              <Card key={category.id} className={!category.isActive ? "opacity-50" : ""} data-testid={`card-category-${category.id}`}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={idx === 0 || reorderMutation.isPending}
                        onClick={() => reorderMutation.mutate({ id: category.id, direction: "up" })}
                        data-testid={`button-move-up-${category.id}`}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={idx === sortedCategories.length - 1 || reorderMutation.isPending}
                        onClick={() => reorderMutation.mutate({ id: category.id, direction: "down" })}
                        data-testid={`button-move-down-${category.id}`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                    {catImages.length > 0 ? (
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <img src={catImages[0]} alt={category.name} className="w-16 h-16 object-cover rounded-md" />
                        {catImages.length > 1 && (
                          <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[9px] rounded-tl-md px-1 py-0.5 flex items-center gap-0.5">
                            <ImageIcon className="w-2.5 h-2.5" />
                            {catImages.length}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                        <Plus className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm" data-testid={`text-category-name-${category.id}`}>{category.name}</span>
                        {!category.isActive && <span className="text-[10px] text-red-400 border border-red-400 rounded px-1">비활성</span>}
                      </div>
                      {category.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{category.description}</p>
                      )}
                      <p className="text-sm font-medium text-cyan-500 mt-1" data-testid={`text-category-price-${category.id}`}>
                        ${category.pricePerUnit} / {category.unitLabel}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(category)} data-testid={`button-edit-category-${category.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`button-delete-category-${category.id}`}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>카테고리 삭제</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{category.name}" 카테고리를 삭제하시겠습니까?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(category.id)}>삭제</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setIsAddOpen(false); setEditingCategory(null); setForm(defaultForm); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "카테고리 수정" : "카테고리 추가"}</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    </div>
  );
}
