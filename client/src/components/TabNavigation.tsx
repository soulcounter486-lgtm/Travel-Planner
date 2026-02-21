import { useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import {
  Calculator,
  MapPin,
  Flag,
  ShoppingBag,
  Sparkles,
  MessageCircle,
  Wallet
} from "lucide-react";

interface TabNavigationProps {
  language: string;
}

const navLabels: Record<string, Record<string, string>> = {
  calculator: { ko: "견적", en: "Quote", zh: "报价", vi: "Báo giá", ru: "Расчёт", ja: "見積" },
  guide: { ko: "관광", en: "Guide", zh: "指南", vi: "Hướng dẫn", ru: "Гид", ja: "ガイド" },
  board: { ko: "소식", en: "News", zh: "新闻", vi: "Tin tức", ru: "Новости", ja: "ニュース" },
  shop: { ko: "쇼핑", en: "Shop", zh: "购物", vi: "Mua sắm", ru: "Магазин", ja: "ショップ" },
  planner: { ko: "AI플래너", en: "Planner", zh: "规划", vi: "Kế hoạch", ru: "Планер", ja: "プランナー" },
  chat: { ko: "채팅", en: "Chat", zh: "聊天", vi: "Trò chuyện", ru: "Чат", ja: "チャット" },
  expenses: { ko: "가계부", en: "Expenses", zh: "账本", vi: "Chi tiêu", ru: "Расходы", ja: "家計簿" },
};

const SCROLL_KEY = "tabNavScrollPosition";

export function TabNavigation({ language }: TabNavigationProps) {
  const [location] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = (key: string) => navLabels[key]?.[language] || navLabels[key]?.ko || key;

  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved && scrollRef.current) {
      scrollRef.current.scrollLeft = parseInt(saved, 10);
    }
  }, []);

  const handleClick = () => {
    if (scrollRef.current) {
      sessionStorage.setItem(SCROLL_KEY, scrollRef.current.scrollLeft.toString());
    }
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const tabs = [
    { path: "/", icon: Calculator, label: "calculator", testId: "nav-calculator" },
    { path: "/planner", icon: Sparkles, label: "planner", testId: "nav-planner" },
    { path: "/guide", icon: MapPin, label: "guide", testId: "nav-guide" },
    { path: "/board", icon: Flag, label: "board", testId: "nav-board" },
    { path: "/diet", icon: ShoppingBag, label: "shop", testId: "nav-shop" },
    { path: "/chat", icon: MessageCircle, label: "chat", testId: "nav-chat" },
    { path: "/expenses", icon: Wallet, label: "expenses", testId: "nav-expenses" },
  ];

  return (
    <div className="bg-background border-b sticky top-0 z-50">
      <div 
        ref={scrollRef}
        className="container mx-auto px-4 overflow-x-auto scrollbar-hide"
      >
        <div className="flex items-center gap-1.5 py-2 min-w-max">
          {tabs.map(({ path, icon: Icon, label, testId }) => (
            <Link key={path} href={path} onClick={handleClick}>
              <Button 
                variant={isActive(path) ? "default" : "outline"} 
                size="sm" 
                className="flex items-center gap-1.5 text-xs whitespace-nowrap" 
                data-testid={testId}
              >
                <Icon className="w-3.5 h-3.5" />
                {t(label)}
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
