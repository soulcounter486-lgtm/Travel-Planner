import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./hooks/use-auth";
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Label } from "./components/ui/label";
import { Switch } from "./components/ui/switch";
import { useToast } from "./hooks/use-toast";
import { apiRequest } from "./lib/queryClient";
import { ArrowLeft, Plus, Pencil, Trash2, Image, Save, X, GripVertical, Upload, Loader2, MapPin } from "lucide-react";
import { cn } from "./lib/utils";
import { Link } from "wouter";
import type { Villa, VillaAmenity } from "@shared/schema";
import { villaAmenities, villaAmenityLabels } from "@shared/schema";
import { Checkbox } from "./components/ui/checkbox";
import { useUpload } from "./hooks/use-upload";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

  // 드래그 센서
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 드래그 종료 시 순서 업데이트
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const oldIndex = villas.findIndex(v => v.id === active.id);
    const newIndex = villas.findIndex(v => v.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const targetVilla = villas[newIndex];
    const newSortOrder = (targetVilla.sortOrder ?? 0) + (newIndex > oldIndex ? 1 : -1);
    
    try {
      const res = await fetch(`/api/admin/villas/${active.id}/order`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sortOrder: newSortOrder }),
      });
      if (!res.ok) throw new Error("Failed");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/villas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/villas"] });
    } catch (error) {
      toast({ title: "순서 변경 실패", variant: "destructive" });
    }
  };

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

        <p className="text-xs text-muted-foreground mb-4">
          드래그 핸들을 길게 눌러 순서 변경
        </p>

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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={villas.map(v => v.id)} strategy={verticalListSortingStrategy}>
              <div className="grid gap-2">
                {villas.map((villa) => (
                  <SortableVillaCard
                    key={villa.id}
                    villa={villa}
                    onEdit={() => setEditingVilla(villa)}
                    onDelete={() => deleteMutation.mutate(villa.id)}
                    onToggleActive={() => updateMutation.mutate({ id: villa.id, data: { isActive: !villa.isActive } })}
                    onToggleBest={() => updateMutation.mutate({ id: villa.id, data: { isBest: !villa.isBest } })}
                    isEditOpen={editingVilla?.id === villa.id}
                    onEditClose={() => setEditingVilla(null)}
                    onSubmit={(data) => updateMutation.mutate({ id: villa.id, data })}
                    isLoading={updateMutation.isPending}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

// 드래그 가능한 빌라 카드 컴포넌트
interface SortableVillaCardProps {
  villa: Villa;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onToggleBest: () => void;
  isEditOpen: boolean;
  onEditClose: () => void;
  onSubmit: (data: Partial<Villa>) => void;
  isLoading: boolean;
}

function SortableVillaCard({ villa, onEdit, onDelete, onToggleActive, onToggleBest, isEditOpen, onEditClose, onSubmit, isLoading }: SortableVillaCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: villa.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className={`${!villa.isActive ? "opacity-60" : ""}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* 드래그 핸들 */}
          <div
            {...attributes}
            {...listeners}
            className="touch-none cursor-grab active:cursor-grabbing p-1 rounded hover-elevate"
            data-testid={`drag-handle-villa-${villa.id}`}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          
          {/* 이미지 */}
          {(villa.mainImage || (villa.images && villa.images.length > 0)) ? (
            <img
              src={villa.mainImage || villa.images![0]}
              alt={villa.name}
              className="w-16 h-16 object-cover rounded-md flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
              <Image className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          
          {/* 이름 + 룸수 + BEST */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-semibold truncate">{villa.name}</h3>
              {villa.isBest && (
                <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-sm">BEST</span>
              )}
            </div>
            {!villa.isActive && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded">비활성</span>
            )}
          </div>
          
          {/* 버튼 */}
          <div className="flex gap-2 flex-shrink-0 items-center">
            {/* BEST 뱃지 토글 */}
            <Button
              variant={villa.isBest ? "destructive" : "outline"}
              size="sm"
              onClick={onToggleBest}
              data-testid={`button-toggle-best-${villa.id}`}
            >
              BEST
            </Button>
            {/* 활성화/비활성화 토글 */}
            <Switch
              checked={villa.isActive ?? true}
              onCheckedChange={onToggleActive}
              data-testid={`switch-villa-active-${villa.id}`}
            />
            <Dialog open={isEditOpen} onOpenChange={(open) => !open && onEditClose()}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onEdit}
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
                  villa={villa}
                  onSubmit={onSubmit}
                  isLoading={isLoading}
                  onCancel={onEditClose}
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
                    onClick={onDelete}
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
  );
}

interface VillaFormProps {
  villa?: Villa | null;
  onSubmit: (data: Partial<Villa>) => void;
  isLoading: boolean;
  onCancel: () => void;
}

// 구글맵 URL에서 좌표 추출
function extractCoordsFromGoogleMapsUrl(url: string): { lat: string; lng: string } | null {
  if (!url) return null;
  
  // 패턴 1: @10.3543,107.0842 형식
  const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
  const atMatch = url.match(atPattern);
  if (atMatch) {
    return { lat: atMatch[1], lng: atMatch[2] };
  }
  
  // 패턴 2: ?q=10.3543,107.0842 형식
  const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
  const qMatch = url.match(qPattern);
  if (qMatch) {
    return { lat: qMatch[1], lng: qMatch[2] };
  }
  
  // 패턴 3: /place/10.3543,107.0842 형식
  const placePattern = /\/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/;
  const placeMatch = url.match(placePattern);
  if (placeMatch) {
    return { lat: placeMatch[1], lng: placeMatch[2] };
  }
  
  // 패턴 4: ll=10.3543,107.0842 형식
  const llPattern = /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
  const llMatch = url.match(llPattern);
  if (llMatch) {
    return { lat: llMatch[1], lng: llMatch[2] };
  }
  
  return null;
}

function VillaForm({ villa, onSubmit, isLoading, onCancel }: VillaFormProps) {
  const [formData, setFormData] = useState({
    name: villa?.name || "",
    mainImage: villa?.mainImage || "",
    images: villa?.images || [],
    amenities: villa?.amenities || [],
    weekdayPrice: villa?.weekdayPrice || 350,
    fridayPrice: villa?.fridayPrice || 380,
    weekendPrice: villa?.weekendPrice || 500,
    holidayPrice: villa?.holidayPrice || 550,
    address: villa?.address || "",
    mapUrl: villa?.mapUrl || "",
    latitude: villa?.latitude || "",
    longitude: villa?.longitude || "",
    notes: villa?.notes || "",
    maxGuests: villa?.maxGuests || 10,
    bedrooms: villa?.bedrooms || 3,
    isActive: villa?.isActive ?? true,
    sortOrder: villa?.sortOrder || 0,
  });
  
  const [showLocationMap, setShowLocationMap] = useState(false);
  const locationMapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  
  // 지도 초기화
  useEffect(() => {
    if (!showLocationMap || !locationMapRef.current) return;
    
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      return;
    }
    
    // 붕따우 중심 좌표 또는 기존 좌표
    const lat = formData.latitude ? parseFloat(formData.latitude) : 10.3456;
    const lng = formData.longitude ? parseFloat(formData.longitude) : 107.0844;
    
    const map = L.map(locationMapRef.current).setView([lat, lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    
    mapInstanceRef.current = map;
    
    // 기존 좌표가 있으면 마커 표시
    if (formData.latitude && formData.longitude) {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    }
    
    // 지도 클릭 시 좌표 설정
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      // 기존 마커 제거
      if (markerRef.current) {
        markerRef.current.remove();
      }
      
      // 새 마커 추가
      markerRef.current = L.marker([lat, lng]).addTo(map);
      
      // 좌표 설정
      setFormData(prev => ({
        ...prev,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      }));
    });
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [showLocationMap]);

  const [newImageUrl, setNewImageUrl] = useState("");
  const [blogUrl, setBlogUrl] = useState("");
  const [isExtractingImages, setIsExtractingImages] = useState(false);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [selectedExtracted, setSelectedExtracted] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      const imageUrl = `https://storage.googleapis.com/${response.objectPath}`;
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl],
      }));
    },
    onError: (error) => {
      alert("이미지 업로드 실패: " + error.message);
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    for (let i = 0; i < files.length; i++) {
      await uploadFile(files[i]);
    }
    e.target.value = "";
  };

  const extractImagesFromBlog = async () => {
    if (!blogUrl.trim()) return;
    
    setIsExtractingImages(true);
    try {
      const res = await fetch("/api/extract-blog-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: blogUrl.trim() }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "이미지 추출 실패");
        return;
      }
      
      const data = await res.json();
      if (data.images && data.images.length > 0) {
        setExtractedImages(data.images);
        alert(`${data.images.length}개의 이미지 URL을 추출했습니다. 클릭해서 선택하세요.`);
      } else {
        alert("이미지를 찾을 수 없습니다. 블로그 URL을 확인해주세요.");
      }
    } catch (error) {
      alert("이미지 추출 중 오류가 발생했습니다.");
    } finally {
      setIsExtractingImages(false);
    }
  };

  const toggleExtractedImage = (imgUrl: string) => {
    if (selectedExtracted.includes(imgUrl)) {
      setSelectedExtracted(selectedExtracted.filter(i => i !== imgUrl));
    } else {
      setSelectedExtracted([...selectedExtracted, imgUrl]);
    }
  };

  const selectAllExtracted = () => {
    setSelectedExtracted([...extractedImages]);
  };

  const deselectAllExtracted = () => {
    setSelectedExtracted([]);
  };

  const downloadAndSaveImages = async () => {
    if (selectedExtracted.length === 0) {
      alert("다운로드할 이미지를 선택해주세요");
      return;
    }
    
    setIsDownloading(true);
    try {
      const res = await fetch("/api/download-blog-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: selectedExtracted }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        alert(error.error || "다운로드 실패");
        return;
      }
      
      const data = await res.json();
      if (data.uploadedUrls && data.uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...data.uploadedUrls],
        }));
        setSelectedExtracted([]);
        setExtractedImages([]);
        alert(`${data.success}개 이미지 저장 완료!`);
      } else {
        alert("이미지 다운로드에 실패했습니다. 다른 이미지를 시도해주세요.");
      }
    } catch (error) {
      alert("이미지 다운로드 중 오류가 발생했습니다.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 첫 번째 이미지를 대표 이미지로 자동 설정
    const dataToSubmit = {
      ...formData,
      mainImage: formData.images.length > 0 ? formData.images[0] : "",
    };
    onSubmit(dataToSubmit);
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
          <Label>블로그에서 이미지 가져오기</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={blogUrl}
              onChange={(e) => setBlogUrl(e.target.value)}
              placeholder="네이버 블로그 URL 입력"
              data-testid="input-blog-url"
            />
            <Button 
              type="button" 
              onClick={extractImagesFromBlog} 
              variant="default"
              disabled={isExtractingImages || !blogUrl.trim()}
            >
              {isExtractingImages ? "추출 중..." : "이미지 추출"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">예: https://m.blog.naver.com/vungtausaver/123456789</p>
          
          {extractedImages.length > 0 && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <Label className="text-sm">추출된 이미지 (클릭해서 선택)</Label>
                <div className="flex gap-2 flex-wrap">
                  <Button type="button" size="sm" variant="outline" onClick={selectAllExtracted}>
                    전체 선택
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={deselectAllExtracted}>
                    전체 해제
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {extractedImages.map((img, idx) => {
                  const isSelected = selectedExtracted.includes(img);
                  const proxyUrl = `/api/naver-image-proxy?url=${encodeURIComponent(img)}`;
                  return (
                    <div 
                      key={idx} 
                      className={`relative cursor-pointer rounded-md overflow-hidden border-2 transition-all ${isSelected ? "border-primary ring-2 ring-primary/30" : "border-muted hover:border-primary/50"}`}
                      onClick={() => toggleExtractedImage(img)}
                    >
                      <img
                        src={proxyUrl}
                        alt={`이미지 ${idx + 1}`}
                        className="w-full h-20 object-cover"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-bl">
                          {selectedExtracted.indexOf(img) + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">선택된 이미지: {selectedExtracted.length}개</p>
              
              {selectedExtracted.length > 0 && (
                <Button 
                  type="button" 
                  className="w-full mt-3" 
                  onClick={downloadAndSaveImages}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      다운로드 및 저장 중...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      선택한 {selectedExtracted.length}개 이미지 다운로드 및 저장
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        <div>
          <Label>이미지 직접 업로드 (권장)</Label>
          <div className="mt-1">
            <label className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors w-fit">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  사진 파일 선택
                </>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
                data-testid="input-file-upload"
              />
            </label>
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG 이미지를 직접 업로드 하세요</p>
          </div>
        </div>

        <div>
          <Label>또는 이미지 URL 직접 입력</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="이미지 URL 직접 입력"
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
                    alt={`사진 ${idx + 1}`}
                    className={`h-20 w-full object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity ${idx === 0 ? "ring-2 ring-primary" : ""}`}
                    onError={(e) => (e.currentTarget.src = "/placeholder.png")}
                    onClick={() => {
                      if (idx !== 0) {
                        const newImages = [...formData.images];
                        const [selected] = newImages.splice(idx, 1);
                        newImages.unshift(selected);
                        setFormData({ ...formData, images: newImages });
                      }
                    }}
                    title={idx === 0 ? "현재 대표 이미지" : "클릭하여 대표 이미지로 설정"}
                  />
                  {idx === 0 && (
                    <span className="absolute top-0 left-0 bg-primary text-white text-[10px] px-1 rounded-br">대표</span>
                  )}
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
          <p className="text-xs text-muted-foreground mt-2">사진을 클릭하면 대표 이미지로 설정됩니다</p>
        </div>

        {/* 편의사항 체크박스 */}
        <div>
          <Label className="mb-2 block">편의사항</Label>
          <div className="grid grid-cols-3 gap-2">
            {villaAmenities.map((amenity) => (
              <div key={amenity} className="flex items-center space-x-2">
                <Checkbox
                  id={`amenity-${amenity}`}
                  checked={formData.amenities.includes(amenity)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFormData({ ...formData, amenities: [...formData.amenities, amenity] });
                    } else {
                      setFormData({ ...formData, amenities: formData.amenities.filter((a: VillaAmenity) => a !== amenity) });
                    }
                  }}
                  data-testid={`checkbox-amenity-${amenity}`}
                />
                <label
                  htmlFor={`amenity-${amenity}`}
                  className="text-sm cursor-pointer"
                >
                  {villaAmenityLabels[amenity]}
                </label>
              </div>
            ))}
          </div>
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
          <Label htmlFor="mapUrl">지도 URL (선택사항)</Label>
          <Input
            id="mapUrl"
            value={formData.mapUrl}
            onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
            placeholder="https://maps.google.com/..."
            data-testid="input-map-url"
          />
        </div>
        
        {/* 위치 설정 - 지도에서 클릭 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              빌라 위치 설정
            </Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setShowLocationMap(!showLocationMap)}
            >
              {showLocationMap ? "지도 닫기" : "지도에서 위치 선택"}
            </Button>
          </div>
          
          {showLocationMap && (
            <div className="space-y-2">
              <div 
                ref={locationMapRef}
                className="h-[300px] rounded-lg border border-slate-300 overflow-hidden"
                data-testid="location-map"
              />
              <p className="text-xs text-muted-foreground text-center">
                👆 지도를 클릭해서 빌라 위치를 선택하세요
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">위도</Label>
              <Input
                id="latitude"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="10.3543"
                data-testid="input-latitude"
              />
            </div>
            <div>
              <Label htmlFor="longitude">경도</Label>
              <Input
                id="longitude"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="107.0842"
                data-testid="input-longitude"
              />
            </div>
          </div>
          
          {formData.latitude && formData.longitude && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              ✓ 위치 설정됨: {formData.latitude}, {formData.longitude}
            </p>
          )}
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
