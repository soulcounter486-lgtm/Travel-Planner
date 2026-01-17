import type { Express } from "express";
import type { Server } from "http";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { calculateQuoteSchema, visitorCount, expenseGroups, expenses, insertExpenseGroupSchema, insertExpenseSchema, posts, comments, insertPostSchema, insertCommentSchema, instagramSyncedPosts } from "@shared/schema";
import { addDays, getDay, parseISO, format } from "date-fns";
import { db } from "./db";
import { eq, sql, desc, and } from "drizzle-orm";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { GoogleGenAI } from "@google/genai";
import { WebSocketServer, WebSocket } from "ws";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

let exchangeRatesCache: { rates: Record<string, number>; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30분 캐시

const defaultRates: Record<string, number> = {
  KRW: 1450,
  CNY: 7.3,
  VND: 25500,
  RUB: 100,
  JPY: 157,
  USD: 1,
};

const naverCurrencyCodes: Record<string, string> = {
  KRW: "FX_USDKRW",
  JPY: "FX_USDJPY", 
  CNY: "FX_USDCNY",
  VND: "FX_USDVND",
  RUB: "FX_USDRUB",
};

async function fetchNaverRate(currencyCode: string): Promise<number | null> {
  try {
    const url = `https://finance.naver.com/marketindex/exchangeDetail.naver?marketindexCd=${currencyCode}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });
    const html = await response.text();
    
    // 매매기준율 추출 (네이버 금융 페이지 구조)
    const match = html.match(/class="no_today"[^>]*>[\s\S]*?<span class="blind">([0-9,]+\.?[0-9]*)<\/span>/);
    if (match && match[1]) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return null;
  } catch (error) {
    console.error(`Naver rate fetch error for ${currencyCode}:`, error);
    return null;
  }
}

async function getExchangeRates(): Promise<Record<string, number>> {
  if (exchangeRatesCache && Date.now() - exchangeRatesCache.timestamp < CACHE_DURATION) {
    return exchangeRatesCache.rates;
  }
  
  try {
    const rates: Record<string, number> = { USD: 1 };
    
    // 네이버 금융에서 환율 가져오기 (병렬 처리)
    const promises = Object.entries(naverCurrencyCodes).map(async ([currency, code]) => {
      const rate = await fetchNaverRate(code);
      return { currency, rate };
    });
    
    const results = await Promise.all(promises);
    
    for (const { currency, rate } of results) {
      rates[currency] = rate || defaultRates[currency];
    }
    
    exchangeRatesCache = { rates, timestamp: Date.now() };
    console.log("Naver exchange rates updated:", rates);
    return rates;
  } catch (error) {
    console.error("Exchange rates fetch error:", error);
    return exchangeRatesCache?.rates || defaultRates;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication (MUST be before other routes)
  await setupAuth(app);
  registerAuthRoutes(app);

  // SEO: robots.txt
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(`User-agent: *
Allow: /

Sitemap: https://vungtau.blog/sitemap.xml`);
  });

  // SEO: og-image.png
  app.get("/og-image.png", (req, res) => {
    const imagePath = path.join(process.cwd(), "client/public/og-image.png");
    if (fs.existsSync(imagePath)) {
      res.type("image/png");
      res.sendFile(imagePath);
    } else {
      res.status(404).send("Image not found");
    }
  });

  // SEO: sitemap.xml
  app.get("/sitemap.xml", (req, res) => {
    res.type("application/xml");
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://vungtau.blog/</loc>
    <lastmod>2026-01-17</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://vungtau.blog/quote</loc>
    <lastmod>2026-01-17</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://vungtau.blog/attractions</loc>
    <lastmod>2026-01-17</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://vungtau.blog/restaurants</loc>
    <lastmod>2026-01-17</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://vungtau.blog/board</loc>
    <lastmod>2026-01-17</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://vungtau.blog/chat</loc>
    <lastmod>2026-01-17</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://vungtau.blog/ai-planner</loc>
    <lastmod>2026-01-17</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://vungtau.blog/expense</loc>
    <lastmod>2026-01-17</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`);
  });

  app.get("/api/exchange-rates", async (req, res) => {
    try {
      const rates = await getExchangeRates();
      res.json({ rates, timestamp: exchangeRatesCache?.timestamp || Date.now() });
    } catch (error) {
      res.status(500).json({ rates: defaultRates, timestamp: Date.now() });
    }
  });

  const vehiclePrices: Record<string, { city: number; oneway: number; roundtrip: number }> = {
    "7_seater": { city: 100, oneway: 80, roundtrip: 150 },
    "16_seater": { city: 130, oneway: 130, roundtrip: 250 },
    "9_limo": { city: 160, oneway: 160, roundtrip: 300 },
    "9_lux_limo": { city: 210, oneway: 210, roundtrip: 400 },
    "12_lux_limo": { city: 250, oneway: 250, roundtrip: 480 },
    "16_lux_limo": { city: 280, oneway: 280, roundtrip: 530 },
    "29_seater": { city: 230, oneway: 230, roundtrip: 430 },
    "45_seater": { city: 280, oneway: 290, roundtrip: 550 },
  };

  app.post(api.quotes.calculate.path, (req, res) => {
    try {
      const input = req.body;
      
      const breakdown = {
        villa: { price: 0, details: [] as string[] },
        vehicle: { price: 0, description: "" },
        golf: { price: 0, description: "" },
        ecoGirl: { price: 0, description: "" },
        guide: { price: 0, description: "" },
        total: 0
      };

      // 1. Villa Calculation
      if (input.villa?.enabled && input.villa.checkIn && input.villa.checkOut) {
        try {
          let current = parseISO(input.villa.checkIn);
          const end = parseISO(input.villa.checkOut);
          if (!isNaN(current.getTime()) && !isNaN(end.getTime())) {
            while (current < end) {
              const dayOfWeek = getDay(current);
              let dailyPrice = 350;
              let dayName = "Weekday";
              if (dayOfWeek === 5) {
                dailyPrice = 380;
                dayName = "Friday";
              } else if (dayOfWeek === 6) {
                dailyPrice = 500;
                dayName = "Saturday";
              } else if (dayOfWeek === 0) {
                dailyPrice = 350;
                dayName = "Sunday (Weekday rate)";
              }
              breakdown.villa.price += dailyPrice;
              breakdown.villa.details.push(`${dayName}: $${dailyPrice}`);
              current = addDays(current, 1);
            }
          }
        } catch (e) {
          console.error("Villa calculation error:", e);
        }
      }

      // 2. Vehicle Calculation
      if (input.vehicle?.enabled && Array.isArray(input.vehicle.selections)) {
        let vehicleTotalPrice = 0;
        const vehicleDescriptions: string[] = [];
        for (const selection of input.vehicle.selections) {
          if (!selection || !selection.date || !selection.type || !selection.route) continue;
          const prices = vehiclePrices[selection.type];
          if (prices) {
            let basePrice = 0;
            let routeDesc = "";
            if (selection.type === "7_seater" && selection.route === "phanthiet_oneway") {
              basePrice = 130;
            } else {
              switch (selection.route) {
                case "city": basePrice = prices.city; routeDesc = "City Tour"; break;
                case "oneway": basePrice = prices.oneway; routeDesc = "One Way (Vung Tau)"; break;
                case "hocham_oneway": basePrice = prices.oneway; routeDesc = "One Way (Ho Tram)"; break;
                case "phanthiet_oneway": basePrice = Math.round(prices.oneway * 1.6 * 0.85); routeDesc = "One Way (Phan Thiet)"; break;
                case "roundtrip": basePrice = prices.roundtrip; routeDesc = "Round Trip"; break;
                case "city_pickup_drop": basePrice = prices.city * 1.5; routeDesc = "Pickup/Drop + City"; break;
              }
            }
            if (!routeDesc) {
              switch (selection.route) {
                case "city": routeDesc = "City Tour"; break;
                case "oneway": routeDesc = "One Way (Vung Tau)"; break;
                case "hocham_oneway": routeDesc = "One Way (Ho Tram)"; break;
                case "phanthiet_oneway": routeDesc = "One Way (Phan Thiet)"; break;
                case "roundtrip": routeDesc = "Round Trip"; break;
                case "city_pickup_drop": routeDesc = "Pickup/Drop + City"; break;
              }
            }
            vehicleTotalPrice += basePrice;
            vehicleDescriptions.push(`${selection.date}: ${selection.type.replace(/_/g, " ")} (${routeDesc})`);
          }
        }
        breakdown.vehicle.price = vehicleTotalPrice;
        breakdown.vehicle.description = vehicleDescriptions.join(" | ");
      }

      // 3. Golf Calculation
      if (input.golf?.enabled && Array.isArray(input.golf.selections)) {
        let golfTotalPrice = 0;
        const golfDescriptions: string[] = [];
        for (const selection of input.golf.selections) {
          if (!selection || !selection.date || !selection.course) continue;
          try {
            const date = parseISO(selection.date);
            if (isNaN(date.getTime())) continue;
            const dayOfWeek = getDay(date);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const players = Number(selection.players) || 1;
            let price = 0;
            let tip = "";
            let courseName = "";
            switch (selection.course) {
              case "paradise":
                price = isWeekend ? 100 : 80;
                tip = "40만동";
                courseName = "파라다이스";
                break;
              case "chouduc":
                price = isWeekend ? 120 : 80;
                tip = "50만동";
                courseName = "쩌우득";
                break;
              case "hocham":
                price = isWeekend ? 200 : 130;
                tip = "50만동";
                courseName = "호짬";
                break;
            }
            const subtotal = price * players;
            golfTotalPrice += subtotal;
            golfDescriptions.push(`${selection.date}: ${courseName} ($${price} x ${players}명 = $${subtotal}, 캐디팁: ${tip}/인)`);
          } catch (e) {
            console.error("Golf selection calculation error:", e);
          }
        }
        breakdown.golf.price = golfTotalPrice;
        breakdown.golf.description = golfDescriptions.join(" | ");
      }

      // 4. Eco Girl Calculation
      if (input.ecoGirl?.enabled) {
        const rate = 220;
        const count = Number(input.ecoGirl.count) || 0;
        const nights = Number(input.ecoGirl.nights) || 0;
        breakdown.ecoGirl.price = rate * count * nights;
        breakdown.ecoGirl.description = `${count} Escort x ${nights} Nights @ $${rate}`;
      }

      // 5. Guide Calculation
      if (input.guide?.enabled) {
        const baseRate = 120;
        const extraRate = 20;
        const days = Number(input.guide.days) || 0;
        const groupSize = Number(input.guide.groupSize) || 1;
        let dailyTotal = baseRate;
        if (groupSize > 4) { dailyTotal += (groupSize - 4) * extraRate; }
        breakdown.guide.price = dailyTotal * days;
        breakdown.guide.description = `${days} Days for ${groupSize} People (Base $120 + Extra)`;
      }

      breakdown.total = breakdown.villa.price + breakdown.vehicle.price + breakdown.golf.price + breakdown.ecoGirl.price + breakdown.guide.price;
      res.json(breakdown);
    } catch (err) {
      console.error("Calculation route error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.quotes.create.path, async (req, res) => {
    try {
      const input = api.quotes.create.input.parse(req.body);
      const quote = await storage.createQuote(input);
      res.status(201).json(quote);
    } catch (err) {
      if (err instanceof z.ZodError) { res.status(400).json({ message: err.errors[0].message }); }
      else { res.status(500).json({ message: "Internal server error" }); }
    }
  });

  app.get(api.quotes.list.path, async (req, res) => {
    const quotes = await storage.getQuotes();
    res.json(quotes);
  });

  app.get("/api/visitor-count", async (req, res) => {
    try {
      const result = await db.select().from(visitorCount).where(eq(visitorCount.id, 1));
      if (result.length === 0) {
        await db.insert(visitorCount).values({ id: 1, count: 1 });
        res.json({ count: 1 });
      } else {
        res.json({ count: result[0].count });
      }
    } catch (err) {
      console.error("Visitor count get error:", err);
      res.json({ count: 0 });
    }
  });

  app.post("/api/visitor-count/increment", async (req, res) => {
    try {
      const result = await db.select().from(visitorCount).where(eq(visitorCount.id, 1));
      if (result.length === 0) {
        await db.insert(visitorCount).values({ id: 1, count: 1 });
        res.json({ count: 1 });
      } else {
        const newCount = result[0].count + 1;
        await db.update(visitorCount).set({ count: newCount }).where(eq(visitorCount.id, 1));
        res.json({ count: newCount });
      }
    } catch (err) {
      console.error("Visitor count increment error:", err);
      res.json({ count: 0 });
    }
  });

  // === 여행 가계부 API (인증 필요) ===
  
  // 그룹 목록 조회 (로그인한 사용자의 그룹만)
  app.get("/api/expense-groups", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const groups = await db.select().from(expenseGroups)
        .where(eq(expenseGroups.userId, userId))
        .orderBy(desc(expenseGroups.createdAt));
      res.json(groups);
    } catch (err) {
      console.error("Expense groups get error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // 그룹 생성
  app.post("/api/expense-groups", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const input = insertExpenseGroupSchema.parse(req.body);
      const budget = parseInt(req.body.budget) || 0;
      if (budget < 0) {
        return res.status(400).json({ message: "Budget cannot be negative" });
      }
      const [group] = await db.insert(expenseGroups).values({
        userId: userId,
        name: input.name,
        participants: input.participants as string[],
        budget,
      }).returning();
      res.status(201).json(group);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error("Expense group create error:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // 그룹 예산 수정 (본인 그룹만)
  app.patch("/api/expense-groups/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const id = parseInt(req.params.id);
      
      const [group] = await db.select().from(expenseGroups).where(and(eq(expenseGroups.id, id), eq(expenseGroups.userId, userId)));
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      const { budget } = req.body;
      const parsedBudget = parseInt(budget) || 0;
      if (parsedBudget < 0) {
        return res.status(400).json({ message: "Budget cannot be negative" });
      }
      
      const [updated] = await db.update(expenseGroups).set({ budget: parsedBudget }).where(eq(expenseGroups.id, id)).returning();
      res.json(updated);
    } catch (err) {
      console.error("Expense group update error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // 그룹 삭제 (본인 그룹만)
  app.delete("/api/expense-groups/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const id = parseInt(req.params.id);
      
      // 본인 그룹인지 확인
      const [group] = await db.select().from(expenseGroups).where(and(eq(expenseGroups.id, id), eq(expenseGroups.userId, userId)));
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      await db.delete(expenses).where(eq(expenses.groupId, id));
      await db.delete(expenseGroups).where(eq(expenseGroups.id, id));
      res.json({ success: true });
    } catch (err) {
      console.error("Expense group delete error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // 지출 목록 조회 (그룹별, 본인 그룹만)
  app.get("/api/expense-groups/:id/expenses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const groupId = parseInt(req.params.id);
      
      // 본인 그룹인지 확인
      const [group] = await db.select().from(expenseGroups).where(and(eq(expenseGroups.id, groupId), eq(expenseGroups.userId, userId)));
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      const expenseList = await db.select().from(expenses).where(eq(expenses.groupId, groupId)).orderBy(desc(expenses.createdAt));
      res.json(expenseList);
    } catch (err) {
      console.error("Expenses get error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // 지출 추가 (본인 그룹만)
  app.post("/api/expense-groups/:id/expenses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const groupId = parseInt(req.params.id);
      
      // 그룹 조회 및 본인 그룹 확인
      const [group] = await db.select().from(expenseGroups).where(and(eq(expenseGroups.id, groupId), eq(expenseGroups.userId, userId)));
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      const { description = "", amount = 0, category = "other", paidBy = "", splitAmong = [], date, memo = "" } = req.body;
      const participants = group.participants as string[];
      const splitAmongList = splitAmong as string[];
      
      // 금액 검증 (음수 불허)
      const parsedAmount = parseInt(amount) || 0;
      if (parsedAmount < 0) {
        return res.status(400).json({ message: "Amount cannot be negative" });
      }
      
      // 결제자 검증 (입력된 경우에만)
      if (paidBy && !participants.includes(paidBy)) {
        return res.status(400).json({ message: "Payer must be a group participant" });
      }
      
      // 분담자 검증 (입력된 경우에만)
      for (const person of splitAmongList) {
        if (!participants.includes(person)) {
          return res.status(400).json({ message: `${person} is not a group participant` });
        }
      }
      
      // 분담자 중복 제거
      const uniqueSplitAmong = Array.from(new Set(splitAmongList));
      
      const [expense] = await db.insert(expenses).values({
        groupId,
        description,
        amount: parsedAmount,
        category,
        paidBy,
        splitAmong: uniqueSplitAmong,
        date: date || new Date().toISOString().split('T')[0],
        memo,
      }).returning();
      res.status(201).json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error("Expense create error:", err);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  // 지출 삭제 (본인 그룹의 지출만)
  app.delete("/api/expenses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const id = parseInt(req.params.id);
      
      // 해당 지출의 그룹이 본인 것인지 확인
      const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      const [group] = await db.select().from(expenseGroups).where(and(eq(expenseGroups.id, expense.groupId), eq(expenseGroups.userId, userId)));
      if (!group) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      await db.delete(expenses).where(eq(expenses.id, id));
      res.json({ success: true });
    } catch (err) {
      console.error("Expense delete error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // 지출 수정 (본인 그룹의 지출만)
  app.patch("/api/expenses/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const id = parseInt(req.params.id);
      
      // 해당 지출의 그룹이 본인 것인지 확인
      const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      
      const [group] = await db.select().from(expenseGroups).where(and(eq(expenseGroups.id, expense.groupId), eq(expenseGroups.userId, userId)));
      if (!group) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const participants = group.participants as string[];
      const { description, amount, category, paidBy, splitAmong, date, memo } = req.body;
      
      // 금액 검증 (음수 불허)
      if (amount !== undefined && (parseInt(amount) || 0) < 0) {
        return res.status(400).json({ message: "Amount cannot be negative" });
      }
      
      // 결제자 검증 (입력된 경우에만)
      if (paidBy !== undefined && paidBy !== "" && !participants.includes(paidBy)) {
        return res.status(400).json({ message: "Payer must be a group participant" });
      }
      
      // 분담자 검증
      if (splitAmong !== undefined) {
        for (const person of splitAmong) {
          if (!participants.includes(person)) {
            return res.status(400).json({ message: `${person} is not a group participant` });
          }
        }
      }
      
      const updateData: any = {};
      if (description !== undefined) updateData.description = description;
      if (amount !== undefined) updateData.amount = parseInt(amount) || 0;
      if (category !== undefined) updateData.category = category;
      if (paidBy !== undefined) updateData.paidBy = paidBy;
      if (splitAmong !== undefined) updateData.splitAmong = Array.from(new Set(splitAmong));
      if (date !== undefined) updateData.date = date;
      if (memo !== undefined) updateData.memo = memo;
      
      const [updated] = await db.update(expenses).set(updateData).where(eq(expenses.id, id)).returning();
      res.json(updated);
    } catch (err) {
      console.error("Expense update error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // 정산 계산 (그룹별, 본인 그룹만)
  app.get("/api/expense-groups/:id/settlement", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const groupId = parseInt(req.params.id);
      const [group] = await db.select().from(expenseGroups).where(and(eq(expenseGroups.id, groupId), eq(expenseGroups.userId, userId)));
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      const expenseList = await db.select().from(expenses).where(eq(expenses.groupId, groupId));
      
      const participants = group.participants as string[];
      
      // 각 참여자가 지불한 금액
      const paid: Record<string, number> = {};
      // 각 참여자가 부담해야 할 금액
      const owed: Record<string, number> = {};
      
      participants.forEach(p => {
        paid[p] = 0;
        owed[p] = 0;
      });
      
      for (const expense of expenseList) {
        const splitAmong = (expense.splitAmong as string[]) || [];
        if (splitAmong.length === 0) continue;
        
        const baseAmount = Math.floor(expense.amount / splitAmong.length);
        const remainder = expense.amount % splitAmong.length;
        
        // 결제자의 지불 금액 증가
        const paidBy = expense.paidBy || "";
        if (paidBy && paid[paidBy] !== undefined) {
          paid[paidBy] += expense.amount;
        }
        
        // 각 분담자의 부담 금액 증가 (나머지는 앞 사람부터 분배)
        for (let idx = 0; idx < splitAmong.length; idx++) {
          const person = splitAmong[idx];
          if (owed[person] !== undefined) {
            owed[person] += baseAmount + (idx < remainder ? 1 : 0);
          }
        }
      }
      
      // 정산 결과 계산 (차액)
      const balance: Record<string, number> = {};
      participants.forEach(p => {
        balance[p] = paid[p] - owed[p]; // 양수면 받아야 함, 음수면 줘야 함
      });
      
      // 정산 내역 생성
      const settlements: { from: string; to: string; amount: number }[] = [];
      const debtors = participants.filter(p => balance[p] < 0).map(p => ({ name: p, amount: -balance[p] }));
      const creditors = participants.filter(p => balance[p] > 0).map(p => ({ name: p, amount: balance[p] }));
      
      debtors.sort((a, b) => b.amount - a.amount);
      creditors.sort((a, b) => b.amount - a.amount);
      
      let i = 0, j = 0;
      while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const amount = Math.min(debtor.amount, creditor.amount);
        
        if (amount > 0) {
          settlements.push({
            from: debtor.name,
            to: creditor.name,
            amount: Math.round(amount)
          });
        }
        
        debtor.amount -= amount;
        creditor.amount -= amount;
        
        if (debtor.amount < 1) i++;
        if (creditor.amount < 1) j++;
      }
      
      const totalExpense = expenseList.reduce((sum, e) => sum + e.amount, 0);
      const perPerson = participants.length > 0 ? Math.round(totalExpense / participants.length) : 0;
      
      res.json({
        totalExpense,
        perPerson,
        participantCount: participants.length,
        paid,
        owed,
        balance,
        settlements
      });
    } catch (err) {
      console.error("Settlement calculation error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // 내 주변 장소 검색 (Google Places API)
  app.get("/api/nearby-places", async (req, res) => {
    try {
      const { lat, lng, type, radius = "1500", lang = "ko" } = req.query;
      
      if (!lat || !lng || !type) {
        return res.status(400).json({ message: "lat, lng, and type are required" });
      }
      
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Google Maps API key not configured" });
      }
      
      // Map language code to Google Places API language code
      const langMap: Record<string, string> = { ko: "ko", en: "en", zh: "zh-CN", vi: "vi", ru: "ru", ja: "ja" };
      const googleLang = langMap[lang as string] || "ko";
      
      // Google Places Nearby Search API
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}&language=${googleLang}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        console.error("Google Places API error:", data.status, data.error_message);
        return res.status(500).json({ message: "Failed to fetch nearby places" });
      }
      
      // 필요한 정보만 추출하여 반환
      const places = (data.results || []).map((place: any) => ({
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        priceLevel: place.price_level,
        openNow: place.opening_hours?.open_now,
        types: place.types,
        location: place.geometry?.location,
        photoReference: place.photos?.[0]?.photo_reference,
      }));
      
      res.json({ places, status: data.status });
    } catch (err) {
      console.error("Nearby places error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // 장소 상세 정보 (Google Places API)
  app.get("/api/place-details/:placeId", async (req, res) => {
    try {
      const { placeId } = req.params;
      const { lang = "ko" } = req.query;
      
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Google Maps API key not configured" });
      }
      
      // Map language code to Google Places API language code
      const langMap: Record<string, string> = { ko: "ko", en: "en", zh: "zh-CN", vi: "vi", ru: "ru", ja: "ja" };
      const googleLang = langMap[lang as string] || "ko";
      
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,opening_hours,rating,user_ratings_total,price_level,reviews,website,url,photos&key=${apiKey}&language=${googleLang}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== "OK") {
        console.error("Google Places Details API error:", data.status, data.error_message);
        return res.status(500).json({ message: "Failed to fetch place details" });
      }
      
      const result = data.result;
      res.json({
        name: result.name,
        address: result.formatted_address,
        phone: result.formatted_phone_number,
        openingHours: result.opening_hours?.weekday_text,
        rating: result.rating,
        userRatingsTotal: result.user_ratings_total,
        priceLevel: result.price_level,
        reviews: result.reviews?.slice(0, 3),
        website: result.website,
        googleMapsUrl: result.url,
        photoReferences: result.photos?.slice(0, 5).map((p: any) => p.photo_reference),
      });
    } catch (err) {
      console.error("Place details error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI 여행 플랜 생성 API (Gemini 사용 - 무료)
  const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  const travelPlanRequestSchema = z.object({
    purpose: z.string().min(1),
    startDate: z.string(),
    endDate: z.string(),
    language: z.string().default("ko"),
  });

  // 붕따우 관광지 및 맛집 데이터
  const placesData = {
    attractions: [
      { name: "붕따우 거대 예수상", nameVi: "Tượng Chúa Kitô", type: "landmark", note: "811개 계단, 해안 전경" },
      { name: "붕따우 등대", nameVi: "Hải Đăng Vũng Tàu", type: "landmark", note: "1910년 프랑스 식민지 시대 건설" },
      { name: "화이트 펠리스", nameVi: "Bạch Dinh", type: "historical", note: "1898년 프랑스 총독 별장" },
      { name: "놀이동산", nameVi: "Ho May Amusement Park", type: "entertainment", note: "케이블카, 워터파크, 동물원" },
      { name: "불교사찰", nameVi: "Chơn Không Monastery", type: "religious", note: "명상, 평화로운 분위기" },
      { name: "붕따우 백비치", nameVi: "Bãi Sau", type: "beach", note: "가장 긴 해변, 수영, 해양스포츠" },
      { name: "붕따우 프론트 비치", nameVi: "Front Beach", type: "beach", note: "일몰 감상 최적" },
      { name: "돼지언덕", nameVi: "Đồi Con Heo", type: "viewpoint", note: "일몰 포토존" },
      { name: "원숭이사원", nameVi: "Chùa Khỉ Viba", type: "temple", note: "야생 원숭이" },
      { name: "붕따우 해산물 시장", nameVi: "Seafood Market", type: "market", note: "신선한 해산물" },
      { name: "붕따우 재래시장", nameVi: "Chợ Vũng Tàu", type: "market", note: "현지 문화 체험" },
    ],
    restaurants: {
      localFood: [
        { name: "반미 티삥", type: "반미", note: "현지인 맛집" },
        { name: "반쎄오 (베트남 빈대떡)", type: "반쎄오", note: "현지 음식" },
        { name: "분짜", type: "분짜", note: "하노이 스타일" },
        { name: "후띠우", type: "쌀국수", note: "베트남 남부 스타일" },
      ],
      koreanFood: [
        { name: "고향 칼국수/냉면", type: "한식" },
        { name: "이안 소금구이 BBQ", type: "고기구이", recommended: true },
        { name: "장모님 치맥", type: "치킨" },
        { name: "돈까스랑 피자랑", type: "돈까스/피자" },
      ],
      buffet: [
        { name: "간하오 스시, 샤브샤브 뷔페", type: "뷔페" },
        { name: "해산물 뷔페", type: "뷔페", note: "저녁 오픈" },
      ],
      chineseFood: [
        { name: "옌찌에우 딤섬", type: "딤섬", recommended: true },
        { name: "민 끼", type: "중식" },
      ],
      coffee: [
        { name: "Coffee Suối Bên Biển", type: "카페", note: "바다 전망" },
        { name: "KATINAT 커피", type: "카페" },
        { name: "Highlands Coffee", type: "카페" },
      ],
    },
    services: [
      { name: "Re.en 마사지", type: "마사지" },
      { name: "그랜드 마사지", type: "마사지" },
      { name: "DAY SPA", type: "스파" },
    ],
    golf: [
      { name: "Paradise Golf", course: "paradise" },
      { name: "Chou Duc Golf", course: "chouduc" },
      { name: "Ho Cham Golf", course: "hocham" },
    ],
  };

  app.post("/api/travel-plan", async (req, res) => {
    try {
      const input = travelPlanRequestSchema.parse(req.body);
      const { purpose, startDate, endDate, language } = input;

      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const purposeDescriptions: Record<string, string> = {
        gourmet: "맛집 탐방과 미식 여행에 중점",
        relaxing: "여유롭고 편안한 힐링 여행에 중점",
        golf: "골프 라운딩과 휴식에 중점",
        adventure: "관광명소 탐험과 액티비티에 중점",
        culture: "문화 유적지와 역사 탐방에 중점",
        family: "가족과 함께 즐길 수 있는 활동에 중점",
        nightlife: "클럽, 바 등 신나는 밤문화 체험에 중점",
      };

      const purposes = purpose.split(",").map((p: string) => p.trim());
      const purposeDescription = purposes
        .map((p: string) => purposeDescriptions[p] || p)
        .join(", ");

      const languagePrompts: Record<string, string> = {
        ko: "한국어로 답변해주세요.",
        en: "Please respond in English.",
        zh: "请用中文回答。",
        vi: "Vui lòng trả lời bằng tiếng Việt.",
        ru: "Пожалуйста, ответьте на русском языке.",
        ja: "日本語で回答してください。",
      };

      const systemPrompt = `당신은 베트남 붕따우(Vung Tau) 전문 여행 플래너입니다. 
사용자의 여행 목적과 일정에 맞춰 최적의 여행 일정을 만들어주세요.
${languagePrompts[language] || languagePrompts.ko}

응답은 반드시 다음 JSON 형식으로만 반환해주세요:
{
  "title": "여행 제목",
  "summary": "여행 요약 (2-3문장)",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "이 날의 테마",
      "schedule": [
        {
          "time": "09:00",
          "activity": "활동 내용",
          "place": "장소명",
          "placeVi": "베트남어 장소명",
          "type": "attraction|restaurant|cafe|massage|golf|beach",
          "note": "참고사항"
        }
      ]
    }
  ],
  "tips": ["팁1", "팁2", "팁3"]
}`;

      const userPrompt = `붕따우 ${days}일 여행 일정을 만들어주세요.

여행 기간: ${format(start, 'yyyy-MM-dd')} ~ ${format(end, 'yyyy-MM-dd')} (${days}일)
여행 목적: ${purposeDescription}

사용 가능한 장소 데이터:
${JSON.stringify(placesData, null, 2)}

위 장소 데이터를 활용하여 각 날짜별로 아침, 점심, 오후, 저녁 일정을 포함한 상세 여행 계획을 만들어주세요.
식사 시간에는 맛집을, 관광 시간에는 관광명소를 적절히 배치해주세요.
${purposes.includes('golf') ? '매일 또는 격일로 골프 라운딩을 포함해주세요.' : ''}
${purposes.includes('relaxing') ? '마사지나 스파, 카페 시간을 충분히 포함해주세요.' : ''}
${purposes.includes('gourmet') ? '다양한 현지 음식과 한식을 골고루 포함해주세요.' : ''}
${purposes.includes('nightlife') ? '저녁에 클럽이나 바 등 밤문화 활동을 포함해주세요. (88 비어클럽, Revo 클럽, Lox 클럽, U.S Bar Club 등)' : ''}`;

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
        contents: userPrompt,
      });

      const content = response.text;
      if (!content) {
        return res.status(500).json({ message: "AI 응답을 받지 못했습니다." });
      }

      const travelPlan = JSON.parse(content);
      res.json(travelPlan);
    } catch (err) {
      console.error("Travel plan error:", err);
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "여행 플랜 생성 중 오류가 발생했습니다." });
      }
    }
  });

  // 장소 사진 프록시 (Google Places API Photo)
  app.get("/api/place-photo/:photoReference", async (req, res) => {
    try {
      const { photoReference } = req.params;
      const { maxwidth = "400" } = req.query;
      
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Google Maps API key not configured" });
      }
      
      const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photo_reference=${photoReference}&key=${apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        return res.status(response.status).json({ message: "Failed to fetch photo" });
      }
      
      // 이미지를 직접 스트리밍
      res.set("Content-Type", response.headers.get("content-type") || "image/jpeg");
      res.set("Cache-Control", "public, max-age=86400"); // 24시간 캐시
      
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err) {
      console.error("Place photo error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Object Storage 라우트 등록
  registerObjectStorageRoutes(app);

  // 관리자 ID (Replit Auth 사용자 ID)
  const ADMIN_USER_ID = process.env.ADMIN_USER_ID || "";

  // 게시판 - 게시글 목록 조회
  app.get("/api/posts", async (req, res) => {
    try {
      const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt));
      res.json(allPosts);
    } catch (err) {
      console.error("Get posts error:", err);
      res.status(500).json({ message: "Failed to get posts" });
    }
  });

  // 게시판 - 게시글 상세 조회
  app.get("/api/posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [post] = await db.select().from(posts).where(eq(posts.id, id));
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (err) {
      console.error("Get post error:", err);
      res.status(500).json({ message: "Failed to get post" });
    }
  });

  // 게시판 - 게시글 작성 (관리자만)
  app.post("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub;
      if (!userId || userId !== ADMIN_USER_ID) {
        return res.status(403).json({ message: "Only admin can create posts" });
      }

      const result = insertPostSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid post data", errors: result.error.errors });
      }

      const [newPost] = await db.insert(posts).values({
        ...result.data,
        authorId: userId,
        authorName: user.claims?.first_name || user.claims?.email || "관리자",
      }).returning();

      res.status(201).json(newPost);
    } catch (err) {
      console.error("Create post error:", err);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // 게시판 - 게시글 수정 (관리자만)
  app.patch("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub;
      if (!userId || userId !== ADMIN_USER_ID) {
        return res.status(403).json({ message: "Only admin can edit posts" });
      }

      const id = parseInt(req.params.id);
      const [existingPost] = await db.select().from(posts).where(eq(posts.id, id));
      if (!existingPost) {
        return res.status(404).json({ message: "Post not found" });
      }

      const [updatedPost] = await db.update(posts)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(posts.id, id))
        .returning();

      res.json(updatedPost);
    } catch (err) {
      console.error("Update post error:", err);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  // 게시판 - 게시글 삭제 (관리자만)
  // 게시글 수정
  app.put("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub;
      if (!userId || String(userId) !== String(ADMIN_USER_ID)) {
        return res.status(403).json({ message: "Only admin can edit posts" });
      }

      const id = parseInt(req.params.id);
      const { title, content } = req.body;

      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }

      const [updated] = await db.update(posts)
        .set({ 
          title, 
          content,
          updatedAt: new Date()
        })
        .where(eq(posts.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Post not found" });
      }

      res.json(updated);
    } catch (err) {
      console.error("Update post error:", err);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.delete("/api/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub;
      if (!userId || userId !== ADMIN_USER_ID) {
        return res.status(403).json({ message: "Only admin can delete posts" });
      }

      const id = parseInt(req.params.id);
      // 댓글도 함께 삭제
      await db.delete(comments).where(eq(comments.postId, id));
      await db.delete(posts).where(eq(posts.id, id));

      res.json({ success: true });
    } catch (err) {
      console.error("Delete post error:", err);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // 게시판 - 게시글 숨기기/보이기 토글 (관리자 전용)
  app.patch("/api/posts/:id/toggle-visibility", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub;
      if (!userId || userId !== ADMIN_USER_ID) {
        return res.status(403).json({ message: "Only admin can toggle post visibility" });
      }

      const id = parseInt(req.params.id);
      const [post] = await db.select().from(posts).where(eq(posts.id, id));
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const [updated] = await db.update(posts)
        .set({ isHidden: !post.isHidden })
        .where(eq(posts.id, id))
        .returning();

      res.json(updated);
    } catch (err) {
      console.error("Toggle post visibility error:", err);
      res.status(500).json({ message: "Failed to toggle post visibility" });
    }
  });

  // 게시판 - 댓글 목록 조회
  app.get("/api/posts/:postId/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      const allComments = await db.select().from(comments).where(eq(comments.postId, postId)).orderBy(comments.createdAt);
      res.json(allComments);
    } catch (err) {
      console.error("Get comments error:", err);
      res.status(500).json({ message: "Failed to get comments" });
    }
  });

  // 게시판 - 댓글 작성 (누구나)
  app.post("/api/posts/:postId/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      
      // 게시글 존재 확인
      const [post] = await db.select().from(posts).where(eq(posts.id, postId));
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const result = insertCommentSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid comment data", errors: result.error.errors });
      }

      const [newComment] = await db.insert(comments).values({
        ...result.data,
        postId,
      }).returning();

      res.status(201).json(newComment);
    } catch (err) {
      console.error("Create comment error:", err);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  // 게시판 - 댓글 삭제 (관리자만)
  app.delete("/api/comments/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub;
      if (!userId || userId !== ADMIN_USER_ID) {
        return res.status(403).json({ message: "Only admin can delete comments" });
      }

      const id = parseInt(req.params.id);
      await db.delete(comments).where(eq(comments.id, id));

      res.json({ success: true });
    } catch (err) {
      console.error("Delete comment error:", err);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // 관리자 여부 확인
  app.get("/api/admin/check", (req, res) => {
    const user = req.user as any;
    const userId = user?.claims?.sub;
    const isAdmin = userId && String(userId) === String(ADMIN_USER_ID);
    console.log("Admin check - userId:", userId, "ADMIN_USER_ID:", ADMIN_USER_ID, "isAdmin:", isAdmin);
    res.json({ isAdmin, isLoggedIn: !!user, userId });
  });

  // === 인스타그램 동기화 ===
  interface InstagramPost {
    id: string;
    caption?: string;
    media_url: string;
    media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
    timestamp: string;
    permalink?: string;
  }

  async function fetchInstagramPosts(): Promise<InstagramPost[]> {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("Instagram Access Token not configured");
    }

    try {
      // 먼저 Instagram User ID 가져오기
      const meResponse = await fetch(
        `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
      );
      
      if (!meResponse.ok) {
        const errorData = await meResponse.text();
        console.error("Instagram me API error:", errorData);
        throw new Error("Failed to get Instagram user info");
      }
      
      const meData = await meResponse.json();
      const userId = meData.id;

      // 게시물 가져오기
      const mediaResponse = await fetch(
        `https://graph.instagram.com/${userId}/media?fields=id,caption,media_url,media_type,timestamp,permalink&limit=10&access_token=${accessToken}`
      );

      if (!mediaResponse.ok) {
        const errorData = await mediaResponse.text();
        console.error("Instagram media API error:", errorData);
        throw new Error("Failed to fetch Instagram posts");
      }

      const mediaData = await mediaResponse.json();
      return mediaData.data || [];
    } catch (error) {
      console.error("Instagram API error:", error);
      throw error;
    }
  }

  // 인스타그램 동기화 상태 확인
  app.get("/api/instagram/status", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = user?.claims?.sub;
    const isAdmin = userId && String(userId) === String(ADMIN_USER_ID);
    
    if (!isAdmin) {
      return res.status(403).json({ error: "관리자 권한이 필요합니다" });
    }

    try {
      const hasToken = !!process.env.INSTAGRAM_ACCESS_TOKEN;
      const syncedPosts = await db.select().from(instagramSyncedPosts).orderBy(desc(instagramSyncedPosts.syncedAt)).limit(5);
      
      res.json({
        configured: hasToken,
        lastSynced: syncedPosts.length > 0 ? syncedPosts[0].syncedAt : null,
        syncedCount: syncedPosts.length,
      });
    } catch (error) {
      res.status(500).json({ error: "상태 확인 실패" });
    }
  });

  // 인스타그램 게시물 수동 동기화
  app.post("/api/instagram/sync", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = user?.claims?.sub;
    const isAdmin = userId && String(userId) === String(ADMIN_USER_ID);
    
    if (!isAdmin) {
      return res.status(403).json({ error: "관리자 권한이 필요합니다" });
    }

    try {
      const instaPosts = await fetchInstagramPosts();
      let syncedCount = 0;

      for (const instaPost of instaPosts) {
        // 이미 동기화된 게시물인지 확인
        const existing = await db.select().from(instagramSyncedPosts).where(eq(instagramSyncedPosts.instagramId, instaPost.id));
        
        if (existing.length > 0) {
          continue; // 이미 동기화됨
        }

        // 새 게시물 생성
        const title = instaPost.caption?.split("\n")[0]?.substring(0, 100) || "Instagram 게시물";
        let content = instaPost.caption || "";
        
        // 이미지 추가
        if (instaPost.media_type === "IMAGE" || instaPost.media_type === "CAROUSEL_ALBUM") {
          content = `![Instagram](${instaPost.media_url})\n\n${content}`;
        }

        const adminName = user?.claims?.nickname || user?.claims?.name || "관리자";
        
        const [newPost] = await db.insert(posts).values({
          title,
          content,
          authorId: String(userId),
          authorName: `${adminName} (Instagram)`,
        }).returning();

        // 동기화 기록 저장
        await db.insert(instagramSyncedPosts).values({
          instagramId: instaPost.id,
          postId: newPost.id,
        });

        syncedCount++;
      }

      res.json({ 
        success: true, 
        syncedCount,
        message: syncedCount > 0 ? `${syncedCount}개의 새 게시물이 동기화되었습니다` : "새로운 게시물이 없습니다"
      });
    } catch (error: any) {
      console.error("Instagram sync error:", error);
      res.status(500).json({ error: error.message || "동기화 실패" });
    }
  });

  // 인스타그램 게시물 미리보기 (동기화 전 확인)
  app.get("/api/instagram/preview", isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const userId = user?.claims?.sub;
    const isAdmin = userId && String(userId) === String(ADMIN_USER_ID);
    
    if (!isAdmin) {
      return res.status(403).json({ error: "관리자 권한이 필요합니다" });
    }

    try {
      const instaPosts = await fetchInstagramPosts();
      
      // 이미 동기화된 게시물 ID 가져오기
      const syncedIds = await db.select({ instagramId: instagramSyncedPosts.instagramId }).from(instagramSyncedPosts);
      const syncedIdSet = new Set(syncedIds.map(s => s.instagramId));
      
      const previewPosts = instaPosts.map(post => ({
        id: post.id,
        caption: post.caption?.substring(0, 200) || "",
        mediaUrl: post.media_url,
        mediaType: post.media_type,
        timestamp: post.timestamp,
        alreadySynced: syncedIdSet.has(post.id),
      }));

      res.json({ posts: previewPosts });
    } catch (error: any) {
      console.error("Instagram preview error:", error);
      res.status(500).json({ error: error.message || "미리보기 실패" });
    }
  });

  // URL 메타데이터 가져오기 (링크 미리보기용)
  app.get("/api/url-metadata", async (req, res) => {
    const url = req.query.url as string;
    
    if (!url) {
      return res.status(400).json({ error: "URL이 필요합니다" });
    }

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; LinkPreview/1.0)",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch URL");
      }

      const html = await response.text();
      
      // OG 태그 파싱
      const getMetaContent = (property: string): string | null => {
        const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
        const altRegex = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`, 'i');
        const match = html.match(regex) || html.match(altRegex);
        return match ? match[1] : null;
      };

      const getTitle = (): string => {
        const ogTitle = getMetaContent("og:title");
        if (ogTitle) return ogTitle;
        
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        return titleMatch ? titleMatch[1].trim() : url;
      };

      const metadata = {
        url,
        title: getTitle(),
        description: getMetaContent("og:description") || getMetaContent("description") || "",
        image: getMetaContent("og:image") || getMetaContent("twitter:image") || null,
        siteName: getMetaContent("og:site_name") || new URL(url).hostname,
      };

      res.json(metadata);
    } catch (error: any) {
      console.error("URL metadata error:", error);
      res.json({
        url,
        title: new URL(url).hostname,
        description: "",
        image: null,
        siteName: new URL(url).hostname,
      });
    }
  });

  // WebSocket 채팅 서버
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/chat" });
  
  interface ChatUser {
    ws: WebSocket;
    nickname: string;
    joinedAt: Date;
  }
  
  const chatUsers = new Map<WebSocket, ChatUser>();
  const chatHistory: Array<{ nickname: string; message: string; timestamp: Date; type: string }> = [];
  const MAX_HISTORY = 100;
  
  wss.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket connection");
    
    ws.on("message", (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        
        if (msg.type === "join") {
          const nickname = msg.nickname || "익명";
          chatUsers.set(ws, { ws, nickname, joinedAt: new Date() });
          
          // 최근 채팅 기록 전송
          ws.send(JSON.stringify({
            type: "history",
            messages: chatHistory.slice(-50),
          }));
          
          // 새 사용자 입장 알림 (관리자 알림용)
          broadcast(JSON.stringify({
            type: "user_joined",
            nickname: nickname,
            timestamp: new Date(),
          }));
          
          // 온라인 유저 목록 전송 (입장 메시지 없이)
          broadcastUserList();
        } else if (msg.type === "message") {
          const user = chatUsers.get(ws);
          if (user) {
            const chatMsg = {
              type: "message",
              nickname: user.nickname,
              message: msg.message,
              timestamp: new Date(),
            };
            chatHistory.push(chatMsg);
            if (chatHistory.length > MAX_HISTORY) chatHistory.shift();
            
            broadcast(JSON.stringify(chatMsg));
          }
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    });
    
    ws.on("close", () => {
      const user = chatUsers.get(ws);
      if (user) {
        chatUsers.delete(ws);
        broadcastUserList();
      }
    });
  });
  
  function broadcast(message: string) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  function broadcastUserList() {
    const users = Array.from(chatUsers.values()).map((u) => u.nickname);
    broadcast(JSON.stringify({ type: "users", users }));
  }

  return httpServer;
}
