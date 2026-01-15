import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { calculateQuoteSchema, visitorCount, expenseGroups, expenses, insertExpenseGroupSchema, insertExpenseSchema } from "@shared/schema";
import { addDays, getDay, parseISO } from "date-fns";
import { db } from "./db";
import { eq, sql, desc } from "drizzle-orm";

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

  // === 여행 가계부 API ===
  
  // 그룹 목록 조회
  app.get("/api/expense-groups", async (req, res) => {
    try {
      const groups = await db.select().from(expenseGroups).orderBy(desc(expenseGroups.createdAt));
      res.json(groups);
    } catch (err) {
      console.error("Expense groups get error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // 그룹 생성
  app.post("/api/expense-groups", async (req, res) => {
    try {
      const input = insertExpenseGroupSchema.parse(req.body);
      const [group] = await db.insert(expenseGroups).values({
        name: input.name,
        participants: input.participants as string[],
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

  // 그룹 삭제
  app.delete("/api/expense-groups/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(expenses).where(eq(expenses.groupId, id));
      await db.delete(expenseGroups).where(eq(expenseGroups.id, id));
      res.json({ success: true });
    } catch (err) {
      console.error("Expense group delete error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // 지출 목록 조회 (그룹별)
  app.get("/api/expense-groups/:id/expenses", async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const expenseList = await db.select().from(expenses).where(eq(expenses.groupId, groupId)).orderBy(desc(expenses.createdAt));
      res.json(expenseList);
    } catch (err) {
      console.error("Expenses get error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // 지출 추가
  app.post("/api/expense-groups/:id/expenses", async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      
      // 그룹 조회 및 참여자 검증
      const [group] = await db.select().from(expenseGroups).where(eq(expenseGroups.id, groupId));
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      const input = insertExpenseSchema.parse({ ...req.body, groupId });
      const participants = group.participants as string[];
      const splitAmongList = input.splitAmong as string[];
      
      // 금액 검증
      if (input.amount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
      }
      
      // 결제자 검증
      if (!participants.includes(input.paidBy)) {
        return res.status(400).json({ message: "Payer must be a group participant" });
      }
      
      // 분담자 검증
      for (const person of splitAmongList) {
        if (!participants.includes(person)) {
          return res.status(400).json({ message: `${person} is not a group participant` });
        }
      }
      
      // 분담자 중복 제거
      const uniqueSplitAmong = Array.from(new Set(splitAmongList));
      
      const [expense] = await db.insert(expenses).values({
        groupId: input.groupId,
        description: input.description,
        amount: input.amount,
        category: input.category,
        paidBy: input.paidBy,
        splitAmong: uniqueSplitAmong,
        date: input.date,
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

  // 지출 삭제
  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(expenses).where(eq(expenses.id, id));
      res.json({ success: true });
    } catch (err) {
      console.error("Expense delete error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // 정산 계산 (그룹별)
  app.get("/api/expense-groups/:id/settlement", async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      const [group] = await db.select().from(expenseGroups).where(eq(expenseGroups.id, groupId));
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
        const splitAmong = expense.splitAmong as string[];
        const baseAmount = Math.floor(expense.amount / splitAmong.length);
        const remainder = expense.amount % splitAmong.length;
        
        // 결제자의 지불 금액 증가
        if (paid[expense.paidBy] !== undefined) {
          paid[expense.paidBy] += expense.amount;
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
      const { lat, lng, type, radius = "1500" } = req.query;
      
      if (!lat || !lng || !type) {
        return res.status(400).json({ message: "lat, lng, and type are required" });
      }
      
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Google Maps API key not configured" });
      }
      
      // Google Places Nearby Search API
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}&language=ko`;
      
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
      
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Google Maps API key not configured" });
      }
      
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,opening_hours,rating,user_ratings_total,price_level,reviews,website,url,photos&key=${apiKey}&language=ko`;
      
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

  return httpServer;
}
