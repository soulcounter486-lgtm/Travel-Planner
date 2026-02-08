import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { FixedBottomBar } from "@/components/FixedBottomBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Home as HomeIcon, 
  Plus, 
  Trash2, 
  Calculator, 
  Users, 
  Receipt, 
  ArrowRight,
  ChevronLeft,
  Wallet,
  LogIn,
  LogOut,
  Loader2,
  Pencil,
  Settings,
  AlertTriangle,
  AlertCircle,
  Eye,
  Sparkles,
  MessageCircle,
  ShoppingBag
} from "lucide-react";
import type { ExpenseGroup, Expense } from "@shared/schema";
import { AppHeader } from "@/components/AppHeader";
import { TabNavigation } from "@/components/TabNavigation";

const navLabels: Record<string, Record<string, string>> = {
  calculator: { ko: "견적", en: "Quote", zh: "报价", vi: "Báo giá", ru: "Расчёт", ja: "見積" },
  guide: { ko: "관광", en: "Guide", zh: "指南", vi: "Hướng dẫn", ru: "Гид", ja: "ガイド" },
  expenses: { ko: "가계부", en: "Expenses", zh: "账本", vi: "Chi tiêu", ru: "Расходы", ja: "家計簿" },
  planner: { ko: "AI 플래너", en: "AI Planner", zh: "AI规划", vi: "AI Lên kế hoạch", ru: "AI Планер", ja: "AIプランナー" },
  chat: { ko: "채팅", en: "Chat", zh: "聊天", vi: "Chat", ru: "Чат", ja: "チャット" },
  board: { ko: "게시판", en: "Board", zh: "公告板", vi: "Bảng tin", ru: "Доска", ja: "掲示板" },
  diet: { ko: "쇼핑", en: "Shop", zh: "购物", vi: "Mua sắm", ru: "Магазин", ja: "ショッピング" },
};

type TranslationType = {
  title: string;
  createGroup: string;
  tripName: string;
  participants: string;
  participantsPlaceholder: string;
  create: string;
  cancel: string;
  noGroups: string;
  addExpense: string;
  description: string;
  amount: string;
  category: string;
  paidBy: string;
  splitAmong: string;
  date: string;
  add: string;
  categories: Record<string, string>;
  settlement: string;
  totalExpense: string;
  perPerson: string;
  settlementResult: string;
  shouldPay: string;
  shouldReceive: string;
  back: string;
  home: string;
  deleteGroup: string;
  noExpenses: string;
  paid: string;
  split: string;
  vnd: string;
  login: string;
  logout: string;
  loginRequired: string;
  loginDescription: string;
  editExpense: string;
  save: string;
  memo: string;
  budget: string;
  budgetPlaceholder: string;
  budgetUsed: string;
  budgetRemaining: string;
  budgetWarning: string;
  budgetDanger: string;
  setBudget: string;
  noBudget: string;
};

const translations: Record<string, TranslationType> = {
  ko: {
    title: "여행 가계부",
    createGroup: "새 여행 만들기",
    tripName: "여행 이름",
    participants: "참여자 (쉼표로 구분)",
    participantsPlaceholder: "예: 철수, 영희, 민수",
    create: "만들기",
    cancel: "취소",
    noGroups: "아직 여행이 없습니다",
    addExpense: "지출 추가",
    description: "내용",
    amount: "금액 (VND)",
    category: "카테고리",
    paidBy: "결제자",
    splitAmong: "분담자",
    date: "날짜",
    add: "추가",
    categories: {
      food: "식비",
      transport: "교통",
      accommodation: "숙박",
      tour: "관광",
      shopping: "쇼핑",
      other: "기타"
    },
    settlement: "정산하기",
    totalExpense: "총 지출",
    perPerson: "1인당 부담액",
    settlementResult: "정산 결과",
    shouldPay: "줘야 할 금액",
    shouldReceive: "받아야 할 금액",
    back: "뒤로",
    home: "홈",
    deleteGroup: "여행 삭제",
    noExpenses: "아직 지출 내역이 없습니다",
    paid: "결제",
    split: "분담",
    vnd: "₫",
    login: "로그인",
    logout: "로그아웃",
    loginRequired: "로그인이 필요합니다",
    loginDescription: "여행 가계부를 사용하려면 로그인해주세요. 로그인하면 나만의 여행 가계부를 관리할 수 있습니다.",
    editExpense: "지출 수정",
    save: "저장",
    memo: "메모",
    budget: "총 예산 (VND)",
    budgetPlaceholder: "예: 10000000",
    budgetUsed: "사용",
    budgetRemaining: "남은 예산",
    budgetWarning: "예산의 80%를 사용했습니다!",
    budgetDanger: "예산을 초과했습니다!",
    setBudget: "예산 설정",
    noBudget: "예산 미설정"
  },
  en: {
    title: "Travel Expense Tracker",
    createGroup: "Create New Trip",
    tripName: "Trip Name",
    participants: "Participants (comma separated)",
    participantsPlaceholder: "e.g. John, Jane, Mike",
    create: "Create",
    cancel: "Cancel",
    noGroups: "No trips yet",
    addExpense: "Add Expense",
    description: "Description",
    amount: "Amount (VND)",
    category: "Category",
    paidBy: "Paid By",
    splitAmong: "Split Among",
    date: "Date",
    add: "Add",
    categories: {
      food: "Food",
      transport: "Transport",
      accommodation: "Accommodation",
      tour: "Tours",
      shopping: "Shopping",
      other: "Other"
    },
    settlement: "Calculate Settlement",
    totalExpense: "Total Expense",
    perPerson: "Per Person",
    settlementResult: "Settlement Result",
    shouldPay: "Should Pay",
    shouldReceive: "Should Receive",
    back: "Back",
    home: "Home",
    deleteGroup: "Delete Trip",
    noExpenses: "No expenses yet",
    paid: "Paid",
    split: "Split",
    vnd: "₫",
    login: "Login",
    logout: "Logout",
    loginRequired: "Login Required",
    loginDescription: "Please log in to use the travel expense tracker. After logging in, you can manage your own travel expenses.",
    editExpense: "Edit Expense",
    save: "Save",
    memo: "Memo",
    budget: "Total Budget (VND)",
    budgetPlaceholder: "e.g. 10000000",
    budgetUsed: "Used",
    budgetRemaining: "Remaining",
    budgetWarning: "You've used 80% of your budget!",
    budgetDanger: "Budget exceeded!",
    setBudget: "Set Budget",
    noBudget: "No budget set"
  }
};

type SettlementData = {
  totalExpense: number;
  perPerson: number;
  participantCount: number;
  paid: Record<string, number>;
  owed: Record<string, number>;
  balance: Record<string, number>;
  settlements: { from: string; to: string; amount: number }[];
};

export default function ExpenseTracker() {
  const { language } = useLanguage();
  const t = translations[language] || translations.ko;
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
  const [selectedGroup, setSelectedGroup] = useState<ExpenseGroup | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);
  const [showEditExpenseDialog, setShowEditExpenseDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showSettlement, setShowSettlement] = useState(false);
  
  const [newGroupName, setNewGroupName] = useState("");
  const [newParticipants, setNewParticipants] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [editBudget, setEditBudget] = useState("");
  
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("food");
  const [expensePaidBy, setExpensePaidBy] = useState("");
  const [expenseSplitAmong, setExpenseSplitAmong] = useState<string[]>([]);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expenseMemo, setExpenseMemo] = useState("");
  
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("food");
  const [editPaidBy, setEditPaidBy] = useState("");
  const [editSplitAmong, setEditSplitAmong] = useState<string[]>([]);
  const [editDate, setEditDate] = useState("");
  const [editMemo, setEditMemo] = useState("");

  const { data: groups = [], isLoading: groupsLoading } = useQuery<ExpenseGroup[]>({
    queryKey: ["/api/expense-groups"],
    enabled: isAuthenticated,
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expense-groups", selectedGroup?.id, "expenses"],
    enabled: !!selectedGroup,
  });

  const { data: settlement, isLoading: settlementLoading } = useQuery<SettlementData>({
    queryKey: ["/api/expense-groups", selectedGroup?.id, "settlement"],
    enabled: !!selectedGroup && showSettlement,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; participants: string[]; budget: number }) => {
      return apiRequest("POST", "/api/expense-groups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-groups"] });
      setShowCreateDialog(false);
      setNewGroupName("");
      setNewParticipants("");
      setNewBudget("");
      toast({ title: "여행이 생성되었습니다" });
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async (data: { id: number; budget: number }) => {
      return apiRequest("PATCH", `/api/expense-groups/${data.id}`, { budget: data.budget });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-groups"] });
      if (selectedGroup) {
        setSelectedGroup({ ...selectedGroup, budget: variables.budget });
      }
      setShowBudgetDialog(false);
      toast({ title: "예산이 설정되었습니다" });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/expense-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-groups"] });
      setSelectedGroup(null);
      toast({ title: "여행이 삭제되었습니다" });
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: async (data: {
      description: string;
      amount: number;
      category: string;
      paidBy: string;
      splitAmong: string[];
      date: string;
      memo: string;
    }) => {
      const res = await apiRequest("POST", `/api/expense-groups/${selectedGroup!.id}/expenses`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-groups", selectedGroup?.id, "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-groups", selectedGroup?.id, "settlement"] });
      setShowAddExpenseDialog(false);
      resetExpenseForm();
      toast({ title: "지출이 추가되었습니다" });
    },
    onError: (error: Error) => {
      toast({ title: "오류가 발생했습니다", description: error.message, variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-groups", selectedGroup?.id, "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-groups", selectedGroup?.id, "settlement"] });
      toast({ title: "지출이 삭제되었습니다" });
    },
  });

  const editExpenseMutation = useMutation({
    mutationFn: async (data: {
      id: number;
      description: string;
      amount: number;
      category: string;
      paidBy: string;
      splitAmong: string[];
      date: string;
      memo: string;
    }) => {
      const { id, ...body } = data;
      const res = await apiRequest("PATCH", `/api/expenses/${id}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expense-groups", selectedGroup?.id, "expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expense-groups", selectedGroup?.id, "settlement"] });
      setShowEditExpenseDialog(false);
      setEditingExpense(null);
      toast({ title: "지출이 수정되었습니다" });
    },
    onError: (error: Error) => {
      toast({ title: "오류가 발생했습니다", description: error.message, variant: "destructive" });
    },
  });

  const resetExpenseForm = () => {
    setExpenseDescription("");
    setExpenseAmount("");
    setExpenseCategory("food");
    setExpensePaidBy("");
    setExpenseSplitAmong([]);
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpenseMemo("");
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || !newParticipants.trim()) return;
    const participants = newParticipants.split(",").map(p => p.trim()).filter(p => p);
    if (participants.length < 1) {
      toast({ title: "최소 1명 이상의 참여자가 필요합니다", variant: "destructive" });
      return;
    }
    const budget = parseInt(newBudget) || 0;
    createGroupMutation.mutate({ name: newGroupName.trim(), participants, budget });
  };

  const handleUpdateBudget = () => {
    if (!selectedGroup) return;
    const budget = parseInt(editBudget) || 0;
    updateBudgetMutation.mutate({ id: selectedGroup.id, budget });
  };

  const openBudgetDialog = () => {
    if (selectedGroup) {
      setEditBudget(String(selectedGroup.budget || 0));
      setShowBudgetDialog(true);
    }
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const safeBudget = Math.max(0, selectedGroup?.budget || 0);
  const budgetUsedPercent = safeBudget > 0 
    ? Math.round((totalExpense / safeBudget) * 100) 
    : 0;

  const handleAddExpense = () => {
    const amount = expenseAmount ? parseInt(expenseAmount) : 0;
    addExpenseMutation.mutate({
      description: expenseDescription.trim(),
      amount,
      category: expenseCategory,
      paidBy: expensePaidBy,
      splitAmong: expenseSplitAmong,
      date: expenseDate,
      memo: expenseMemo.trim(),
    });
  };

  const handleStartEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setEditDescription(expense.description || "");
    setEditAmount(String(expense.amount));
    setEditCategory(expense.category || "other");
    setEditPaidBy(expense.paidBy || "");
    setEditSplitAmong((expense.splitAmong as string[]) || []);
    setEditDate(expense.date);
    setEditMemo((expense as any).memo || "");
    setShowEditExpenseDialog(true);
  };

  const handleEditExpense = () => {
    if (!editingExpense) return;
    const amount = editAmount ? parseInt(editAmount) : 0;
    editExpenseMutation.mutate({
      id: editingExpense.id,
      description: editDescription.trim(),
      amount,
      category: editCategory,
      paidBy: editPaidBy,
      splitAmong: editSplitAmong,
      date: editDate,
      memo: editMemo.trim(),
    });
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + "₫";
  };

  const participants = selectedGroup?.participants as string[] || [];
  const categoryLabels = t.categories;

  if (selectedGroup) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => { setSelectedGroup(null); setShowSettlement(false); }}
              data-testid="button-back"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-bold text-lg">{selectedGroup.name}</h1>
              <p className="text-sm text-muted-foreground">
                <Users className="inline h-3 w-3 mr-1" />
                {participants.join(", ")}
              </p>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => deleteGroupMutation.mutate(selectedGroup.id)}
              data-testid="button-delete-group"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-4">
          <div className="flex gap-2">
            <Dialog open={showAddExpenseDialog} onOpenChange={setShowAddExpenseDialog}>
              <DialogTrigger asChild>
                <Button className="flex-1" data-testid="button-add-expense">
                  <Plus className="h-4 w-4 mr-2" />
                  {t.addExpense}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t.addExpense}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{t.description}</Label>
                    <Input
                      value={expenseDescription}
                      onChange={(e) => setExpenseDescription(e.target.value)}
                      placeholder="점심 식사"
                      data-testid="input-expense-description"
                    />
                  </div>
                  <div>
                    <Label>{t.amount}</Label>
                    <Input
                      type="number"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="500000"
                      data-testid="input-expense-amount"
                    />
                  </div>
                  <div>
                    <Label>{t.category}</Label>
                    <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                      <SelectTrigger data-testid="select-expense-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border shadow-lg">
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t.date}</Label>
                    <Input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      data-testid="input-expense-date"
                    />
                  </div>
                  <div>
                    <Label>{t.paidBy}</Label>
                    <Select value={expensePaidBy} onValueChange={setExpensePaidBy}>
                      <SelectTrigger data-testid="select-expense-paidby">
                        <SelectValue placeholder="결제자 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border shadow-lg">
                        {participants.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t.splitAmong}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {participants.map((p) => (
                        <label key={p} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={expenseSplitAmong.includes(p)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setExpenseSplitAmong([...expenseSplitAmong, p]);
                              } else {
                                setExpenseSplitAmong(expenseSplitAmong.filter(x => x !== p));
                              }
                            }}
                            data-testid={`checkbox-split-${p}`}
                          />
                          <span className="text-sm">{p}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>{t.memo}</Label>
                    <Input
                      value={expenseMemo}
                      onChange={(e) => setExpenseMemo(e.target.value)}
                      placeholder="메모 (선택사항)"
                      data-testid="input-expense-memo"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" className="flex-1" onClick={() => setShowAddExpenseDialog(false)}>
                      {t.cancel}
                    </Button>
                    <Button 
                      className="flex-1" 
                      onClick={handleAddExpense}
                      disabled={addExpenseMutation.isPending}
                      data-testid="button-submit-expense"
                    >
                      {t.add}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showEditExpenseDialog} onOpenChange={setShowEditExpenseDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{t.editExpense}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{t.description}</Label>
                    <Input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="점심 식사"
                      data-testid="input-edit-description"
                    />
                  </div>
                  <div>
                    <Label>{t.amount}</Label>
                    <Input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      placeholder="500000"
                      data-testid="input-edit-amount"
                    />
                  </div>
                  <div>
                    <Label>{t.category}</Label>
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger data-testid="select-edit-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border shadow-lg">
                        {Object.entries(categoryLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t.date}</Label>
                    <Input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      data-testid="input-edit-date"
                    />
                  </div>
                  <div>
                    <Label>{t.paidBy}</Label>
                    <Select value={editPaidBy} onValueChange={setEditPaidBy}>
                      <SelectTrigger data-testid="select-edit-paidby">
                        <SelectValue placeholder="결제자 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border shadow-lg">
                        {participants.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t.splitAmong}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {participants.map((p) => (
                        <label key={p} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={editSplitAmong.includes(p)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setEditSplitAmong([...editSplitAmong, p]);
                              } else {
                                setEditSplitAmong(editSplitAmong.filter(x => x !== p));
                              }
                            }}
                            data-testid={`checkbox-edit-split-${p}`}
                          />
                          <span className="text-sm">{p}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>{t.memo}</Label>
                    <Input
                      value={editMemo}
                      onChange={(e) => setEditMemo(e.target.value)}
                      placeholder="메모 (선택사항)"
                      data-testid="input-edit-memo"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" className="flex-1" onClick={() => setShowEditExpenseDialog(false)}>
                      {t.cancel}
                    </Button>
                    <Button 
                      className="flex-1" 
                      onClick={handleEditExpense}
                      disabled={editExpenseMutation.isPending}
                      data-testid="button-save-expense"
                    >
                      {t.save}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant={showSettlement ? "secondary" : "outline"}
              onClick={() => setShowSettlement(!showSettlement)}
              data-testid="button-settlement"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {t.settlement}
            </Button>
          </div>

          <Card className={`mb-4 ${budgetUsedPercent >= 100 ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : budgetUsedPercent >= 80 ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  <span className="font-bold">{t.budget.replace(" (VND)", "")}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={openBudgetDialog} data-testid="button-edit-budget">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              
              {safeBudget > 0 ? (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>{t.budgetUsed}: {formatVND(totalExpense)} / {formatVND(safeBudget)}</span>
                    <span className={`font-bold ${budgetUsedPercent >= 100 ? 'text-red-600' : budgetUsedPercent >= 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {budgetUsedPercent}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(budgetUsedPercent, 100)} 
                    className={`h-3 ${budgetUsedPercent >= 100 ? '[&>div]:bg-red-500' : budgetUsedPercent >= 80 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{t.budgetRemaining}: {formatVND(Math.max(0, safeBudget - totalExpense))}</span>
                  </div>
                  {budgetUsedPercent >= 100 && (
                    <div className="flex items-center gap-2 text-red-600 font-medium bg-red-100 dark:bg-red-900/30 rounded-lg p-2">
                      <AlertCircle className="h-4 w-4" />
                      {t.budgetDanger}
                    </div>
                  )}
                  {budgetUsedPercent >= 80 && budgetUsedPercent < 100 && (
                    <div className="flex items-center gap-2 text-yellow-600 font-medium bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-2">
                      <AlertTriangle className="h-4 w-4" />
                      {t.budgetWarning}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-2">
                  <p>{t.noBudget}</p>
                  <Button variant="ghost" className="text-primary" onClick={openBudgetDialog}>
                    {t.setBudget}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{t.setBudget}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t.budget}</Label>
                  <Input
                    type="number"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    placeholder={t.budgetPlaceholder}
                    data-testid="input-edit-budget"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setShowBudgetDialog(false)}>
                    {t.cancel}
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleUpdateBudget}
                    disabled={updateBudgetMutation.isPending}
                    data-testid="button-save-budget"
                  >
                    {t.save}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {showSettlement && settlement && (
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  {t.settlementResult}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-background rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">{t.totalExpense}</div>
                    <div className="text-xl font-bold text-primary">{formatVND(settlement.totalExpense)}</div>
                  </div>
                  <div className="bg-background rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">{t.perPerson}</div>
                    <div className="text-xl font-bold">{formatVND(settlement.perPerson)}</div>
                  </div>
                </div>

                {settlement.settlements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground">송금 내역</h4>
                    {settlement.settlements.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 bg-background rounded-lg p-3">
                        <Badge variant="outline">{s.from}</Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary">{s.to}</Badge>
                        <span className="ml-auto font-bold text-primary">{formatVND(s.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">개인별 현황</h4>
                  {participants.map(p => (
                    <div key={p} className="flex items-center justify-between bg-background rounded-lg p-2 text-sm">
                      <span className="font-medium">{p}</span>
                      <div className="flex gap-4 text-xs">
                        <span>결제: {formatVND(settlement.paid[p] || 0)}</span>
                        <span>부담: {formatVND(settlement.owed[p] || 0)}</span>
                        <span className={settlement.balance[p] > 0 ? "text-green-600 font-bold" : settlement.balance[p] < 0 ? "text-red-600 font-bold" : ""}>
                          {settlement.balance[p] > 0 ? `+${formatVND(settlement.balance[p])}` : settlement.balance[p] < 0 ? formatVND(settlement.balance[p]) : "0₫"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {expensesLoading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t.noExpenses}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((expense) => (
                <Card key={expense.id} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{expense.description || "(내용 없음)"}</span>
                          <Badge variant="secondary" className="text-xs">
                            {categoryLabels[expense.category || "other"] || expense.category || "기타"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
                          <span>{expense.date}</span>
                          <span>{t.paid}: {expense.paidBy}</span>
                          <span>{t.split}: {(expense.splitAmong as string[]).join(", ")}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="font-bold text-primary mr-1">{formatVND(expense.amount)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleStartEdit(expense)}
                          data-testid={`button-edit-expense-${expense.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteExpenseMutation.mutate(expense.id)}
                          data-testid={`button-delete-expense-${expense.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // 로딩 중
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-xl">{t.title}</h1>
            </div>
            </div>
        </header>
        <div className="bg-background border-b">
          <div className="container mx-auto px-4 overflow-x-auto">
            <div className="flex items-center gap-1.5 py-2 min-w-max">
              <Link href="/">
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-calculator">
                  <Calculator className="w-3.5 h-3.5" />
                  {navLabels.calculator[language] || navLabels.calculator.ko}
                </Button>
              </Link>
              <Link href="/guide">
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-guide">
                  <Eye className="w-3.5 h-3.5" />
                  {navLabels.guide[language] || navLabels.guide.ko}
                </Button>
              </Link>
              <Link href="/board">
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-board">
                  <Pencil className="w-3.5 h-3.5" />
                  {navLabels.board[language] || navLabels.board.ko}
                </Button>
              </Link>
              <Link href="/diet">
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-diet">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  {navLabels.diet[language] || navLabels.diet.ko}
                </Button>
              </Link>
              <Link href="/planner">
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-planner">
                  <Sparkles className="w-3.5 h-3.5" />
                  {navLabels.planner[language] || navLabels.planner.ko}
                </Button>
              </Link>
              <Button variant="default" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-expenses">
                <Wallet className="w-3.5 h-3.5" />
                {navLabels.expenses[language] || navLabels.expenses.ko}
              </Button>
              <Link href="/chat">
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs whitespace-nowrap" data-testid="nav-chat">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {navLabels.chat[language] || navLabels.chat.ko}
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <main className="container mx-auto px-4 py-12 max-w-md text-center">
          <Card className="p-8">
            <LogIn className="h-16 w-16 mx-auto mb-6 text-primary" />
            <h2 className="text-2xl font-bold mb-4">{t.loginRequired}</h2>
            <p className="text-muted-foreground mb-6">{t.loginDescription}</p>
            <Button size="lg" className="w-full" onClick={() => window.location.href = "/api/login"} data-testid="button-login">
              <LogIn className="h-5 w-5 mr-2" />
              {t.login}
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <TabNavigation language={language} />

      <main className="container mx-auto px-4 py-6">
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="w-full mb-6" size="lg" data-testid="button-create-group">
              <Plus className="h-5 w-5 mr-2" />
              {t.createGroup}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t.createGroup}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t.tripName}</Label>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="붕따우 여행 2025"
                  data-testid="input-group-name"
                />
              </div>
              <div>
                <Label>{t.participants}</Label>
                <Input
                  value={newParticipants}
                  onChange={(e) => setNewParticipants(e.target.value)}
                  placeholder={t.participantsPlaceholder}
                  data-testid="input-group-participants"
                />
              </div>
              <div>
                <Label>{t.budget}</Label>
                <Input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  placeholder={t.budgetPlaceholder}
                  data-testid="input-group-budget"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreateDialog(false)}>
                  {t.cancel}
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleCreateGroup}
                  disabled={createGroupMutation.isPending}
                  data-testid="button-submit-group"
                >
                  {t.create}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {groupsLoading ? (
          <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t.noGroups}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {groups.map((group) => (
              <Card 
                key={group.id} 
                className="cursor-pointer hover-elevate transition-all"
                onClick={() => setSelectedGroup(group)}
                data-testid={`card-group-${group.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{group.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Users className="h-3 w-3" />
                        {(group.participants as string[]).join(", ")}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <FixedBottomBar />
    </div>
  );
}
