import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Upload, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useUpload } from "@/hooks/use-upload";
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
  imageUrl: string;
  pricePerUnit: number;
  unitLabel: string;
  isActive: boolean;
  sortOrder: number;
}

const defaultForm: CategoryForm = {
  name: "",
  description: "",
  imageUrl: "",
  pricePerUnit: 0,
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

  const { data: categories = [], isLoading } = useQuery<QuoteCategory[]>({
    queryKey: ["/api/admin/quote-categories"],
    enabled: isAdmin,
  });

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      const imageUrl = `/api/public-images/${response.objectPath.split("/").pop()}`;
      setForm(prev => ({ ...prev, imageUrl }));
      toast({ title: "이미지 업로드 완료" });
    },
    onError: () => {
      toast({ title: "이미지 업로드 실패", variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CategoryForm) => {
      const res = await fetch("/api/admin/quote-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
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
        body: JSON.stringify(data),
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const openEdit = (category: QuoteCategory) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      pricePerUnit: category.pricePerUnit || 0,
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
            type="number"
            min={0}
            value={form.pricePerUnit}
            onChange={(e) => setForm(prev => ({ ...prev, pricePerUnit: Number(e.target.value) || 0 }))}
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
        <Label>정렬 순서</Label>
        <Input
          data-testid="input-category-sort"
          type="number"
          value={form.sortOrder}
          onChange={(e) => setForm(prev => ({ ...prev, sortOrder: Number(e.target.value) || 0 }))}
        />
      </div>
      <div className="space-y-2">
        <Label>이미지</Label>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />
            <Button variant="outline" size="sm" asChild disabled={isUploading} data-testid="button-upload-image">
              <span>{isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isUploading ? "업로드 중..." : "이미지 선택"}</span>
            </Button>
          </label>
          {form.imageUrl && (
            <Button variant="ghost" size="icon" onClick={() => setForm(prev => ({ ...prev, imageUrl: "" }))} data-testid="button-remove-image">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        {form.imageUrl && (
          <img src={form.imageUrl} alt="preview" className="w-full h-32 object-cover rounded-md mt-2" />
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
          {categories.map((category) => (
            <Card key={category.id} className={!category.isActive ? "opacity-50" : ""} data-testid={`card-category-${category.id}`}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {category.imageUrl ? (
                    <img src={category.imageUrl} alt={category.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
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
          ))}
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
