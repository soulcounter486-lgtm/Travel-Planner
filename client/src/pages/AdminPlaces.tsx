import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, Image, MapPin, Phone, Clock, DollarSign, Tag, Loader2, Upload, GripVertical } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { Place } from "@shared/schema";
import { useUpload } from "@/hooks/use-upload";
import { placesData, type HardcodedPlace } from "./PlacesGuide";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORY_LABELS: Record<string, string> = {
  attraction: "관광명소",
  local_food: "현지맛집",
  nightlife: "나이트라이프",
  spa: "스파/마사지",
  cafe: "카페",
  other: "기타",
};

// placesData 카테고리 -> DB 카테고리 매핑
const HARDCODED_TO_DB_CATEGORY: Record<string, string> = {
  attractions: "attraction",
  localFood: "local_food",
  nightlife: "nightlife",
  spa: "spa",
  coffee: "cafe",
  exchange: "other",
};

// DB 카테고리 -> placesData 카테고리 매핑
const DB_TO_HARDCODED_CATEGORY: Record<string, string> = {
  attraction: "attractions",
  local_food: "localFood",
  nightlife: "nightlife",
  spa: "spa",
  cafe: "coffee",
  other: "exchange",
};

export default function AdminPlaces() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const { data: dbPlaces = [], isLoading } = useQuery<Place[]>({
    queryKey: ["/api/admin/places"],
    enabled: isAdmin,
  });
  const [, setLocation] = useLocation();

  // 통합 장소 타입
  type UnifiedPlace = {
    id: string;
    name: string;
    category: string;
    address?: string;
    phone?: string;
    description?: string;
    imageUrl?: string;
    mapUrl?: string;
    sortOrder: number;
    isHardcoded: boolean;
    dbPlace?: Place; // DB 장소인 경우
    hardcodedPlace?: HardcodedPlace; // 하드코딩 장소인 경우
  };

  // 하드코딩된 장소와 DB 장소를 통합
  const unifiedPlaces = useMemo(() => {
    const dbPlaceNames = new Set(dbPlaces.map(p => p.name));
    const list: UnifiedPlace[] = [];
    let orderIndex = 0;
    
    Object.entries(placesData).forEach(([categoryKey, category]) => {
      const dbCategory = HARDCODED_TO_DB_CATEGORY[categoryKey] || "other";
      category.places.forEach((place, idx) => {
        // DB에 같은 이름의 장소가 있는지 확인
        const dbPlace = dbPlaces.find(p => p.name === place.name);
        
        if (dbPlace) {
          // DB 버전 사용 (수정된 버전)
          list.push({
            id: `db-${dbPlace.id}`,
            name: dbPlace.name,
            category: dbPlace.category,
            address: dbPlace.address || undefined,
            phone: dbPlace.phone || undefined,
            description: dbPlace.description || undefined,
            imageUrl: dbPlace.mainImage || place.imageUrl,
            mapUrl: dbPlace.website || place.mapUrl,
            sortOrder: dbPlace.sortOrder ?? orderIndex,
            isHardcoded: false,
            dbPlace,
          });
        } else {
          // 하드코딩 버전 사용
          list.push({
            id: `hardcoded-${categoryKey}-${idx}`,
            name: place.name,
            category: dbCategory,
            address: place.address,
            phone: place.phone,
            description: place.description?.ko,
            imageUrl: place.imageUrl,
            mapUrl: place.mapUrl,
            sortOrder: orderIndex,
            isHardcoded: true,
            hardcodedPlace: place,
          });
        }
        orderIndex++;
      });
    });
    
    // DB에만 있는 장소 추가 (하드코딩에 없는 새로 추가된 장소)
    dbPlaces.forEach(dbPlace => {
      const exists = list.some(p => p.name === dbPlace.name);
      if (!exists) {
        list.push({
          id: `db-${dbPlace.id}`,
          name: dbPlace.name,
          category: dbPlace.category,
          address: dbPlace.address || undefined,
          phone: dbPlace.phone || undefined,
          description: dbPlace.description || undefined,
          imageUrl: dbPlace.mainImage || undefined,
          mapUrl: dbPlace.website || undefined,
          sortOrder: dbPlace.sortOrder ?? 999,
          isHardcoded: false,
          dbPlace,
        });
      }
    });
    
    // sortOrder로 정렬
    list.sort((a, b) => a.sortOrder - b.sortOrder);
    
    return list;
  }, [dbPlaces]);

  // 필터링된 통합 장소
  const filteredPlaces = filterCategory === "all"
    ? unifiedPlaces
    : unifiedPlaces.filter(p => p.category === filterCategory);

  // 드래그 앤 드롭 센서
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 200, // 200ms 길게 누르기
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 드래그 종료 시 순서 업데이트
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = filteredPlaces.findIndex(p => p.id === active.id);
    const newIndex = filteredPlaces.findIndex(p => p.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const movedPlace = filteredPlaces[oldIndex];
    
    // 하드코딩된 장소를 이동하려면 먼저 DB에 복사해야 함
    if (movedPlace.isHardcoded) {
      toast({ title: "수정 버튼을 눌러 DB에 저장 후 순서를 변경하세요", variant: "destructive" });
      return;
    }
    
    // DB 장소의 sortOrder 업데이트
    const targetPlace = filteredPlaces[newIndex];
    const newSortOrder = targetPlace.sortOrder + (newIndex > oldIndex ? 1 : -1);
    
    try {
      const res = await fetch(`/api/admin/places/${movedPlace.dbPlace!.id}/order`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sortOrder: newSortOrder }),
      });
      if (!res.ok) throw new Error("Failed");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/places"] });
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
    } catch (error) {
      toast({ title: "순서 변경 실패", variant: "destructive" });
    }
  };

  // 하드코딩된 장소를 DB로 복사
  const copyToDb = async (place: UnifiedPlace) => {
    if (!place.hardcodedPlace) return;
    
    try {
      const res = await fetch("/api/admin/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: place.name,
          category: place.category,
          address: place.address || "",
          phone: place.phone || "",
          website: place.mapUrl || "",
          description: place.description || "",
          mainImage: place.imageUrl || "",
          sortOrder: place.sortOrder,
          isActive: true,
        }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        toast({ title: err.error || "복사 실패", variant: "destructive" });
        return;
      }
      
      const newPlace = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/places"] });
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      setEditingPlace(newPlace);
      toast({ title: "DB에 저장되었습니다. 수정하세요." });
    } catch (error) {
      toast({ title: "오류가 발생했습니다", variant: "destructive" });
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Place>) => {
      const res = await fetch("/api/admin/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/places"] });
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      setIsAddOpen(false);
      toast({ title: "장소가 추가되었습니다" });
    },
    onError: () => {
      toast({ title: "추가 실패", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Place> }) => {
      const res = await fetch(`/api/admin/places/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/places"] });
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      setEditingPlace(null);
      toast({ title: "장소가 수정되었습니다" });
    },
    onError: () => {
      toast({ title: "수정 실패", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/places/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/places"] });
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
      toast({ title: "장소가 삭제되었습니다" });
    },
    onError: () => {
      toast({ title: "삭제 실패", variant: "destructive" });
    },
  });

  // 순서 변경 핸들러
  const handleMoveOrder = async (place: Place, direction: number) => {
    const newOrder = (place.sortOrder ?? 0) + direction;
    try {
      const res = await fetch(`/api/admin/places/${place.id}/order`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sortOrder: newOrder }),
      });
      if (!res.ok) throw new Error("Failed to update order");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/places"] });
      queryClient.invalidateQueries({ queryKey: ["/api/places"] });
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
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">관광/맛집 관리</h1>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="ml-auto" data-testid="button-add-place">
                <Plus className="h-4 w-4 mr-2" />
                새 장소 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>새 장소 추가</DialogTitle>
              </DialogHeader>
              <PlaceForm
                onSubmit={(data) => createMutation.mutate(data)}
                isLoading={createMutation.isPending}
                onCancel={() => setIsAddOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { value: "all", label: "전체" },
            { value: "attraction", label: "관광명소" },
            { value: "local_food", label: "현지맛집" },
            { value: "nightlife", label: "나이트라이프" },
            { value: "spa", label: "스파/마사지" },
            { value: "cafe", label: "카페" },
            { value: "other", label: "기타" },
          ].map(tab => (
            <Button
              key={tab.value}
              variant={filterCategory === tab.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterCategory(tab.value)}
              data-testid={`tab-${tab.value}`}
            >
              {tab.label}
              {tab.value !== "all" && (
                <span className="ml-1 text-xs opacity-70">
                  ({unifiedPlaces.filter(p => p.category === tab.value).length})
                </span>
              )}
            </Button>
          ))}
        </div>
        
        <p className="text-xs text-muted-foreground mb-4">
          드래그 핸들을 길게 눌러 순서 변경 (DB 저장된 항목만 가능)
        </p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredPlaces.length === 0 ? (
          <Card className="p-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">해당 카테고리에 장소가 없습니다</p>
            <Button onClick={() => setIsAddOpen(true)}>새 장소 추가하기</Button>
          </Card>
        ) : (
          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={filteredPlaces.map(p => p.id)} strategy={verticalListSortingStrategy}>
              <div className="grid gap-3">
                {filteredPlaces.map((place) => (
                  <SortablePlaceCard
                    key={place.id}
                    place={place}
                    onEdit={(p) => {
                      if (p.isHardcoded) {
                        copyToDb(p);
                      } else if (p.dbPlace) {
                        setEditingPlace(p.dbPlace);
                      }
                    }}
                    onDelete={deleteMutation.mutate}
                    editingPlace={editingPlace}
                    setEditingPlace={setEditingPlace}
                    updateMutation={updateMutation}
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

// 드래그 가능한 카드 컴포넌트
interface SortablePlaceCardProps {
  place: {
    id: string;
    name: string;
    category: string;
    address?: string;
    phone?: string;
    description?: string;
    imageUrl?: string;
    sortOrder: number;
    isHardcoded: boolean;
    dbPlace?: Place;
  };
  onEdit: (place: SortablePlaceCardProps["place"]) => void;
  onDelete: (id: number) => void;
  editingPlace: Place | null;
  setEditingPlace: (place: Place | null) => void;
  updateMutation: any;
}

function SortablePlaceCard({ place, onEdit, onDelete, editingPlace, setEditingPlace, updateMutation }: SortablePlaceCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: place.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className={`${place.isHardcoded ? "border-dashed" : ""} ${isDragging ? "z-50" : ""}`}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* 드래그 핸들 */}
          <div
            {...attributes}
            {...listeners}
            className={`touch-none cursor-grab active:cursor-grabbing p-2 rounded hover-elevate ${place.isHardcoded ? "opacity-30" : ""}`}
            data-testid={`drag-handle-${place.id}`}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          
          {/* 이미지 */}
          {place.imageUrl ? (
            <img
              src={place.imageUrl}
              alt={place.name}
              className="w-16 h-16 object-cover rounded-md flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
              <Image className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          
          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-medium text-sm">{place.name}</h4>
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                {CATEGORY_LABELS[place.category] || place.category}
              </span>
              {place.isHardcoded && (
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">기본</span>
              )}
              {place.dbPlace && !place.dbPlace.isActive && (
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">비활성</span>
              )}
            </div>
            {place.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">{place.description}</p>
            )}
            {place.address && (
              <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {place.address}
              </p>
            )}
          </div>
          
          {/* 액션 버튼 */}
          <div className="flex gap-1 flex-shrink-0">
            {place.dbPlace ? (
              <>
                <Dialog open={editingPlace?.id === place.dbPlace.id} onOpenChange={(open) => !open && setEditingPlace(null)}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(place)}
                      data-testid={`button-edit-${place.id}`}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      수정
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>장소 수정</DialogTitle>
                    </DialogHeader>
                    <PlaceForm
                      place={editingPlace}
                      onSubmit={(data) => updateMutation.mutate({ id: place.dbPlace!.id, data })}
                      isLoading={updateMutation.isPending}
                      onCancel={() => setEditingPlace(null)}
                    />
                  </DialogContent>
                </Dialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      data-testid={`button-delete-${place.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>장소 삭제</AlertDialogTitle>
                      <AlertDialogDescription>
                        "{place.name}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(place.dbPlace!.id)}
                        className="bg-destructive text-destructive-foreground hover-elevate"
                      >
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(place)}
                data-testid={`button-copy-${place.id}`}
              >
                <Pencil className="h-3 w-3 mr-1" />
                수정
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PlaceFormProps {
  place?: Place | null;
  onSubmit: (data: Partial<Place>) => void;
  isLoading: boolean;
  onCancel: () => void;
}


function PlaceForm({ place, onSubmit, isLoading, onCancel }: PlaceFormProps) {
  const [formData, setFormData] = useState({
    name: place?.name || "",
    category: place?.category || "attraction",
    description: place?.description || "",
    mainImage: place?.mainImage || "",
    images: place?.images || [],
    latitude: place?.latitude || "",
    longitude: place?.longitude || "",
    address: place?.address || "",
    phone: place?.phone || "",
    website: place?.website || "",
    openingHours: place?.openingHours || "",
    priceRange: place?.priceRange || "",
    tags: place?.tags || [],
    isActive: place?.isActive ?? true,
    sortOrder: place?.sortOrder || 0,
  });

  const [newTag, setNewTag] = useState("");
  const [blogUrl, setBlogUrl] = useState("");
  const [isExtractingImages, setIsExtractingImages] = useState(false);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [selectedExtracted, setSelectedExtracted] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // 구글 맵 URL 파싱
  const [googleSearchQuery, setGoogleSearchQuery] = useState("");
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

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
        alert(`${data.images.length}개의 이미지를 추출했습니다. 클릭해서 선택하세요.`);
      } else {
        alert("이미지를 찾을 수 없습니다.");
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

  // 구글 맵 URL에서 좌표 추출
  const parseGoogleMapsUrl = async () => {
    const url = googleSearchQuery.trim();
    if (!url) return;
    
    setIsSearchingGoogle(true);
    setIsFetchingDetails(true);
    
    try {
      // 서버에서 URL 파싱
      const res = await fetch("/api/parse-google-maps-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "URL 파싱 실패");
        return;
      }
      
      const data = await res.json();
      
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        address: data.address || prev.address,
        latitude: data.latitude?.toString() || prev.latitude,
        longitude: data.longitude?.toString() || prev.longitude,
        website: url, // 원본 구글맵 URL 저장
      }));
      
      setGoogleSearchQuery("");
      alert("정보를 가져왔습니다! 필요하면 수정해주세요.");
    } catch (error) {
      alert("URL 파싱 중 오류가 발생했습니다");
    } finally {
      setIsSearchingGoogle(false);
      setIsFetchingDetails(false);
    }
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
        alert("이미지 다운로드에 실패했습니다.");
      }
    } catch (error) {
      alert("이미지 다운로드 중 오류가 발생했습니다.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      mainImage: formData.images.length > 0 ? formData.images[0] : "",
    };
    onSubmit(dataToSubmit);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t: string) => t !== tag),
    });
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_: string, i: number) => i !== index),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 구글 맵 URL로 장소 정보 가져오기 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-3">
        <Label className="text-blue-700 dark:text-blue-300 font-medium">
          📍 구글 맵 URL로 정보 가져오기
        </Label>
        <p className="text-xs text-muted-foreground">
          구글 맵에서 장소를 찾고 "공유" → "링크 복사"한 URL을 붙여넣으세요
        </p>
        <div className="flex gap-2">
          <Input
            value={googleSearchQuery}
            onChange={(e) => setGoogleSearchQuery(e.target.value)}
            placeholder="https://maps.app.goo.gl/... 또는 https://www.google.com/maps/..."
            data-testid="input-google-url"
          />
          <Button
            type="button"
            onClick={parseGoogleMapsUrl}
            disabled={isSearchingGoogle || !googleSearchQuery.trim()}
            data-testid="button-parse-url"
          >
            {isSearchingGoogle ? <Loader2 className="h-4 w-4 animate-spin" /> : "가져오기"}
          </Button>
        </div>
        
        {isFetchingDetails && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            정보 가져오는 중...
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">장소 이름 *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="예: 예수상 (Christ of Vung Tau)"
            required
            data-testid="input-place-name"
          />
        </div>

        <div>
          <Label htmlFor="category">카테고리 *</Label>
          <Select 
            value={formData.category} 
            onValueChange={(v) => setFormData({ ...formData, category: v })}
          >
            <SelectTrigger data-testid="select-place-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="attraction">관광명소</SelectItem>
              <SelectItem value="restaurant">맛집</SelectItem>
              <SelectItem value="cafe">카페</SelectItem>
              <SelectItem value="other">기타</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="장소에 대한 상세 설명을 입력하세요..."
          rows={3}
          data-testid="textarea-place-description"
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
            {isExtractingImages ? <Loader2 className="h-4 w-4 animate-spin" /> : "이미지 추출"}
          </Button>
        </div>
        
        {extractedImages.length > 0 && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <Label className="text-sm">추출된 이미지 (클릭해서 선택)</Label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setSelectedExtracted([...extractedImages])}>
                  전체 선택
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setSelectedExtracted([])}>
                  전체 해제
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {extractedImages.map((img, idx) => {
                const isSelected = selectedExtracted.includes(img);
                const proxyUrl = `/api/naver-image-proxy?url=${encodeURIComponent(img)}`;
                return (
                  <div
                    key={idx}
                    className={`relative cursor-pointer rounded border-2 overflow-hidden ${isSelected ? "border-primary" : "border-transparent"}`}
                    onClick={() => toggleExtractedImage(img)}
                  >
                    <img src={proxyUrl} alt="" className="w-full h-16 object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                        <div className="w-4 h-4 bg-primary rounded-full" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {selectedExtracted.length > 0 && (
              <Button 
                type="button" 
                onClick={downloadAndSaveImages} 
                className="mt-2 w-full"
                disabled={isDownloading}
              >
                {isDownloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isDownloading ? "저장 중..." : `선택한 ${selectedExtracted.length}개 이미지 저장`}
              </Button>
            )}
          </div>
        )}
      </div>

      <div>
        <Label>직접 이미지 업로드</Label>
        <div className="mt-1">
          <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">클릭해서 이미지 업로드</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              data-testid="input-image-upload"
            />
          </label>
        </div>
      </div>

      {formData.images.length > 0 && (
        <div>
          <Label>등록된 이미지 ({formData.images.length}개)</Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {formData.images.map((img: string, idx: number) => (
              <div key={idx} className="relative group">
                <img src={img} alt="" className="w-full h-20 object-cover rounded" />
                {idx === 0 && (
                  <span className="absolute top-1 left-1 text-xs bg-primary text-primary-foreground px-1 rounded">대표</span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="latitude">위도</Label>
          <Input
            id="latitude"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
            placeholder="예: 10.3460"
            data-testid="input-latitude"
          />
        </div>
        <div>
          <Label htmlFor="longitude">경도</Label>
          <Input
            id="longitude"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
            placeholder="예: 107.0843"
            data-testid="input-longitude"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">주소</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="예: 861 Trần Phú, Phường 5, Vũng Tàu"
          data-testid="input-address"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">전화번호</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="예: +84 254 3856 789"
            data-testid="input-phone"
          />
        </div>
        <div>
          <Label htmlFor="website">웹사이트/SNS</Label>
          <Input
            id="website"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="예: https://instagram.com/..."
            data-testid="input-website"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="openingHours">영업시간</Label>
          <Input
            id="openingHours"
            value={formData.openingHours}
            onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
            placeholder="예: 07:00 - 17:00"
            data-testid="input-hours"
          />
        </div>
        <div>
          <Label htmlFor="priceRange">가격대</Label>
          <Select 
            value={formData.priceRange} 
            onValueChange={(v) => setFormData({ ...formData, priceRange: v })}
          >
            <SelectTrigger data-testid="select-price-range">
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="$">$ (저렴)</SelectItem>
              <SelectItem value="$$">$$ (보통)</SelectItem>
              <SelectItem value="$$$">$$$ (고급)</SelectItem>
              <SelectItem value="무료">무료</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>태그</Label>
        <div className="flex gap-2 mt-1">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="태그 입력 후 추가"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            data-testid="input-tag"
          />
          <Button type="button" onClick={addTag} variant="outline">
            추가
          </Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {formData.tags.map((tag: string, idx: number) => (
              <span key={idx} className="text-sm bg-muted px-2 py-1 rounded flex items-center gap-1">
                #{tag}
                <button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-destructive">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="sortOrder">정렬 순서</Label>
          <Input
            id="sortOrder"
            type="number"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
            data-testid="input-sort-order"
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            data-testid="switch-active"
          />
          <Label>활성화</Label>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" disabled={isLoading || isUploading} data-testid="button-submit-place">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {place ? "수정" : "추가"}
        </Button>
      </div>
    </form>
  );
}
