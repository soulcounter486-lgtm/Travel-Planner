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
import { ArrowLeft, Plus, Pencil, Trash2, Image, MapPin, Phone, Clock, DollarSign, Tag, Loader2, Upload } from "lucide-react";
import { Link } from "wouter";
import type { Place } from "@shared/schema";
import { useUpload } from "@/hooks/use-upload";
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
  restaurant: "맛집",
  cafe: "카페",
  other: "기타",
};

export default function AdminPlaces() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const { data: places = [], isLoading } = useQuery<Place[]>({
    queryKey: ["/api/admin/places"],
    enabled: isAdmin,
  });

  const filteredPlaces = filterCategory === "all"
    ? places
    : places.filter(p => p.category === filterCategory);

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
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-32" data-testid="select-category-filter">
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="attraction">관광명소</SelectItem>
              <SelectItem value="restaurant">맛집</SelectItem>
              <SelectItem value="cafe">카페</SelectItem>
              <SelectItem value="other">기타</SelectItem>
            </SelectContent>
          </Select>

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

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filteredPlaces.length === 0 ? (
          <Card className="p-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">등록된 장소가 없습니다</p>
            <div className="flex flex-col gap-3 items-center">
              <Button onClick={() => setIsAddOpen(true)}>첫 장소 추가하기</Button>
              <Button 
                variant="outline" 
                onClick={async () => {
                  if (!confirm("기존 관광/맛집 데이터를 DB로 가져오시겠습니까?\n(예수상, 등대, 맛집 등 기본 데이터)")) return;
                  try {
                    const res = await fetch("/api/admin/places/import-default", {
                      method: "POST",
                      credentials: "include",
                    });
                    if (!res.ok) {
                      const err = await res.json();
                      alert(err.error || "가져오기 실패");
                      return;
                    }
                    const data = await res.json();
                    alert(`${data.count}개의 장소를 가져왔습니다!`);
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/places"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/places"] });
                  } catch (error) {
                    alert("오류가 발생했습니다");
                  }
                }}
                data-testid="button-import-default"
              >
                📥 기존 데이터 가져오기
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPlaces.map((place) => (
              <Card key={place.id} className={`${!place.isActive ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {place.mainImage ? (
                      <img
                        src={place.mainImage}
                        alt={place.name}
                        className="w-24 h-24 object-cover rounded-md flex-shrink-0"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                        <Image className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-lg">{place.name}</h3>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {CATEGORY_LABELS[place.category] || place.category}
                        </span>
                        {!place.isActive && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">비활성</span>
                        )}
                      </div>
                      {place.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-1">{place.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        {place.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {place.address}
                          </span>
                        )}
                        {place.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {place.phone}
                          </span>
                        )}
                        {place.priceRange && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {place.priceRange}
                          </span>
                        )}
                      </div>
                      {place.tags && place.tags.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {place.tags.map((tag, idx) => (
                            <span key={idx} className="text-xs bg-muted px-2 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Dialog open={editingPlace?.id === place.id} onOpenChange={(open) => !open && setEditingPlace(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setEditingPlace(place)}
                            data-testid={`button-edit-place-${place.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>장소 수정</DialogTitle>
                          </DialogHeader>
                          <PlaceForm
                            place={editingPlace}
                            onSubmit={(data) => updateMutation.mutate({ id: place.id, data })}
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
                            data-testid={`button-delete-place-${place.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
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
                              onClick={() => deleteMutation.mutate(place.id)}
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

interface PlaceFormProps {
  place?: Place | null;
  onSubmit: (data: Partial<Place>) => void;
  isLoading: boolean;
  onCancel: () => void;
}

interface GooglePlace {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  types?: string[];
  location?: { lat: number; lng: number };
  photoReference?: string;
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
  
  // 구글 장소 검색
  const [googleSearchQuery, setGoogleSearchQuery] = useState("");
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [googleResults, setGoogleResults] = useState<GooglePlace[]>([]);
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

  // 구글에서 장소 검색
  const searchGooglePlaces = async () => {
    if (!googleSearchQuery.trim()) return;
    
    setIsSearchingGoogle(true);
    try {
      const res = await fetch(`/api/search-places?query=${encodeURIComponent(googleSearchQuery)}`);
      if (!res.ok) {
        alert("검색 실패");
        return;
      }
      const data = await res.json();
      setGoogleResults(data.places || []);
      if (data.places.length === 0) {
        alert("검색 결과가 없습니다");
      }
    } catch (error) {
      alert("검색 중 오류가 발생했습니다");
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  // 구글 장소 상세 정보 가져와서 폼에 채우기
  const selectGooglePlace = async (googlePlace: GooglePlace) => {
    setIsFetchingDetails(true);
    try {
      const res = await fetch(`/api/place-details/${googlePlace.placeId}`);
      if (!res.ok) {
        // 상세 정보 없으면 기본 정보만 사용
        setFormData(prev => ({
          ...prev,
          name: googlePlace.name,
          address: googlePlace.address || "",
          latitude: googlePlace.location?.lat?.toString() || "",
          longitude: googlePlace.location?.lng?.toString() || "",
        }));
        setGoogleResults([]);
        setGoogleSearchQuery("");
        return;
      }
      
      const data = await res.json();
      setFormData(prev => ({
        ...prev,
        name: data.name || googlePlace.name,
        address: data.address || googlePlace.address || "",
        phone: data.phone || "",
        website: data.website || "",
        openingHours: data.openingHours?.join(", ") || "",
        latitude: googlePlace.location?.lat?.toString() || "",
        longitude: googlePlace.location?.lng?.toString() || "",
      }));
      setGoogleResults([]);
      setGoogleSearchQuery("");
    } catch (error) {
      // 오류 시 기본 정보만 사용
      setFormData(prev => ({
        ...prev,
        name: googlePlace.name,
        address: googlePlace.address || "",
        latitude: googlePlace.location?.lat?.toString() || "",
        longitude: googlePlace.location?.lng?.toString() || "",
      }));
      setGoogleResults([]);
      setGoogleSearchQuery("");
    } finally {
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
      {/* 구글 맵 장소 검색 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-3">
        <Label className="text-blue-700 dark:text-blue-300 font-medium">
          🔍 구글 맵에서 장소 검색
        </Label>
        <div className="flex gap-2">
          <Input
            value={googleSearchQuery}
            onChange={(e) => setGoogleSearchQuery(e.target.value)}
            placeholder="장소 이름 검색 (예: 예수상, Christ Statue)"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchGooglePlaces())}
            data-testid="input-google-search"
          />
          <Button
            type="button"
            onClick={searchGooglePlaces}
            disabled={isSearchingGoogle || !googleSearchQuery.trim()}
            data-testid="button-search-google"
          >
            {isSearchingGoogle ? <Loader2 className="h-4 w-4 animate-spin" /> : "검색"}
          </Button>
        </div>
        
        {googleResults.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border max-h-60 overflow-y-auto">
            {googleResults.map((gPlace) => (
              <div
                key={gPlace.placeId}
                className="p-3 border-b last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                onClick={() => selectGooglePlace(gPlace)}
                data-testid={`google-result-${gPlace.placeId}`}
              >
                <div className="font-medium text-sm">{gPlace.name}</div>
                <div className="text-xs text-muted-foreground">{gPlace.address}</div>
                {gPlace.rating && (
                  <div className="text-xs text-amber-600">⭐ {gPlace.rating} ({gPlace.userRatingsTotal}개 리뷰)</div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {isFetchingDetails && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            상세 정보 가져오는 중...
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
