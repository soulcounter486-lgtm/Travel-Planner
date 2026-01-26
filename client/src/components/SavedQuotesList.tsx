import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ChevronDown, ChevronUp, FileText, Calendar, Trash2, Download, ChevronRight, Pencil, Check, X } from "lucide-react";
import { useState, useRef } from "react";
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
}

function QuoteItem({ quote, language, currencyInfo, exchangeRate, onDelete, isDeleting, isAdmin, onToggleDeposit }: QuoteItemProps) {
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
  const [memo, setMemo] = useState<string>(quote.memo || "");
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const queryClient = useQueryClient();

  const parsePrice = (detail: string): number => {
    const match = detail.match(/\$(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const getAdjustedVillaTotal = () => {
    if (!breakdown?.villa?.details) return breakdown?.villa?.price || 0;
    let total = 0;
    breakdown.villa.details.forEach((detail, idx) => {
      const originalPrice = parsePrice(detail);
      total += villaAdjustments[idx] !== undefined ? villaAdjustments[idx] : originalPrice;
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
      const caddyTip = tipMatch ? tipMatch[1] : "";
      
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
  const villaAdjustment = villaTotal - (breakdown?.villa?.price || 0);
  const vehicleAdjustment = vehicleTotal - (breakdown?.vehicle?.price || 0);
  const golfAdjustment = golfTotal - (breakdown?.golf?.price || 0);
  const adjustedTotal = quote.totalPrice + villaAdjustment + vehicleAdjustment + golfAdjustment;
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

  const handleSaveEdit = async () => {
    try {
      // 수정된 breakdown 생성
      const updatedBreakdown = { ...breakdown };
      
      // Villa 수정 반영
      if (breakdown?.villa) {
        const villaDetails = breakdown.villa.details || [];
        const updatedVillaDetails = villaDetails.map((detail: string, idx: number) => {
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
        updatedBreakdown.vehicle = {
          ...breakdown.vehicle,
          price: vehicleTotal
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
          return `${detail.date} / ${detail.courseName} / $${unitPrice} x ${players}명 = $${subtotal} (캐디팁: ${detail.caddyTip}/인)`;
        });
        updatedBreakdown.golf = {
          ...breakdown.golf,
          price: golfTotal,
          description: updatedGolfDescriptions.join(" | ")
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
                      <span>{language === "ko" ? "풀빌라" : "Villa"}</span>
                      <span>${villaTotal.toLocaleString()}</span>
                    </div>
                    {breakdown.villa.checkIn && breakdown.villa.checkOut && (
                      <div className="text-[10px] text-primary font-medium pl-2">
                        {breakdown.villa.checkIn} ~ {breakdown.villa.checkOut}
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground space-y-1 pl-2">
                      {breakdown.villa.details.map((detail, idx) => {
                        const originalPrice = parsePrice(detail);
                        const currentPrice = villaAdjustments[idx] !== undefined ? villaAdjustments[idx] : originalPrice;
                        const dateMatch = detail.match(/^([^:]+):/);
                        const dateLabel = dateMatch ? dateMatch[1] : `Day ${idx + 1}`;
                        
                        return (
                          <div key={idx} className="flex items-center gap-1">
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
                                    setVillaAdjustments(prev => ({ ...prev, [idx]: val }));
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
                      <span>${breakdown.guide.price.toLocaleString()}</span>
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

                <div className="pt-2 text-center">
                  <span className="text-[9px] text-muted-foreground">
                    붕따우 도깨비 | vungtau.blog
                  </span>
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
                  rows={8}
                  data-testid={`textarea-memo-${quote.id}`}
                />
                <Button
                  onClick={handleSaveMemo}
                  size="sm"
                  className="mt-2"
                  disabled={isSavingMemo || memo === (quote.memo || "")}
                  data-testid={`button-save-memo-${quote.id}`}
                >
                  {isSavingMemo
                    ? (language === "ko" ? "저장 중..." : "Saving...")
                    : (language === "ko" ? "메모 저장" : "Save Memo")}
                </Button>
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
    </div>
  );
}

export function SavedQuotesList() {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const { data: quotes, isLoading } = useQuotes();
  const queryClient = useQueryClient();

  const { data: adminCheck } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
  });
  const isAdmin = adminCheck?.isAdmin || false;

  const { data: exchangeRatesData } = useQuery<{ rates: Record<string, number>; timestamp: number }>({
    queryKey: ["/api/exchange-rates"],
    staleTime: 12 * 60 * 60 * 1000,
  });

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
                />
              ))
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
