import ReactDOM from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChevronDown, ChevronUp, FileText, Calendar, Trash2, Download, ChevronRight, Pencil, Check, X, ImagePlus, Loader2, Heart, Plus, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { EcoProfile } from "@shared/schema";
import { useState, useRef, useMemo, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import { useQuotes } from "@/hooks/use-quotes";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { type QuoteBreakdown, type Quote } from "@shared/schema";
import html2canvas from "html2canvas";
import logoImage from "@assets/BackgroundEraser_20240323_103507859_1768997960669.png";

interface QuoteItemProps {
  quote: Quote;
  language: string;
  currencyInfo: { code: string; symbol: string; locale: string };
  exchangeRate: number;
  onDelete: (id: number) => void;
  isDeleting: boolean;
  isAdmin: boolean;
  onToggleDeposit: (id: number, depositPaid: boolean) => void;
  onLoad?: (quote: Quote) => void;
  ecoProfiles?: EcoProfile[];
  userGender?: string;
  ecoPrices?: { price12: number; price22: number };
}

interface SavedQuotesListProps {
  onLoad?: (quote: Quote) => void;
}

function QuoteItem({ quote, language, currencyInfo, exchangeRate, onDelete, isDeleting, isAdmin, onToggleDeposit, onLoad, ecoProfiles = [], userGender, ecoPrices = { price12: 220, price22: 380 } }: QuoteItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [depositPaid, setDepositPaid] = useState(quote.depositPaid || false);
  const detailRef = useRef<HTMLDivElement>(null);
  const breakdown = quote.breakdown as QuoteBreakdown;
  const [isCapturing, setIsCapturing] = useState(false);

  const [customerName, setCustomerName] = useState<string>(quote.customerName);
  const [depositAmount, setDepositAmount] = useState<number>(quote.depositAmount || Math.round(quote.totalPrice * 0.5));
  const [villaAdjustments, setVillaAdjustments] = useState<Record<number, number>>({});
  const [vehicleAdjustments, setVehicleAdjustments] = useState<Record<number, number>>({});
  const [golfAdjustments, setGolfAdjustments] = useState<Record<number, { unitPrice: number, players: number }>>({});
  const [guideAdjustment, setGuideAdjustment] = useState<number | null>(null);
  const [memo, setMemo] = useState<string>(quote.memo || "");
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const [memoImages, setMemoImages] = useState<string[]>((quote.memoImages as string[]) || []);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [ecoPickOpen, setEcoPickOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSavingEcoPicks, setIsSavingEcoPicks] = useState(false);

  type PersonPick = { first: number | null; second: number | null; third: number | null };
  type EcoPicksMap = Record<string, PersonPick[]>;
  type EcoSelection = { date: string; hours: string; count: number };
  const priorityLabels = language === "ko" ? ["1지망", "2지망", "3지망"] : ["1st", "2nd", "3rd"];
  const priorityKeys: Array<keyof PersonPick> = ["first", "second", "third"];
  const priorityColors = ["bg-pink-500", "bg-orange-400", "bg-blue-400"];
  const defaultPersonLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const [personNames, setPersonNames] = useState<string[]>(() => {
    const saved = (quote.ecoPicks as any)?.personNames;
    return Array.isArray(saved) ? saved : [...defaultPersonLabels];
  });
  const [editingPersonIdx, setEditingPersonIdx] = useState<number | null>(null);
  const [editingPersonName, setEditingPersonName] = useState("");

  const isMaleUser = userGender === "male";

  const origEcoSelections = useMemo(() => {
    const eco = (breakdown as any)?.ecoGirl;
    if (!eco) return [] as EcoSelection[];
    if (Array.isArray(eco.selections) && eco.selections.length > 0) {
      return eco.selections as EcoSelection[];
    }
    if (Array.isArray(eco.details) && eco.details.length > 0) {
      const parsed: EcoSelection[] = [];
      for (const detail of eco.details) {
        const m = String(detail).match(/^(\d{4}-\d{2}-\d{2}):\s*(\d+)시간\s*x\s*(\d+)명/);
        if (m) {
          parsed.push({ date: m[1], hours: m[2] as "12" | "22", count: parseInt(m[3]) });
        }
      }
      if (parsed.length > 0) return parsed;
    }
    return [] as EcoSelection[];
  }, [breakdown]);

  const [editableEcoSelections, setEditableEcoSelections] = useState<EcoSelection[]>([...origEcoSelections]);

  useEffect(() => {
    setEditableEcoSelections([...origEcoSelections]);
  }, [origEcoSelections]);

  const ecoSelections = editableEcoSelections;

  const migrateOldPicks = (raw: any, selections: EcoSelection[]): EcoPicksMap => {
    if (!raw || typeof raw !== "object") return {};
    const result: EcoPicksMap = {};
    for (const [date, val] of Object.entries(raw)) {
      const v = val as any;
      if (Array.isArray(v)) {
        result[date] = v.map((item: any) => {
          if (item && typeof item === "object" && !Array.isArray(item) && ("first" in item || "second" in item || "third" in item)) {
            return { first: item.first ?? null, second: item.second ?? null, third: item.third ?? null };
          }
          return { first: null, second: null, third: null };
        });
      } else if (v && typeof v === "object" && !Array.isArray(v) && (v.first || v.second || v.third)) {
        const firstArr = Array.isArray(v.first) ? v.first : [];
        const secondArr = Array.isArray(v.second) ? v.second : [];
        const thirdArr = Array.isArray(v.third) ? v.third : [];
        const sel = selections.find(s => s.date === date);
        const cnt = sel?.count || Math.max(firstArr.length, secondArr.length, thirdArr.length, 1);
        const persons: PersonPick[] = [];
        for (let i = 0; i < cnt; i++) {
          persons.push({
            first: firstArr[i] ?? null,
            second: secondArr[i] ?? null,
            third: thirdArr[i] ?? null,
          });
        }
        result[date] = persons;
      }
    }
    return result;
  };

  const initEcoPicks = (): EcoPicksMap => {
    const raw = quote.ecoPicks as any;
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      return migrateOldPicks(raw, origEcoSelections);
    }
    if (Array.isArray(raw) && raw.length > 0 && origEcoSelections.length > 0) {
      return migrateOldPicks({ [origEcoSelections[0].date]: { first: raw, second: [], third: [] } }, origEcoSelections);
    }
    return {};
  };
  const [selectedEcoPicks, setSelectedEcoPicks] = useState<EcoPicksMap>(initEcoPicks);
  const [activePickDate, setActivePickDate] = useState<string>(ecoSelections[0]?.date || "");
  const [activePersonIndex, setActivePersonIndex] = useState<number>(0);

  useEffect(() => {
    if (ecoSelections.length > 0) {
      const validDates = ecoSelections.map(s => s.date);
      if (!activePickDate || !validDates.includes(activePickDate)) {
        setActivePickDate(ecoSelections[0].date);
        setActivePersonIndex(0);
      }
    }
  }, [ecoSelections]);

  const ensurePersonSlots = (picks: EcoPicksMap, date: string, count: number): PersonPick[] => {
    const existing = picks[date] || [];
    const result = [...existing];
    while (result.length < count) result.push({ first: null, second: null, third: null });
    return result.slice(0, count);
  };

  const allPickedProfileIds = useMemo(() => {
    const ids: number[] = [];
    Object.values(selectedEcoPicks).forEach(persons => {
      persons.forEach(p => {
        if (p.first) ids.push(p.first);
        if (p.second) ids.push(p.second);
        if (p.third) ids.push(p.third);
      });
    });
    return ids;
  }, [selectedEcoPicks]);

  const ecoTotalPrice = useMemo(() => {
    let total = 0;
    for (const sel of editableEcoSelections) {
      const rate = sel.hours === "22" ? ecoPrices.price22 : ecoPrices.price12;
      total += rate * sel.count;
    }
    return total;
  }, [editableEcoSelections, ecoPrices]);

  const handleAddEcoSelection = () => {
    const checkIn = quote.checkInDate || "";
    const checkOut = quote.checkOutDate || "";
    let newDate = "";
    if (checkIn) {
      const existingDates = editableEcoSelections.map(s => s.date);
      const start = new Date(checkIn);
      const end = checkOut ? new Date(checkOut) : new Date(start.getTime() + 7 * 86400000);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const ds = d.toISOString().split("T")[0];
        if (!existingDates.includes(ds)) { newDate = ds; break; }
      }
      if (!newDate) newDate = new Date(end.getTime() + 86400000).toISOString().split("T")[0];
    } else {
      newDate = new Date().toISOString().split("T")[0];
    }
    const lastCount = editableEcoSelections.length > 0 ? editableEcoSelections[editableEcoSelections.length - 1].count : 1;
    const lastHours = editableEcoSelections.length > 0 ? editableEcoSelections[editableEcoSelections.length - 1].hours : "12";
    const newSel: EcoSelection = { date: newDate, hours: lastHours, count: lastCount };
    setEditableEcoSelections(prev => [...prev, newSel]);
    setActivePickDate(newDate);
    setActivePersonIndex(0);
  };

  const handleRemoveEcoSelection = (date: string) => {
    setEditableEcoSelections(prev => prev.filter(s => s.date !== date));
    setSelectedEcoPicks(prev => {
      const updated = { ...prev };
      delete updated[date];
      return updated;
    });
    if (activePickDate === date) {
      const remaining = editableEcoSelections.filter(s => s.date !== date);
      setActivePickDate(remaining[0]?.date || "");
      setActivePersonIndex(0);
    }
  };

  const handleUpdateEcoSelection = (date: string, field: "hours" | "count" | "date", value: string | number) => {
    setEditableEcoSelections(prev => prev.map(s => {
      if (s.date !== date) return s;
      if (field === "date") {
        const newDate = String(value);
        if (editableEcoSelections.some(es => es.date === newDate && es.date !== date)) return s;
        setSelectedEcoPicks(prevPicks => {
          const updated = { ...prevPicks };
          if (updated[date]) {
            updated[newDate] = updated[date];
            delete updated[date];
          }
          return updated;
        });
        if (activePickDate === date) setActivePickDate(newDate);
        return { ...s, date: newDate };
      }
      if (field === "count") {
        const newCount = Math.max(1, Number(value));
        if (newCount < s.count) {
          setSelectedEcoPicks(prevPicks => {
            const persons = (prevPicks[date] || []).slice(0, newCount);
            return { ...prevPicks, [date]: persons };
          });
          if (activePersonIndex >= newCount) setActivePersonIndex(newCount - 1);
        }
        return { ...s, count: newCount };
      }
      if (field === "hours") return { ...s, hours: String(value) };
      return s;
    }));
  };

  const handleToggleEcoPick = (profileId: number, date: string, personIdx: number, priority: keyof PersonPick) => {
    setSelectedEcoPicks(prev => {
      const sel = ecoSelections.find(s => s.date === date);
      const cnt = sel?.count || 1;
      const persons = ensurePersonSlots(prev, date, cnt).map(p => ({ ...p }));
      const person = persons[personIdx];
      if (person[priority] === profileId) {
        person[priority] = null;
      } else {
        if (priority === "first") {
          for (let i = 0; i < persons.length; i++) {
            if (i !== personIdx && persons[i].first === profileId) {
              persons[i].first = null;
            }
          }
        }
        for (const pk of priorityKeys) {
          if (person[pk] === profileId) person[pk] = null;
        }
        person[priority] = profileId;
      }
      return { ...prev, [date]: persons };
    });
  };

  const handleSaveEcoPicks = async () => {
    setIsSavingEcoPicks(true);
    try {
      await apiRequest("PATCH", `/api/quotes/${quote.id}/eco-schedule`, {
        ecoSelections: editableEcoSelections.map(s => ({ date: s.date, hours: s.hours, count: s.count })),
        ecoPicks: selectedEcoPicks,
        personNames: personNames,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      setEcoPickOpen(false);
    } catch (error) {
      console.error("Failed to save eco picks:", error);
    } finally {
      setIsSavingEcoPicks(false);
    }
  };

  const parsePrice = (detail: string): number => {
    const match = detail.match(/\$(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const villaDetailsPriceOnly = useMemo(() => {
    if (!breakdown?.villa?.details) return [];
    return breakdown.villa.details
      .map((d: string, origIdx: number) => ({ detail: d, origIdx }))
      .filter((item: { detail: string; origIdx: number }) => item.detail.includes(": $"));
  }, [breakdown?.villa?.details]);

  const getAdjustedVillaTotal = () => {
    if (!villaDetailsPriceOnly.length) return breakdown?.villa?.price || 0;
    let total = 0;
    villaDetailsPriceOnly.forEach((item: { detail: string; origIdx: number }) => {
      const originalPrice = parsePrice(item.detail);
      total += villaAdjustments[item.origIdx] !== undefined ? villaAdjustments[item.origIdx] : originalPrice;
    });
    return total;
  };

  const getAdjustedVehicleTotal = () => {
    if (!breakdown?.vehicle?.description) return breakdown?.vehicle?.price || 0;
    const details = breakdown.vehicle.description.split(" | ");
    let total = 0;
    details.forEach((detail, idx) => {
      const originalPrice = parsePrice(detail);
      total += vehicleAdjustments[idx] !== undefined ? vehicleAdjustments[idx] : originalPrice;
    });
    return total;
  };

  const parseGolfDetails = (description: string) => {
    if (!description) return [];
    return description.split(" | ").map(item => {
      // Format: "날짜 / 골프장명 / $가격 x 인원명 = $소계 (캐디팁: 팁/인)"
      const parts = item.split(" / ");
      const date = parts[0] || "";
      const courseName = parts[1] || "";
      
      // Extract price info and caddy tip
      const priceInfo = parts[2] || "";
      const subtotalMatch = priceInfo.match(/= \$(\d+)/);
      const subtotal = subtotalMatch ? parseInt(subtotalMatch[1]) : 0;
      
      const playersMatch = priceInfo.match(/x (\d+)명/);
      const players = playersMatch ? playersMatch[1] : "1";
      
      const unitPriceMatch = priceInfo.match(/\$(\d+) x/);
      const unitPrice = unitPriceMatch ? unitPriceMatch[1] : "0";
      
      const tipMatch = priceInfo.match(/캐디팁: ([^)]+)/);
      let caddyTip = tipMatch ? tipMatch[1] : "";
      // 중복된 "/인" 제거 - "50만동/인/인/인" -> "50만동/인"
      caddyTip = caddyTip.replace(/(\/(인|person|人|người|чел|名))+/gi, "/인");
      
      return {
        date,
        courseName,
        players,
        unitPrice,
        caddyTip,
        price: subtotal,
        text: item
      };
    });
  };

  const getAdjustedGolfTotal = () => {
    if (!breakdown?.golf?.description) return breakdown?.golf?.price || 0;
    const details = parseGolfDetails(breakdown.golf.description);
    let total = 0;
    details.forEach((detail, idx) => {
      const adj = golfAdjustments[idx];
      if (adj) {
        total += adj.unitPrice * adj.players;
      } else {
        total += parseInt(detail.unitPrice) * parseInt(detail.players);
      }
    });
    return total;
  };

  const villaTotal = getAdjustedVillaTotal();
  const vehicleTotal = getAdjustedVehicleTotal();
  const golfTotal = getAdjustedGolfTotal();
  const guideTotal = guideAdjustment !== null ? guideAdjustment : (breakdown?.guide?.price || 0);
  const villaAdjustment = villaTotal - (breakdown?.villa?.price || 0);
  const vehicleAdjustment = vehicleTotal - (breakdown?.vehicle?.price || 0);
  const golfAdjustmentDiff = golfTotal - (breakdown?.golf?.price || 0);
  const guideAdjustmentDiff = guideTotal - (breakdown?.guide?.price || 0);
  const adjustedTotal = quote.totalPrice + villaAdjustment + vehicleAdjustment + golfAdjustmentDiff + guideAdjustmentDiff;
  const balanceAmount = adjustedTotal - depositAmount;

  const formatLocalCurrency = (usd: number) => {
    if (currencyInfo.code === "USD") return `$ ${usd.toLocaleString()}`;
    const converted = Math.round(usd * exchangeRate);
    return `${currencyInfo.symbol} ${new Intl.NumberFormat(currencyInfo.locale).format(converted)}`;
  };

  const resetEdits = () => {
    setCustomerName(quote.customerName);
    setVillaAdjustments({});
    setVehicleAdjustments({});
    setGolfAdjustments({});
    setGuideAdjustment(null);
    setDepositAmount(Math.round(quote.totalPrice * 0.5));
    setIsEditing(false);
  };

  const handleDownloadImage = async () => {
    if (!detailRef.current) return;
    setIsCapturing(true);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const canvas = await html2canvas(detailRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `quote-${customerName}-${format(new Date(quote.createdAt || new Date()), "yyyyMMdd")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to download image:", error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleToggleDeposit = () => {
    const newStatus = !depositPaid;
    setDepositPaid(newStatus);
    onToggleDeposit(quote.id, newStatus);
  };

  const handleSaveMemo = async () => {
    setIsSavingMemo(true);
    try {
      await apiRequest("PATCH", `/api/quotes/${quote.id}/memo`, { memo });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    } catch (error) {
      console.error("Failed to save memo:", error);
    } finally {
      setIsSavingMemo(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploadingImage(true);
    try {
      const newImages: string[] = [...memoImages];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const urlRes = await fetch("/api/uploads/request-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            size: file.size,
            contentType: file.type,
          }),
        });
        
        if (!urlRes.ok) throw new Error("Failed to get upload URL");
        
        const { uploadURL, objectPath } = await urlRes.json();
        
        await fetch(uploadURL, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });
        
        newImages.push(objectPath);
      }
      
      await apiRequest("PATCH", `/api/quotes/${quote.id}/memo-images`, { memoImages: newImages });
      setMemoImages(newImages);
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    } catch (error) {
      console.error("Failed to upload image:", error);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteImage = async (index: number) => {
    const newImages = memoImages.filter((_, i) => i !== index);
    try {
      await apiRequest("PATCH", `/api/quotes/${quote.id}/memo-images`, { memoImages: newImages });
      setMemoImages(newImages);
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };

  const handleSaveEdit = async () => {
    try {
      // 수정된 breakdown 생성
      const updatedBreakdown = { ...breakdown };
      
      // Villa 수정 반영
      if (breakdown?.villa) {
        const villaDetails = breakdown.villa.details || [];
        const updatedVillaDetails = villaDetails.map((detail: string, idx: number) => {
          if (!detail.includes(": $")) return detail;
          if (villaAdjustments[idx] !== undefined) {
            const dayMatch = detail.match(/^([^:]+):/);
            const dayName = dayMatch ? dayMatch[1] : "";
            return `${dayName}: $${villaAdjustments[idx]}`;
          }
          return detail;
        });
        updatedBreakdown.villa = {
          ...breakdown.villa,
          price: villaTotal,
          details: updatedVillaDetails
        };
      }
      
      // Vehicle 수정 반영
      if (breakdown?.vehicle) {
        const vehicleDetails = breakdown.vehicle.description.split(" | ");
        const updatedVehicleDescriptions = vehicleDetails.map((detail: string, idx: number) => {
          const currentPrice = vehicleAdjustments[idx] !== undefined ? vehicleAdjustments[idx] : parsePrice(detail);
          // 기존 description에서 가격 부분만 수정
          return detail.replace(/\$\d+/, `$${currentPrice}`);
        });
        updatedBreakdown.vehicle = {
          ...breakdown.vehicle,
          price: vehicleTotal,
          description: updatedVehicleDescriptions.join(" | ")
        };
      }
      
      // Golf 수정 반영
      if (breakdown?.golf) {
        const golfDetails = parseGolfDetails(breakdown.golf.description);
        const updatedGolfDescriptions = golfDetails.map((detail, idx) => {
          const adj = golfAdjustments[idx];
          const unitPrice = adj ? adj.unitPrice : parseInt(detail.unitPrice);
          const players = adj ? adj.players : parseInt(detail.players);
          const subtotal = unitPrice * players;
          return `${detail.date} / ${detail.courseName} / $${unitPrice} x ${players}명 = $${subtotal} (캐디팁: ${detail.caddyTip})`;
        });
        updatedBreakdown.golf = {
          ...breakdown.golf,
          price: golfTotal,
          description: updatedGolfDescriptions.join(" | ")
        };
      }
      
      // Guide 수정 반영
      if (breakdown?.guide && guideAdjustment !== null) {
        updatedBreakdown.guide = {
          ...breakdown.guide,
          price: guideTotal
        };
      }
      
      updatedBreakdown.total = adjustedTotal;
      
      await apiRequest("PATCH", `/api/quotes/${quote.id}/total`, { 
        totalPrice: adjustedTotal,
        breakdown: updatedBreakdown,
        depositAmount: depositAmount
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      setVillaAdjustments({});
      setVehicleAdjustments({});
      setGolfAdjustments({});
      setGuideAdjustment(null);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save quote:", error);
    }
  };

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors ${
        depositPaid 
          ? "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700" 
          : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
      }`}
      data-testid={`quote-item-${quote.id}`}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 cursor-pointer hover-elevate">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${isExpanded ? "rotate-90" : ""}`} />
              {depositPaid && (
                <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full shrink-0">
                  {language === "ko" ? "입금" : "Paid"}
                </span>
              )}
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                {customerName}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {depositPaid ? (
                <div className="flex flex-col items-end text-[10px]">
                  <span className="text-amber-600 dark:text-amber-400">
                    {language === "ko" ? "예약금" : "Deposit"}: ${Math.round(quote.totalPrice * 0.5).toLocaleString()}
                  </span>
                  <span className="text-green-600 dark:text-green-400">
                    {language === "ko" ? "잔금" : "Balance"}: ${Math.round(quote.totalPrice * 0.5).toLocaleString()}
                  </span>
                </div>
              ) : (
                <span className="font-bold text-primary">
                  ${quote.totalPrice.toLocaleString()}
                </span>
              )}
              {onLoad && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-primary hover:text-primary/80 hover:bg-primary/10 h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    // 수정된 breakdown 생성
                    const updatedBreakdown = { ...breakdown };
                    
                    // Vehicle 수정 반영
                    if (breakdown?.vehicle && isExpanded) {
                      const vehicleParts = breakdown.vehicle.description.split(" | ");
                      let vehicleTotal = 0;
                      const updatedVehicleDescriptions = vehicleParts.map((detail: string, idx: number) => {
                        const currentPrice = vehicleAdjustments[idx] !== undefined ? vehicleAdjustments[idx] : parsePrice(detail);
                        vehicleTotal += currentPrice;
                        const parts = detail.split(" / ");
                        return `${parts[0]} / ${parts[1]} / ${parts[2]} / $${currentPrice}`;
                      });
                      updatedBreakdown.vehicle = {
                        ...breakdown.vehicle,
                        price: vehicleTotal,
                        description: updatedVehicleDescriptions.join(" | ")
                      };
                    }
                    
                    // Golf 수정 반영
                    if (breakdown?.golf && isExpanded) {
                      const golfDetails = parseGolfDetails(breakdown.golf.description);
                      let golfTotal = 0;
                      const updatedGolfDescriptions = golfDetails.map((detail: any, idx: number) => {
                        const adj = golfAdjustments[idx];
                        const unitPrice = adj ? adj.unitPrice : parseInt(detail.unitPrice);
                        const players = adj ? adj.players : parseInt(detail.players);
                        const subtotal = unitPrice * players;
                        golfTotal += subtotal;
                        return `${detail.date} / ${detail.courseName} / $${unitPrice} x ${players}명 = $${subtotal} (캐디팁: ${detail.caddyTip})`;
                      });
                      updatedBreakdown.golf = {
                        ...breakdown.golf,
                        price: golfTotal,
                        description: updatedGolfDescriptions.join(" | ")
                      };
                    }
                    
                    // 총 금액 계산
                    const newTotal = (updatedBreakdown.villa?.price || 0) + 
                                     (updatedBreakdown.vehicle?.price || 0) + 
                                     (updatedBreakdown.golf?.price || 0) + 
                                     (updatedBreakdown.guide?.price || 0) + 
                                     (updatedBreakdown.fastTrack?.price || 0) + 
                                     (updatedBreakdown.ecoGirl?.price || 0);
                    updatedBreakdown.total = newTotal;
                    
                    onLoad({ ...quote, breakdown: updatedBreakdown, totalPrice: newTotal });
                  }}
                  data-testid={`button-load-quote-${quote.id}`}
                  title={language === "ko" ? "불러오기" : "Load"}
                >
                  <Download className="w-4 h-4 rotate-180" />
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 w-8"
                    onClick={(e) => e.stopPropagation()}
                    disabled={isDeleting}
                    data-testid={`button-delete-quote-${quote.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {language === "ko" ? "견적서 삭제" : "Delete Quote"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {language === "ko" 
                        ? `"${customerName}" 견적서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.` 
                        : `Are you sure you want to delete the quote for "${customerName}"? This action cannot be undone.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {language === "ko" ? "취소" : "Cancel"}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(quote.id)}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      {language === "ko" ? "삭제" : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-slate-200 dark:border-slate-600 p-3 space-y-3">
            <div className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resetEdits}
                    className="h-7 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    {language === "ko" ? "취소" : "Cancel"}
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleSaveEdit}
                    className="h-7 text-xs"
                  >
                    <Check className="w-3 h-3 mr-1" />
                    {language === "ko" ? "저장" : "Save"}
                  </Button>
                </>
              ) : isAdmin ? (
                <>
                  <Button
                    size="sm"
                    variant={depositPaid ? "default" : "outline"}
                    onClick={handleToggleDeposit}
                    className={`h-7 text-xs ${depositPaid ? "bg-green-500 hover:bg-green-600" : ""}`}
                    data-testid={`button-toggle-deposit-${quote.id}`}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    {language === "ko" ? (depositPaid ? "입금완료" : "입금대기") : (depositPaid ? "Paid" : "Unpaid")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="h-7 text-xs"
                    data-testid={`button-edit-quote-${quote.id}`}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    {language === "ko" ? "수정" : "Edit"}
                  </Button>
                </>
              ) : null}
            </div>

            <div 
              ref={detailRef}
              className="bg-white rounded-lg overflow-hidden shadow-lg"
              style={{ maxWidth: "400px" }}
            >
              <div className="h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-primary" />
              <div className="bg-primary/5 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {language === "ko" ? "여행 견적서" : "Travel Quote"}
                    </span>
                    <span className="text-2xl text-primary font-bold">
                      ${adjustedTotal.toLocaleString()}
                    </span>
                    {currencyInfo.code !== "USD" && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm text-primary/70 font-semibold">
                          ≈ {formatLocalCurrency(adjustedTotal)}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {language === "ko" ? "환율" : "Rate"}: {currencyInfo.symbol} {exchangeRate.toLocaleString()}/USD
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <img 
                      src={logoImage} 
                      alt="붕따우 도깨비" 
                      className="w-16 h-16 object-contain"
                    />
                    <div className="flex items-center gap-1">
                      <div className="rounded p-1 text-center bg-amber-50 border border-amber-200">
                        <span className="text-[7px] font-medium text-amber-700 block">
                          {language === "ko" ? "예약금" : "Deposit"}
                        </span>
                        {isEditing && !isCapturing ? (
                          <div className="flex items-center">
                            <span className="text-[9px] font-bold text-amber-800">$</span>
                            <input
                              type="number"
                              min="0"
                              value={depositAmount === 0 ? "" : depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value === "" ? 0 : parseInt(e.target.value))}
                              className="w-12 text-center text-[9px] font-bold text-amber-800 bg-white border border-amber-300 rounded px-0.5"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-amber-800">
                            ${depositAmount.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="rounded p-1 text-center bg-green-50 border border-green-200">
                        <span className="text-[7px] font-medium text-green-700 block">
                          {language === "ko" ? "잔금" : "Balance"}
                        </span>
                        <span className="text-[9px] font-bold text-green-800">
                          ${balanceAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pb-2 border-b border-slate-100">
                  <Calendar className="w-3 h-3" />
                  <span>{language === "ko" ? "고객명" : "Customer"}: </span>
                  {isEditing && !isCapturing ? (
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="font-medium text-slate-800 bg-white border border-slate-300 rounded px-1 w-20"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="font-medium text-slate-800">{customerName}</span>
                  )}
                  <span className="mx-1">|</span>
                  <span>{quote.createdAt ? format(new Date(quote.createdAt), "yyyy-MM-dd") : "-"}</span>
                </div>

                {breakdown?.villa?.price > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between font-semibold text-sm text-slate-800">
                      <span>{language === "ko" ? "풀빌라" : "Villa"}{breakdown.villa.rooms && breakdown.villa.rooms > 0 ? ` (${breakdown.villa.rooms}룸)` : ""}</span>
                      <span>${villaTotal.toLocaleString()}</span>
                    </div>
                    {breakdown.villa.checkIn && breakdown.villa.checkOut && (
                      <div className="text-[10px] text-primary font-medium pl-2">
                        {breakdown.villa.checkIn} ~ {breakdown.villa.checkOut}
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground space-y-1 pl-2">
                      {villaDetailsPriceOnly.map((item: { detail: string; origIdx: number }) => {
                        const originalPrice = parsePrice(item.detail);
                        const currentPrice = villaAdjustments[item.origIdx] !== undefined ? villaAdjustments[item.origIdx] : originalPrice;
                        const dateMatch = item.detail.match(/^([^:]+):/);
                        const dateLabel = dateMatch ? dateMatch[1] : "";
                        
                        return (
                          <div key={item.origIdx} className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-primary/40" />
                            <span className="flex-1">{dateLabel}</span>
                            {isEditing && !isCapturing ? (
                              <div className="flex items-center">
                                <span className="font-medium">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={currentPrice === 0 ? "" : currentPrice}
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                    setVillaAdjustments(prev => ({ ...prev, [item.origIdx]: val }));
                                  }}
                                  className="w-14 text-center text-[10px] font-medium bg-white border border-slate-300 rounded px-1"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            ) : (
                              <span className="font-medium">${currentPrice}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {breakdown?.vehicle?.price > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between font-semibold text-sm text-slate-800">
                      <span>{language === "ko" ? "차량" : "Vehicle"}</span>
                      <span>${vehicleTotal.toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground space-y-1 pl-2">
                      {breakdown.vehicle.description.split(" | ").map((detail, idx) => {
                        const originalPrice = parsePrice(detail);
                        const currentPrice = vehicleAdjustments[idx] !== undefined ? vehicleAdjustments[idx] : originalPrice;
                        const dateMatch = detail.match(/^(\d{4}-\d{2}-\d{2})/);
                        const dateLabel = dateMatch ? dateMatch[1] : `Day ${idx + 1}`;
                        const routeMatch = detail.match(/\((.*?)\)/);
                        const routeInfo = routeMatch ? routeMatch[1] : "";
                        
                        return (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-primary/40" />
                            <span className="flex-1">{dateLabel} {routeInfo && `(${routeInfo})`}</span>
                            {isEditing && !isCapturing ? (
                              <div className="flex items-center">
                                <span className="font-medium">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={currentPrice === 0 ? "" : currentPrice}
                                  onChange={(e) => {
                                    const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                                    setVehicleAdjustments(prev => ({ ...prev, [idx]: val }));
                                  }}
                                  className="w-14 text-center text-[10px] font-medium bg-white border border-slate-300 rounded px-1"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            ) : (
                              <span className="font-medium">${currentPrice}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {breakdown?.golf?.price > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between font-semibold text-sm text-slate-800">
                      <span>{language === "ko" ? "골프" : "Golf"}</span>
                      <span>${golfTotal.toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground pl-2 space-y-2">
                      {parseGolfDetails(breakdown.golf.description).map((detail, idx) => {
                        const adj = golfAdjustments[idx];
                        const displayUnitPrice = adj ? adj.unitPrice : parseInt(detail.unitPrice);
                        const displayPlayers = adj ? adj.players : parseInt(detail.players);
                        const displayTotal = displayUnitPrice * displayPlayers;
                        return (
                          <div key={idx} className="border-l-2 border-primary/20 pl-2 py-1">
                            <div className="font-medium text-slate-700 dark:text-slate-300">
                              {detail.date}
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              {isEditing && !isCapturing ? (
                                <>
                                  <span>{detail.courseName}</span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="text-[10px]">$</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={displayUnitPrice === 0 ? "" : displayUnitPrice}
                                      onChange={(e) => setGolfAdjustments(prev => ({
                                        ...prev,
                                        [idx]: {
                                          unitPrice: e.target.value === "" ? 0 : parseInt(e.target.value),
                                          players: prev[idx]?.players ?? parseInt(detail.players)
                                        }
                                      }))}
                                      className="w-12 text-right text-[10px] bg-white border border-slate-300 rounded px-1"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="text-[10px]">x</span>
                                    <input
                                      type="number"
                                      min="1"
                                      value={displayPlayers === 0 ? "" : displayPlayers}
                                      onChange={(e) => setGolfAdjustments(prev => ({
                                        ...prev,
                                        [idx]: {
                                          unitPrice: prev[idx]?.unitPrice ?? parseInt(detail.unitPrice),
                                          players: e.target.value === "" ? 1 : parseInt(e.target.value)
                                        }
                                      }))}
                                      className="w-8 text-right text-[10px] bg-white border border-slate-300 rounded px-1"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="text-[10px]">{language === "ko" ? "명" : "p"}</span>
                                    <span className="text-[10px] font-medium ml-1">= ${displayTotal.toLocaleString()}</span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <span>{detail.courseName} / {displayPlayers}명 (${displayUnitPrice} x {displayPlayers})</span>
                                  <span className="shrink-0 font-medium">${displayTotal.toLocaleString()}</span>
                                </>
                              )}
                            </div>
                            {detail.caddyTip && (
                              <div className="text-[9px] text-amber-600 dark:text-amber-400">
                                {language === "ko" ? "캐디팁" : "Caddy Tip"}: {detail.caddyTip}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {breakdown?.guide?.price > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between font-semibold text-sm text-slate-800">
                      <span>{language === "ko" ? "가이드" : "Guide"}</span>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <span>$</span>
                          <input
                            type="number"
                            className="w-20 px-1 py-0.5 text-right border rounded text-sm"
                            value={guideAdjustment !== null ? guideAdjustment : breakdown.guide.price}
                            onChange={(e) => setGuideAdjustment(parseInt(e.target.value) || 0)}
                          />
                        </div>
                      ) : (
                        <span>${guideTotal.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground pl-2">
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-primary/40" />
                        <span>{breakdown.guide.description}</span>
                      </div>
                    </div>
                  </div>
                )}

                {breakdown?.fastTrack?.price > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between font-semibold text-sm text-slate-800">
                      <span>{language === "ko" ? "패스트트랙" : "Fast Track"}</span>
                      <span>${breakdown.fastTrack.price.toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground pl-2">
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-primary/40" />
                        <span>{breakdown.fastTrack.description}</span>
                      </div>
                    </div>
                  </div>
                )}

                {(breakdown?.ecoGirl?.price > 0 || ((isMaleUser || isAdmin) && depositPaid)) && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center font-semibold text-sm text-slate-800">
                      <div className="flex items-center gap-2">
                        <span>{language === "ko" ? "에코" : "Eco"}</span>
                        {depositPaid && ecoProfiles.length > 0 && !isCapturing && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] px-2 text-pink-500 border-pink-300"
                            onClick={(e) => { e.stopPropagation(); setEcoPickOpen(true); }}
                            data-testid={`button-eco-pick-${quote.id}`}
                          >
                            <Heart className="w-3 h-3 mr-1" />
                            {language === "ko" ? "픽하기" : "Pick"}
                          </Button>
                        )}
                      </div>
                      <span>${(ecoTotalPrice || breakdown?.ecoGirl?.price || 0).toLocaleString()}</span>
                    </div>
                    {breakdown?.ecoGirl?.details && breakdown.ecoGirl.details.length > 0 && (
                      <div className="text-[10px] text-muted-foreground pl-2">
                        {breakdown.ecoGirl.details.map((detail: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-pink-400" />
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {(!breakdown?.ecoGirl?.details || breakdown.ecoGirl.details.length === 0) && ecoTotalPrice === 0 && (isMaleUser || isAdmin) && depositPaid && (
                      <div className="text-[10px] text-muted-foreground pl-2">
                        {language === "ko" ? "픽하기를 눌러 에코 일정을 추가하세요" : "Click Pick to add eco schedule"}
                      </div>
                    )}
                    {Object.keys(selectedEcoPicks).some(d => {
                      const p = selectedEcoPicks[d];
                      return p && ((p.first?.length || 0) + (p.second?.length || 0) + (p.third?.length || 0)) > 0;
                    }) && (
                      <div className="mt-2 pt-2 border-t border-pink-200/30 space-y-2">
                        {ecoSelections.map(sel => {
                          const dp = selectedEcoPicks[sel.date];
                          if (!dp) return null;
                          const hasAny = (dp.first?.length || 0) + (dp.second?.length || 0) + (dp.third?.length || 0) > 0;
                          if (!hasAny) return null;
                          return (
                            <div key={sel.date}>
                              <div className="text-[10px] font-semibold text-muted-foreground mb-1">{sel.date.slice(5)}</div>
                              {priorityKeys.map((pk, i) => {
                                const arr = dp[pk] || [];
                                if (arr.length === 0) return null;
                                const profiles = arr.map(id => ecoProfiles.find(p => p.id === id)).filter(Boolean) as EcoProfile[];
                                return (
                                  <div key={pk} className="mb-1">
                                    <div className="flex items-center gap-1 mb-0.5">
                                      <span className={`w-1.5 h-1.5 rounded-full ${priorityColors[i]}`} />
                                      <span className="text-[9px] font-medium text-muted-foreground">{priorityLabels[i]}</span>
                                    </div>
                                    <div className="flex gap-1.5 flex-wrap pl-2">
                                      {profiles.map(profile => (
                                        <div key={profile.id} className="relative w-12 h-12 rounded-lg overflow-hidden border border-pink-300/50">
                                          <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover" />
                                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[7px] text-white text-center py-0.5 truncate">
                                            {profile.name}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">
                      {language === "ko" ? "총 금액" : "Total"}
                    </span>
                    <span className="font-bold text-lg text-primary">
                      ${adjustedTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 text-center space-y-1">
                  <span className="text-[10px] font-semibold text-slate-600">
                    붕따우 도깨비
                  </span>
                  <div className="text-[9px] text-muted-foreground space-y-0.5">
                    <div>📞 089.932.6273</div>
                    <div>💬 카카오톡 ID: vungtau</div>
                    <div>🌐 vungtau.blog</div>
                  </div>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  {language === "ko" ? "메모 (관리자용)" : "Memo (Admin only)"}
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder={language === "ko" ? "메모를 입력하세요..." : "Enter memo..."}
                  className="w-full p-2 text-sm border rounded-md resize-none bg-white dark:bg-slate-900 dark:text-white"
                  rows={15}
                  data-testid={`textarea-memo-${quote.id}`}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button
                    onClick={handleSaveMemo}
                    size="sm"
                    disabled={isSavingMemo || memo === (quote.memo || "")}
                    data-testid={`button-save-memo-${quote.id}`}
                  >
                    {isSavingMemo
                      ? (language === "ko" ? "저장 중..." : "Saving...")
                      : (language === "ko" ? "메모 저장" : "Save Memo")}
                  </Button>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="sm"
                    variant="outline"
                    disabled={isUploadingImage}
                    data-testid={`button-add-image-${quote.id}`}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <ImagePlus className="w-4 h-4 mr-1" />
                    )}
                    {language === "ko" ? "사진 추가" : "Add Image"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                    data-testid={`input-image-${quote.id}`}
                  />
                </div>
                
                {memoImages.length > 0 && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-muted-foreground mb-2">
                      {language === "ko" ? `첨부 이미지 (${memoImages.length}장)` : `Attached Images (${memoImages.length})`}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {memoImages.map((imagePath, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imagePath}
                            alt={`Memo image ${index + 1}`}
                            className="w-full h-24 object-cover rounded-md border"
                            data-testid={`img-memo-${quote.id}-${index}`}
                          />
                          <button
                            onClick={() => handleDeleteImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`button-delete-image-${quote.id}-${index}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleDownloadImage}
              className="w-full mt-3"
              variant="outline"
              disabled={isCapturing}
              data-testid={`button-download-quote-${quote.id}`}
            >
              <Download className="w-4 h-4 mr-2" />
              {isCapturing 
                ? (language === "ko" ? "이미지 생성 중..." : "Generating...") 
                : (language === "ko" ? "이미지 다운로드" : "Download Image")}
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={ecoPickOpen} onOpenChange={(open) => { setEcoPickOpen(open); if (open) { setEditableEcoSelections([...origEcoSelections]); setSelectedEcoPicks(initEcoPicks()); if (origEcoSelections.length > 0) { setActivePickDate(origEcoSelections[0].date); } setActivePersonIndex(0); setEditingPersonIdx(null); const savedNames = (quote.ecoPicks as any)?.personNames; setPersonNames(Array.isArray(savedNames) ? savedNames : [...defaultPersonLabels]); } }}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col overflow-hidden p-0">
          <div className="flex-shrink-0 px-4 pt-3 pb-0">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-2 pr-6">
                <span className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  {language === "ko" ? "에코 픽하기" : "Eco Pick"}
                </span>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => setEcoPickOpen(false)} data-testid="button-eco-pick-cancel-top">
                    {language === "ko" ? "취소" : "Cancel"}
                  </Button>
                  <Button size="sm" onClick={handleSaveEcoPicks} disabled={isSavingEcoPicks} data-testid={`button-save-eco-picks-top-${quote.id}`}>
                    {isSavingEcoPicks ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                    {language === "ko" ? "저장" : "Save"}
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{language === "ko" ? "에코 일정" : "Eco Schedule"}</span>
                <Button variant="outline" size="sm" onClick={handleAddEcoSelection} data-testid="button-add-eco-schedule">
                  <Plus className="w-3 h-3 mr-1" />
                  {language === "ko" ? "일정 추가" : "Add"}
                </Button>
              </div>
              {editableEcoSelections.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  {language === "ko" ? "일정 추가를 눌러 에코 일정을 추가하세요" : "Click Add to create an eco schedule"}
                </div>
              )}
              <div className={editableEcoSelections.length > 2 ? "max-h-[88px] overflow-y-auto space-y-1.5 pr-1" : "space-y-1.5"}>
                {editableEcoSelections.map((sel, idx) => (
                  <div key={`${sel.date}-${idx}`} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Input type="date" value={sel.date} onChange={(e) => handleUpdateEcoSelection(sel.date, "date", e.target.value)} className="flex-1 text-xs h-8" data-testid={`eco-schedule-date-${idx}`} />
                    <Select value={sel.hours} onValueChange={(v) => handleUpdateEcoSelection(sel.date, "hours", v)}>
                      <SelectTrigger className="w-20 h-8 text-xs" data-testid={`eco-schedule-hours-${idx}`}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12h</SelectItem>
                        <SelectItem value="22">22h</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateEcoSelection(sel.date, "count", Math.max(1, sel.count - 1))} data-testid={`eco-schedule-count-minus-${idx}`}><Minus className="w-3 h-3" /></Button>
                      <span className="text-xs w-4 text-center">{sel.count}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleUpdateEcoSelection(sel.date, "count", sel.count + 1)} data-testid={`eco-schedule-count-plus-${idx}`}><Plus className="w-3 h-3" /></Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => handleRemoveEcoSelection(sel.date)} data-testid={`eco-schedule-remove-${idx}`}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
              </div>
              {editableEcoSelections.length > 0 && (
                <div className="text-right text-sm font-semibold text-pink-500">
                  {language === "ko" ? "에코 합계" : "Eco Total"}: ${ecoTotalPrice.toLocaleString()}
                </div>
              )}
            </div>
          </div>
          {editableEcoSelections.length > 0 && (
            <div className="flex flex-col flex-1 min-h-0 border-t mt-2">
              <div className="flex-shrink-0 px-4 pt-3 pb-2 space-y-2">
                <div className="flex gap-1 flex-wrap">
                  {ecoSelections.map(sel => {
                    const persons = ensurePersonSlots(selectedEcoPicks, sel.date, sel.count);
                    const totalPicked = persons.reduce((sum, p) => sum + (p.first ? 1 : 0) + (p.second ? 1 : 0) + (p.third ? 1 : 0), 0);
                    const isActive = activePickDate === sel.date;
                    return (
                      <Button key={sel.date} variant={isActive ? "default" : "outline"} size="sm" onClick={() => { setActivePickDate(sel.date); setActivePersonIndex(0); }} data-testid={`eco-pick-tab-${sel.date}`}>
                        <span>{sel.date.slice(5)}</span>
                        {totalPicked > 0 && <span className="ml-1 text-[10px] opacity-70">({totalPicked})</span>}
                      </Button>
                    );
                  })}
                </div>
                {(() => {
                  const activeSel = ecoSelections.find(s => s.date === activePickDate);
                  if (!activeSel) return null;
                  const persons = ensurePersonSlots(selectedEcoPicks, activePickDate, activeSel.count);
                  const currentPerson = persons[activePersonIndex] || { first: null, second: null, third: null };
                  return (
                    <>
                      <div className="text-xs text-muted-foreground">
                        {activeSel.date} | {activeSel.hours}{language === "ko" ? "시간" : "h"} | {activeSel.count}{language === "ko" ? "명" : " people"}
                      </div>
                      {activeSel.count > 1 && (
                        <div className="flex gap-1 flex-wrap items-center">
                          {Array.from({ length: activeSel.count }, (_, i) => {
                            const p = persons[i] || { first: null, second: null, third: null };
                            const pickCount = (p.first ? 1 : 0) + (p.second ? 1 : 0) + (p.third ? 1 : 0);
                            const isActivePerson = activePersonIndex === i;
                            return (
                              <Button key={i} variant={isActivePerson ? "default" : "outline"} size="sm" onClick={() => setActivePersonIndex(i)} onDoubleClick={() => { setEditingPersonIdx(i); setEditingPersonName(personNames[i] || defaultPersonLabels[i]); }} data-testid={`eco-pick-person-${i}`}>
                                {personNames[i] || defaultPersonLabels[i]}
                                {pickCount > 0 && <span className="ml-1 text-[10px] opacity-70">({pickCount}/3)</span>}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                      {editingPersonIdx !== null && (
                        <div className="flex gap-1 items-center">
                          <Input value={editingPersonName} onChange={(e) => setEditingPersonName(e.target.value)} className="h-7 text-xs flex-1" maxLength={10} autoFocus onKeyDown={(e) => { if (e.key === "Enter") { setPersonNames(prev => { const n = [...prev]; n[editingPersonIdx] = editingPersonName.trim() || defaultPersonLabels[editingPersonIdx]; return n; }); setEditingPersonIdx(null); } }} data-testid="input-person-name" />
                          <Button variant="default" size="sm" className="h-7 text-xs" onClick={() => { setPersonNames(prev => { const n = [...prev]; n[editingPersonIdx] = editingPersonName.trim() || defaultPersonLabels[editingPersonIdx]; return n; }); setEditingPersonIdx(null); }} data-testid="button-confirm-person-name"><Check className="w-3 h-3" /></Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEditingPersonIdx(null)} data-testid="button-cancel-person-name"><X className="w-3 h-3" /></Button>
                        </div>
                      )}
                      <div className="flex gap-1 flex-wrap">
                        {priorityKeys.map((pk, i) => {
                          const selectedId = currentPerson[pk];
                          const profile = selectedId ? ecoProfiles.find(p => p.id === selectedId) : null;
                          return (
                            <Badge key={pk} variant={selectedId ? "default" : "outline"} className={`text-xs ${selectedId ? priorityColors[i] + " text-white border-transparent" : ""}`}>
                              <span className={`w-2 h-2 rounded-full ${priorityColors[i]} mr-1 inline-block`} />
                              {priorityLabels[i]}: {profile ? profile.name : "-"}
                            </Badge>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{language === "ko" ? "사진 밑 숫자 클릭으로 1,2,3지망 선택" : "Click 1/2/3 below photo to pick"}</p>
                    </>
                  );
                })()}
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {(() => {
                  const activeSel = ecoSelections.find(s => s.date === activePickDate);
                  if (!activeSel) return null;
                  const persons = ensurePersonSlots(selectedEcoPicks, activePickDate, activeSel.count);
                  const currentPerson = persons[activePersonIndex] || { first: null, second: null, third: null };
                  return (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        {ecoProfiles.map(profile => {
                          const selectedPriority = priorityKeys.find(pk => currentPerson[pk] === profile.id);
                          const isSelectedByOther = persons.some((p, idx) => idx !== activePersonIndex && p.first === profile.id);
                          return (
                            <div key={profile.id} className={`relative rounded-lg overflow-hidden border-2 transition-all ${selectedPriority ? "border-pink-500 ring-2 ring-pink-300" : isSelectedByOther ? "border-slate-200 dark:border-slate-600 opacity-30" : "border-slate-200 dark:border-slate-600"}`} data-testid={`eco-pick-profile-${profile.id}`}>
                              <div className="aspect-[3/4] relative cursor-pointer" onClick={() => setPreviewImage(profile.imageUrl)}>
                                <img src={profile.imageUrl} alt={profile.name} className="w-full h-full object-cover" />
                                {selectedPriority && (
                                  <div className={`absolute top-1 right-1 w-6 h-6 ${priorityColors[priorityKeys.indexOf(selectedPriority)]} rounded-full flex items-center justify-center`}>
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                )}
                                {isSelectedByOther && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded">{language === "ko" ? "1지망 선택됨" : "1st Taken"}</span>
                                  </div>
                                )}
                              </div>
                              <div className="p-1 space-y-0.5">
                                <span className="text-xs font-medium truncate block text-center">{profile.name}</span>
                                <div className="flex gap-0.5 justify-center">
                                  {priorityKeys.map((pk, i) => {
                                    const isThisPri = currentPerson[pk] === profile.id;
                                    return (
                                      <button key={pk} className={`w-6 h-5 rounded text-[9px] font-bold transition-all ${isThisPri ? priorityColors[i] + " text-white" : "bg-muted text-muted-foreground"}`} onClick={(e) => { e.stopPropagation(); handleToggleEcoPick(profile.id, activePickDate, activePersonIndex, pk); }} data-testid={`eco-pick-${profile.id}-${pk}`}>
                                        {(i + 1)}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {ecoProfiles.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-8">
                          {language === "ko" ? "등록된 에코 프로필이 없습니다" : "No eco profiles available"}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {previewImage && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center" style={{ zIndex: 99999 }} onPointerDown={() => setPreviewImage(null)} data-testid="eco-preview-overlay">
          <img src={previewImage} alt="preview" className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" onPointerDown={(e) => e.stopPropagation()} />
          <div className="absolute top-4 right-4 text-white bg-black/60 rounded-full w-10 h-10 flex items-center justify-center text-xl cursor-pointer" onPointerDown={(e) => { e.stopPropagation(); setPreviewImage(null); }} data-testid="button-close-preview">&times;</div>
        </div>,
        document.body
      )}
    </div>
  );
}

export function SavedQuotesList({ onLoad }: SavedQuotesListProps) {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const { data: quotes, isLoading } = useQuotes();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: adminCheck } = useQuery<{ isAdmin: boolean; userId?: string; adminUserIds?: string[] }>({
    queryKey: ["/api/admin/check"],
  });
  const isAdmin = adminCheck?.isAdmin || false;
  const currentUserId = adminCheck?.userId;
  const adminUserIds = adminCheck?.adminUserIds || [];

  const { data: exchangeRatesData } = useQuery<{ rates: Record<string, number>; timestamp: number }>({
    queryKey: ["/api/exchange-rates"],
    staleTime: 12 * 60 * 60 * 1000,
  });

  const { data: ecoProfilesData } = useQuery<EcoProfile[]>({
    queryKey: ["/api/eco-profiles"],
  });

  const { data: siteSettingsData } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
    staleTime: 1000 * 60 * 30,
  });
  const ecoPrices = useMemo(() => ({
    price12: Number(siteSettingsData?.["eco_price_12"]) || 220,
    price22: Number(siteSettingsData?.["eco_price_22"]) || 380,
  }), [siteSettingsData]);

  const languageCurrencyMap: Record<string, { code: string; symbol: string; locale: string }> = {
    ko: { code: "KRW", symbol: "₩", locale: "ko-KR" },
    en: { code: "USD", symbol: "$", locale: "en-US" },
    zh: { code: "CNY", symbol: "¥", locale: "zh-CN" },
    vi: { code: "VND", symbol: "₫", locale: "vi-VN" },
    ru: { code: "RUB", symbol: "₽", locale: "ru-RU" },
    ja: { code: "JPY", symbol: "¥", locale: "ja-JP" },
  };

  const currencyInfo = languageCurrencyMap[language] || languageCurrencyMap.ko;
  const exchangeRate = exchangeRatesData?.rates?.[currencyInfo.code] || 1;

  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/quotes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
    },
  });

  const depositMutation = useMutation({
    mutationFn: async ({ id, depositPaid }: { id: number; depositPaid: boolean }) => {
      await apiRequest("PATCH", `/api/quotes/${id}/deposit`, { depositPaid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes/deposit-paid"] });
    },
  });

  const quoteCount = quotes?.length || 0;
  
  // 관리자일 때 견적서를 관리자/일반 사용자로 분리
  // 관리자 계정 목록에 현재 사용자 ID도 포함하고, 모든 관리자 ID를 고려
  const allAdminIds = [...adminUserIds];
  if (currentUserId && !allAdminIds.includes(currentUserId)) {
    allAdminIds.push(currentUserId);
  }
  const adminQuotes = isAdmin && quotes ? quotes.filter(q => allAdminIds.includes(q.userId || "")) : [];
  const userQuotes = isAdmin && quotes ? quotes.filter(q => !allAdminIds.includes(q.userId || "")) : [];

  return (
    <Card className="rounded-2xl border-slate-200 dark:border-slate-700 shadow-lg bg-background relative z-0">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover-elevate rounded-t-2xl bg-background">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>{language === "ko" ? "저장된 견적서" : "Saved Quotes"}</span>
                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                  {quoteCount}
                </span>
              </div>
              {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-2 max-h-[500px] overflow-y-auto bg-background rounded-b-2xl">
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                {language === "ko" ? "로딩 중..." : "Loading..."}
              </div>
            ) : quoteCount === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                {language === "ko" ? "저장된 견적서가 없습니다.\n견적서를 저장하면 여기에 표시됩니다." : "No saved quotes.\nSaved quotes will appear here."}
              </div>
            ) : isAdmin ? (
              <>
                {/* 관리자 견적서 섹션 */}
                {adminQuotes.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {language === "ko" ? `관리자 견적서 (${adminQuotes.length})` : `Admin Quotes (${adminQuotes.length})`}
                      </span>
                    </div>
                    {adminQuotes.map((quote) => (
                      <QuoteItem
                        key={quote.id}
                        quote={quote}
                        language={language}
                        currencyInfo={currencyInfo}
                        exchangeRate={exchangeRate}
                        onDelete={(id) => deleteQuoteMutation.mutate(id)}
                        isDeleting={deleteQuoteMutation.isPending}
                        isAdmin={isAdmin}
                        onToggleDeposit={(id, depositPaid) => depositMutation.mutate({ id, depositPaid })}
                        onLoad={onLoad}
                        ecoProfiles={ecoProfilesData || []}
                        userGender={user?.gender || undefined}
                        ecoPrices={ecoPrices}
                      />
                    ))}
                  </div>
                )}
                
                {/* 일반 사용자 견적서 섹션 */}
                {userQuotes.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                        {language === "ko" ? `일반 사용자 견적서 (${userQuotes.length})` : `User Quotes (${userQuotes.length})`}
                      </span>
                    </div>
                    {userQuotes.map((quote) => (
                      <QuoteItem
                        key={quote.id}
                        quote={quote}
                        language={language}
                        currencyInfo={currencyInfo}
                        exchangeRate={exchangeRate}
                        onDelete={(id) => deleteQuoteMutation.mutate(id)}
                        isDeleting={deleteQuoteMutation.isPending}
                        isAdmin={isAdmin}
                        onToggleDeposit={(id, depositPaid) => depositMutation.mutate({ id, depositPaid })}
                        onLoad={onLoad}
                        ecoProfiles={ecoProfilesData || []}
                        userGender={user?.gender || undefined}
                        ecoPrices={ecoPrices}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              quotes?.map((quote) => (
                <QuoteItem
                  key={quote.id}
                  quote={quote}
                  language={language}
                  currencyInfo={currencyInfo}
                  exchangeRate={exchangeRate}
                  onDelete={(id) => deleteQuoteMutation.mutate(id)}
                  isDeleting={deleteQuoteMutation.isPending}
                  isAdmin={isAdmin}
                  onToggleDeposit={(id, depositPaid) => depositMutation.mutate({ id, depositPaid })}
                  onLoad={onLoad}
                  ecoProfiles={ecoProfilesData || []}
                  userGender={user?.gender || undefined}
                  ecoPrices={ecoPrices}
                />
              ))
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
