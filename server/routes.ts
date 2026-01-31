import type { Express } from "express";
import type { Server } from "http";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { calculateQuoteSchema, visitorCount, expenseGroups, expenses, insertExpenseGroupSchema, insertExpenseSchema, posts, comments, insertPostSchema, insertCommentSchema, instagramSyncedPosts, pushSubscriptions, userLocations, insertUserLocationSchema, users, villas, insertVillaSchema } from "@shared/schema";
import { addDays, getDay, parseISO, format, addHours } from "date-fns";
import { db } from "./db";
import { eq, sql, desc, and } from "drizzle-orm";
import { setupAuth, registerAuthRoutes, isAuthenticated, getSession } from "./replit_integrations/auth";
import { GoogleGenAI } from "@google/genai";
import { WebSocketServer, WebSocket } from "ws";
import { registerObjectStorageRoutes, objectStorageClient } from "./replit_integrations/object_storage";
import webpush from "web-push";
import crypto from "crypto";
import * as cheerio from "cheerio";

// Web Push 설정
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@vungtau.blog";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

// 베트남 공휴일 목록 (2025-2028)
const VIETNAM_HOLIDAYS: string[] = [
  // 2025년
  "2025-01-01", // 새해
  "2025-01-29", "2025-01-30", "2025-01-31", "2025-02-01", "2025-02-02", "2025-02-03", "2025-02-04", // 뗏 (설날, 음력 1월 1일 = 1/29)
  "2025-04-10", // 훙왕 기념일
  "2025-04-30", // 통일의 날
  "2025-05-01", // 노동절
  "2025-09-02", // 국경일
  // 2026년
  "2026-01-01", // 새해
  "2026-02-14", "2026-02-15", "2026-02-16", "2026-02-17", "2026-02-18", "2026-02-19", "2026-02-20", "2026-02-21", "2026-02-22", // 뗏 (설날, 음력 1월 1일 = 2/17)
  "2026-04-28", // 훙왕 기념일
  "2026-04-30", // 통일의 날
  "2026-05-01", // 노동절
  "2026-09-02", // 국경일
  "2026-11-24", // 베트남 문화의 날 (신설)
  // 2027년
  "2027-01-01", // 새해
  "2027-02-07", "2027-02-08", "2027-02-09", "2027-02-10", "2027-02-11", "2027-02-12", "2027-02-13", // 뗏 (설날, 음력 1월 1일 = 2/7)
  "2027-04-18", // 훙왕 기념일
  "2027-04-30", // 통일의 날
  "2027-05-01", // 노동절
  "2027-09-02", // 국경일
  "2027-11-24", // 베트남 문화의 날
  // 2028년
  "2028-01-01", // 새해
  "2028-01-26", "2028-01-27", "2028-01-28", "2028-01-29", "2028-01-30", "2028-01-31", "2028-02-01", // 뗏 (설날, 음력 1월 1일 = 1/26)
  "2028-04-06", // 훙왕 기념일
  "2028-04-30", // 통일의 날
  "2028-05-01", // 노동절
  "2028-09-02", // 국경일
  "2028-11-24", // 베트남 문화의 날
];

// 베트남 공휴일 체크 함수
function isVietnamHoliday(date: Date): boolean {
  const dateStr = format(date, "yyyy-MM-dd");
  return VIETNAM_HOLIDAYS.includes(dateStr);
}

// 푸시 알림 발송 함수
async function sendPushNotifications(title: string, body: string, url: string = "/board") {
  try {
    const subscriptions = await db.select().from(pushSubscriptions);
    const payload = JSON.stringify({ title, body, url });
    
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: sub.keys as { p256dh: string; auth: string }
        }, payload);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
        }
        console.error("Push notification error:", err);
      }
    }
  } catch (err) {
    console.error("Send push notifications error:", err);
  }
}

let exchangeRatesCache: { rates: Record<string, number>; timestamp: number } | null = null;
let weatherCache: { data: { temp: string; condition: string; humidity: string; wind: string }; timestamp: number } | null = null;
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
    
    // 새로운 네이버 금융 페이지 구조: span 태그들에서 숫자 추출
    // <p class="no_today">...<span class="no1">1</span><span class="shim">,</span><span class="no4">4</span>...
    const noTodayMatch = html.match(/<p class="no_today">([\s\S]*?)<\/p>/);
    if (noTodayMatch) {
      const noTodayContent = noTodayMatch[1];
      // span 태그들에서 숫자와 점(.)만 추출
      const numbers = noTodayContent.match(/<span class="(?:no\d|jum)">[0-9.]<\/span>/g);
      if (numbers) {
        const rateStr = numbers.map(span => {
          const numMatch = span.match(/>([0-9.])<\/span>/);
          return numMatch ? numMatch[1] : '';
        }).join('');
        const rate = parseFloat(rateStr);
        if (!isNaN(rate) && rate > 0) {
          return rate;
        }
      }
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

  // === 카카오 로그인 OAuth ===
  const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY || "";
  console.log("Kakao REST API Key status:", KAKAO_REST_API_KEY ? `set (${KAKAO_REST_API_KEY.substring(0, 8)}...)` : "NOT SET");

  // 카카오 로그인 시작
  app.get("/api/auth/kakao", (req, res) => {
    const state = crypto.randomBytes(16).toString("hex");
    (req.session as any).kakaoState = state;
    req.session.save(() => {
      // 항상 vungtau.blog 도메인 사용 (카카오 개발자 콘솔에 등록된 URI)
      const redirectUri = "https://vungtau.blog/api/auth/kakao/callback";
      console.log("Kakao auth start - redirectUri:", redirectUri);
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;
      res.redirect(kakaoAuthUrl);
    });
  });

  // 카카오 콜백 처리
  app.get("/api/auth/kakao/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      const sessionState = (req.session as any).kakaoState;
      
      console.log("Kakao callback - state:", state, "sessionState:", sessionState, "sessionId:", req.sessionID);
      
      // state 검증 (세션 문제 시 경고만 출력하고 진행)
      if (!state || !sessionState || state !== sessionState) {
        console.warn("State mismatch - state:", state, "sessionState:", sessionState);
        // 프로덕션에서 세션 쿠키가 유실되는 경우가 있어 경고만 출력하고 진행
        // return res.status(400).send("Invalid or missing state parameter");
      }
      
      // 사용된 state 삭제
      if (sessionState) {
        delete (req.session as any).kakaoState;
      }
      
      // 항상 vungtau.blog 도메인 사용 (카카오 개발자 콘솔에 등록된 URI)
      const redirectUri = "https://vungtau.blog/api/auth/kakao/callback";
      
      console.log("Kakao callback - redirectUri:", redirectUri, "code:", code?.toString().substring(0, 10) + "...");

      // 액세스 토큰 요청
      const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: KAKAO_REST_API_KEY,
          redirect_uri: redirectUri,
          code: code as string,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error("Kakao token error:", error, "redirectUri:", redirectUri, "client_id:", KAKAO_REST_API_KEY ? "set" : "missing");
        return res.status(400).send("Failed to get access token: " + error);
      }

      const tokenData = await tokenResponse.json() as { access_token: string };

      // 사용자 정보 요청
      const userResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        return res.status(400).send("Failed to get user info");
      }

      const kakaoUser = await userResponse.json() as {
        id: number;
        kakao_account?: {
          email?: string;
          gender?: string; // male, female
          profile?: {
            nickname?: string;
            profile_image_url?: string;
          };
        };
      };

      // 사용자 ID 생성 (kakao_ prefix)
      const kakaoUserId = `kakao_${kakaoUser.id}`;
      const email = kakaoUser.kakao_account?.email || null;
      const nickname = kakaoUser.kakao_account?.profile?.nickname || "카카오 사용자";
      const profileImage = kakaoUser.kakao_account?.profile?.profile_image_url || null;
      const gender = kakaoUser.kakao_account?.gender || null; // male, female

      console.log("Kakao user info - gender:", gender);

      // DB에 사용자 저장/업데이트
      await db.insert(users).values({
        id: kakaoUserId,
        email: email,
        firstName: nickname,
        lastName: "",
        profileImageUrl: profileImage,
        gender: gender,
      }).onConflictDoUpdate({
        target: users.id,
        set: {
          email: email,
          firstName: nickname,
          profileImageUrl: profileImage,
          gender: gender,
          updatedAt: new Date(),
        },
      });

      // 세션에 사용자 정보 저장 (Replit Auth와 호환되는 형식)
      const user = {
        claims: {
          sub: kakaoUserId,
          email: email,
          first_name: nickname,
          last_name: "",
          profile_image_url: profileImage,
          gender: gender,
        },
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 1주일
      };

      (req as any).login(user, (err: any) => {
        if (err) {
          console.error("Kakao login session error:", err);
          return res.status(500).send("Login failed");
        }
        console.log("Kakao login successful - userId:", kakaoUserId, "email:", email, "nickname:", nickname);
        req.session.save(() => {
          res.redirect("/");
        });
      });
    } catch (error) {
      console.error("Kakao OAuth error:", error);
      res.status(500).send("Authentication failed");
    }
  });

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

  // APK 다운로드 라우트
  app.get("/vungtau-dokkaebi.apk", (req, res) => {
    const apkPath = path.join(process.cwd(), "client/public/vungtau-dokkaebi.apk");
    if (fs.existsSync(apkPath)) {
      res.setHeader("Content-Type", "application/vnd.android.package-archive");
      res.setHeader("Content-Disposition", "attachment; filename=vungtau-dokkaebi.apk");
      res.sendFile(apkPath);
    } else {
      res.status(404).send("APK file not found");
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

  // 날씨 API (30분 캐시)
  app.get("/api/weather", async (req, res) => {
    try {
      const now = Date.now();
      if (weatherCache && (now - weatherCache.timestamp) < CACHE_DURATION) {
        return res.json({ ...weatherCache.data, lastUpdated: weatherCache.timestamp });
      }

      const response = await fetch("https://wttr.in/Vung+Tau?format=j1", {
        headers: { "User-Agent": "VungTauDokkaebi/1.0" }
      });
      
      if (!response.ok) {
        throw new Error("Weather API failed");
      }
      
      const data = await response.json();
      const current = data.current_condition[0];
      
      const weatherData = {
        temp: current.temp_C,
        condition: current.weatherDesc[0].value,
        humidity: current.humidity,
        wind: current.windspeedKmph
      };
      
      weatherCache = { data: weatherData, timestamp: now };
      console.log("Weather updated:", weatherData);
      
      res.json({ ...weatherData, lastUpdated: now });
    } catch (error) {
      console.error("Weather fetch error:", error);
      if (weatherCache) {
        return res.json({ ...weatherCache.data, lastUpdated: weatherCache.timestamp });
      }
      res.status(500).json({ error: "Failed to fetch weather" });
    }
  });

  // === 푸시 알림 API ===
  
  // VAPID 공개키 조회
  app.get("/api/push/vapid-public-key", (req, res) => {
    res.json({ publicKey: vapidPublicKey });
  });
  
  // 푸시 구독 등록
  app.post("/api/push/subscribe", async (req, res) => {
    try {
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ message: "Invalid subscription" });
      }
      
      const existing = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
      if (existing.length === 0) {
        await db.insert(pushSubscriptions).values({ endpoint, keys });
      }
      
      res.json({ success: true });
    } catch (err) {
      console.error("Push subscribe error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // 푸시 구독 해제
  app.post("/api/push/unsubscribe", async (req, res) => {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        return res.status(400).json({ message: "Endpoint required" });
      }
      
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
      res.json({ success: true });
    } catch (err) {
      console.error("Push unsubscribe error:", err);
      res.status(500).json({ message: "Internal server error" });
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

  app.post(api.quotes.calculate.path, async (req, res) => {
    try {
      const input = req.body;
      
      const breakdown = {
        villa: { price: 0, details: [] as string[], checkIn: "", checkOut: "", rooms: 1, villaId: undefined as number | undefined, villaName: "" },
        vehicle: { price: 0, description: "" },
        golf: { price: 0, description: "" },
        ecoGirl: { price: 0, description: "", details: [] as string[] },
        guide: { price: 0, description: "" },
        fastTrack: { price: 0, description: "" },
        total: 0
      };
      
      // 체크인/체크아웃 날짜 저장
      if (input.villa?.checkIn) {
        breakdown.villa.checkIn = input.villa.checkIn;
      }
      if (input.villa?.checkOut) {
        breakdown.villa.checkOut = input.villa.checkOut;
      }

      // 1. Villa Calculation
      if (input.villa?.enabled && input.villa.checkIn && input.villa.checkOut) {
        try {
          let current = parseISO(input.villa.checkIn);
          const end = parseISO(input.villa.checkOut);
          const rooms = input.villa.rooms || 1;
          breakdown.villa.rooms = rooms;
          
          // 선택된 빌라의 가격 조회 (없으면 기본값 사용)
          let weekdayPrice = 350;
          let fridayPrice = 380;
          let weekendPrice = 500;
          let holidayPrice = 550;
          let villaName = "";
          
          if (input.villa.villaId) {
            const selectedVilla = await db.select().from(villas).where(eq(villas.id, input.villa.villaId));
            if (selectedVilla.length > 0) {
              weekdayPrice = selectedVilla[0].weekdayPrice;
              fridayPrice = selectedVilla[0].fridayPrice;
              weekendPrice = selectedVilla[0].weekendPrice;
              holidayPrice = selectedVilla[0].holidayPrice;
              villaName = selectedVilla[0].name;
              breakdown.villa.villaId = input.villa.villaId;
              breakdown.villa.villaName = villaName;
            }
          }
          
          if (!isNaN(current.getTime()) && !isNaN(end.getTime())) {
            const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
            if (villaName) {
              breakdown.villa.details.push(`🏠 ${villaName}`);
            }
            while (current < end) {
              const dayOfWeek = getDay(current);
              const isHoliday = isVietnamHoliday(current);
              let dailyPrice = weekdayPrice;
              let dayType = "평일";
              const dateStr = format(current, "M/d");
              const dayName = dayNames[dayOfWeek];
              
              if (isHoliday) {
                // 베트남 공휴일 - 공휴일 요금 적용
                dailyPrice = holidayPrice;
                dayType = "공휴일";
              } else if (dayOfWeek === 5) {
                // 금요일
                dailyPrice = fridayPrice;
                dayType = "금";
              } else if (dayOfWeek === 6) {
                // 토요일
                dailyPrice = weekendPrice;
                dayType = "주말";
              } else if (dayOfWeek === 0) {
                // 일요일
                dailyPrice = weekendPrice;
                dayType = "주말";
              }
              breakdown.villa.price += dailyPrice;
              breakdown.villa.details.push(`${dateStr}(${dayName},${dayType}): $${dailyPrice}`);
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
                case "city": basePrice = prices.city; routeDesc = "시내투어"; break;
                case "oneway": basePrice = prices.oneway; routeDesc = "편도(붕따우)"; break;
                case "hocham_oneway": basePrice = prices.oneway; routeDesc = "편도(호짬)"; break;
                case "phanthiet_oneway": basePrice = Math.round(prices.oneway * 1.6 * 0.85); routeDesc = "편도(판티엣)"; break;
                case "roundtrip": basePrice = prices.roundtrip; routeDesc = "왕복"; break;
                case "city_pickup_drop": basePrice = Math.ceil((prices.oneway + prices.city * 0.4) / 10) * 10; routeDesc = "픽드랍+시내"; break;
              }
            }
            if (!routeDesc) {
              switch (selection.route) {
                case "city": routeDesc = "시내투어"; break;
                case "oneway": routeDesc = "편도(붕따우)"; break;
                case "hocham_oneway": routeDesc = "편도(호짬)"; break;
                case "phanthiet_oneway": routeDesc = "편도(판티엣)"; break;
                case "roundtrip": routeDesc = "왕복"; break;
                case "city_pickup_drop": routeDesc = "픽드랍+시내"; break;
              }
            }
            vehicleTotalPrice += basePrice;
            const vehicleTypeKorean: Record<string, string> = {
              "7_seater": "7인승",
              "16_seater": "16인승",
              "9_limo": "9인승 리무진",
              "9_lux_limo": "9인승 럭셔리 리무진",
              "12_lux_limo": "12인승 럭셔리 리무진",
              "16_lux_limo": "16인승 럭셔리 리무진",
              "29_seater": "29인승",
              "45_seater": "45인승",
            };
            const vehicleTypeName = vehicleTypeKorean[selection.type] || selection.type.replace(/_/g, " ");
            vehicleDescriptions.push(`${selection.date}: ${vehicleTypeName} (${routeDesc}) $${basePrice}`);
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
            const isHoliday = isVietnamHoliday(date);
            // 주말 또는 공휴일이면 주말 요금 적용
            const isWeekendOrHoliday = dayOfWeek === 0 || dayOfWeek === 6 || isHoliday;
            const players = Number(selection.players) || 1;
            let price = 0;
            let tip = "";
            let courseName = "";
            switch (selection.course) {
              case "paradise":
                price = isWeekendOrHoliday ? 110 : 90;
                tip = "40만동";
                courseName = "파라다이스";
                break;
              case "chouduc":
                price = isWeekendOrHoliday ? 120 : 80;
                tip = "50만동";
                courseName = "쩌우득";
                break;
              case "hocham":
                price = isWeekendOrHoliday ? 200 : 150;
                tip = "50만동";
                courseName = "호짬";
                break;
            }
            const subtotal = price * players;
            golfTotalPrice += subtotal;
            golfDescriptions.push(`${selection.date} / ${courseName} / $${price} x ${players}명 = $${subtotal} (캐디팁: ${tip}/인)`);
          } catch (e) {
            console.error("Golf selection calculation error:", e);
          }
        }
        breakdown.golf.price = golfTotalPrice;
        breakdown.golf.description = golfDescriptions.join(" | ");
      }

      // 4. Eco Calculation
      if (input.ecoGirl?.enabled && input.ecoGirl.selections && input.ecoGirl.selections.length > 0) {
        const priceMap: Record<string, number> = { "12": 220, "22": 380 };
        let totalEcoPrice = 0;
        const ecoDetails: string[] = [];
        
        for (const selection of input.ecoGirl.selections) {
          const count = Number(selection.count) || 1;
          const hours = (selection as any).hours || "12";
          const rate = priceMap[hours] || 220;
          const price = count * rate;
          totalEcoPrice += price;
          ecoDetails.push(`${selection.date}: ${hours}시간 x ${count}명 x $${rate} = $${price}`);
        }
        
        breakdown.ecoGirl.price = totalEcoPrice;
        breakdown.ecoGirl.details = ecoDetails;
        breakdown.ecoGirl.description = `${input.ecoGirl.selections.length}일`;
      }

      // 5. Guide Calculation
      if (input.guide?.enabled) {
        const baseRate = 120;
        const extraRate = 20;
        const days = Number(input.guide.days) || 0;
        const groupSize = Number(input.guide.groupSize) || 1;
        let dailyTotal = baseRate;
        const extraPeople = groupSize > 4 ? groupSize - 4 : 0;
        if (extraPeople > 0) { dailyTotal += extraPeople * extraRate; }
        breakdown.guide.price = dailyTotal * days;
        breakdown.guide.description = `${days}일 / ${groupSize}명 (기본 4인 $120${extraPeople > 0 ? ` + 추가 ${extraPeople}인` : ""})`;
      }

      // 6. Fast Track Calculation
      if (input.fastTrack?.enabled) {
        const pricePerPerson = 25; // $25 per person per way
        const persons = Number(input.fastTrack.persons) || 0;
        const isRoundtrip = input.fastTrack.type === "roundtrip";
        const multiplier = isRoundtrip ? 2 : 1;
        breakdown.fastTrack.price = pricePerPerson * persons * multiplier;
        const typeDesc = isRoundtrip ? "왕복" : "편도";
        breakdown.fastTrack.description = `패스트트랙 ${typeDesc} x ${persons}명 ($${pricePerPerson}/인)`;
      }

      breakdown.total = breakdown.villa.price + breakdown.vehicle.price + breakdown.golf.price + breakdown.ecoGirl.price + breakdown.guide.price + breakdown.fastTrack.price;
      res.json(breakdown);
    } catch (err) {
      console.error("Calculation route error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.quotes.create.path, async (req, res) => {
    try {
      const input = api.quotes.create.input.parse(req.body);
      const userId = (req as any).user?.claims?.sub;
      
      // breakdown에서 체크인/체크아웃 날짜 추출
      const breakdown = input.breakdown as any;
      const checkInDate = breakdown?.villa?.checkIn || null;
      const checkOutDate = breakdown?.villa?.checkOut || null;
      
      const quote = await storage.createQuote({ ...input, userId, checkInDate, checkOutDate });
      res.status(201).json(quote);
    } catch (err) {
      if (err instanceof z.ZodError) { res.status(400).json({ message: err.errors[0].message }); }
      else { res.status(500).json({ message: "Internal server error" }); }
    }
  });

  // 예약금 입금 상태 업데이트 (관리자만)
  app.patch("/api/quotes/:id/deposit", async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub;
      if (!userId || String(userId) !== String(ADMIN_USER_ID)) {
        return res.status(403).json({ message: "Only admin can update deposit status" });
      }
      
      const id = parseInt(req.params.id);
      const { depositPaid } = req.body;
      const quote = await storage.updateQuoteDepositStatus(id, depositPaid);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      res.json(quote);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // 메모 업데이트 (관리자 전용)
  app.patch("/api/quotes/:id/memo", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).user?.claims?.sub;
      
      if (userId !== ADMIN_USER_ID) {
        return res.status(403).json({ message: "Only admin can update memo" });
      }

      const { memo } = req.body;
      const quote = await storage.updateQuoteMemo(id, memo || "");
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      res.json(quote);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // 메모 이미지 업데이트 (관리자 전용)
  app.patch("/api/quotes/:id/memo-images", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).user?.claims?.sub;
      
      if (userId !== ADMIN_USER_ID) {
        return res.status(403).json({ message: "Only admin can update memo images" });
      }

      const { memoImages } = req.body;
      if (!Array.isArray(memoImages)) {
        return res.status(400).json({ message: "memoImages must be an array" });
      }

      const quote = await storage.updateQuoteMemoImages(id, memoImages);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      res.json(quote);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // 견적서 총금액 및 세부내역 업데이트
  app.patch("/api/quotes/:id/total", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).user?.claims?.sub;
      
      if (userId !== ADMIN_USER_ID) {
        return res.status(403).json({ message: "Only admin can update total price" });
      }

      const { totalPrice, breakdown, depositAmount } = req.body;
      if (typeof totalPrice !== "number" || totalPrice < 0) {
        return res.status(400).json({ message: "Invalid total price" });
      }

      const quote = await storage.updateQuoteTotalAndBreakdown(id, totalPrice, breakdown, depositAmount);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      res.json(quote);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // 예약금 입금 완료된 견적서 목록 (캘린더용) - 관리자 전용
  app.get("/api/quotes/deposit-paid", async (req, res) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const adminId = process.env.ADMIN_USER_ID || "";
      const isAdmin = userId && String(userId) === String(adminId);
      
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const quotes = await storage.getDepositPaidQuotes();
      res.json(quotes);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.quotes.list.path, async (req, res) => {
    const user = (req as any).user;
    const userId = user?.claims?.sub;
    const userEmail = user?.claims?.email || user?.email;
    // isUserAdmin 함수를 사용하여 ID 또는 이메일로 관리자 확인
    const isAdmin = isUserAdmin(userId, userEmail);
    
    // 관리자는 전체 목록, 일반 사용자는 자신의 것만
    const quotes = isAdmin 
      ? await storage.getAllQuotes()
      : await storage.getQuotesByUser(userId);
    res.json(quotes);
  });

  app.delete("/api/quotes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid quote ID" });
      }
      const user = (req as any).user;
      const userId = user?.claims?.sub;
      const userEmail = user?.claims?.email || user?.email;
      // isUserAdmin 함수를 사용하여 ID 또는 이메일로 관리자 확인
      const isAdmin = isUserAdmin(userId, userEmail);
      
      // 관리자는 모든 견적서 삭제 가능
      if (isAdmin) {
        await storage.deleteQuoteAdmin(id);
      } else {
        await storage.deleteQuote(id, userId);
      }
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Helper function to get today's date in YYYY-MM-DD format (Korea timezone)
  const getTodayDateString = () => {
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
    return koreaTime.toISOString().split("T")[0];
  };

  // Helper function to get random count between 4000 and 6000
  const getRandomBaseCount = () => Math.floor(Math.random() * 2001) + 4000;

  app.get("/api/visitor-count", async (req, res) => {
    try {
      const today = getTodayDateString();
      const result = await db.select().from(visitorCount).where(eq(visitorCount.id, 1));
      
      if (result.length === 0) {
        const baseCount = getRandomBaseCount();
        await db.insert(visitorCount).values({ id: 1, count: baseCount, lastResetDate: today });
        res.json({ count: baseCount });
      } else {
        // Check if we need to reset for a new day
        if (result[0].lastResetDate !== today) {
          const baseCount = getRandomBaseCount();
          await db.update(visitorCount).set({ count: baseCount, lastResetDate: today }).where(eq(visitorCount.id, 1));
          res.json({ count: baseCount });
        } else {
          res.json({ count: result[0].count });
        }
      }
    } catch (err) {
      console.error("Visitor count get error:", err);
      res.json({ count: 0 });
    }
  });

  app.post("/api/visitor-count/increment", async (req, res) => {
    try {
      const today = getTodayDateString();
      const result = await db.select().from(visitorCount).where(eq(visitorCount.id, 1));
      
      if (result.length === 0) {
        const baseCount = getRandomBaseCount();
        await db.insert(visitorCount).values({ id: 1, count: baseCount, lastResetDate: today });
        res.json({ count: baseCount });
      } else {
        // Check if we need to reset for a new day
        if (result[0].lastResetDate !== today) {
          const baseCount = getRandomBaseCount();
          await db.update(visitorCount).set({ count: baseCount, lastResetDate: today }).where(eq(visitorCount.id, 1));
          res.json({ count: baseCount });
        } else {
          const newCount = result[0].count + 1;
          await db.update(visitorCount).set({ count: newCount }).where(eq(visitorCount.id, 1));
          res.json({ count: newCount });
        }
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

  // Google Maps API 키 제공 (클라이언트 지도 로드용)
  app.get("/api/maps-key", (req, res) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Google Maps API key not configured" });
    }
    res.json({ key: apiKey });
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

  // 붕따우 관광지 및 맛집 데이터 (PlacesGuide.tsx와 동기화)
  // 이 데이터는 AI 일정 생성 시 반드시 사용해야 하는 검증된 장소 목록입니다
  const placesData = {
    attractions: [
      { name: "붕따우 거대 예수상", nameVi: "Tượng Chúa Kitô", type: "landmark", note: "높이 32m, 811개 계단, 아름다운 해안 전경 감상", priority: 1 },
      { name: "붕따우 등대", nameVi: "Hải Đăng Vũng Tàu", type: "landmark", note: "1910년 프랑스 식민지 시대 건설, 붕따우 전경 조망", priority: 1 },
      { name: "전쟁기념관", nameVi: "Bà Rịa–Vũng Tàu Provincial museum", type: "museum", note: "베트남 전쟁과 지역 역사", priority: 2 },
      { name: "화이트 펠리스(띠우 별장)", nameVi: "Bạch Dinh (White Palace)", type: "historical", note: "1898년 프랑스 총독 여름 별장", priority: 1 },
      { name: "놀이동산", nameVi: "Ho May Amusement Park", type: "entertainment", note: "케이블카, 워터파크, 동물원 - 가족 여행 추천", priority: 1 },
      { name: "불교사찰", nameVi: "Chơn Không Monastery", type: "religious", note: "명상, 평화로운 분위기", priority: 2 },
      { name: "붕따우 백비치", nameVi: "Bãi Sau", type: "beach", note: "가장 긴 해변, 수영, 서핑 등 해양스포츠", priority: 1 },
      { name: "붕따우 프론트 비치", nameVi: "Front Beach", type: "beach", note: "일몰 감상 최적, 해안 산책로", priority: 1 },
      { name: "땀탕기념타워", nameVi: "Tháp Tầm", type: "viewpoint", note: "베트남 해군 역사적 기념탑", priority: 2 },
      { name: "돼지언덕", nameVi: "Đồi Con Heo", type: "viewpoint", note: "일몰 포토존, 연인들의 명소", priority: 1 },
      { name: "원숭이사원", nameVi: "Chùa Khỉ Viba", type: "temple", note: "야생 원숭이 서식, 독특한 체험 (소지품 주의)", priority: 2 },
      { name: "붕따우 해산물 시장", nameVi: "Seafood Market", type: "market", note: "신선한 해산물, 저녁 시간 방문 추천", priority: 1 },
      { name: "붕따우 시장", nameVi: "Chợ Vũng Tàu 1985", type: "market", note: "현지 음식, 과일, 기념품", priority: 2 },
    ],
    localFood: [
      { name: "꼬바붕따우 1호점", nameVi: "Cô Ba Restaurant", type: "반콧/반쎄오", note: "현지인 맛집" },
      { name: "꼬바붕따우 2호점", nameVi: "Cô Ba Restaurant 2", type: "반콧/반쎄오", note: "넓은 공간" },
      { name: "해산물 고급 식당", nameVi: "Gành Hào Seafood Restaurant", type: "해산물", note: "고급 해산물 전문" },
      { name: "해산물 야시장 로컬식당", nameVi: "Hải Sản Cô Thy 2", type: "해산물", note: "야시장 분위기" },
      { name: "분짜 하노이", nameVi: "Bún Chả Hà Nội", type: "분짜", note: "하노이 스타일 쌀국수" },
      { name: "88 Food Garden", nameVi: "88 Food Garden", type: "레스토랑", note: "다양한 메뉴" },
      { name: "Panda BBQ", type: "현지 바베큐", note: "로컬 BBQ" },
      { name: "해산물 식당", nameVi: "Ốc Tự Nhiên 3", type: "해산물", note: "조개류 전문" },
      { name: "베트남 가정식", nameVi: "Cơm Niêu Quê Nhà", type: "가정식", note: "정통 베트남 가정식" },
      { name: "해산물 쌀국수", nameVi: "Old Man Cali - Hủ tiểu Mực", type: "쌀국수", note: "추천 맛집", recommended: true },
      { name: "로컬 식당 (껌땀)", nameVi: "Quán Cơm Tấm Lọ Lem", type: "껌땀", note: "베트남 대표 밥요리" },
      { name: "오리국수", type: "오리국수", note: "오후 3시반 오픈" },
    ],
    koreanFood: [
      { name: "이안 돌판 삼겹살", type: "삼겹살", note: "도깨비 협력식당, 예약 시 10% 할인", recommended: true },
      { name: "가보정", type: "한식", note: "다양한 한식" },
      { name: "비원식당", type: "한식", note: "한국 음식점" },
      { name: "뚱보집 (포차)", type: "포차", note: "한국식 포차" },
    ],
    buffet: [
      { name: "GoGi House", type: "뷔페", note: "한국식 고기뷔페" },
      { name: "간하오 스시, 샤브샤브 뷔페", type: "일식뷔페", note: "스시와 샤브샤브" },
      { name: "해산물 뷔페", type: "해산물뷔페", note: "저녁 오픈, 간하오 1층" },
    ],
    chineseFood: [
      { name: "린차이나", type: "중식", note: "중화요리 전문" },
    ],
    coffee: [
      { name: "Coffee Suối Bên Biển", type: "카페", note: "바다 전망, 분위기 좋은 카페" },
      { name: "KATINAT 커피", type: "카페", note: "베트남 유명 카페 체인" },
      { name: "Soho Coffee", type: "카페", note: "조용한 분위기" },
      { name: "Highlands Coffee", type: "카페", note: "베트남 대표 카페 체인" },
      { name: "Sea & Sun 2", type: "카페", note: "바다 전망" },
      { name: "Mi Amor Beach", type: "비치카페", note: "해변 카페" },
    ],
    services: [
      { name: "Re.en 마사지", type: "마사지", note: "도깨비 협력업체" },
      { name: "그랜드 마사지", type: "마사지", note: "도깨비 협력업체" },
      { name: "DAY SPA", type: "스파", note: "도깨비 협력업체, 프리미엄 스파" },
      { name: "김마싸", type: "마사지", note: "한국인 운영" },
      { name: "이발소 Salon Kimha", type: "이발소", note: "한국인 운영" },
      { name: "Bi Roen 현지 고급 이발소", type: "이발소", note: "도깨비 협력업체, 추천", recommended: true },
    ],
    nightlife: [
      { name: "88 비어클럽", nameVi: "88 Beer Club", type: "비어클럽", note: "라이브 음악, 야외 분위기" },
      { name: "Revo 클럽", nameVi: "Revo Club", type: "나이트클럽", note: "EDM 음악, 현지인 인기" },
      { name: "Lox 클럽", nameVi: "Lox Night Club", type: "나이트클럽", note: "프리미엄 클럽, VIP 서비스" },
      { name: "U.S Bar Club", type: "바", note: "아메리칸 스타일, 칵테일" },
      { name: "Peace and Love 라이브바", nameVi: "Peace and Love Live Bar", type: "라이브바", note: "금,토 라이브 밴드" },
    ],
    golf: [
      { name: "파라다이스 골프장", nameVi: "Paradise Golf", course: "paradise", note: "평일 $90, 주말 $110" },
      { name: "쩌우득 골프장", nameVi: "Chou Duc Golf", course: "chouduc", note: "평일 $80, 주말 $120" },
      { name: "호짬 골프장", nameVi: "Ho Tram Golf", course: "hocham", note: "평일 $150, 주말 $200" },
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

## ⚠️ 절대 규칙: 아래 제공된 장소 데이터만 사용하세요!
이 데이터는 "붕따우 도깨비" 사이트의 관광/맛집 탭에서 검증된 실제 장소 목록입니다.
일정에 포함되는 모든 관광명소, 식당, 카페, 마사지샵은 반드시 이 목록에서만 선택하세요.
이 목록에 없는 장소는 절대 추천하지 마세요.

## 사용 가능한 장소 목록 (이 목록만 사용):
${JSON.stringify(placesData, null, 2)}

## 카테고리별 설명:
- attractions: 관광명소 (예수상, 등대, 해변, 시장 등)
- localFood: 현지 음식점 (반쎄오, 해산물, 쌀국수 등)
- koreanFood: 한식당 (이안 돌판 삼겹살, 가보정 등)
- buffet: 뷔페 (GoGi House, 간하오 등)
- chineseFood: 중식당
- coffee: 카페 (KATINAT, Highlands Coffee 등)
- services: 마사지/이발소 (Re.en 마사지, 그랜드 마사지 등)
- nightlife: 밤문화 (88 비어클럽, Revo 클럽 등)
- golf: 골프장

## 일정 작성 규칙:
1. 관광명소(attractions)에서 priority: 1인 장소를 우선 배치하세요.
2. 식사 시간에는 localFood, koreanFood, buffet, chineseFood 목록에서 선택하세요.
3. 카페 휴식은 coffee 목록에서만 선택하세요.
4. 마사지/스파는 services 목록에서만 선택하세요.
5. 각 날짜별로 아침, 점심, 오후, 저녁 일정을 포함하세요.
6. 장소명은 반드시 위 데이터의 name과 nameVi를 정확히 사용하세요.
7. recommended: true 표시된 장소는 특히 추천합니다.

${purposes.includes('golf') ? '## 골프 여행: golf 목록에서 골프장을 선택하여 매일 또는 격일로 라운딩을 포함하세요.' : ''}
${purposes.includes('relaxing') ? '## 힐링 여행: services 목록의 마사지/스파와 coffee 목록의 카페를 충분히 포함하세요.' : ''}
${purposes.includes('gourmet') ? '## 맛집 탐방: localFood, koreanFood, chineseFood, buffet를 골고루 포함하세요.' : ''}
${purposes.includes('nightlife') ? '## 밤문화: nightlife 목록에서 선택하여 저녁에 클럽이나 바 활동을 포함하세요.' : ''}
${purposes.includes('family') ? '## 가족 여행: 놀이동산(Ho May), 백비치, 프론트비치 등 가족이 함께 즐길 수 있는 장소를 우선 배치하세요.' : ''}
${purposes.includes('culture') ? '## 문화 탐방: 화이트 펠리스, 전쟁기념관, 붕따우 등대 등 역사/문화 명소를 우선 배치하세요.' : ''}`;

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

  // 관리자 ID (Replit Auth 사용자 ID) 및 관리자 이메일
  const ADMIN_USER_ID = process.env.ADMIN_USER_ID || "";
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "vungtau1004@daum.net";
  
  // 관리자 체크 헬퍼 함수
  const isUserAdmin = (userId: string | undefined, userEmail: string | undefined): boolean => {
    if (userId && String(userId) === String(ADMIN_USER_ID)) return true;
    if (userEmail && userEmail === ADMIN_EMAIL) return true;
    return false;
  };

  // 게시판 - 게시글 목록 조회
  app.get("/api/posts", async (req, res) => {
    try {
      const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt));
      
      // 각 게시글의 댓글 개수 조회
      const postsWithCommentCount = await Promise.all(
        allPosts.map(async (post) => {
          const commentCountResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(comments)
            .where(eq(comments.postId, post.id));
          return {
            ...post,
            commentCount: Number(commentCountResult[0]?.count || 0)
          };
        })
      );
      
      res.json(postsWithCommentCount);
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

  // 게시판 - 게시글 조회수 증가
  app.post("/api/posts/:id/view", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [post] = await db.select().from(posts).where(eq(posts.id, id));
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      await db.update(posts)
        .set({ viewCount: (post.viewCount || 0) + 1 })
        .where(eq(posts.id, id));
      
      res.json({ success: true, viewCount: (post.viewCount || 0) + 1 });
    } catch (err) {
      console.error("Increment view count error:", err);
      res.status(500).json({ message: "Failed to increment view count" });
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

      // 푸시 알림 발송 (비동기로 처리)
      sendPushNotifications(
        "붕따우 도깨비 새 소식",
        newPost.title,
        `/board/${newPost.id}`
      );

      res.status(201).json(newPost);
    } catch (err) {
      console.error("Create post error:", err);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // 프로필 이름 변경 시 게시글/댓글 작성자 이름 동기화
  app.post("/api/sync-author-name", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub;
      const newName = user?.claims?.first_name || user?.claims?.email || "사용자";
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // 해당 사용자의 모든 게시글 authorName 업데이트
      await db.execute(sql`UPDATE posts SET author_name = ${newName} WHERE author_id = ${userId}`);

      res.json({ success: true, newName });
    } catch (err) {
      console.error("Sync author name error:", err);
      res.status(500).json({ message: "Failed to sync author name" });
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
    const userEmail = user?.claims?.email || user?.email;
    const isAdmin = isUserAdmin(userId, userEmail);
    
    // 관리자 ID 목록 (Replit ID와 카카오 ID 등 - 모든 관리자 계정의 ID 포함)
    // ADMIN_USER_ID는 Replit 관리자 ID, 현재 로그인한 관리자의 ID도 추가
    const adminUserIds: string[] = [];
    if (ADMIN_USER_ID) adminUserIds.push(ADMIN_USER_ID);
    // 현재 로그인한 사용자가 관리자인 경우, 그 사용자의 ID도 관리자 목록에 추가
    if (isAdmin && userId && !adminUserIds.includes(userId)) {
      adminUserIds.push(userId);
    }
    
    console.log("Admin check - userId:", userId, "userEmail:", userEmail, "ADMIN_USER_ID:", ADMIN_USER_ID, "ADMIN_EMAIL:", ADMIN_EMAIL, "isAdmin:", isAdmin, "adminUserIds:", adminUserIds);
    res.json({ isAdmin, isLoggedIn: !!user, userId, adminUserIds });
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

  // === 풀빌라 관리 API ===
  
  // 네이버 블로그에서 이미지 추출
  app.post("/api/extract-blog-images", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL is required" });
      }

      // 네이버 블로그 URL인지 확인
      if (!url.includes("blog.naver.com")) {
        return res.status(400).json({ error: "Only Naver blog URLs are supported" });
      }

      // 블로그 게시글 가져오기
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!response.ok) {
        return res.status(400).json({ error: "Failed to fetch blog post" });
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const images: string[] = [];

      // 네이버 블로그 이미지 추출 (다양한 패턴)
      $("img").each((_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src");
        if (src && (src.includes("pstatic.net") || src.includes("blogfiles") || src.includes("postfiles"))) {
          let fullSrc = src;
          
          // 쿼리 파라미터 제거
          if (src.includes("?type=")) {
            fullSrc = src.split("?type=")[0];
          }
          
          // 프로필 이미지, 외부 썸네일 제외
          if (fullSrc.includes("blogpfthumb-phinf") || fullSrc.includes("profileImage") || fullSrc.includes("dthumb-phinf")) {
            return;
          }
          
          if (!images.includes(fullSrc)) {
            images.push(fullSrc);
          }
        }
      });

      // iframe 내부 이미지도 확인 (네이버 블로그 구조)
      const iframeSrc = $("iframe#mainFrame").attr("src");
      if (iframeSrc && images.length === 0) {
        // 모바일 버전 URL 시도
        const mobileUrl = url.replace("blog.naver.com", "m.blog.naver.com");
        const mobileResponse = await fetch(mobileUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
          },
        });
        
        if (mobileResponse.ok) {
          const mobileHtml = await mobileResponse.text();
          const $mobile = cheerio.load(mobileHtml);
          
          $mobile("img").each((_, el) => {
            const src = $mobile(el).attr("src") || $mobile(el).attr("data-src");
            if (src && (src.includes("pstatic.net") || src.includes("blogfiles") || src.includes("postfiles"))) {
              let fullSrc = src;
              
              // 쿼리 파라미터 제거
              if (src.includes("?type=")) {
                fullSrc = src.split("?type=")[0];
              }
              
              // 프로필, 외부 썸네일 제외
              if (fullSrc.includes("blogpfthumb-phinf") || fullSrc.includes("profileImage") || fullSrc.includes("dthumb-phinf")) {
                return;
              }
              
              if (!images.includes(fullSrc)) {
                images.push(fullSrc);
              }
            }
          });
        }
      }

      // 이미지 URL 목록 반환
      console.log("Found", images.length, "images");
      res.json({ images });
    } catch (error) {
      console.error("Extract blog images error:", error);
      res.status(500).json({ error: "Failed to extract images" });
    }
  });

  // 네이버 블로그 이미지를 다운로드해서 Object Storage에 저장
  app.post("/api/download-blog-images", async (req, res) => {
    try {
      const { imageUrls } = req.body;
      
      if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
        return res.status(400).json({ error: "Image URLs required" });
      }

      const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
      if (!bucketId) {
        return res.status(500).json({ error: "Object storage not configured" });
      }

      const uploadedUrls: string[] = [];
      
      for (const imageUrl of imageUrls) {
        try {
          // Referer 헤더를 설정해서 네이버 이미지 다운로드
          const imgResponse = await fetch(imageUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Referer": "https://blog.naver.com/",
              "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            },
          });

          if (!imgResponse.ok) {
            console.log("Failed to download:", imageUrl, imgResponse.status);
            continue;
          }

          const buffer = Buffer.from(await imgResponse.arrayBuffer());
          const contentType = imgResponse.headers.get("content-type") || "image/jpeg";
          
          // 파일명 생성
          const ext = contentType.includes("png") ? "png" : contentType.includes("gif") ? "gif" : "jpg";
          const fileName = `villa_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
          
          // Object Storage에 업로드
          const bucket = objectStorageClient.bucket(bucketId);
          const file = bucket.file(`public/${fileName}`);
          
          await file.save(buffer, {
            contentType,
            metadata: {
              cacheControl: "public, max-age=31536000",
            },
          });

          const publicUrl = `https://storage.googleapis.com/${bucketId}/public/${fileName}`;
          uploadedUrls.push(publicUrl);
          console.log("Uploaded:", publicUrl);
        } catch (imgError: any) {
          console.log("Failed to process image:", imageUrl.substring(0, 50), imgError.message);
        }
      }

      res.json({ 
        uploadedUrls, 
        success: uploadedUrls.length,
        failed: imageUrls.length - uploadedUrls.length 
      });
    } catch (error) {
      console.error("Download blog images error:", error);
      res.status(500).json({ error: "Failed to download images" });
    }
  });

  // 모든 빌라 조회 (활성화된 것만)
  app.get("/api/villas", async (req, res) => {
    try {
      const allVillas = await db.select()
        .from(villas)
        .where(eq(villas.isActive, true))
        .orderBy(villas.sortOrder);
      res.json(allVillas);
    } catch (error) {
      console.error("Get villas error:", error);
      res.status(500).json({ error: "Failed to get villas" });
    }
  });

  // 모든 빌라 조회 (관리자용 - 비활성화 포함)
  app.get("/api/admin/villas", async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user?.claims?.sub;
      const userEmail = user?.claims?.email || user?.email;
      if (!user || !isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const allVillas = await db.select()
        .from(villas)
        .orderBy(villas.sortOrder);
      res.json(allVillas);
    } catch (error) {
      console.error("Get admin villas error:", error);
      res.status(500).json({ error: "Failed to get villas" });
    }
  });

  // 빌라 상세 조회
  app.get("/api/villas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const villa = await db.select().from(villas).where(eq(villas.id, id));
      if (villa.length === 0) {
        return res.status(404).json({ error: "Villa not found" });
      }
      res.json(villa[0]);
    } catch (error) {
      console.error("Get villa error:", error);
      res.status(500).json({ error: "Failed to get villa" });
    }
  });

  // 빌라 추가 (관리자만)
  app.post("/api/admin/villas", async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user?.claims?.sub;
      const userEmail = user?.claims?.email || user?.email;
      if (!user || !isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const data = insertVillaSchema.parse(req.body);
      const newVilla = await db.insert(villas).values(data).returning();
      res.json(newVilla[0]);
    } catch (error) {
      console.error("Create villa error:", error);
      res.status(500).json({ error: "Failed to create villa" });
    }
  });

  // 빌라 수정 (관리자만)
  app.patch("/api/admin/villas/:id", async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user?.claims?.sub;
      const userEmail = user?.claims?.email || user?.email;
      if (!user || !isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      const data = insertVillaSchema.partial().parse(req.body);
      const updated = await db.update(villas)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(villas.id, id))
        .returning();
      if (updated.length === 0) {
        return res.status(404).json({ error: "Villa not found" });
      }
      res.json(updated[0]);
    } catch (error) {
      console.error("Update villa error:", error);
      res.status(500).json({ error: "Failed to update villa" });
    }
  });

  // 빌라 삭제 (관리자만)
  app.delete("/api/admin/villas/:id", async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user?.claims?.sub;
      const userEmail = user?.claims?.email || user?.email;
      if (!user || !isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      await db.delete(villas).where(eq(villas.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete villa error:", error);
      res.status(500).json({ error: "Failed to delete villa" });
    }
  });

  // === 위치 공유 API ===
  
  // 모든 활성 위치 조회
  app.get("/api/locations", async (req, res) => {
    try {
      // 만료되지 않은 위치만 조회
      const now = new Date();
      const locations = await db.select()
        .from(userLocations)
        .where(sql`${userLocations.expiresAt} > ${now}`)
        .orderBy(desc(userLocations.createdAt));
      res.json(locations);
    } catch (error) {
      console.error("Get locations error:", error);
      res.status(500).json({ error: "Failed to get locations" });
    }
  });
  
  // 위치 공유 (현재 위치 또는 장소)
  app.post("/api/locations", async (req, res) => {
    try {
      const { nickname, latitude, longitude, placeName, placeCategory, message } = req.body;
      
      if (!nickname || !latitude || !longitude) {
        return res.status(400).json({ error: "Nickname, latitude, and longitude are required" });
      }
      
      // 24시간 후 만료
      const expiresAt = addHours(new Date(), 24);
      
      // 같은 닉네임의 이전 위치 삭제
      await db.delete(userLocations).where(eq(userLocations.nickname, nickname));
      
      // 새 위치 저장
      const [location] = await db.insert(userLocations).values({
        nickname,
        latitude: String(latitude),
        longitude: String(longitude),
        placeName: placeName || null,
        placeCategory: placeCategory || null,
        message: message || null,
        expiresAt,
      }).returning();
      
      res.json(location);
    } catch (error) {
      console.error("Share location error:", error);
      res.status(500).json({ error: "Failed to share location" });
    }
  });
  
  // 내 위치 삭제
  app.delete("/api/locations/:nickname", async (req, res) => {
    try {
      const { nickname } = req.params;
      await db.delete(userLocations).where(eq(userLocations.nickname, nickname));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete location error:", error);
      res.status(500).json({ error: "Failed to delete location" });
    }
  });
  
  // 만료된 위치 정리 (정기적으로 호출)
  app.post("/api/locations/cleanup", async (req, res) => {
    try {
      const now = new Date();
      await db.delete(userLocations).where(sql`${userLocations.expiresAt} <= ${now}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Cleanup locations error:", error);
      res.status(500).json({ error: "Failed to cleanup locations" });
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
