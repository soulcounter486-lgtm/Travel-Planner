import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./hooks/use-auth";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Switch } from "./components/ui/switch";
import { Textarea } from "./components/ui/textarea";
import { useToast } from "./hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Upload, Loader2, ChevronUp, ChevronDown, ImageIcon, ShoppingBag } from "lucide-react";
import { Link } from "wouter";
import type { ShopProduct } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
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
} from "./components/ui/alert-dialog";

interface ProductForm {
  name: string;
  brand: string;
  price: string;
  quantity: string;
  description: string;
  image: string;
  images: string[];
  benefits: string[];
  ingredients: string;
  usage: string;
  caution: string;
  gradient: string;
  isActive: boolean;
  sortOrder: number;
}

const defaultForm: ProductForm = {
  name: "",
  brand: "",
  price: "0",
  quantity: "",
  description: "",
  image: "",
  images: [],
  benefits: [""],
  ingredients: "",
  usage: "",
  caution: "",
  gradient: "from-primary to-purple-600",
  isActive: true,
  sortOrder: 0,
};

const gradientOptions = [
  { label: "주황", value: "from-amber-500 to-orange-600" },
  { label: "초록", value: "from-emerald-500 to-teal-600" },
  { label: "회색", value: "from-gray-700 to-gray-900" },
  { label: "보라", value: "from-primary to-purple-600" },
  { label: "파랑", value: "from-blue-500 to-indigo-600" },
  { label: "빨강", value: "from-red-500 to-rose-600" },
  { label: "핑크", value: "from-pink-500 to-fuchsia-600" },
];

export default function AdminShopProducts() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShopProduct | null>(null);
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [isUploading, setIsUploading] = useState(false);

  const { data: products = [], isLoading } = useQuery<ShopProduct[]>({
    queryKey: ["/api/admin/shop-products"],
    enabled: isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const res = await fetch("/api/admin/shop-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          price: Number(data.price) || 0,
          benefits: data.benefits.filter(b => b.trim()),
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop-products"] });
      setIsAddOpen(false);
      setForm(defaultForm);
      toast({ title: "상품이 추가되었습니다" });
    },
    onError: () => {
      toast({ title: "추가 실패", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProductForm> }) => {
      const res = await fetch(`/api/admin/shop-products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          price: Number(data.price) || 0,
          benefits: (data.benefits || []).filter(b => b.trim()),
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop-products"] });
      setEditingProduct(null);
      setForm(defaultForm);
      toast({ title: "상품이 수정되었습니다" });
    },
    onError: () => {
      toast({ title: "수정 실패", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/shop-products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop-products"] });
      toast({ title: "상품이 삭제되었습니다" });
    },
    onError: () => {
      toast({ title: "삭제 실패", variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: number; direction: "up" | "down" }) => {
      const sorted = [...products].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      const idx = sorted.findIndex(p => p.id === id);
      if (idx < 0) return;
      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return;
      const currentOrder = sorted[idx].sortOrder || 0;
      const swapOrder = sorted[swapIdx].sortOrder || 0;
      await Promise.all([
        fetch(`/api/admin/shop-products/${sorted[idx].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sortOrder: swapOrder }),
        }),
        fetch(`/api/admin/shop-products/${sorted[swapIdx].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ sortOrder: currentOrder }),
        }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/shop-products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop-products"] });
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
      setForm(prev => ({
        ...prev,
        images: [...prev.images, ...uploaded],
        image: prev.image || uploaded[0] || "",
      }));
      toast({ title: `${uploaded.length}개 이미지 업로드 완료` });
    } catch {
      toast({ title: "이미지 업로드 실패", variant: "destructive" });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setForm(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newImages,
        image: newImages[0] || "",
      };
    });
  };

  const openEdit = (product: ShopProduct) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      brand: product.brand || "",
      price: String(product.price || 0),
      quantity: product.quantity || "",
      description: product.description || "",
      image: product.image || "",
      images: (product.images || []).filter(Boolean) as string[],
      benefits: (product.benefits || []).length > 0 ? (product.benefits as string[]) : [""],
      ingredients: product.ingredients || "",
      usage: product.usage || "",
      caution: product.caution || "",
      gradient: product.gradient || "from-primary to-purple-600",
      isActive: product.isActive !== false,
      sortOrder: product.sortOrder || 0,
    });
  };

  const openAdd = () => {
    setForm(defaultForm);
    setIsAddOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: "상품명을 입력해주세요", variant: "destructive" });
      return;
    }
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const addBenefit = () => {
    setForm(prev => ({ ...prev, benefits: [...prev.benefits, ""] }));
  };

  const removeBenefit = (index: number) => {
    setForm(prev => ({ ...prev, benefits: prev.benefits.filter((_, i) => i !== index) }));
  };

  const updateBenefit = (index: number, value: string) => {
    setForm(prev => ({
      ...prev,
      benefits: prev.benefits.map((b, i) => i === index ? value : b),
    }));
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">관리자 권한이 필요합니다</p>
      </div>
    );
  }

  const formContent = (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>상품명 *</Label>
          <Input
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="다이어트 커피"
            data-testid="input-product-name"
          />
        </div>
        <div>
          <Label>브랜드</Label>
          <Input
            value={form.brand}
            onChange={e => setForm(prev => ({ ...prev, brand: e.target.value }))}
            placeholder="Pluscoffee Diet"
            data-testid="input-product-brand"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>가격 (원)</Label>
          <Input
            type="number"
            value={form.price}
            onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
            data-testid="input-product-price"
          />
        </div>
        <div>
          <Label>수량/단위</Label>
          <Input
            value={form.quantity}
            onChange={e => setForm(prev => ({ ...prev, quantity: e.target.value }))}
            placeholder="15개 (15일분)"
            data-testid="input-product-quantity"
          />
        </div>
      </div>
      <div>
        <Label>설명</Label>
        <Textarea
          value={form.description}
          onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="상품 설명"
          rows={2}
          data-testid="input-product-description"
        />
      </div>
      <div>
        <Label>이미지</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {form.images.map((img, i) => (
            <div key={i} className="relative w-20 h-20">
              <img src={img} alt="" className="w-full h-full object-cover rounded-md" />
              <Button
                size="icon"
                variant="ghost"
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full"
                onClick={() => removeImage(i)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <label className="w-20 h-20 border-2 border-dashed rounded-md flex items-center justify-center cursor-pointer hover-elevate">
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5 text-muted-foreground" />}
            <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      </div>
      <div>
        <Label>효과/장점</Label>
        {form.benefits.map((b, i) => (
          <div key={i} className="flex gap-2 mt-1">
            <Input
              value={b}
              onChange={e => updateBenefit(i, e.target.value)}
              placeholder={`효과 ${i + 1}`}
              data-testid={`input-benefit-${i}`}
            />
            {form.benefits.length > 1 && (
              <Button size="icon" variant="ghost" onClick={() => removeBenefit(i)}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={addBenefit} className="mt-1">
          <Plus className="w-3 h-3 mr-1" /> 효과 추가
        </Button>
      </div>
      <div>
        <Label>성분</Label>
        <Textarea
          value={form.ingredients}
          onChange={e => setForm(prev => ({ ...prev, ingredients: e.target.value }))}
          placeholder="성분 목록"
          rows={2}
          data-testid="input-product-ingredients"
        />
      </div>
      <div>
        <Label>복용방법</Label>
        <Textarea
          value={form.usage}
          onChange={e => setForm(prev => ({ ...prev, usage: e.target.value }))}
          placeholder="복용방법"
          rows={2}
          data-testid="input-product-usage"
        />
      </div>
      <div>
        <Label>주의사항</Label>
        <Textarea
          value={form.caution}
          onChange={e => setForm(prev => ({ ...prev, caution: e.target.value }))}
          placeholder="주의사항"
          rows={2}
          data-testid="input-product-caution"
        />
      </div>
      <div>
        <Label>색상 테마</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {gradientOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setForm(prev => ({ ...prev, gradient: opt.value }))}
              className={`px-3 py-1 rounded-md text-xs text-white bg-gradient-to-r ${opt.value} ${form.gradient === opt.value ? "ring-2 ring-offset-2 ring-primary" : ""}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={form.isActive}
          onCheckedChange={v => setForm(prev => ({ ...prev, isActive: v }))}
          data-testid="switch-product-active"
        />
        <Label>활성화</Label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/diet">
            <Button variant="ghost" size="icon" data-testid="btn-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <ShoppingBag className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">상품 관리</h1>
          <div className="ml-auto">
            <Button onClick={openAdd} data-testid="btn-add-product">
              <Plus className="w-4 h-4 mr-1" /> 상품 추가
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            등록된 상품이 없습니다
          </div>
        ) : (
          <div className="space-y-3">
            {[...products].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((product, idx) => (
              <Card key={product.id} className={!product.isActive ? "opacity-50" : ""} data-testid={`card-admin-product-${product.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {product.image || (product.images && product.images.length > 0) ? (
                      <img
                        src={product.image || (product.images as string[])[0]}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{product.name}</h3>
                        {product.brand && <span className="text-xs text-muted-foreground">({product.brand})</span>}
                        {!product.isActive && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">비활성</span>
                        )}
                      </div>
                      <p className="text-sm text-primary font-bold">{(product.price || 0).toLocaleString()}원</p>
                      {product.quantity && <p className="text-xs text-muted-foreground">{product.quantity}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => reorderMutation.mutate({ id: product.id, direction: "up" })}
                          disabled={idx === 0}
                          data-testid={`btn-up-${product.id}`}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => reorderMutation.mutate({ id: product.id, direction: "down" })}
                          disabled={idx === products.length - 1}
                          data-testid={`btn-down-${product.id}`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(product)} data-testid={`btn-edit-${product.id}`}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`btn-delete-${product.id}`}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>상품 삭제</AlertDialogTitle>
                            <AlertDialogDescription>'{product.name}' 상품을 삭제하시겠습니까?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(product.id)}>삭제</AlertDialogAction>
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

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>상품 추가</DialogTitle>
          </DialogHeader>
          {formContent}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsAddOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending} data-testid="btn-save-product">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              저장
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingProduct} onOpenChange={(open) => { if (!open) setEditingProduct(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>상품 수정</DialogTitle>
          </DialogHeader>
          {formContent}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setEditingProduct(null)}>취소</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="btn-update-product">
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              수정
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}