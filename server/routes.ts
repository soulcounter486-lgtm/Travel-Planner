import type { Express } from "express";
import type { Server } from "http";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { calculateQuoteSchema, visitorCount, expenseGroups, expenses, insertExpenseGroupSchema, insertExpenseSchema, posts, comments, insertPostSchema, insertCommentSchema, instagramSyncedPosts, pushSubscriptions, userLocations, insertUserLocationSchema, users, villas, insertVillaSchema, places, insertPlaceSchema, placeCategories, insertPlaceCategorySchema, siteSettings, adminMessages, insertAdminMessageSchema, coupons, insertCouponSchema, userCoupons, insertUserCouponSchema, announcements, insertAnnouncementSchema, adminNotifications, quoteCategories, insertQuoteCategorySchema, savedTravelPlans, customerChatRooms, customerChatMessages } from "@shared/schema";
import { addDays, getDay, parseISO, format, addHours } from "date-fns";
import { db } from "./db";
import { eq, sql, desc, and } from "drizzle-orm";
import { setupAuth, registerAuthRoutes, isAuthenticated, getSession } from "./replit_integrations/auth";
import { setupGoogleAuth } from "./auth/googleAuth";
import { GoogleGenAI } from "@google/genai";
import { WebSocketServer, WebSocket } from "ws";
import { registerObjectStorageRoutes, objectStorageClient } from "./replit_integrations/object_storage";
import webpush from "web-push";
import crypto from "crypto";
import * as cheerio from "cheerio";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

// Web Push 설정
const vapidPublicKey = process.env.PUSH_PUB || "";
const vapidPrivateKey = process.env.PUSH_PRIV || "";
const vapidSubject = "mailto:admin@vungtau.blog";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  console.log("Web Push configured - pub:", vapidPublicKey.substring(0, 12) + "...", "priv:", vapidPrivateKey.substring(0, 8) + "...");
} else {
  console.log("Web Push NOT configured - pub:", vapidPublicKey ? "set" : "MISSING", "priv:", vapidPrivateKey ? "set" : "MISSING");
}

// 푸시 알림 전송 함수
async function sendPushNotification(userId: string, title: string, body: string, url: string = "/") {
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.log("VAPID keys not configured, skipping push notification");
    return;
  }
  
  try {
    const subscriptions = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify({ title, body, url })
        );
        console.log("Push notification sent to:", userId);
      } catch (error: any) {
        // 구독이 만료되었거나 유효하지 않은 경우 삭제
        if (error.statusCode === 404 || error.statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
          console.log("Removed expired push subscription:", sub.endpoint);
        } else {
          console.error("Push notification error:", error);
        }
      }
    }
  } catch (error) {
    console.error("Failed to send push notification:", error);
  }
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

const PUSH_OPTIONS = { TTL: 86400, urgency: 'high' as const, headers: { Urgency: 'high' } };

async function sendPushToSubscription(sub: { endpoint: string; p256dh: string; auth: string; userId: string }) {
  return { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } };
}

// 전체 푸시 알림 발송 함수 (게시판 등)
async function sendPushNotifications(title: string, body: string, url: string = "/board") {
  try {
    const subscriptions = await db.select().from(pushSubscriptions);
    const payload = JSON.stringify({ title, body, url });
    console.log(`[PUSH-BROADCAST] 발송 시작 - title: "${title}", 구독자 수: ${subscriptions.length}`);
    
    let sent = 0;
    let failed = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          PUSH_OPTIONS
        );
        sent++;
      } catch (err: any) {
        failed++;
        console.error(`[PUSH-BROADCAST] 실패 - userId: ${sub.userId}, status: ${err.statusCode}, body: ${err.body}`);
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
        }
      }
    }
    console.log(`[PUSH-BROADCAST] 발송 완료 - 성공: ${sent}, 실패: ${failed}`);
  } catch (err) {
    console.error("[PUSH-BROADCAST] 전체 오류:", err);
  }
}

// 관리자 전용 푸시 알림 발송 함수 (고객 채팅 등)
async function sendAdminPushNotifications(title: string, body: string, url: string = "/admin/chat") {
  try {
    const adminUsers = await db.select({ id: users.id }).from(users).where(eq(users.isAdmin, true));
    const ADMIN_ID_ENV = process.env.ADMIN_USER_ID || "";
    const envAdminIds = ADMIN_ID_ENV ? ADMIN_ID_ENV.split(",").map(id => id.trim()) : [];
    const allAdminIds = Array.from(new Set([...adminUsers.map(u => u.id), ...envAdminIds].filter(Boolean)));
    
    const allSubs = await db.select().from(pushSubscriptions);
    const adminSubs = allSubs.filter(sub => allAdminIds.includes(sub.userId));
    
    const payload = JSON.stringify({ title, body, url });
    console.log(`[PUSH-ADMIN] 발송 시작 - title: "${title}", 전체 구독: ${allSubs.length}, 관리자 구독: ${adminSubs.length}, 관리자 ID: ${allAdminIds.join(",")}`);
    
    if (adminSubs.length === 0) {
      console.log(`[PUSH-ADMIN] 관리자 구독 없음! 전체 구독자에게 발송 시도`);
      for (const sub of allSubs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
            PUSH_OPTIONS
          );
          console.log(`[PUSH-ADMIN] fallback 발송 성공 - userId: ${sub.userId}`);
        } catch (err: any) {
          console.error(`[PUSH-ADMIN] fallback 실패 - userId: ${sub.userId}, status: ${err.statusCode}`);
          if (err.statusCode === 410 || err.statusCode === 404) {
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
          }
        }
      }
      return;
    }
    
    let sent = 0;
    let failed = 0;
    for (const sub of adminSubs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          PUSH_OPTIONS
        );
        sent++;
        console.log(`[PUSH-ADMIN] 발송 성공 - userId: ${sub.userId}`);
      } catch (err: any) {
        failed++;
        console.error(`[PUSH-ADMIN] 발송 실패 - userId: ${sub.userId}, status: ${err.statusCode}, body: ${err.body}`);
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
        }
      }
    }
    console.log(`[PUSH-ADMIN] 발송 완료 - 성공: ${sent}, 실패: ${failed}`);
  } catch (err) {
    console.error("[PUSH-ADMIN] 전체 오류:", err);
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
  await setupGoogleAuth(app);

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

  // 카카오 다른 계정으로 로그인 (prompt=login으로 항상 로그인 화면 표시)
  app.get("/api/auth/kakao/relogin", (req, res) => {
    const state = crypto.randomBytes(16).toString("hex");
    (req.session as any).kakaoState = state;
    req.session.save(() => {
      const redirectUri = "https://vungtau.blog/api/auth/kakao/callback";
      console.log("Kakao relogin start - redirectUri:", redirectUri);
      // prompt=login 파라미터로 항상 카카오 로그인 화면 표시
      const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}&prompt=login`;
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
      const existingUser = await db.select().from(users).where(eq(users.id, kakaoUserId)).limit(1);
      const isNewUser = existingUser.length === 0;
      
      await db.insert(users).values({
        id: kakaoUserId,
        email: email,
        nickname: nickname,
        firstName: nickname,
        lastName: "",
        profileImageUrl: profileImage,
        gender: gender,
        loginMethod: "kakao",
        emailVerified: true,
      }).onConflictDoUpdate({
        target: users.id,
        set: {
          email: email,
          firstName: nickname,
          profileImageUrl: profileImage,
          gender: gender,
          loginMethod: "kakao",
          updatedAt: new Date(),
        },
      });

      // 첫 로그인 환영 쿠폰 발급 (신규 사용자 또는 아직 쿠폰 미발급)
      const currentUser = existingUser[0];
      if (isNewUser || (currentUser && !currentUser.welcomeCouponIssued)) {
        try {
          const welcomeCoupons = await db.select().from(coupons).where(
            and(
              eq(coupons.isWelcomeCoupon, true),
              eq(coupons.isActive, true)
            )
          );
          
          for (const coupon of welcomeCoupons) {
            await db.insert(userCoupons).values({
              userId: kakaoUserId,
              couponId: coupon.id,
              isUsed: false,
            });
          }
          
          await db.update(users).set({ welcomeCouponIssued: true }).where(eq(users.id, kakaoUserId));
          console.log("Welcome coupon issued for Kakao user:", kakaoUserId);
        } catch (couponError) {
          console.error("Welcome coupon issue error:", couponError);
        }
      }
      
      // 관리자 알림 생성 (신규회원 또는 로그인)
      try {
        if (isNewUser) {
          await db.insert(adminNotifications).values({
            type: "new_member",
            userId: kakaoUserId,
            userEmail: email,
            userNickname: nickname,
            message: `새 회원 가입: ${nickname} (카카오)`,
          });
        } else {
          await db.insert(adminNotifications).values({
            type: "login",
            userId: kakaoUserId,
            userEmail: email,
            userNickname: nickname,
            message: `로그인: ${nickname} (카카오)`,
          });
        }
      } catch (notifError) {
        console.error("Admin notification error:", notifError);
      }

      const user = {
        claims: {
          sub: kakaoUserId,
          email: email,
          first_name: nickname,
          last_name: "",
          profile_image_url: profileImage,
          gender: gender,
        },
        provider: "kakao",
        expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
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

  // === 이메일/비밀번호 회원가입 ===
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, nickname, gender, birthDate } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "이메일과 비밀번호를 입력해주세요." });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: "비밀번호는 최소 6자 이상이어야 합니다." });
      }
      
      // 이메일 중복 확인
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        // 인증되지 않은 사용자인 경우 재발송 안내
        if (!existingUser[0].emailVerified && existingUser[0].loginMethod === "email") {
          return res.status(400).json({ 
            error: "이미 등록된 이메일입니다. 인증 이메일을 확인하거나 재발송해주세요.",
            needsVerification: true,
            email: email
          });
        }
        return res.status(400).json({ error: "이미 등록된 이메일입니다." });
      }
      
      // 비밀번호 해시
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // 인증 토큰 생성 (6자리 숫자)
      const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
      const tokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30분 후 만료
      
      // 사용자 생성 (UUID 자동 생성) - 이메일 미인증 상태
      const [newUser] = await db.insert(users).values({
        email,
        password: hashedPassword,
        nickname: nickname || email.split("@")[0],
        gender: gender || null,
        birthDate: birthDate || null,
        loginMethod: "email",
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: tokenExpires,
      }).returning();
      
      // 인증 이메일 발송
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD,
        },
      });
      
      const mailOptions = {
        from: `"붕따우 도깨비" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: "[붕따우 도깨비] 이메일 인증 코드",
        html: `
          <div style="font-family: 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">붕따우 도깨비 이메일 인증</h2>
            <p>안녕하세요!</p>
            <p>회원가입을 완료하려면 아래 인증 코드를 입력해주세요.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${verificationToken}</p>
            </div>
            <p style="color: #666;">이 코드는 30분 후에 만료됩니다.</p>
            <p style="color: #666;">본인이 요청하지 않은 경우 이 이메일을 무시해주세요.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">붕따우 도깨비 (사업자등록번호: 350-70-00679)</p>
          </div>
        `,
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${email} with code ${verificationToken}`);
      
      res.json({ 
        success: true, 
        message: "인증 이메일이 발송되었습니다. 이메일을 확인해주세요.",
        needsVerification: true,
        email: email
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "회원가입 처리 중 오류가 발생했습니다." });
    }
  });

  // === 이메일 인증 확인 ===
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({ error: "이메일과 인증 코드를 입력해주세요." });
      }
      
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user) {
        return res.status(400).json({ error: "등록되지 않은 이메일입니다." });
      }
      
      if (user.emailVerified) {
        return res.status(400).json({ error: "이미 인증된 이메일입니다." });
      }
      
      if (user.emailVerificationToken !== code) {
        return res.status(400).json({ error: "인증 코드가 일치하지 않습니다." });
      }
      
      if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
        return res.status(400).json({ error: "인증 코드가 만료되었습니다. 재발송해주세요." });
      }
      
      // 이메일 인증 완료
      await db.update(users)
        .set({ 
          emailVerified: true, 
          emailVerificationToken: null, 
          emailVerificationExpires: null 
        })
        .where(eq(users.id, user.id));
      
      // 첫 로그인 환영 쿠폰 발급
      if (!user.welcomeCouponIssued) {
        try {
          const welcomeCoupons = await db.select().from(coupons).where(
            and(
              eq(coupons.isWelcomeCoupon, true),
              eq(coupons.isActive, true)
            )
          );
          
          for (const coupon of welcomeCoupons) {
            await db.insert(userCoupons).values({
              userId: user.id,
              couponId: coupon.id,
              isUsed: false,
            });
          }
          
          await db.update(users).set({ welcomeCouponIssued: true }).where(eq(users.id, user.id));
        } catch (couponError) {
          console.error("Welcome coupon issue error (verify-email):", couponError);
        }
      }
      
      // 관리자 알림 생성 (신규회원)
      await db.insert(adminNotifications).values({
        type: "new_member",
        userId: user.id,
        userEmail: user.email,
        userNickname: user.nickname,
        message: `새 회원 가입: ${user.nickname || user.email} (이메일)`,
      });
      
      // 세션에 사용자 정보 저장 (자동 로그인)
      (req.session as any).userId = user.id;
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        name: user.nickname || user.email?.split("@")[0],
        profileImageUrl: user.profileImageUrl,
      };
      
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "세션 저장 실패" });
        }
        res.json({ success: true, message: "이메일 인증이 완료되었습니다.", user: { id: user.id, email: user.email, nickname: user.nickname } });
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ error: "이메일 인증 처리 중 오류가 발생했습니다." });
    }
  });

  // === 인증 이메일 재발송 ===
  app.post("/api/auth/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "이메일을 입력해주세요." });
      }
      
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user) {
        return res.status(400).json({ error: "등록되지 않은 이메일입니다." });
      }
      
      if (user.emailVerified) {
        return res.status(400).json({ error: "이미 인증된 이메일입니다." });
      }
      
      // 새 인증 토큰 생성
      const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
      const tokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30분 후 만료
      
      await db.update(users)
        .set({ 
          emailVerificationToken: verificationToken, 
          emailVerificationExpires: tokenExpires 
        })
        .where(eq(users.id, user.id));
      
      // 인증 이메일 재발송
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD,
        },
      });
      
      const mailOptions = {
        from: `"붕따우 도깨비" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: "[붕따우 도깨비] 이메일 인증 코드 (재발송)",
        html: `
          <div style="font-family: 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">붕따우 도깨비 이메일 인증</h2>
            <p>안녕하세요!</p>
            <p>회원가입을 완료하려면 아래 인증 코드를 입력해주세요.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${verificationToken}</p>
            </div>
            <p style="color: #666;">이 코드는 30분 후에 만료됩니다.</p>
            <p style="color: #666;">본인이 요청하지 않은 경우 이 이메일을 무시해주세요.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">붕따우 도깨비 (사업자등록번호: 350-70-00679)</p>
          </div>
        `,
      };
      
      await transporter.sendMail(mailOptions);
      console.log(`Verification email resent to ${email} with code ${verificationToken}`);
      
      res.json({ success: true, message: "인증 이메일이 재발송되었습니다." });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ error: "인증 이메일 재발송 중 오류가 발생했습니다." });
    }
  });

  // === 이메일/비밀번호 로그인 ===
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "이메일과 비밀번호를 입력해주세요." });
      }
      
      // 사용자 찾기
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user) {
        return res.status(401).json({ error: "등록되지 않은 이메일입니다." });
      }
      
      // 비밀번호가 없는 경우 (OAuth로 가입한 사용자)
      if (!user.password) {
        return res.status(401).json({ error: "이 이메일은 소셜 로그인으로 등록되었습니다. 카카오 또는 구글로 로그인해주세요." });
      }
      
      // 이메일 인증 확인
      if (!user.emailVerified && user.loginMethod === "email") {
        return res.status(401).json({ 
          error: "이메일 인증이 필요합니다. 이메일을 확인해주세요.",
          needsVerification: true,
          email: email
        });
      }
      
      // 비밀번호 확인
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "비밀번호가 일치하지 않습니다." });
      }
      
      // 첫 로그인 환영 쿠폰 발급
      if (!user.welcomeCouponIssued) {
        try {
          // 활성화된 환영 쿠폰 찾기
          const welcomeCoupons = await db.select().from(coupons).where(
            and(
              eq(coupons.isWelcomeCoupon, true),
              eq(coupons.isActive, true)
            )
          );
          
          // 환영 쿠폰 발급
          for (const coupon of welcomeCoupons) {
            await db.insert(userCoupons).values({
              userId: user.id,
              couponId: coupon.id,
              isUsed: false,
            });
          }
          
          // 환영 쿠폰 발급 완료 표시
          await db.update(users).set({ welcomeCouponIssued: true }).where(eq(users.id, user.id));
        } catch (couponError) {
          console.error("Welcome coupon issue error:", couponError);
          // 쿠폰 발급 실패해도 로그인은 진행
        }
      }
      
      // 관리자 알림 생성 (로그인)
      try {
        await db.insert(adminNotifications).values({
          type: "login",
          userId: user.id,
          userEmail: user.email,
          userNickname: user.nickname,
          message: `로그인: ${user.nickname || user.email} (이메일)`,
        });
      } catch (notifError) {
        console.error("Admin notification error:", notifError);
      }
      
      // 세션에 사용자 정보 저장
      (req.session as any).userId = user.id;
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        name: user.nickname || user.email?.split("@")[0],
        profileImageUrl: user.profileImageUrl,
      };
      
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "세션 저장 실패" });
        }
        res.json({ success: true, user: { id: user.id, email: user.email, nickname: user.nickname } });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "로그인 처리 중 오류가 발생했습니다." });
    }
  });

  // === 비밀번호 찾기 (임시 비밀번호 이메일 발송) ===
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "이메일을 입력해주세요." });
      }
      
      // 사용자 찾기
      const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (!user) {
        return res.status(404).json({ error: "등록되지 않은 이메일입니다." });
      }
      
      // OAuth로 가입한 사용자 체크
      if (user.loginMethod && user.loginMethod !== "email") {
        return res.status(400).json({ 
          error: `이 이메일은 ${user.loginMethod === "kakao" ? "카카오" : user.loginMethod === "google" ? "구글" : user.loginMethod} 로그인으로 등록되었습니다.` 
        });
      }
      
      // 임시 비밀번호 생성 (8자리 영문+숫자)
      const tempPassword = crypto.randomBytes(4).toString("hex");
      
      // 비밀번호 해시 및 업데이트
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      await db.update(users).set({ password: hashedPassword }).where(eq(users.id, user.id));
      
      // 이메일 발송
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD,
        },
      });
      
      const mailOptions = {
        from: `"붕따우 도깨비" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: "[붕따우 도깨비] 임시 비밀번호 안내",
        html: `
          <div style="font-family: 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">붕따우 도깨비 임시 비밀번호</h2>
            <p>안녕하세요, ${user.nickname || user.email?.split("@")[0]}님!</p>
            <p>요청하신 임시 비밀번호를 안내해 드립니다.</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px;">임시 비밀번호: <strong style="color: #dc2626;">${tempPassword}</strong></p>
            </div>
            <p style="color: #666;">로그인 후 반드시 비밀번호를 변경해주세요.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">붕따우 도깨비 (사업자등록번호: 350-70-00679)</p>
          </div>
        `,
      };
      
      await transporter.sendMail(mailOptions);
      
      res.json({ success: true, message: "임시 비밀번호가 이메일로 발송되었습니다." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "비밀번호 재설정 처리 중 오류가 발생했습니다. 관리자에게 문의해주세요." });
    }
  });

  // === 푸시 알림 API ===
  
  // VAPID 공개키 반환
  app.get("/api/push/vapid-public-key", (req, res) => {
    res.json({ publicKey: vapidPublicKey });
  });

  // 푸시 알림 구독 - 인증 미들웨어 없이 직접 세션에서 userId 추출
  app.post("/api/push/subscribe", async (req: any, res) => {
    try {
      const { endpoint, keys } = req.body;
      const user = req.user as any;
      const session = req.session as any;
      const userId = user?.claims?.sub || user?.id || session?.userId || session?.passport?.user?.claims?.sub;
      
      console.log("[PUSH] subscribe attempt - userId:", userId, "hasUser:", !!user, "sessionUserId:", session?.userId, "passportUser:", !!session?.passport?.user, "endpoint:", endpoint?.substring(0, 60));
      
      if (!userId) {
        return res.status(401).json({ error: "로그인이 필요합니다." });
      }
      
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ error: "잘못된 구독 정보입니다." });
      }

      const existing = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint)).limit(1);
      
      if (existing.length > 0) {
        await db.update(pushSubscriptions)
          .set({ userId, p256dh: keys.p256dh, auth: keys.auth })
          .where(eq(pushSubscriptions.endpoint, endpoint));
      } else {
        await db.insert(pushSubscriptions).values({
          userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        });
      }

      console.log("[PUSH] subscription saved for user:", userId);
      res.json({ success: true, userId });
    } catch (error) {
      console.error("[PUSH] subscription error:", error);
      res.status(500).json({ error: "구독 저장 실패" });
    }
  });

  app.post("/api/push/test", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "로그인 필요" });
      
      const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
      console.log("Push test - userId:", userId, "subscriptions:", subs.length);
      
      if (subs.length === 0) {
        return res.json({ success: false, message: "구독 없음. 알림 권한을 허용하고 다시 로그인해주세요.", userId, subscriptionCount: 0 });
      }
      
      let sent = 0;
      let failed = 0;
      let lastError = "";
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title: "테스트 알림", body: "푸시 알림이 정상 작동합니다!", url: "/" }),
            PUSH_OPTIONS
          );
          sent++;
        } catch (err: any) {
          failed++;
          lastError = `${err.statusCode}: ${err.message}`;
          console.error("Push send error:", err.statusCode, err.body || err.message, "endpoint:", sub.endpoint.substring(0, 60));
          if (err.statusCode === 404 || err.statusCode === 410) {
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
          }
        }
      }
      
      res.json({ success: sent > 0, message: sent > 0 ? `${sent}건 발송 완료` : `발송 실패: ${lastError}`, userId, sent, failed, total: subs.length, serverPubKey: vapidPublicKey.substring(0, 15) });
    } catch (err) {
      res.status(500).json({ error: "테스트 실패" });
    }
  });

  app.post("/api/push/test-delayed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ error: "로그인 필요" });
      const delay = Math.min(parseInt(req.body?.delay) || 30, 120);
      res.json({ success: true, message: `${delay}초 후 푸시 발송 예약됨. 앱을 닫고 기다려주세요.` });
      setTimeout(async () => {
        try {
          const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
          console.log(`[PUSH-DELAYED] ${delay}초 경과, userId: ${userId}, subs: ${subs.length}`);
          for (const sub of subs) {
            try {
              await webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                JSON.stringify({ title: "지연 테스트", body: `${delay}초 후 백그라운드 알림 테스트입니다!`, url: "/" }),
                PUSH_OPTIONS
              );
              console.log(`[PUSH-DELAYED] 발송 성공 - ${sub.endpoint.substring(0, 60)}`);
            } catch (err: any) {
              console.error(`[PUSH-DELAYED] 발송 실패 - status: ${err.statusCode}`);
              if (err.statusCode === 410 || err.statusCode === 404) {
                await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint));
              }
            }
          }
        } catch (e) {
          console.error("[PUSH-DELAYED] 오류:", e);
        }
      }, delay * 1000);
    } catch (err) {
      res.status(500).json({ error: "예약 실패" });
    }
  });

  app.get("/api/push/status", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.user?.id || (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: "로그인 필요" });
    const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    res.json({ userId, subscriptionCount: subs.length, subscriptions: subs.map(s => ({ endpoint: s.endpoint.substring(0, 80), createdAt: s.createdAt })) });
  });

  // 푸시 알림 구독 해제
  app.post("/api/push/unsubscribe", isAuthenticated, async (req: any, res) => {
    try {
      const { endpoint } = req.body;
      
      if (!endpoint) {
        return res.status(400).json({ error: "endpoint가 필요합니다." });
      }

      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
      
      console.log("Push subscription removed:", endpoint);
      res.json({ success: true });
    } catch (error) {
      console.error("Push unsubscribe error:", error);
      res.status(500).json({ error: "구독 해제 실패" });
    }
  });

  app.get("/api/push/debug", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || (req.session as any)?.userId;
      const allSubs = await db.select().from(pushSubscriptions);
      const adminUsers = await db.select({ id: users.id, isAdmin: users.isAdmin }).from(users).where(eq(users.isAdmin, true));
      res.json({
        currentUserId: userId,
        totalSubscriptions: allSubs.length,
        subscriptions: allSubs.map(s => ({ userId: s.userId, endpoint: s.endpoint.substring(0, 80), createdAt: s.createdAt })),
        adminUsers: adminUsers.map(a => a.id),
        vapidKey: vapidPublicKey.substring(0, 20) + "..."
      });
    } catch (error) {
      res.status(500).json({ error: "디버그 실패" });
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

      // 7. Custom Categories Calculation
      const customCategoryItems: { categoryId: number; name: string; pricePerUnit: number; quantity: number; subtotal: number; schedules?: { date: string; quantity: number }[] }[] = [];
      if (input.customCategories && input.customCategories.length > 0) {
        const enabledSelections = input.customCategories.filter((c: any) => c.enabled !== false);
        if (enabledSelections.length > 0) {
          const categories = await db.select().from(quoteCategories).where(
            and(eq(quoteCategories.isActive, true))
          );
          const categoryMap = new Map(categories.map(c => [c.id, c]));
          for (const sel of enabledSelections) {
            const cat = categoryMap.get(sel.categoryId);
            if (cat) {
              let catOptions: Array<{name: string; price: number}> = [];
              try {
                if (cat.options) {
                  const parsed = typeof cat.options === "string" ? JSON.parse(cat.options) : cat.options;
                  if (Array.isArray(parsed)) catOptions = parsed;
                }
              } catch {}

              const schedules = Array.isArray(sel.schedules) && sel.schedules.length > 0
                ? sel.schedules
                : [{ date: sel.date || "", quantity: Number(sel.quantity) || 1, selectedOption: "" }];

              let subtotal = 0;
              const processedSchedules = schedules.map((s: any) => {
                const qty = Number(s.quantity) || 1;
                let price = cat.pricePerUnit || 0;
                const selectedOption = s.selectedOption || "";
                if (selectedOption && catOptions.length > 0) {
                  const opt = catOptions.find(o => o.name === selectedOption);
                  if (opt) price = opt.price;
                }
                subtotal += price * qty;
                return { date: s.date || "", quantity: qty, selectedOption, optionPrice: price };
              });

              const totalQuantity = processedSchedules.reduce((sum: number, s: any) => sum + s.quantity, 0);
              customCategoryItems.push({
                categoryId: cat.id,
                name: cat.name,
                pricePerUnit: cat.pricePerUnit || 0,
                quantity: totalQuantity,
                subtotal,
                schedules: processedSchedules,
              });
            }
          }
        }
      }
      (breakdown as any).customCategories = customCategoryItems;
      const customCategoriesTotal = customCategoryItems.reduce((sum, item) => sum + item.subtotal, 0);

      breakdown.total = breakdown.villa.price + breakdown.vehicle.price + breakdown.golf.price + breakdown.ecoGirl.price + breakdown.guide.price + breakdown.fastTrack.price + customCategoriesTotal;
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
  app.patch("/api/quotes/:id/memo", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      
      if (!isUserAdmin(userId, userEmail)) {
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
  app.patch("/api/quotes/:id/memo-images", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      
      if (!isUserAdmin(userId, userEmail)) {
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
  app.patch("/api/quotes/:id/total", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      
      if (!isUserAdmin(userId, userEmail)) {
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
  app.get("/api/quotes/deposit-paid", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!isUserAdmin(userId, userEmail)) {
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

  // Helper function to get random count between 600 and 1000
  const getRandomBaseCount = () => Math.floor(Math.random() * 401) + 600;

  function getFakeMemberCount(): number {
    const startDate = new Date("2026-02-07");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 563;
    let count = 563;
    let seed = 20260207;
    for (let i = 0; i < diffDays; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      count += (seed % 10) + 1;
    }
    return count;
  }

  app.get("/api/member-count", async (req, res) => {
    try {
      const fakeMemberCount = getFakeMemberCount();
      const realMemberResult = await db.select({ count: sql<number>`count(*)` }).from(users);
      const realMemberCount = Number(realMemberResult[0]?.count || 0);
      res.json({ fakeMemberCount, realMemberCount });
    } catch (err) {
      console.error("Member count error:", err);
      res.json({ fakeMemberCount: 563, realMemberCount: 0 });
    }
  });

  app.get("/api/visitor-count", async (req, res) => {
    try {
      const today = getTodayDateString();
      const result = await db.select().from(visitorCount).where(eq(visitorCount.id, 1));
      
      if (result.length === 0) {
        const baseCount = getRandomBaseCount();
        await db.insert(visitorCount).values({ id: 1, count: baseCount, totalCount: 15000, realCount: 0, realTotalCount: 0, lastResetDate: today });
        res.json({ count: baseCount, totalCount: 15000, realCount: 0, realTotalCount: 0 });
      } else {
        // Check if we need to reset for a new day
        if (result[0].lastResetDate !== today) {
          // 새 날: 어제 방문자 수를 누적에 더하고, 오늘 방문자 초기화
          const previousDayCount = result[0].count;
          const previousRealCount = result[0].realCount || 0;
          const newTotalCount = (result[0].totalCount || 15000) + previousDayCount;
          const newRealTotalCount = (result[0].realTotalCount || 0) + previousRealCount;
          const baseCount = getRandomBaseCount();
          await db.update(visitorCount).set({ 
            count: baseCount, 
            totalCount: newTotalCount, 
            realCount: 0,
            realTotalCount: newRealTotalCount,
            lastResetDate: today 
          }).where(eq(visitorCount.id, 1));
          res.json({ count: baseCount, totalCount: newTotalCount, realCount: 0, realTotalCount: newRealTotalCount });
        } else {
          res.json({ 
            count: result[0].count, 
            totalCount: result[0].totalCount || 15000,
            realCount: result[0].realCount || 0,
            realTotalCount: result[0].realTotalCount || 0
          });
        }
      }
    } catch (err) {
      console.error("Visitor count get error:", err);
      res.json({ count: 0, totalCount: 15000, realCount: 0, realTotalCount: 0 });
    }
  });

  app.post("/api/visitor-count/increment", async (req, res) => {
    try {
      const today = getTodayDateString();
      const result = await db.select().from(visitorCount).where(eq(visitorCount.id, 1));
      
      if (result.length === 0) {
        const baseCount = getRandomBaseCount();
        await db.insert(visitorCount).values({ 
          id: 1, 
          count: baseCount, 
          totalCount: 15000, 
          realCount: 1, 
          realTotalCount: 1,
          lastResetDate: today 
        });
        res.json({ count: baseCount, totalCount: 15000, realCount: 1, realTotalCount: 1 });
      } else {
        // Check if we need to reset for a new day
        if (result[0].lastResetDate !== today) {
          // 새 날: 어제 방문자 수를 누적에 더하고, 오늘 방문자 초기화
          const previousDayCount = result[0].count;
          const previousRealCount = result[0].realCount || 0;
          const newTotalCount = (result[0].totalCount || 15000) + previousDayCount;
          const newRealTotalCount = (result[0].realTotalCount || 0) + previousRealCount;
          const baseCount = getRandomBaseCount();
          await db.update(visitorCount).set({ 
            count: baseCount, 
            totalCount: newTotalCount, 
            realCount: 1, 
            realTotalCount: newRealTotalCount + 1,
            lastResetDate: today 
          }).where(eq(visitorCount.id, 1));
          res.json({ count: baseCount, totalCount: newTotalCount, realCount: 1, realTotalCount: newRealTotalCount + 1 });
        } else {
          const newCount = result[0].count + 1;
          const newTotalCount = (result[0].totalCount || 15000) + 1;
          const newRealCount = (result[0].realCount || 0) + 1;
          const newRealTotalCount = (result[0].realTotalCount || 0) + 1;
          await db.update(visitorCount).set({ 
            count: newCount, 
            totalCount: newTotalCount,
            realCount: newRealCount,
            realTotalCount: newRealTotalCount
          }).where(eq(visitorCount.id, 1));
          res.json({ 
            count: newCount, 
            totalCount: newTotalCount,
            realCount: newRealCount,
            realTotalCount: newRealTotalCount
          });
        }
      }
    } catch (err) {
      console.error("Visitor count increment error:", err);
      res.json({ count: 0, totalCount: 15000, realCount: 0, realTotalCount: 0 });
    }
  });

  // === 여행 가계부 API (인증 필요) ===
  
  // 그룹 목록 조회 (로그인한 사용자의 그룹만)
  app.get("/api/expense-groups", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || (req.session as any)?.userId;
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
      const userId = req.user?.claims?.sub || req.user?.id || (req.session as any)?.userId;
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
      const userId = req.user?.claims?.sub || req.user?.id || (req.session as any)?.userId;
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
      const userId = req.user?.claims?.sub || req.user?.id || (req.session as any)?.userId;
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
      const userId = req.user?.claims?.sub || req.user?.id || (req.session as any)?.userId;
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
      const userId = req.user?.claims?.sub || req.user?.id || (req.session as any)?.userId;
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
      const userId = req.user?.claims?.sub || req.user?.id || (req.session as any)?.userId;
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
      const userId = req.user?.claims?.sub || req.user?.id || (req.session as any)?.userId;
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
      const userId = req.user?.claims?.sub || req.user?.id || (req.session as any)?.userId;
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

  // 텍스트로 장소 검색 (Google Places Text Search API)
  app.get("/api/search-places", async (req, res) => {
    try {
      const { query, lang = "ko" } = req.query;
      
      if (!query) {
        return res.status(400).json({ message: "query is required" });
      }
      
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Google Maps API key not configured" });
      }
      
      const langMap: Record<string, string> = { ko: "ko", en: "en", zh: "zh-CN", vi: "vi", ru: "ru", ja: "ja" };
      const googleLang = langMap[lang as string] || "ko";
      
      // 붕따우 지역으로 검색 범위 제한
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query as string)}+Vung+Tau&key=${apiKey}&language=${googleLang}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        console.error("Google Places Text Search API error:", data.status, data.error_message);
        return res.status(500).json({ message: "Failed to search places" });
      }
      
      const places = (data.results || []).slice(0, 10).map((place: any) => ({
        placeId: place.place_id,
        name: place.name,
        address: place.formatted_address,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        types: place.types,
        location: place.geometry?.location,
        photoReference: place.photos?.[0]?.photo_reference,
      }));
      
      res.json({ places, status: data.status });
    } catch (err) {
      console.error("Search places error:", err);
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

  // 구글 맵 URL 파싱 API
  app.post("/api/parse-google-maps-url", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: "URL이 필요합니다" });
      }
      
      let finalUrl = url;
      
      // 단축 URL (maps.app.goo.gl, goo.gl/maps) 처리 - 리다이렉트 따라가기
      if (url.includes("goo.gl") || url.includes("maps.app.goo.gl")) {
        try {
          // manual redirect 설정으로 Location 헤더 추출
          const response = await fetch(url, { 
            redirect: "manual",
            headers: { 
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept": "text/html,application/xhtml+xml"
            }
          });
          
          // 302 리다이렉트의 Location 헤더 확인
          const location = response.headers.get("location");
          if (location) {
            finalUrl = location;
            console.log("Redirected to:", finalUrl);
          } else {
            // Location 없으면 body에서 URL 추출 시도
            const body = await response.text();
            const urlMatch = body.match(/https:\/\/www\.google\.[a-z]+\/maps[^"'\s]*/);
            if (urlMatch) {
              finalUrl = urlMatch[0];
              console.log("Extracted from body:", finalUrl);
            }
          }
        } catch (e) {
          console.error("Redirect follow error:", e);
        }
      }
      
      let latitude: number | null = null;
      let longitude: number | null = null;
      let name: string | null = null;
      let address: string | null = null;
      
      // URL에서 좌표 추출 시도
      // 패턴 1: @lat,lng,zoom
      const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const atMatch = finalUrl.match(atPattern);
      if (atMatch) {
        latitude = parseFloat(atMatch[1]);
        longitude = parseFloat(atMatch[2]);
      }
      
      // 패턴 2: !3d{lat}!4d{lng}
      const bangPattern = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/;
      const bangMatch = finalUrl.match(bangPattern);
      if (bangMatch && !latitude) {
        latitude = parseFloat(bangMatch[1]);
        longitude = parseFloat(bangMatch[2]);
      }
      
      // 패턴 3: q=lat,lng
      const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const qMatch = finalUrl.match(qPattern);
      if (qMatch && !latitude) {
        latitude = parseFloat(qMatch[1]);
        longitude = parseFloat(qMatch[2]);
      }
      
      // 패턴 4: 좌표가 없으면 페이지에서 추출 시도
      if (!latitude || !longitude) {
        try {
          const pageRes = await fetch(finalUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept": "text/html,application/xhtml+xml",
              "Accept-Language": "en-US,en;q=0.9"
            }
          });
          const html = await pageRes.text();
          
          // HTML에서 좌표 패턴 찾기: APP_INITIALIZATION_STATE, window.APP_OPTIONS 등에서
          // 패턴: [null,null,LAT,LNG] 또는 [LAT,LNG]
          const coordPatterns = [
            /\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/,
            /"center":\[(-?\d+\.\d+),(-?\d+\.\d+)\]/,
            /\/@(-?\d+\.\d+),(-?\d+\.\d+)/,
            /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
            /ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
          ];
          
          for (const pattern of coordPatterns) {
            const match = html.match(pattern);
            if (match) {
              const lat = parseFloat(match[1]);
              const lng = parseFloat(match[2]);
              // 붕따우 근처인지 확인 (lat: 10.3~10.5, lng: 107.0~107.2)
              if (lat > 10 && lat < 11 && lng > 107 && lng < 108) {
                latitude = lat;
                longitude = lng;
                console.log("Extracted coords from HTML:", latitude, longitude);
                break;
              }
            }
          }
        } catch (e) {
          console.error("HTML coord extraction error:", e);
        }
      }
      
      // 장소 이름 추출 시도 (URL 경로에서)
      // /place/장소이름/ 패턴
      const placePattern = /\/place\/([^/@]+)/;
      const placeMatch = finalUrl.match(placePattern);
      if (placeMatch) {
        const fullName = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
        
        // 쉼표로 분리해서 이름과 주소 구분
        // 예: "장소이름, 주소1, 주소2, 도시" -> 이름: "장소이름", 주소: "주소1, 주소2, 도시"
        const parts = fullName.split(",").map(p => p.trim()).filter(p => p);
        if (parts.length > 1) {
          // 첫 번째 부분만 이름으로, 나머지는 주소로
          name = parts[0];
          address = parts.slice(1).join(", ");
        } else {
          name = fullName;
        }
      }
      
      // 좌표가 없고 이름/주소가 있으면 Geocoding/Places API로 좌표 가져오기
      if ((!latitude || !longitude) && (name || address) && process.env.GOOGLE_MAPS_API_KEY) {
        try {
          const searchQuery = name ? `${name}, Vũng Tàu, Vietnam` : address;
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery || "")}&key=${process.env.GOOGLE_MAPS_API_KEY}&language=vi`;
          const geocodeRes = await fetch(geocodeUrl);
          const geocodeData = await geocodeRes.json() as {
            status: string;
            results: Array<{
              geometry: { location: { lat: number; lng: number } };
              formatted_address: string;
            }>;
            error_message?: string;
          };
          
          if (geocodeData.status === "OK" && geocodeData.results.length > 0) {
            const result = geocodeData.results[0];
            latitude = result.geometry.location.lat;
            longitude = result.geometry.location.lng;
            if (!address) {
              address = result.formatted_address;
            }
            console.log("Geocoding found coords:", latitude, longitude);
          }
        } catch (geocodeErr) {
          console.error("Forward geocoding error:", geocodeErr);
        }
      }
      
      // 좌표가 있고 주소가 없으면 Geocoding API로 주소 가져오기
      if (latitude && longitude && !address && process.env.GOOGLE_MAPS_API_KEY) {
        try {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}&language=vi`;
          const geocodeRes = await fetch(geocodeUrl);
          const geocodeData = await geocodeRes.json() as {
            status: string;
            results: Array<{
              formatted_address: string;
              address_components: Array<{
                long_name: string;
                short_name: string;
                types: string[];
              }>;
            }>;
          };
          
          if (geocodeData.status === "OK" && geocodeData.results.length > 0) {
            address = geocodeData.results[0].formatted_address;
            console.log("Geocoding address:", address);
          }
        } catch (geocodeErr) {
          console.error("Geocoding error:", geocodeErr);
        }
      }
      
      // 좌표가 없어도 이름이 있으면 성공 처리
      // 사용자가 직접 좌표를 입력할 수 있음
      if (!latitude && !longitude && !name) {
        return res.status(400).json({ 
          error: "URL에서 정보를 추출할 수 없습니다. 구글 맵에서 장소 상세 페이지의 URL을 복사해주세요." 
        });
      }
      
      res.json({
        name,
        address,
        latitude,
        longitude,
        originalUrl: url,
        resolvedUrl: finalUrl,
        message: (!latitude && !longitude) ? "좌표를 추출할 수 없어 직접 입력이 필요합니다" : undefined,
      });
    } catch (err) {
      console.error("Parse Google Maps URL error:", err);
      res.status(500).json({ error: "URL 파싱 중 오류가 발생했습니다" });
    }
  });

  // 카테고리명 번역 API (Gemini 사용)
  const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  app.post("/api/translate-category", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text is required" });
      }
      
      const prompt = `Translate the following Korean category name to multiple languages. Return ONLY a valid JSON object with these exact keys: en, zh, vi, ru, ja. Each value should be a short category name (1-3 words max).

Korean text: "${text}"

Example response format:
{"en":"Golf Club","zh":"高尔夫俱乐部","vi":"Câu lạc bộ golf","ru":"Гольф-клуб","ja":"ゴルフクラブ"}`;

      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
      });
      
      const resultText = response.text?.trim() || "";
      // JSON 추출 (```json ... ``` 형태 처리)
      let jsonStr = resultText;
      if (resultText.includes("```")) {
        const match = resultText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) jsonStr = match[1];
      }
      
      try {
        const translations = JSON.parse(jsonStr);
        res.json(translations);
      } catch {
        console.error("Translation parse error:", resultText);
        res.status(500).json({ error: "Failed to parse translation" });
      }
    } catch (error) {
      console.error("Translation error:", error);
      res.status(500).json({ error: "Translation failed" });
    }
  });

  // AI 여행 플랜 생성 API (Gemini 사용 - 무료)

  const travelPlanRequestSchema = z.object({
    purpose: z.string().min(1),
    startDate: z.string(),
    endDate: z.string(),
    language: z.string().default("ko"),
    companion: z.string().optional().default(""),
    travelStyle: z.string().optional().default("balanced"),
    arrivalTime: z.string().optional().default(""),
    villaName: z.string().optional().default(""),
    villaLat: z.string().optional().default(""),
    villaLng: z.string().optional().default(""),
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
      { name: "이안 돌판 삼겹살", type: "삼겹살", note: "도깨비 협력식당, 예약 시 10% 할인", recommended: true, isPartner: true, discountText: "붕따우 도깨비 카톡으로 예약 시 10% 할인" },
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
      { name: "Re.en 마사지", type: "마사지", note: "도깨비 협력업체", isPartner: true, discountText: "붕따우 도깨비 카톡으로 예약 시 할인" },
      { name: "그랜드 마사지", type: "마사지", note: "도깨비 협력업체", isPartner: true, discountText: "붕따우 도깨비 카톡으로 예약 시 할인" },
      { name: "DAY SPA", type: "스파", note: "도깨비 협력업체, 프리미엄 스파", isPartner: true, discountText: "붕따우 도깨비 카톡으로 예약 시 할인" },
      { name: "김마싸", type: "마사지", note: "한국인 운영" },
      { name: "이발소 Salon Kimha", type: "이발소", note: "한국인 운영" },
      { name: "Bi Roen 현지 고급 이발소", type: "이발소", note: "도깨비 협력업체, 추천", recommended: true, isPartner: true, discountText: "붕따우 도깨비 카톡으로 예약 시 5% 할인" },
    ],
    nightlife: [
      { name: "88 비어클럽", nameVi: "88 Beer Club", type: "비어클럽", note: "라이브 음악, 야외 분위기" },
      { name: "Revo 클럽", nameVi: "Revo Club", type: "나이트클럽", note: "EDM 음악, 현지인 인기" },
      { name: "Lox 클럽", nameVi: "Lox Night Club", type: "나이트클럽", note: "프리미엄 클럽, VIP 서비스" },
      { name: "U.S Bar Club", type: "바", note: "아메리칸 스타일, 칵테일" },
      { name: "Peace and Love 라이브바", nameVi: "Peace and Love Live Bar", type: "라이브바", note: "금,토 라이브 밴드" },
    ],
    golf: [
      { name: "파라다이스 골프장", nameVi: "Paradise Golf", course: "paradise", note: "도깨비 협력업체, 평일 $90, 주말 $110", isPartner: true, discountText: "붕따우 도깨비 카톡으로 예약 시 할인" },
      { name: "쩌우득 골프장", nameVi: "Chou Duc Golf", course: "chouduc", note: "도깨비 협력업체, 평일 $80, 주말 $120", isPartner: true, discountText: "붕따우 도깨비 카톡으로 예약 시 할인" },
      { name: "호짬 골프장", nameVi: "Ho Tram Golf", course: "hocham", note: "도깨비 협력업체, 평일 $150, 주말 $200", isPartner: true, discountText: "붕따우 도깨비 카톡으로 예약 시 할인" },
    ],
    casino: [
      { name: "임페리얼 seaside 클럽", nameVi: "Imperial Seaside Club", type: "카지노", note: "도깨비 협력업체, 첫 방문시 20불 바우처 지급, 외국인 전용(여권 필수, 21세 이상)", lat: 10.344120, lng: 107.095049, isPartner: true, discountText: "붕따우 도깨비 카톡으로 문의 시 20불 바우처 지급 및 차량지원" },
      { name: "Monaco casino", nameVi: "Monaco Casino", type: "카지노", note: "도깨비 협력업체, 외국인 전용(여권 필수, 21세 이상)", lat: 10.349345, lng: 107.074998, isPartner: true, discountText: "붕따우 도깨비 카톡으로 문의시 50불 바우처 지급" },
      { name: "Palace 카지노", nameVi: "Palace Casino", type: "카지노", note: "도깨비 협력업체, 외국인 전용(여권 필수, 21세 이상)", lat: 10.342816, lng: 107.075912, isPartner: true, discountText: "붕따우 도깨비 카톡으로 문의 시 차량지원" },
    ],
  };

  app.post("/api/travel-plan", async (req, res) => {
    try {
      const input = travelPlanRequestSchema.parse(req.body);
      const { purpose, startDate, endDate, language, companion, travelStyle, arrivalTime, villaName, villaLat, villaLng } = input;

      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const startMonth = start.getMonth() + 1;
      const isRainySeason = startMonth >= 5 && startMonth <= 10;

      const purposeDescriptions: Record<string, string> = {
        gourmet: "맛집 탐방과 미식 여행에 중점",
        relaxing: "여유롭고 편안한 힐링 여행에 중점",
        golf: "골프 라운딩과 휴식에 중점",
        adventure: "관광명소 탐험과 액티비티에 중점",
        culture: "문화 유적지와 역사 탐방에 중점",
        family: "가족과 함께 즐길 수 있는 활동에 중점",
        nightlife: "클럽, 바 등 신나는 밤문화 체험에 중점",
        casino: "카지노와 엔터테인먼트에 중점",
      };

      const companionDescriptions: Record<string, string> = {
        solo: "혼자 여행하는 1인 여행자",
        couple: "커플/연인 여행 - 로맨틱한 장소, 분위기 좋은 카페/레스토랑 우선",
        family_kids: "가족 여행(아이 동반) - 안전하고 아이가 즐길 수 있는 장소 위주, 이동시간 최소화",
        family_adults: "성인 가족 여행 - 관광명소와 식도락 균형",
        friends_male: "남성 친구 그룹 - 골프, 맥주, 밤문화, 마사지 등 활동적인 일정",
        friends_female: "여성 친구 그룹 - 카페, 스파, 포토스팟, 쇼핑 위주",
        workshop: "워크샵/단체 여행 - 단체로 이동 가능한 장소, 넓은 식당 우선",
      };

      const styleDescriptions: Record<string, string> = {
        packed: "빡빡한 관광형 - 하루에 5~7개 일정, 이동이 많아도 최대한 많은 곳 방문",
        balanced: "밸런스형 - 하루에 4~5개 일정, 관광과 휴식의 적절한 조합",
        relaxed: "널널한 휴식형 - 하루에 2~3개 일정, 풀빌라에서 충분히 쉬고 여유롭게 이동",
      };

      const arrivalDescriptions: Record<string, string> = {
        morning: "첫날 오전 일찍 도착 (9시 이전) - 호치민 공항에서 붕따우까지 약 2~2.5시간 이동, 점심부터 관광 가능",
        midday: "첫날 낮 도착 (9~14시) - 호치민 공항에서 붕따우까지 약 2~2.5시간 이동, 오후부터 관광 시작",
        afternoon: "첫날 오후 도착 (14~18시) - 이동 후 붕따우 도착 시 저녁시간, 첫날은 저녁식사와 휴식 위주",
        evening: "첫날 저녁 도착 (18시 이후) - 첫날은 숙소 체크인과 가벼운 저녁식사만, 본격 관광은 둘째날부터",
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
사용자의 여행 목적, 동반자 유형, 여행 스타일, 도착 시간을 고려하여 최적의 맞춤 여행 일정을 만들어주세요.
${languagePrompts[language] || languagePrompts.ko}

## 응답 JSON 형식 (반드시 이 형식만 사용):
{
  "title": "여행 제목 (동반자/스타일 반영)",
  "summary": "여행 요약 (3-4문장, 동반자/스타일 반영)",
  "totalEstimatedCost": 총 예상 비용(USD, 숫자만),
  "vehicleRecommendation": "차량 추천 메시지 (예: 이 일정은 총 N시간 이동이 필요합니다. X인승 차량 예약을 추천드립니다)",
  "weatherNote": "날씨 관련 참고사항",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "theme": "이 날의 테마",
      "schedule": [
        {
          "time": "09:00",
          "activity": "활동 내용",
          "place": "장소명 (한국어)",
          "placeVi": "베트남어 장소명",
          "type": "attraction|restaurant|cafe|massage|golf|beach|club|bar|transfer|shopping|casino",
          "note": "참고사항 (영업시간, 팁 등)",
          "estimatedCost": 1인당 예상 비용(USD, 숫자만),
          "travelTime": "이전 장소에서 이동시간 (예: 차 10분, 도보 5분)",
          "lat": 위도(숫자),
          "lng": 경도(숫자),
          "isPartner": true/false (협력업체 여부, 장소 데이터의 isPartner 필드 참조),
          "discountText": "할인 혜택 텍스트 (협력업체인 경우만, 장소 데이터의 discountText 참조)"
        }
      ]
    }
  ],
  "tips": ["팁1", "팁2", "팁3", "팁4", "팁5"]
}

## 비용 참고 기준 (1인 기준 USD):
- 관광명소 입장료: $1~5
- 현지 식당: $5~15
- 한식당: $10~20
- 뷔페: $15~30
- 카페: $3~5
- 마사지 (60분): $10~20
- 스파 (프리미엄): $30~50
- 골프 (18홀): $80~200
- 클럽/바: $10~30
- 해변 활동: 무료~$5
- 카지노: $50~500 (최소 베팅 $10~25, 테이블당)

## 좌표 참고 (붕따우 주요 지점):
- 붕따우 중심: 10.346, 107.084
- 백비치(Bãi Sau): 10.337, 107.095
- 프론트비치(Front Beach): 10.340, 107.072
- 예수상: 10.327, 107.090
- 등대: 10.329, 107.082
- 붕따우 시장: 10.347, 107.077
- 놀이동산(Ho May): 10.356, 107.080
- 호짬(Ho Tram): 10.470, 107.398 (붕따우에서 차로 약 40분)
각 장소의 lat/lng는 위 좌표 근처에서 적절히 지정하세요.`;

      let companionContext = "";
      if (companion && companionDescriptions[companion]) {
        companionContext = `\n## 동반자 유형: ${companionDescriptions[companion]}`;
      }

      let styleContext = "";
      if (travelStyle && styleDescriptions[travelStyle]) {
        styleContext = `\n## 여행 스타일: ${styleDescriptions[travelStyle]}`;
      }

      let arrivalContext = "";
      if (arrivalTime && arrivalDescriptions[arrivalTime]) {
        arrivalContext = `\n## 도착 시간: ${arrivalDescriptions[arrivalTime]}
⚠️ 중요: 첫날 일정은 반드시 도착 시간을 고려하여 현실적으로 배치하세요. 공항에서 붕따우까지 약 2~2.5시간이 소요됩니다.`;
      }

      let villaContext = "";
      if (villaName) {
        villaContext = `\n## 숙소 정보: ${villaName}`;
        if (villaLat && villaLng) {
          villaContext += ` (위치: ${villaLat}, ${villaLng})
⚠️ 동선 최적화: 숙소 위치를 기준으로 가까운 장소부터 배치하세요. 숙소에서 먼 곳은 같은 방향의 일정끼리 묶어주세요.`;
        }
      }

      let weatherContext = "";
      if (isRainySeason) {
        weatherContext = `\n## 우기 시즌 (5~10월):
- 오후에 소나기가 올 가능성이 높으므로 오전에 야외 활동을, 오후에는 실내 활동(마사지, 카페, 쇼핑)을 배치하세요.
- 해변 활동은 오전 시간대에 넣어주세요.
- weatherNote에 우기 관련 주의사항을 포함하세요.`;
      } else {
        weatherContext = `\n## 건기 시즌 (11~4월):
- 날씨가 좋아 해변 활동과 야외 관광에 최적입니다.
- 오전/오후 모두 야외 활동이 가능합니다.
- weatherNote에 건기 시즌의 장점을 포함하세요.`;
      }

      const userPrompt = `붕따우 ${days}일 여행 일정을 만들어주세요.

여행 기간: ${format(start, 'yyyy-MM-dd')} ~ ${format(end, 'yyyy-MM-dd')} (${days}일)
여행 목적: ${purposeDescription}
${companionContext}${styleContext}${arrivalContext}${villaContext}${weatherContext}

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
- casino: 카지노 (임페리얼 seaside 클럽, Monaco casino, Palace 카지노 - 모두 도깨비 협력업체)

## 일정 작성 규칙:
1. ⭐ 협력업체 우선 배치: isPartner: true인 장소를 반드시 우선적으로 일정에 포함하세요. 협력업체는 "붕따우 도깨비" 공식 파트너로 할인 혜택이 있습니다.
2. 협력업체 장소는 일정에 포함할 때 반드시 isPartner: true와 해당 discountText를 응답에 포함하세요.
3. 관광명소(attractions)에서 priority: 1인 장소를 우선 배치하세요.
4. 식사 시간에는 localFood, koreanFood, buffet, chineseFood 목록에서 선택하세요. koreanFood의 협력업체(이안 돌판 삼겹살)를 반드시 1회 이상 포함하세요.
5. 카페 휴식은 coffee 목록에서만 선택하세요.
6. 마사지/스파는 services 목록에서만 선택하세요. 협력업체(Re.en 마사지, 그랜드 마사지, DAY SPA, Bi Roen)를 우선 선택하세요.
7. 각 날짜별로 아침, 점심, 오후, 저녁 일정을 포함하세요.
8. 장소명은 반드시 위 데이터의 name과 nameVi를 정확히 사용하세요.
9. recommended: true 표시된 장소는 특히 추천합니다.
10. 각 일정마다 estimatedCost(1인 기준 USD), travelTime(이전 장소에서 이동시간), lat/lng 좌표를 반드시 포함하세요.
11. vehicleRecommendation에 총 이동시간과 추천 차량 종류를 포함하세요.
12. 마지막 날은 공항 이동시간(붕따우→호치민 약 2~2.5시간)을 고려하여 일정을 짧게 하세요.

${purposes.includes('golf') ? '## 골프 여행: golf 목록에서 골프장을 선택하여 매일 또는 격일로 라운딩을 포함하세요.' : ''}
${purposes.includes('relaxing') ? '## 힐링 여행: services 목록의 마사지/스파와 coffee 목록의 카페를 충분히 포함하세요. 일정 사이에 숙소 휴식시간을 넉넉히 넣어주세요.' : ''}
${purposes.includes('gourmet') ? '## 맛집 탐방: localFood, koreanFood, chineseFood, buffet를 골고루 포함하세요.' : ''}
${purposes.includes('nightlife') ? '## 밤문화: nightlife 목록에서 선택하여 저녁에 클럽이나 바 활동을 포함하세요. 다음날 오전 일정은 늦게 시작하세요.' : ''}
${purposes.includes('family') ? '## 가족 여행: 놀이동산(Ho May), 백비치, 프론트비치 등 가족이 함께 즐길 수 있는 장소를 우선 배치하세요. 아이가 있으면 이동 최소화.' : ''}
${purposes.includes('culture') ? '## 문화 탐방: 화이트 펠리스, 전쟁기념관, 붕따우 등대 등 역사/문화 명소를 우선 배치하세요.' : ''}
${purposes.includes('casino') ? `## 카지노 여행: casino 목록에서 카지노를 반드시 1곳 이상 일정에 포함하세요.
- 임페리얼 seaside 클럽, Monaco casino, Palace 카지노 모두 도깨비 협력업체입니다. 반드시 isPartner: true와 discountText를 포함하세요.
- 카지노는 저녁~밤 시간대에 배치하세요. 낮에는 관광/식사를 하고 저녁에 카지노를 방문하는 일정이 좋습니다.
- 외국인 전용(여권 필수, 21세 이상)임을 tips에 반드시 안내하세요.
- 2일 이상 여행이면 서로 다른 카지노를 방문하는 일정도 좋습니다.
- 카지노 방문 전후로 근처 밤문화(nightlife)도 함께 추천하세요.` : ''}`;

      let response;
      let retries = 0;
      const maxRetries = 3;
      while (retries <= maxRetries) {
        try {
          response = await gemini.models.generateContent({
            model: "gemini-2.5-flash-lite",
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: "application/json",
            },
            contents: userPrompt,
          });
          break;
        } catch (apiErr: any) {
          if (apiErr?.status === 429 && retries < maxRetries) {
            const retryMatch = JSON.stringify(apiErr).match(/"retryDelay":"(\d+)s"/);
            const waitSec = retryMatch ? Math.min(parseInt(retryMatch[1]), 30) : 10;
            console.log(`Gemini rate limit hit, retrying in ${waitSec}s (attempt ${retries + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, waitSec * 1000));
            retries++;
          } else {
            throw apiErr;
          }
        }
      }

      const content = response?.text;
      if (!content) {
        return res.status(500).json({ message: "AI 응답을 받지 못했습니다." });
      }

      const travelPlan = JSON.parse(content);
      res.json(travelPlan);
    } catch (err: any) {
      console.error("Travel plan error:", err);
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else if (err?.status === 429) {
        res.status(429).json({ message: "AI API 사용 한도를 초과했습니다. 잠시 후(약 1분) 다시 시도해주세요." });
      } else {
        res.status(500).json({ message: "여행 플랜 생성 중 오류가 발생했습니다." });
      }
    }
  });

  const saveTravelPlanSchema = z.object({
    title: z.string().min(1).max(500),
    purpose: z.string().min(1).max(200),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    planData: z.object({
      title: z.string().optional(),
      summary: z.string().optional(),
      days: z.array(z.any()),
      tips: z.array(z.string()).optional(),
      totalEstimatedCost: z.number().optional(),
      vehicleRecommendation: z.string().optional(),
      weatherNote: z.string().optional(),
    }),
  });

  // 여행 일정 저장
  app.post("/api/saved-travel-plans", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const parsed = saveTravelPlanSchema.parse(req.body);

      const [plan] = await db.insert(savedTravelPlans).values({
        userId,
        title: parsed.title,
        purpose: parsed.purpose,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        planData: parsed.planData,
      }).returning();

      res.json(plan);
    } catch (error: any) {
      if (error?.issues) {
        return res.status(400).json({ message: error.issues[0].message });
      }
      console.error("Error saving travel plan:", error);
      res.status(500).json({ message: "여행 일정 저장 중 오류가 발생했습니다." });
    }
  });

  // 내 저장된 여행 일정 목록
  app.get("/api/saved-travel-plans", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const plans = await db.select().from(savedTravelPlans)
        .where(eq(savedTravelPlans.userId, userId))
        .orderBy(desc(savedTravelPlans.createdAt));

      res.json(plans);
    } catch (error) {
      console.error("Error fetching saved travel plans:", error);
      res.status(500).json({ message: "저장된 일정 목록을 불러오는 중 오류가 발생했습니다." });
    }
  });

  // 저장된 여행 일정 삭제
  app.delete("/api/saved-travel-plans/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const planId = parseInt(req.params.id);
      const [deleted] = await db.delete(savedTravelPlans)
        .where(and(eq(savedTravelPlans.id, planId), eq(savedTravelPlans.userId, userId)))
        .returning();

      if (!deleted) return res.status(404).json({ message: "일정을 찾을 수 없습니다." });
      res.json({ message: "삭제되었습니다." });
    } catch (error) {
      console.error("Error deleting travel plan:", error);
      res.status(500).json({ message: "일정 삭제 중 오류가 발생했습니다." });
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
  
  // 관리자 체크 헬퍼 함수 (동기적 - 환경변수만 체크)
  const isUserAdmin = (userId: string | undefined, userEmail: string | undefined): boolean => {
    // ADMIN_USER_ID가 쉼표로 구분된 여러 ID일 수 있음
    if (userId && ADMIN_USER_ID) {
      const adminIds = ADMIN_USER_ID.split(",").map(id => id.trim());
      if (adminIds.includes(String(userId))) return true;
    }
    if (userEmail && userEmail === ADMIN_EMAIL) return true;
    return false;
  };
  
  // 관리자 체크 헬퍼 함수 (비동기 - DB의 isAdmin 필드도 체크)
  const isUserAdminWithDb = async (userId: string | undefined, userEmail: string | undefined): Promise<boolean> => {
    // 먼저 환경변수 체크
    if (isUserAdmin(userId, userEmail)) return true;
    
    // DB의 isAdmin 필드 체크
    if (userId) {
      const dbUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (dbUser.length > 0 && dbUser[0].isAdmin) return true;
    }
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

  const ogRefreshCache = new Map<number, number>();
  app.post("/api/posts/:id/refresh-og", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid post ID" });

      const now = Date.now();
      const lastRefresh = ogRefreshCache.get(id) || 0;
      if (now - lastRefresh < 60000) {
        return res.json({ success: true, cached: true });
      }
      ogRefreshCache.set(id, now);

      const postUrl = `https://vungtau.blog/board/${id}`;
      const kakaoApiKey = process.env.KAKAO_REST_API_KEY;

      if (kakaoApiKey) {
        try {
          const kakaoRes = await fetch("https://kapi.kakao.com/v2/util/url/scrape", {
            method: "POST",
            headers: {
              "Authorization": `KakaoAK ${kakaoApiKey}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `target_url=${encodeURIComponent(postUrl)}`,
          });
          const kakaoData = await kakaoRes.json();
          return res.json({ success: kakaoRes.ok, kakao: kakaoData });
        } catch (kakaoErr) {
          console.error("Kakao scrape API error:", kakaoErr);
          return res.json({ success: false, message: "Kakao API call failed" });
        }
      }

      res.json({ success: true });
    } catch (err) {
      console.error("Refresh OG cache error:", err);
      res.status(500).json({ message: "Failed to refresh OG cache" });
    }
  });

  // 게시판 - 게시글 작성 (관리자만)
  app.post("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ message: "Only admin can create posts" });
      }

      const result = insertPostSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid post data", errors: result.error.errors });
      }

      let authorName = "붕따우 도깨비";
      if (userId) {
        let [dbUser] = await db.select().from(users).where(eq(users.id, String(userId)));
        if (!dbUser) {
          const numId = String(userId).replace(/^kakao_/, "");
          if (numId !== String(userId)) {
            [dbUser] = await db.select().from(users).where(eq(users.id, numId));
          }
        }
        if (dbUser) {
          authorName = dbUser.nickname || dbUser.firstName || dbUser.email?.split("@")[0] || "붕따우 도깨비";
        }
      }

      const [newPost] = await db.insert(posts).values({
        ...result.data,
        authorId: userId,
        authorName,
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

  // 닉네임 변경 API
  app.patch("/api/user/nickname", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const sessionUserId = user?.id || (req.session as any)?.userId;
      const oauthUserId = user?.claims?.sub;
      
      const { nickname } = req.body;
      if (!nickname || typeof nickname !== "string" || nickname.trim().length < 1 || nickname.trim().length > 20) {
        return res.status(400).json({ message: "닉네임은 1~20자 사이여야 합니다." });
      }

      const trimmedNickname = nickname.trim();

      if (sessionUserId) {
        const [updated] = await db.update(users)
          .set({ nickname: trimmedNickname })
          .where(eq(users.id, sessionUserId))
          .returning();
        
        if (!updated) {
          return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
        }

        if ((req.session as any)?.user) {
          (req.session as any).user.name = trimmedNickname;
          req.session.save(() => {});
        }

        await db.execute(sql`UPDATE posts SET author_name = ${trimmedNickname} WHERE author_id = ${String(sessionUserId)}`);
        await db.execute(sql`UPDATE comments SET author_name = ${trimmedNickname} WHERE author_id = ${String(sessionUserId)}`);

        res.json({ success: true, nickname: trimmedNickname });
      } else if (oauthUserId) {
        const [dbUser] = await db.select().from(users).where(eq(users.id, oauthUserId));
        if (dbUser) {
          await db.update(users)
            .set({ nickname: trimmedNickname })
            .where(eq(users.id, dbUser.id));
        }
          
        await db.execute(sql`UPDATE posts SET author_name = ${trimmedNickname} WHERE author_id = ${oauthUserId}`);
        await db.execute(sql`UPDATE comments SET author_name = ${trimmedNickname} WHERE author_id = ${oauthUserId}`);

        res.json({ success: true, nickname: trimmedNickname });
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
    } catch (err) {
      console.error("Update nickname error:", err);
      res.status(500).json({ message: "닉네임 변경에 실패했습니다." });
    }
  });

  // 프로필 이름 변경 시 게시글/댓글 작성자 이름 동기화 (로그인 시 자동 호출)
  app.post("/api/sync-author-name", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      let [dbUser] = await db.select().from(users).where(eq(users.id, String(userId)));
      if (!dbUser) {
        const numId = String(userId).replace(/^kakao_/, "");
        if (numId !== String(userId)) {
          [dbUser] = await db.select().from(users).where(eq(users.id, numId));
        }
      }
      if (!dbUser || !dbUser.nickname) {
        return res.json({ success: true, newName: null });
      }

      const newName = dbUser.nickname;
      const userIdStr = String(userId);
      await db.execute(sql`UPDATE posts SET author_name = ${newName} WHERE author_id = ${userIdStr}`);
      await db.execute(sql`UPDATE comments SET author_name = ${newName} WHERE author_id = ${userIdStr}`);
      
      const numericId = userIdStr.replace(/^kakao_/, "");
      if (numericId !== userIdStr) {
        await db.execute(sql`UPDATE posts SET author_name = ${newName} WHERE author_id = ${numericId}`);
        await db.execute(sql`UPDATE comments SET author_name = ${newName} WHERE author_id = ${numericId}`);
      }

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
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!isUserAdmin(userId, userEmail)) {
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
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!isUserAdmin(userId, userEmail)) {
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
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!isUserAdmin(userId, userEmail)) {
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
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!isUserAdmin(userId, userEmail)) {
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
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!isUserAdmin(userId, userEmail)) {
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
  app.get("/api/admin/check", async (req: any, res) => {
    // OAuth 사용자 (Kakao, Google)
    const oauthUser = req.user as any;
    let userId = oauthUser?.claims?.sub;
    let userEmail = oauthUser?.claims?.email || oauthUser?.email;
    let dbIsAdmin = false;
    
    // 세션 기반 이메일 로그인 사용자
    if (!userId && req.session?.userId) {
      const dbUser = await db.select().from(users).where(eq(users.id, req.session.userId));
      if (dbUser.length > 0) {
        userId = dbUser[0].id;
        userEmail = dbUser[0].email;
        dbIsAdmin = dbUser[0].isAdmin ?? false;
      }
    } else if (userId) {
      // OAuth 사용자도 DB에서 is_admin 확인
      const dbUser = await db.select().from(users).where(eq(users.id, String(userId)));
      if (dbUser.length > 0) {
        dbIsAdmin = dbUser[0].isAdmin ?? false;
      }
    }
    
    // 환경 변수 기반 관리자 체크 (폴백) 또는 DB 기반 관리자 체크
    const envAdmin = isUserAdmin(userId, userEmail);
    const isAdmin = envAdmin || dbIsAdmin;
    const isLoggedIn = !!(oauthUser || req.session?.userId);
    
    // 관리자 ID 목록 (쉼표로 구분된 ID들을 배열로 분리)
    const adminUserIds: string[] = ADMIN_USER_ID ? ADMIN_USER_ID.split(",").map(id => id.trim()) : [];
    
    console.log("Admin check - userId:", userId, "userEmail:", userEmail, "envAdmin:", envAdmin, "dbIsAdmin:", dbIsAdmin, "isAdmin:", isAdmin);
    res.json({ isAdmin, isLoggedIn, userId, adminUserIds });
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
  
  // 구글맵 단축 URL에서 좌표 추출
  app.post("/api/resolve-google-maps-url", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL is required" });
      }

      // 단축 URL인 경우 리다이렉트 따라가기
      let finalUrl = url;
      if (url.includes("maps.app.goo.gl") || url.includes("goo.gl/maps")) {
        try {
          const response = await fetch(url, {
            method: "HEAD",
            redirect: "follow",
          });
          finalUrl = response.url;
          console.log("Resolved URL:", finalUrl);
        } catch (e) {
          console.error("Failed to resolve short URL:", e);
        }
      }

      // URL에서 좌표 추출
      const patterns = [
        /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,           // @10.3543,107.0842
        /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,      // ?q=10.3543,107.0842
        /\/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/,   // /place/10.3543,107.0842
        /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,     // ?ll=10.3543,107.0842
        /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/,       // !3d10.3543!4d107.0842
      ];

      for (const pattern of patterns) {
        const match = finalUrl.match(pattern);
        if (match) {
          return res.json({
            success: true,
            latitude: match[1],
            longitude: match[2],
            resolvedUrl: finalUrl,
          });
        }
      }

      // 장소 이름으로 Nominatim (OpenStreetMap) Geocoding 시도
      const placeNameMatch = finalUrl.match(/\/place\/([^\/]+)/);
      if (placeNameMatch) {
        const placeName = decodeURIComponent(placeNameMatch[1]).replace(/\+/g, ' ');
        console.log("Geocoding place name:", placeName);
        try {
          const geocodeResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}`,
            {
              headers: {
                'User-Agent': 'VungtauDokkaebi/1.0'
              }
            }
          );
          const geocodeData = await geocodeResponse.json();
          console.log("Nominatim response:", geocodeData.length, "results");
          if (geocodeData && geocodeData.length > 0) {
            return res.json({
              success: true,
              latitude: geocodeData[0].lat,
              longitude: geocodeData[0].lon,
              resolvedUrl: finalUrl,
            });
          }
        } catch (e) {
          console.error("Failed to geocode place name:", e);
        }
      }

      return res.json({
        success: false,
        error: "Could not extract coordinates from URL",
        resolvedUrl: finalUrl,
      });
    } catch (error) {
      console.error("Error resolving Google Maps URL:", error);
      return res.status(500).json({ error: "Failed to resolve URL" });
    }
  });
  
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
          
          // 쿼리 파라미터 제거 (크기 제한 해제로 원본 화질)
          if (src.includes("?type=")) {
            fullSrc = src.split("?type=")[0];
          }
          if (src.includes("?w=")) {
            fullSrc = src.split("?w=")[0];
          }
          
          // 썸네일 도메인을 원본 이미지 도메인으로 변환 (고화질)
          fullSrc = fullSrc.replace("mblogthumb-phinf.pstatic.net", "blogfiles.pstatic.net");
          fullSrc = fullSrc.replace("postfiles.pstatic.net", "blogfiles.pstatic.net");
          
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
              
              // 쿼리 파라미터 제거 (크기 제한 해제로 원본 화질)
              if (src.includes("?type=")) {
                fullSrc = src.split("?type=")[0];
              }
              if (src.includes("?w=")) {
                fullSrc = src.split("?w=")[0];
              }
              
              // 썸네일 도메인을 원본 이미지 도메인으로 변환 (고화질)
              fullSrc = fullSrc.replace("mblogthumb-phinf.pstatic.net", "postfiles.pstatic.net");
              
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

  // 네이버 이미지 프록시 (미리보기용)
  app.get("/api/naver-image-proxy", async (req, res) => {
    try {
      let imageUrl = req.query.url as string;
      if (!imageUrl) {
        return res.status(400).json({ error: "URL required" });
      }

      // 원본 고화질 이미지 URL로 변환
      // 썸네일 도메인을 원본 도메인으로 변환 (blogfiles = 고화질 원본)
      imageUrl = imageUrl.replace("mblogthumb-phinf.pstatic.net", "blogfiles.pstatic.net");
      imageUrl = imageUrl.replace("postfiles.pstatic.net", "blogfiles.pstatic.net");
      
      // 모든 크기 제한 파라미터 제거
      imageUrl = imageUrl.split("?")[0];

      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Referer": "https://blog.naver.com/",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch image" });
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=3600");
      
      const buffer = Buffer.from(await response.arrayBuffer());
      res.send(buffer);
    } catch (error) {
      console.error("Naver image proxy error:", error);
      res.status(500).json({ error: "Failed to proxy image" });
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
      
      for (let imageUrl of imageUrls) {
        try {
          // 모든 도메인을 blogfiles로 변환 (고화질 원본 이미지)
          imageUrl = imageUrl.replace("mblogthumb-phinf.pstatic.net", "blogfiles.pstatic.net");
          imageUrl = imageUrl.replace("postfiles.pstatic.net", "blogfiles.pstatic.net");
          
          // 쿼리 파라미터 제거 (크기 제한 해제)
          imageUrl = imageUrl.split("?")[0];
          
          console.log("Downloading:", imageUrl);
          
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

          // 앱 내부 경로로 URL 생성 (GCS 직접 접근은 403 에러 발생)
          const publicUrl = `/api/public-images/${fileName}`;
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

  // 직접 파일 업로드 (base64)
  app.post("/api/upload-image", async (req, res) => {
    try {
      const { base64Data, fileName, contentType } = req.body;
      
      if (!base64Data || !fileName) {
        return res.status(400).json({ error: "base64Data and fileName are required" });
      }

      const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
      if (!bucketId) {
        return res.status(500).json({ error: "Object storage not configured" });
      }

      // base64 데이터에서 prefix 제거 (data:image/jpeg;base64, 등)
      const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Content, "base64");
      
      // 파일명 생성
      const ext = contentType?.includes("png") ? "png" : contentType?.includes("gif") ? "gif" : "jpg";
      const uniqueFileName = `place_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      
      // Object Storage에 업로드
      const bucket = objectStorageClient.bucket(bucketId);
      const file = bucket.file(`public/${uniqueFileName}`);
      
      await file.save(buffer, {
        contentType: contentType || "image/jpeg",
        metadata: {
          cacheControl: "public, max-age=31536000",
        },
      });

      const publicUrl = `/api/public-images/${uniqueFileName}`;
      console.log("Direct upload success:", publicUrl);
      
      res.json({ url: publicUrl, success: true });
    } catch (error) {
      console.error("Direct upload error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  });

  // Public 이미지 서빙 (Object Storage에서)
  app.get("/api/public-images/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
      
      if (!bucketId) {
        return res.status(500).json({ error: "Object storage not configured" });
      }

      const bucket = objectStorageClient.bucket(bucketId);
      const file = bucket.file(`public/${filename}`);
      
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ error: "Image not found" });
      }

      const [metadata] = await file.getMetadata();
      res.setHeader("Content-Type", metadata.contentType || "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=31536000");
      
      file.createReadStream().pipe(res);
    } catch (error) {
      console.error("Serve public image error:", error);
      res.status(500).json({ error: "Failed to serve image" });
    }
  });

  // ============ 사이트 설정 API ============
  
  // 모든 설정 조회
  app.get("/api/site-settings", async (req, res) => {
    try {
      const settings = await db.select().from(siteSettings);
      const settingsMap: Record<string, string> = {};
      settings.forEach(s => {
        settingsMap[s.key] = s.value;
      });
      res.json(settingsMap);
    } catch (error) {
      console.error("Get site settings error:", error);
      res.status(500).json({ error: "Failed to get site settings" });
    }
  });

  // 설정 업데이트 (관리자 전용)
  app.put("/api/admin/site-settings", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!userId || !isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const { key, value } = req.body;
      if (!key || value === undefined) {
        return res.status(400).json({ error: "key와 value가 필요합니다" });
      }

      // upsert - 있으면 업데이트, 없으면 생성
      const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
      
      if (existing.length > 0) {
        await db.update(siteSettings)
          .set({ value, updatedAt: new Date() })
          .where(eq(siteSettings.key, key));
      } else {
        await db.insert(siteSettings).values({ key, value });
      }
      
      res.json({ success: true, key, value });
    } catch (error) {
      console.error("Update site setting error:", error);
      res.status(500).json({ error: "Failed to update site setting" });
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
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!userId || !isUserAdmin(userId, userEmail)) {
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
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!userId || !isUserAdmin(userId, userEmail)) {
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
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!userId || !isUserAdmin(userId, userEmail)) {
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

  // 빌라 순서 변경 (관리자만)
  app.put("/api/admin/villas/:id/order", async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!userId || !isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      const { sortOrder } = req.body;
      
      if (typeof sortOrder !== "number") {
        return res.status(400).json({ error: "sortOrder is required" });
      }
      
      const updatedVilla = await db.update(villas)
        .set({ sortOrder, updatedAt: new Date() })
        .where(eq(villas.id, id))
        .returning();
      
      res.json(updatedVilla[0]);
    } catch (error) {
      console.error("Update villa order error:", error);
      res.status(500).json({ error: "Failed to update villa order" });
    }
  });

  // === 견적 커스텀 카테고리 API ===
  
  // 공개 - 활성 카테고리 목록
  app.get("/api/quote-categories", async (req, res) => {
    try {
      const categories = await db.select().from(quoteCategories)
        .where(eq(quoteCategories.isActive, true))
        .orderBy(quoteCategories.sortOrder);
      res.json(categories);
    } catch (error) {
      console.error("Get quote categories error:", error);
      res.status(500).json({ error: "Failed to get categories" });
    }
  });

  // 관리자 - 전체 카테고리 목록
  app.get("/api/admin/quote-categories", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!userId || !isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const categories = await db.select().from(quoteCategories).orderBy(quoteCategories.sortOrder);
      res.json(categories);
    } catch (error) {
      console.error("Get admin quote categories error:", error);
      res.status(500).json({ error: "Failed to get categories" });
    }
  });

  // 관리자 - 카테고리 추가
  app.post("/api/admin/quote-categories", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!userId || !isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { name, description, imageUrl, images, pricePerUnit, unitLabel, options, isActive, sortOrder } = req.body;
      if (!name) {
        return res.status(400).json({ error: "카테고리 이름이 필요합니다" });
      }
      const imagesList = Array.isArray(images) ? images.filter(Boolean) : [];
      const optionsStr = typeof options === "string" ? options : JSON.stringify(options || []);
      const [newCategory] = await db.insert(quoteCategories).values({
        name,
        description: description || "",
        imageUrl: imageUrl || (imagesList[0] || ""),
        images: imagesList,
        pricePerUnit: Number(pricePerUnit) || 0,
        unitLabel: unitLabel || "인",
        options: optionsStr,
        isActive: isActive !== false,
        sortOrder: Number(sortOrder) || 0,
      }).returning();
      res.json(newCategory);
    } catch (error) {
      console.error("Create quote category error:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  // 관리자 - 카테고리 수정
  app.put("/api/admin/quote-categories/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!userId || !isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      const { name, description, imageUrl, images, pricePerUnit, unitLabel, options, isActive, sortOrder } = req.body;
      const updateData: any = {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(pricePerUnit !== undefined && { pricePerUnit: Number(pricePerUnit) }),
        ...(unitLabel !== undefined && { unitLabel }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
        updatedAt: new Date(),
      };
      if (images !== undefined) {
        const imagesList = Array.isArray(images) ? images.filter(Boolean) : [];
        updateData.images = imagesList;
        updateData.imageUrl = imageUrl || (imagesList[0] || "");
      } else if (imageUrl !== undefined) {
        updateData.imageUrl = imageUrl;
      }
      if (options !== undefined) {
        updateData.options = typeof options === "string" ? options : JSON.stringify(options || []);
      }
      const [updated] = await db.update(quoteCategories)
        .set(updateData)
        .where(eq(quoteCategories.id, id))
        .returning();
      if (!updated) {
        return res.status(404).json({ error: "카테고리를 찾을 수 없습니다" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update quote category error:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  // 관리자 - 카테고리 삭제
  app.delete("/api/admin/quote-categories/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!userId || !isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      await db.delete(quoteCategories).where(eq(quoteCategories.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete quote category error:", error);
      res.status(500).json({ error: "Failed to delete category" });
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

  // === 관광 명소/맛집 API ===
  
  // 모든 장소 조회 (활성화된 것만)
  app.get("/api/places", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      let query = db.select().from(places).where(eq(places.isActive, true));
      
      if (category && category !== "all") {
        const allPlaces = await db.select()
          .from(places)
          .where(and(eq(places.isActive, true), eq(places.category, category)))
          .orderBy(places.sortOrder);
        return res.json(allPlaces);
      }
      
      const allPlaces = await db.select()
        .from(places)
        .where(eq(places.isActive, true))
        .orderBy(places.sortOrder);
      res.json(allPlaces);
    } catch (error) {
      console.error("Get places error:", error);
      res.status(500).json({ error: "Failed to get places" });
    }
  });
  
  // ========== 카테고리 관리 API ==========
  
  // 모든 카테고리 조회 (공개)
  app.get("/api/place-categories", async (req, res) => {
    try {
      const categories = await db.select()
        .from(placeCategories)
        .where(eq(placeCategories.isActive, true))
        .orderBy(placeCategories.sortOrder);
      res.json(categories);
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({ error: "Failed to get categories" });
    }
  });
  
  // 모든 카테고리 조회 (관리자용 - 비활성화 포함)
  app.get("/api/admin/place-categories", async (req: any, res) => {
    try {
      const oauthUser = req.user as any;
      let userId = oauthUser?.claims?.sub;
      let userEmail = oauthUser?.claims?.email || oauthUser?.email;
      
      // 세션 기반 이메일 로그인 사용자
      if (!userId && req.session?.userId) {
        const dbUser = await db.select().from(users).where(eq(users.id, req.session.userId));
        if (dbUser.length > 0) {
          userId = dbUser[0].id;
          userEmail = dbUser[0].email;
        }
      }
      
      if (!isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const categories = await db.select()
        .from(placeCategories)
        .orderBy(placeCategories.sortOrder);
      res.json(categories);
    } catch (error) {
      console.error("Get admin categories error:", error);
      res.status(500).json({ error: "Failed to get categories" });
    }
  });
  
  // 카테고리 추가 (관리자만)
  app.post("/api/admin/place-categories", async (req: any, res) => {
    try {
      const oauthUser = req.user as any;
      let userId = oauthUser?.claims?.sub;
      let userEmail = oauthUser?.claims?.email || oauthUser?.email;
      
      // 세션 기반 이메일 로그인 사용자
      if (!userId && req.session?.userId) {
        const dbUser = await db.select().from(users).where(eq(users.id, req.session.userId));
        if (dbUser.length > 0) {
          userId = dbUser[0].id;
          userEmail = dbUser[0].email;
        }
      }
      
      if (!await isUserAdminWithDb(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const data = insertPlaceCategorySchema.parse(req.body);
      
      // 중복 ID 체크
      const existing = await db.select().from(placeCategories).where(eq(placeCategories.id, data.id)).limit(1);
      if (existing.length > 0) {
        return res.status(400).json({ error: "Category ID already exists" });
      }
      
      // 가장 높은 sortOrder 찾기
      const maxOrder = await db.select({ max: sql<number>`COALESCE(MAX(sort_order), 0)` }).from(placeCategories);
      const newSortOrder = (maxOrder[0]?.max || 0) + 1;
      
      const [category] = await db.insert(placeCategories).values({
        ...data,
        sortOrder: data.sortOrder ?? newSortOrder,
      }).returning();
      res.json(category);
    } catch (error) {
      console.error("Create category error:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });
  
  // 카테고리 수정 (관리자만)
  app.patch("/api/admin/place-categories/:id", async (req: any, res) => {
    try {
      const oauthUser = req.user as any;
      let userId = oauthUser?.claims?.sub;
      let userEmail = oauthUser?.claims?.email || oauthUser?.email;
      
      // 세션 기반 이메일 로그인 사용자
      if (!userId && req.session?.userId) {
        const dbUser = await db.select().from(users).where(eq(users.id, req.session.userId));
        if (dbUser.length > 0) {
          userId = dbUser[0].id;
          userEmail = dbUser[0].email;
        }
      }
      
      if (!await isUserAdminWithDb(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const categoryId = req.params.id;
      const updates = req.body;
      
      const [updated] = await db.update(placeCategories)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(placeCategories.id, categoryId))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Update category error:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });
  
  // 카테고리 삭제 (관리자만)
  app.delete("/api/admin/place-categories/:id", async (req: any, res) => {
    try {
      const oauthUser = req.user as any;
      let userId = oauthUser?.claims?.sub;
      let userEmail = oauthUser?.claims?.email || oauthUser?.email;
      
      // 세션 기반 이메일 로그인 사용자
      if (!userId && req.session?.userId) {
        const dbUser = await db.select().from(users).where(eq(users.id, req.session.userId));
        if (dbUser.length > 0) {
          userId = dbUser[0].id;
          userEmail = dbUser[0].email;
        }
      }
      
      if (!await isUserAdminWithDb(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const categoryId = req.params.id;
      
      // 해당 카테고리에 속한 장소가 있는지 확인
      const placesInCategory = await db.select().from(places).where(eq(places.category, categoryId)).limit(1);
      if (placesInCategory.length > 0) {
        return res.status(400).json({ error: "Cannot delete category with places. Move or delete places first." });
      }
      
      await db.delete(placeCategories).where(eq(placeCategories.id, categoryId));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });
  
  // 카테고리 순서 일괄 업데이트 (관리자만)
  app.post("/api/admin/place-categories/reorder", async (req: any, res) => {
    try {
      const oauthUser = req.user as any;
      let userId = oauthUser?.claims?.sub;
      let userEmail = oauthUser?.claims?.email || oauthUser?.email;
      
      // 세션 기반 이메일 로그인 사용자
      if (!userId && req.session?.userId) {
        const dbUser = await db.select().from(users).where(eq(users.id, req.session.userId));
        if (dbUser.length > 0) {
          userId = dbUser[0].id;
          userEmail = dbUser[0].email;
        }
      }
      
      if (!await isUserAdminWithDb(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { categoryIds } = req.body as { categoryIds: string[] };
      
      // 각 카테고리의 sortOrder 업데이트
      for (let i = 0; i < categoryIds.length; i++) {
        await db.update(placeCategories)
          .set({ sortOrder: i, updatedAt: new Date() })
          .where(eq(placeCategories.id, categoryIds[i]));
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Reorder categories error:", error);
      res.status(500).json({ error: "Failed to reorder categories" });
    }
  });
  
  // 기본 카테고리 초기화 (관리자만 - 첫 실행 시)
  app.post("/api/admin/place-categories/init", async (req: any, res) => {
    try {
      const oauthUser = req.user as any;
      let userId = oauthUser?.claims?.sub;
      let userEmail = oauthUser?.claims?.email || oauthUser?.email;
      
      // 세션 기반 이메일 로그인 사용자
      if (!userId && req.session?.userId) {
        const dbUser = await db.select().from(users).where(eq(users.id, req.session.userId));
        if (dbUser.length > 0) {
          userId = dbUser[0].id;
          userEmail = dbUser[0].email;
        }
      }
      
      if (!await isUserAdminWithDb(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      // 이미 카테고리가 있으면 무시
      const existing = await db.select().from(placeCategories).limit(1);
      if (existing.length > 0) {
        return res.json({ message: "Categories already initialized", count: existing.length });
      }
      
      // 기본 카테고리 추가
      const defaultCategories = [
        { id: "attraction", labelKo: "관광명소", labelEn: "Attractions", labelZh: "景点", labelVi: "Địa điểm du lịch", labelRu: "Достопримечательности", labelJa: "観光スポット", color: "#3b82f6", gradient: "from-blue-500 to-blue-700", icon: "Camera", sortOrder: 0 },
        { id: "services", labelKo: "마사지/이발소", labelEn: "Massage & Barber", labelZh: "按摩/理发", labelVi: "Massage/Cắt tóc", labelRu: "Массаж/Парикмахерская", labelJa: "マッサージ/理髪店", color: "#0ea5e9", gradient: "from-cyan-500 to-cyan-700", icon: "Scissors", sortOrder: 1 },
        { id: "local_food", labelKo: "현지 음식점", labelEn: "Local Restaurants", labelZh: "当地餐厅", labelVi: "Nhà hàng địa phương", labelRu: "Местные рестораны", labelJa: "ローカルレストラン", color: "#ef4444", gradient: "from-red-500 to-red-700", icon: "Utensils", sortOrder: 2 },
        { id: "korean_food", labelKo: "한식", labelEn: "Korean Food", labelZh: "韩国料理", labelVi: "Món Hàn Quốc", labelRu: "Корейская еда", labelJa: "韓国料理", color: "#f97316", gradient: "from-orange-500 to-orange-700", icon: "Utensils", sortOrder: 3 },
        { id: "buffet", labelKo: "뷔페", labelEn: "Buffet", labelZh: "自助餐", labelVi: "Buffet", labelRu: "Буфет", labelJa: "ビュッフェ", color: "#eab308", gradient: "from-yellow-500 to-yellow-700", icon: "Utensils", sortOrder: 4 },
        { id: "chinese_food", labelKo: "중식", labelEn: "Chinese Food", labelZh: "中餐", labelVi: "Món Trung Quốc", labelRu: "Китайская еда", labelJa: "中華料理", color: "#22c55e", gradient: "from-green-500 to-green-700", icon: "Utensils", sortOrder: 5 },
        { id: "cafe", labelKo: "커피숍", labelEn: "Coffee Shops", labelZh: "咖啡店", labelVi: "Quán cà phê", labelRu: "Кофейни", labelJa: "カフェ", color: "#6366f1", gradient: "from-indigo-500 to-indigo-700", icon: "Coffee", sortOrder: 6 },
        { id: "exchange", labelKo: "환전소", labelEn: "Currency Exchange", labelZh: "货币兑换", labelVi: "Đổi tiền", labelRu: "Обмен валюты", labelJa: "両替所", color: "#64748b", gradient: "from-gray-500 to-gray-700", icon: "DollarSign", sortOrder: 7 },
        { id: "nightlife", labelKo: "밤문화", labelEn: "Nightlife", labelZh: "夜生活", labelVi: "Cuộc sống về đêm", labelRu: "Ночная жизнь", labelJa: "ナイトライフ", color: "#ec4899", gradient: "from-pink-600 to-purple-700", icon: "Music", sortOrder: 8 },
        { id: "nightlife18", labelKo: "밤문화 18+", labelEn: "Nightlife 18+", labelZh: "夜生活 18+", labelVi: "Cuộc sống về đêm 18+", labelRu: "Ночная жизнь 18+", labelJa: "ナイトライフ 18+", color: "#dc2626", gradient: "from-red-600 to-pink-700", icon: "Music", sortOrder: 9, isAdultOnly: true },
      ];
      
      await db.insert(placeCategories).values(defaultCategories);
      res.json({ success: true, count: defaultCategories.length });
    } catch (error) {
      console.error("Init categories error:", error);
      res.status(500).json({ error: "Failed to initialize categories" });
    }
  });
  
  // ========== 장소 관리 API ==========
  
  // 모든 장소 조회 (관리자용 - 비활성화 포함)
  app.get("/api/admin/places", async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user?.claims?.sub;
      const userEmail = user?.claims?.email || user?.email;
      if (!user || !isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const allPlaces = await db.select()
        .from(places)
        .orderBy(places.sortOrder);
      res.json(allPlaces);
    } catch (error) {
      console.error("Get admin places error:", error);
      res.status(500).json({ error: "Failed to get places" });
    }
  });
  
  // 장소 상세 조회
  app.get("/api/places/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const place = await db.select().from(places).where(eq(places.id, id));
      if (place.length === 0) {
        return res.status(404).json({ error: "Place not found" });
      }
      res.json(place[0]);
    } catch (error) {
      console.error("Get place error:", error);
      res.status(500).json({ error: "Failed to get place" });
    }
  });
  
  // 장소 추가 (관리자만) - 중복 체크 포함
  app.post("/api/admin/places", async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user?.claims?.sub;
      const userEmail = user?.claims?.email || user?.email;
      if (!user || !isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const data = insertPlaceSchema.parse(req.body);
      
      // 같은 이름 또는 같은 website(mapUrl)가 있는지 중복 체크
      const existingByName = await db.select().from(places).where(eq(places.name, data.name)).limit(1);
      if (existingByName.length > 0) {
        return res.status(409).json({ error: "이미 같은 이름의 장소가 있습니다", existingPlace: existingByName[0] });
      }
      
      if (data.website) {
        const existingByWebsite = await db.select().from(places).where(eq(places.website, data.website)).limit(1);
        if (existingByWebsite.length > 0) {
          return res.status(409).json({ error: "이미 같은 지도 URL의 장소가 있습니다", existingPlace: existingByWebsite[0] });
        }
      }
      
      const newPlace = await db.insert(places).values(data).returning();
      res.json(newPlace[0]);
    } catch (error) {
      console.error("Create place error:", error);
      res.status(500).json({ error: "Failed to create place" });
    }
  });
  
  // 기존 하드코딩된 장소 데이터 가져오기 (관리자만)
  app.post("/api/admin/places/import-default", async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user?.claims?.sub;
      const userEmail = user?.claims?.email || user?.email;
      if (!user || !isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      // 이미 데이터가 있는지 확인
      const existing = await db.select().from(places).limit(1);
      if (existing.length > 0) {
        return res.status(400).json({ error: "이미 장소 데이터가 있습니다. 개별적으로 추가해주세요." });
      }
      
      // 기본 장소 데이터 (PlacesGuide.tsx의 하드코딩 데이터)
      const defaultPlaces = [
        // 관광명소
        { name: "예수상 (Christ of Vung Tau)", category: "attraction", description: "붕따우 랜드마크, 32m 높이 예수상", address: "Vũng Tàu, Vietnam", latitude: "10.3279", longitude: "107.0872", isActive: true, sortOrder: 1 },
        { name: "등대 (Lighthouse)", category: "attraction", description: "붕따우 전경을 감상할 수 있는 등대", address: "Vũng Tàu Lighthouse", latitude: "10.3358", longitude: "107.0775", isActive: true, sortOrder: 2 },
        { name: "호찌민 박물관", category: "attraction", description: "백악관 스타일 역사 박물관", address: "White Palace, Vũng Tàu", latitude: "10.3491", longitude: "107.0697", isActive: true, sortOrder: 3 },
        { name: "호메이파크", category: "attraction", description: "가족 놀이공원", address: "Ho May Park, Vũng Tàu", latitude: "10.3650", longitude: "107.0850", isActive: true, sortOrder: 4 },
        { name: "바이다우 (Back Beach)", category: "attraction", description: "붕따우 메인 해변", address: "Bãi Sau, Vũng Tàu", latitude: "10.3305", longitude: "107.0821", isActive: true, sortOrder: 5 },
        { name: "바이쯔억 (Front Beach)", category: "attraction", description: "붕따우 프론트 비치", address: "Bãi Trước, Vũng Tàu", latitude: "10.3419", longitude: "107.0737", isActive: true, sortOrder: 6 },
        { name: "돼지언덕 (Doi Con Heo)", category: "attraction", description: "일출/일몰 명소", address: "Pig Hill, Vũng Tàu", latitude: "10.3380", longitude: "107.0650", isActive: true, sortOrder: 7 },
        // 맛집
        { name: "가인하오 (Ganh Hao)", category: "restaurant", description: "로컬 해산물 맛집", address: "Ganh Hao, Vũng Tàu", isActive: true, sortOrder: 1 },
        { name: "코바 (Coba)", category: "restaurant", description: "한국인 맛집", address: "Coba Restaurant, Vũng Tàu", isActive: true, sortOrder: 2 },
        { name: "꼬티 (Co Thy)", category: "restaurant", description: "현지인 추천 맛집", address: "Co Thy, Vũng Tàu", isActive: true, sortOrder: 3 },
        { name: "Texas BBQ", category: "restaurant", description: "고기 전문점", address: "Texas BBQ, Vũng Tàu", isActive: true, sortOrder: 4 },
        { name: "판다 BBQ", category: "restaurant", description: "BBQ 레스토랑", address: "Panda BBQ, Vũng Tàu", isActive: true, sortOrder: 5 },
        // 카페
        { name: "미아모어 (Mi Amore)", category: "cafe", description: "분위기 좋은 카페", address: "Mi Amore Cafe, Vũng Tàu", isActive: true, sortOrder: 1 },
        { name: "씨앤선 (Sea & Sun)", category: "cafe", description: "바다뷰 카페", address: "Sea Sun Coffee, Vũng Tàu", isActive: true, sortOrder: 2 },
        { name: "텐 커피", category: "cafe", description: "로컬 인기 카페", address: "Ten Coffee, Vũng Tàu", isActive: true, sortOrder: 3 },
      ];
      
      const inserted = await db.insert(places).values(defaultPlaces).returning();
      res.json({ success: true, count: inserted.length, places: inserted });
    } catch (error) {
      console.error("Import default places error:", error);
      res.status(500).json({ error: "Failed to import places" });
    }
  });
  
  // 장소 수정 (관리자만)
  app.put("/api/admin/places/:id", async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user?.claims?.sub;
      const userEmail = user?.claims?.email || user?.email;
      if (!user || !isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      console.log("Place update request - mainImage:", req.body.mainImage, "images:", JSON.stringify(req.body.images));
      const data = insertPlaceSchema.partial().parse(req.body);
      const updatedPlace = await db.update(places)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(places.id, id))
        .returning();
      if (updatedPlace.length === 0) {
        return res.status(404).json({ error: "Place not found" });
      }
      res.json(updatedPlace[0]);
    } catch (error) {
      console.error("Update place error:", error);
      res.status(500).json({ error: "Failed to update place" });
    }
  });
  
  // 장소 순서 변경 (관리자만) - 같은 카테고리 내 순서 재계산
  app.put("/api/admin/places/:id/order", async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user?.claims?.sub;
      const userEmail = user?.claims?.email || user?.email;
      if (!user || !isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      const { newIndex } = req.body;
      
      if (typeof newIndex !== "number") {
        return res.status(400).json({ error: "newIndex is required" });
      }
      
      // 해당 장소 조회
      const [targetPlace] = await db.select().from(places).where(eq(places.id, id));
      if (!targetPlace) {
        return res.status(404).json({ error: "Place not found" });
      }
      
      // 같은 카테고리의 모든 장소를 현재 순서로 정렬
      const categoryPlaces = await db.select().from(places)
        .where(eq(places.category, targetPlace.category))
        .orderBy(places.sortOrder, places.id);
      
      // 현재 위치 찾기
      const oldIndex = categoryPlaces.findIndex(p => p.id === id);
      if (oldIndex === -1) {
        return res.status(404).json({ error: "Place not found in category" });
      }
      
      // 배열에서 항목 제거 후 새 위치에 삽입
      const [movedPlace] = categoryPlaces.splice(oldIndex, 1);
      const insertIndex = Math.max(0, Math.min(newIndex, categoryPlaces.length));
      categoryPlaces.splice(insertIndex, 0, movedPlace);
      
      // 모든 항목의 순서를 10 간격으로 재설정
      for (let i = 0; i < categoryPlaces.length; i++) {
        await db.update(places)
          .set({ sortOrder: (i + 1) * 10, updatedAt: new Date() })
          .where(eq(places.id, categoryPlaces[i].id));
      }
      
      // 업데이트된 장소 반환
      const [updatedPlace] = await db.select().from(places).where(eq(places.id, id));
      res.json(updatedPlace);
    } catch (error) {
      console.error("Update place order error:", error);
      res.status(500).json({ error: "Failed to update place order" });
    }
  });
  
  // 장소 삭제 (관리자만)
  app.delete("/api/admin/places/:id", async (req, res) => {
    try {
      const user = (req as any).user;
      const userId = user?.claims?.sub;
      const userEmail = user?.claims?.email || user?.email;
      if (!user || !isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const id = parseInt(req.params.id);
      await db.delete(places).where(eq(places.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete place error:", error);
      res.status(500).json({ error: "Failed to delete place" });
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

  // === 회원 관리, 쪽지, 쿠폰, 공지사항 API ===

  // 전체 회원 목록 조회 (관리자용)
  app.get("/api/admin/members", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      res.json(allUsers);
    } catch (err) {
      console.error("회원 목록 조회 오류:", err);
      res.status(500).json({ error: "회원 목록 조회 실패" });
    }
  });

  // === 쪽지 API ===
  // 쪽지 발송 (관리자 → 사용자)
  app.post("/api/admin/messages", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const adminEmails = ["soulcounter486@gmail.com", "vungtau1004@daum.net"];
      const adminUserIds = ["42663365", "kakao_4725775455", "google:108455658112888249075"]; // 관리자 userId도 허용
      const userEmail = user?.claims?.email;
      const userId = user?.claims?.sub;
      
      const isAdmin = (userEmail && adminEmails.includes(userEmail)) || 
                      (userId && adminUserIds.includes(userId));
      if (!isAdmin) {
        console.log("Admin message denied - email:", userEmail, "userId:", userId);
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const parsed = insertAdminMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "잘못된 요청", details: parsed.error });
      }

      const [message] = await db.insert(adminMessages).values({
        ...parsed.data,
        senderId: user?.claims?.sub || userEmail,
      }).returning();

      // 푸시 알림 전송
      await sendPushNotification(
        parsed.data.receiverId,
        "📬 새 쪽지가 도착했습니다",
        parsed.data.title,
        "/my-coupons?tab=messages"
      );

      res.json(message);
    } catch (err) {
      console.error("쪽지 발송 오류:", err);
      res.status(500).json({ error: "쪽지 발송 실패" });
    }
  });

  // 전체 회원에게 쪽지 발송 (관리자)
  app.post("/api/admin/messages/broadcast", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const adminEmails = ["soulcounter486@gmail.com", "vungtau1004@daum.net"];
      const adminUserIds = ["42663365", "kakao_4725775455", "google:108455658112888249075"];
      const userEmail = user?.claims?.email;
      const userId = user?.claims?.sub;
      
      const isAdmin = (userEmail && adminEmails.includes(userEmail)) || 
                      (userId && adminUserIds.includes(userId));
      if (!isAdmin) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: "제목과 내용이 필요합니다" });
      }

      const allUsers = await db.select().from(users);
      const senderId = user?.claims?.sub || userEmail;
      
      let sentCount = 0;
      for (const targetUser of allUsers) {
        await db.insert(adminMessages).values({
          receiverId: targetUser.id,
          senderId,
          title,
          content,
        });
        
        // 푸시 알림 전송
        sendPushNotification(
          targetUser.id,
          "📬 새 쪽지가 도착했습니다",
          title,
          "/my-coupons?tab=messages"
        );
        
        sentCount++;
      }

      res.json({ success: true, sentCount });
    } catch (err) {
      console.error("전체 쪽지 발송 오류:", err);
      res.status(500).json({ error: "전체 쪽지 발송 실패" });
    }
  });

  // 전체 회원에게 쿠폰 발급 (관리자)
  app.post("/api/admin/user-coupons/broadcast", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const { couponId } = req.body;
      if (!couponId) {
        return res.status(400).json({ error: "couponId가 필요합니다" });
      }

      const allUsers = await db.select().from(users);
      
      // 쿠폰 정보 가져오기
      const [couponInfo] = await db.select().from(coupons).where(eq(coupons.id, couponId));
      
      let issuedCount = 0;
      for (const targetUser of allUsers) {
        await db.insert(userCoupons).values({
          userId: targetUser.id,
          couponId,
          isUsed: false,
        });
        
        // 푸시 알림 전송
        sendPushNotification(
          targetUser.id,
          "🎫 새 쿠폰이 도착했습니다",
          couponInfo?.name || "할인 쿠폰",
          "/my-coupons?tab=coupons"
        );
        
        issuedCount++;
      }

      res.json({ success: true, issuedCount });
    } catch (err) {
      console.error("전체 쿠폰 발급 오류:", err);
      res.status(500).json({ error: "전체 쿠폰 발급 실패" });
    }
  });

  // 내 쪽지 목록 조회
  app.get("/api/messages", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) {
        return res.status(401).json({ error: "로그인이 필요합니다" });
      }

      const userId = user?.claims?.sub || user?.claims?.email;
      const myMessages = await db.select().from(adminMessages)
        .where(eq(adminMessages.receiverId, userId))
        .orderBy(desc(adminMessages.createdAt));

      res.json(myMessages);
    } catch (err) {
      console.error("쪽지 조회 오류:", err);
      res.status(500).json({ error: "쪽지 조회 실패" });
    }
  });

  // 쪽지 읽음 처리
  app.patch("/api/messages/:id/read", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) {
        return res.status(401).json({ error: "로그인이 필요합니다" });
      }

      const messageId = parseInt(req.params.id);
      await db.update(adminMessages)
        .set({ isRead: true })
        .where(eq(adminMessages.id, messageId));

      res.json({ success: true });
    } catch (err) {
      console.error("쪽지 읽음 처리 오류:", err);
      res.status(500).json({ error: "쪽지 읽음 처리 실패" });
    }
  });

  // 안읽은 쪽지 개수
  app.get("/api/messages/unread-count", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) {
        return res.status(401).json({ error: "로그인이 필요합니다" });
      }

      const userId = user?.claims?.sub || user?.claims?.email;
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(adminMessages)
        .where(and(
          eq(adminMessages.receiverId, userId),
          eq(adminMessages.isRead, false)
        ));

      res.json({ count: result[0]?.count || 0 });
    } catch (err) {
      console.error("안읽은 쪽지 개수 조회 오류:", err);
      res.json({ count: 0 });
    }
  });

  // === 쿠폰 API ===
  // 쿠폰 생성 (관리자)
  app.post("/api/admin/coupons", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      // 날짜 문자열을 Date 객체로 변환
      const body = {
        ...req.body,
        validUntil: req.body.validUntil ? new Date(req.body.validUntil) : null,
        validFrom: req.body.validFrom ? new Date(req.body.validFrom) : null,
      };

      const parsed = insertCouponSchema.safeParse(body);
      if (!parsed.success) {
        console.error("쿠폰 생성 검증 오류:", parsed.error);
        return res.status(400).json({ error: "잘못된 요청", details: parsed.error });
      }

      const [coupon] = await db.insert(coupons).values(parsed.data).returning();
      res.json(coupon);
    } catch (err) {
      console.error("쿠폰 생성 오류:", err);
      res.status(500).json({ error: "쿠폰 생성 실패" });
    }
  });

  // 쿠폰 목록 조회 (관리자)
  app.get("/api/admin/coupons", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const allCoupons = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
      res.json(allCoupons);
    } catch (err) {
      console.error("쿠폰 목록 조회 오류:", err);
      res.status(500).json({ error: "쿠폰 목록 조회 실패" });
    }
  });

  // 쿠폰 수정 (관리자)
  app.patch("/api/admin/coupons/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const couponId = parseInt(req.params.id);
      
      // 날짜 문자열을 Date 객체로 변환
      const updateData = { ...req.body };
      if (updateData.validFrom && typeof updateData.validFrom === 'string') {
        updateData.validFrom = updateData.validFrom ? new Date(updateData.validFrom) : null;
      }
      if (updateData.validUntil && typeof updateData.validUntil === 'string') {
        updateData.validUntil = updateData.validUntil ? new Date(updateData.validUntil) : null;
      }
      
      const [updated] = await db.update(coupons)
        .set(updateData)
        .where(eq(coupons.id, couponId))
        .returning();

      res.json(updated);
    } catch (err) {
      console.error("쿠폰 수정 오류:", err);
      res.status(500).json({ error: "쿠폰 수정 실패" });
    }
  });

  // 쿠폰 삭제 (관리자)
  app.delete("/api/admin/coupons/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const couponId = parseInt(req.params.id);
      await db.delete(coupons).where(eq(coupons.id, couponId));
      res.json({ success: true });
    } catch (err) {
      console.error("쿠폰 삭제 오류:", err);
      res.status(500).json({ error: "쿠폰 삭제 실패" });
    }
  });

  // 사용자에게 쿠폰 발급 (관리자)
  app.post("/api/admin/user-coupons", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const adminUserId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const adminEmail = user?.claims?.email || user?.email;
      if (!isUserAdmin(adminUserId, adminEmail)) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const { userId, couponId } = req.body;
      if (!userId || !couponId) {
        return res.status(400).json({ error: "userId와 couponId가 필요합니다" });
      }

      const [userCoupon] = await db.insert(userCoupons).values({
        userId,
        couponId,
        isUsed: false,
      }).returning();

      // 쿠폰 정보 가져오기 및 푸시 알림 전송
      const [couponInfo] = await db.select().from(coupons).where(eq(coupons.id, couponId));
      await sendPushNotification(
        userId,
        "🎫 새 쿠폰이 도착했습니다",
        couponInfo?.name || "할인 쿠폰",
        "/my-coupons?tab=coupons"
      );

      res.json(userCoupon);
    } catch (err) {
      console.error("쿠폰 발급 오류:", err);
      res.status(500).json({ error: "쿠폰 발급 실패" });
    }
  });

  // 내 쿠폰 목록 조회
  app.get("/api/my-coupons", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) {
        return res.status(401).json({ error: "로그인이 필요합니다" });
      }

      const userId = user?.claims?.sub || user?.claims?.email;
      const myCoupons = await db.select({
        id: userCoupons.id,
        couponId: userCoupons.couponId,
        isUsed: userCoupons.isUsed,
        usedAt: userCoupons.usedAt,
        issuedAt: userCoupons.issuedAt,
        name: coupons.name,
        description: coupons.description,
        discountType: coupons.discountType,
        discountValue: coupons.discountValue,
        serviceDescription: coupons.serviceDescription,
        validFrom: coupons.validFrom,
        validUntil: coupons.validUntil,
        placeId: coupons.placeId,
        placeName: places.name,
        placeAddress: places.address,
        placeLatitude: places.latitude,
        placeLongitude: places.longitude,
      })
        .from(userCoupons)
        .innerJoin(coupons, eq(userCoupons.couponId, coupons.id))
        .leftJoin(places, eq(coupons.placeId, places.id))
        .where(eq(userCoupons.userId, userId))
        .orderBy(desc(userCoupons.issuedAt));

      res.json(myCoupons);
    } catch (err) {
      console.error("내 쿠폰 조회 오류:", err);
      res.status(500).json({ error: "쿠폰 조회 실패" });
    }
  });

  // 쿠폰 사용 처리
  app.patch("/api/my-coupons/:id/use", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) {
        return res.status(401).json({ error: "로그인이 필요합니다" });
      }

      const userCouponId = parseInt(req.params.id);
      const [updated] = await db.update(userCoupons)
        .set({ isUsed: true, usedAt: new Date() })
        .where(eq(userCoupons.id, userCouponId))
        .returning();

      res.json(updated);
    } catch (err) {
      console.error("쿠폰 사용 처리 오류:", err);
      res.status(500).json({ error: "쿠폰 사용 처리 실패" });
    }
  });

  // === 회원 쪽지함 API ===
  // 내 쪽지 목록 조회
  app.get("/api/my-messages", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) {
        return res.status(401).json({ error: "로그인이 필요합니다" });
      }
      const userId = user.claims?.sub || user.id;

      const myMessages = await db.select().from(adminMessages)
        .where(eq(adminMessages.receiverId, userId))
        .orderBy(desc(adminMessages.createdAt));

      res.json(myMessages);
    } catch (err) {
      console.error("쪽지 조회 오류:", err);
      res.status(500).json({ error: "쪽지 조회 실패" });
    }
  });

  // 쪽지 읽음 처리
  app.patch("/api/my-messages/:id/read", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) {
        return res.status(401).json({ error: "로그인이 필요합니다" });
      }

      const messageId = parseInt(req.params.id);
      const [updated] = await db.update(adminMessages)
        .set({ isRead: true })
        .where(eq(adminMessages.id, messageId))
        .returning();

      res.json(updated);
    } catch (err) {
      console.error("쪽지 읽음 처리 오류:", err);
      res.status(500).json({ error: "쪽지 읽음 처리 실패" });
    }
  });

  // 안읽은 쪽지/쿠폰 수 조회
  app.get("/api/my-notifications", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      if (!user) {
        return res.status(401).json({ error: "로그인이 필요합니다" });
      }
      const userId = user.claims?.sub || user.id;

      const unreadMessages = await db.select().from(adminMessages)
        .where(and(eq(adminMessages.receiverId, userId), eq(adminMessages.isRead, false)));
      
      const unusedCoupons = await db.select().from(userCoupons)
        .where(and(eq(userCoupons.userId, userId), eq(userCoupons.isUsed, false)));

      let unreadChatCount = 0;
      const userEmail = user.claims?.email || user.email;
      if (await isUserAdminWithDb(userId, userEmail)) {
        const openRooms = await db.select().from(customerChatRooms)
          .where(eq(customerChatRooms.status, "open"));
        unreadChatCount = openRooms.reduce((sum, r) => sum + (r.unreadByAdmin ?? 0), 0);
      }

      res.json({
        unreadMessagesCount: unreadMessages.length,
        unusedCouponsCount: unusedCoupons.length,
        unreadChatCount,
      });
    } catch (err) {
      console.error("알림 조회 오류:", err);
      res.status(500).json({ error: "알림 조회 실패" });
    }
  });

  // === 공지사항/배너 API ===
  // 공지사항 목록 조회 (공개)
  app.get("/api/announcements", async (req, res) => {
    try {
      const now = new Date();
      const activeAnnouncements = await db.select().from(announcements)
        .where(eq(announcements.isActive, true))
        .orderBy(announcements.sortOrder);

      // 날짜 필터링 (startDate, endDate)
      const filtered = activeAnnouncements.filter(a => {
        if (a.startDate && new Date(a.startDate) > now) return false;
        if (a.endDate && new Date(a.endDate) < now) return false;
        return true;
      });

      res.json(filtered);
    } catch (err) {
      console.error("공지사항 조회 오류:", err);
      res.status(500).json({ error: "공지사항 조회 실패" });
    }
  });

  // 공지사항 생성 (관리자)
  app.post("/api/admin/announcements", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const parsed = insertAnnouncementSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "잘못된 요청", details: parsed.error });
      }

      const [announcement] = await db.insert(announcements).values(parsed.data).returning();
      res.json(announcement);
    } catch (err) {
      console.error("공지사항 생성 오류:", err);
      res.status(500).json({ error: "공지사항 생성 실패" });
    }
  });

  // 공지사항 순서 변경 (관리자)
  app.post("/api/admin/announcements/reorder", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const { orderedIds } = req.body;
      if (!orderedIds || !Array.isArray(orderedIds)) {
        return res.status(400).json({ error: "orderedIds 배열이 필요합니다" });
      }

      for (let i = 0; i < orderedIds.length; i++) {
        await db.update(announcements)
          .set({ sortOrder: i, updatedAt: new Date() })
          .where(eq(announcements.id, orderedIds[i]));
      }

      res.json({ success: true });
    } catch (err) {
      console.error("공지사항 순서 변경 오류:", err);
      res.status(500).json({ error: "공지사항 순서 변경 실패" });
    }
  });

  // 공지사항 수정 (관리자)
  app.patch("/api/admin/announcements/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const announcementId = parseInt(req.params.id);
      const [updated] = await db.update(announcements)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(announcements.id, announcementId))
        .returning();

      res.json(updated);
    } catch (err) {
      console.error("공지사항 수정 오류:", err);
      res.status(500).json({ error: "공지사항 수정 실패" });
    }
  });

  // 공지사항 삭제 (관리자)
  app.delete("/api/admin/announcements/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const announcementId = parseInt(req.params.id);
      await db.delete(announcements).where(eq(announcements.id, announcementId));
      res.json({ success: true });
    } catch (err) {
      console.error("공지사항 삭제 오류:", err);
      res.status(500).json({ error: "공지사항 삭제 실패" });
    }
  });

  // 관리자용 전체 공지사항 조회
  app.get("/api/admin/announcements", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!isUserAdmin(userId, userEmail)) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const allAnnouncements = await db.select().from(announcements).orderBy(announcements.sortOrder, desc(announcements.createdAt));
      res.json(allAnnouncements);
    } catch (err) {
      console.error("관리자 공지사항 조회 오류:", err);
      res.status(500).json({ error: "공지사항 조회 실패" });
    }
  });

  // === 회원 관리 API ===
  
  // 비동기 관리자 권한 확인 헬퍼 함수
  const isUserAdminAsync = async (userId: string | undefined): Promise<boolean> => {
    if (!userId) return false;
    
    // 환경 변수 기반 체크
    if (ADMIN_USER_ID) {
      const adminIds = ADMIN_USER_ID.split(",").map(id => id.trim());
      if (adminIds.includes(String(userId))) return true;
    }
    
    // DB 기반 체크
    const dbUser = await db.select().from(users).where(eq(users.id, String(userId)));
    if (dbUser.length > 0 && dbUser[0].isAdmin) return true;
    
    return false;
  };

  // 관리자용 회원 목록 조회
  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const oauthUser = req.user as any;
      let userId = oauthUser?.claims?.sub;
      
      if (!userId && req.session?.userId) {
        userId = req.session.userId;
      }
      
      console.log("[DEBUG] /api/admin/users - userId:", userId, "session:", !!req.session?.userId, "user:", !!req.user);
      
      const isAdmin = await isUserAdminAsync(userId);
      if (!isAdmin) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const allUsers = await db.select({
        id: users.id,
        email: users.email,
        nickname: users.nickname,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        loginMethod: users.loginMethod,
        isAdmin: users.isAdmin,
        gender: users.gender,
        canViewNightlife18: users.canViewNightlife18,
        canViewEco: users.canViewEco,
        createdAt: users.createdAt,
      }).from(users).orderBy(desc(users.createdAt));
      
      res.json(allUsers);
    } catch (err) {
      console.error("회원 목록 조회 오류:", err);
      res.status(500).json({ error: "회원 목록 조회 실패" });
    }
  });

  // 관리자 권한 부여/해제
  app.patch("/api/admin/users/:id/admin", isAuthenticated, async (req: any, res) => {
    try {
      const oauthUser = req.user as any;
      let currentUserId = oauthUser?.claims?.sub;
      
      if (!currentUserId && req.session?.userId) {
        currentUserId = req.session.userId;
      }
      
      const isAdmin = await isUserAdminAsync(currentUserId);
      if (!isAdmin) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const targetUserId = req.params.id;
      const { isAdmin: newIsAdmin } = req.body;

      if (typeof newIsAdmin !== "boolean") {
        return res.status(400).json({ error: "isAdmin 값이 필요합니다" });
      }

      // 자기 자신의 관리자 권한은 해제 불가 (안전 장치)
      if (String(currentUserId) === String(targetUserId) && !newIsAdmin) {
        return res.status(400).json({ error: "자신의 관리자 권한은 해제할 수 없습니다" });
      }

      const [updatedUser] = await db.update(users)
        .set({ isAdmin: newIsAdmin, updatedAt: new Date() })
        .where(eq(users.id, targetUserId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
      }

      res.json({ 
        success: true, 
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          nickname: updatedUser.nickname,
          isAdmin: updatedUser.isAdmin,
        }
      });
    } catch (err) {
      console.error("관리자 권한 변경 오류:", err);
      res.status(500).json({ error: "관리자 권한 변경 실패" });
    }
  });

  // 밤문화18 권한 부여/해제 (관리자 전용)
  app.patch("/api/admin/users/:id/nightlife18", isAuthenticated, async (req: any, res) => {
    try {
      const oauthUser = req.user as any;
      let currentUserId = oauthUser?.claims?.sub;
      
      if (!currentUserId && req.session?.userId) {
        currentUserId = req.session.userId;
      }
      
      const isAdmin = await isUserAdminAsync(currentUserId);
      if (!isAdmin) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const targetUserId = req.params.id;
      const { canViewNightlife18 } = req.body;

      if (typeof canViewNightlife18 !== "boolean") {
        return res.status(400).json({ error: "canViewNightlife18 값이 필요합니다" });
      }

      const [updatedUser] = await db.update(users)
        .set({ canViewNightlife18, updatedAt: new Date() })
        .where(eq(users.id, targetUserId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
      }

      res.json({ 
        success: true, 
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          nickname: updatedUser.nickname,
          canViewNightlife18: updatedUser.canViewNightlife18,
        }
      });
    } catch (err) {
      console.error("밤문화18 권한 변경 오류:", err);
      res.status(500).json({ error: "밤문화18 권한 변경 실패" });
    }
  });

  // 에코 권한 부여/해제 (관리자 전용)
  app.patch("/api/admin/users/:id/eco", isAuthenticated, async (req: any, res) => {
    try {
      const oauthUser = req.user as any;
      let currentUserId = oauthUser?.claims?.sub;
      
      if (!currentUserId && req.session?.userId) {
        currentUserId = req.session.userId;
      }
      
      const isAdmin = await isUserAdminAsync(currentUserId);
      if (!isAdmin) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const targetUserId = req.params.id;
      const { canViewEco } = req.body;

      if (typeof canViewEco !== "boolean") {
        return res.status(400).json({ error: "canViewEco 값이 필요합니다" });
      }

      const [updatedUser] = await db.update(users)
        .set({ canViewEco, updatedAt: new Date() })
        .where(eq(users.id, targetUserId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
      }

      res.json({ 
        success: true, 
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          nickname: updatedUser.nickname,
          canViewEco: updatedUser.canViewEco,
        }
      });
    } catch (err) {
      console.error("에코 권한 변경 오류:", err);
      res.status(500).json({ error: "에코 권한 변경 실패" });
    }
  });

  // 회원 삭제 (관리자 전용)
  app.delete("/api/admin/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const oauthUser = req.user as any;
      let currentUserId = oauthUser?.claims?.sub;
      
      if (!currentUserId && req.session?.userId) {
        currentUserId = req.session.userId;
      }
      
      const isAdmin = await isUserAdminAsync(currentUserId);
      if (!isAdmin) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const targetUserId = req.params.id;

      // 자기 자신은 삭제 불가
      if (String(currentUserId) === String(targetUserId)) {
        return res.status(400).json({ error: "자신의 계정은 삭제할 수 없습니다" });
      }

      // 삭제 대상이 관리자인지 확인
      const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId));
      if (!targetUser) {
        return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
      }

      // 관리자 계정은 삭제 불가
      if (targetUser.isAdmin) {
        return res.status(400).json({ error: "관리자 계정은 삭제할 수 없습니다. 먼저 관리자 권한을 해제하세요" });
      }

      await db.delete(users).where(eq(users.id, targetUserId));

      res.json({ success: true, message: "사용자가 삭제되었습니다" });
    } catch (err) {
      console.error("회원 삭제 오류:", err);
      res.status(500).json({ error: "회원 삭제 실패" });
    }
  });

  // 관리자 알림 목록 조회
  app.get("/api/admin/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const oauthUser = req.user as any;
      let currentUserId = oauthUser?.claims?.sub;
      if (!currentUserId && req.session?.userId) {
        currentUserId = req.session.userId;
      }

      const isAdmin = await isUserAdminAsync(currentUserId);
      if (!isAdmin) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const notifications = await db.select()
        .from(adminNotifications)
        .orderBy(desc(adminNotifications.createdAt))
        .limit(50);

      res.json(notifications);
    } catch (err) {
      console.error("알림 목록 조회 오류:", err);
      res.status(500).json({ error: "알림 목록 조회 실패" });
    }
  });

  // 읽지 않은 알림 개수 조회
  app.get("/api/admin/notifications/unread-count", isAuthenticated, async (req: any, res) => {
    try {
      const oauthUser = req.user as any;
      let currentUserId = oauthUser?.claims?.sub;
      if (!currentUserId && req.session?.userId) {
        currentUserId = req.session.userId;
      }

      const isAdmin = await isUserAdminAsync(currentUserId);
      if (!isAdmin) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      const result = await db.select({ count: sql<number>`count(*)` })
        .from(adminNotifications)
        .where(eq(adminNotifications.isRead, false));

      res.json({ count: Number(result[0]?.count || 0) });
    } catch (err) {
      console.error("알림 개수 조회 오류:", err);
      res.status(500).json({ error: "알림 개수 조회 실패" });
    }
  });

  // 알림 읽음 처리
  app.patch("/api/admin/notifications/mark-read", isAuthenticated, async (req: any, res) => {
    try {
      const oauthUser = req.user as any;
      let currentUserId = oauthUser?.claims?.sub;
      if (!currentUserId && req.session?.userId) {
        currentUserId = req.session.userId;
      }

      const isAdmin = await isUserAdminAsync(currentUserId);
      if (!isAdmin) {
        return res.status(403).json({ error: "관리자 권한이 필요합니다" });
      }

      await db.update(adminNotifications)
        .set({ isRead: true })
        .where(eq(adminNotifications.isRead, false));

      res.json({ success: true });
    } catch (err) {
      console.error("알림 읽음 처리 오류:", err);
      res.status(500).json({ error: "알림 읽음 처리 실패" });
    }
  });

  // === 고객센터 1:1 실시간 채팅 ===

  // 고객: 내 채팅방 가져오기/생성 (visitorId 기반)
  app.post("/api/customer-chat/room", async (req, res) => {
    try {
      const { visitorId, visitorName } = req.body;
      console.log("[CHAT] 채팅방 생성 요청:", { visitorId, visitorName });
      if (!visitorId) {
        console.log("[CHAT] visitorId 없음 - 400 반환");
        return res.status(400).json({ error: "visitorId required" });
      }

      const existing = await db.select().from(customerChatRooms)
        .where(and(eq(customerChatRooms.visitorId, visitorId), eq(customerChatRooms.status, "open")))
        .limit(1);

      if (existing.length > 0) {
        console.log("[CHAT] 기존 채팅방 반환:", existing[0].id);
        return res.json(existing[0]);
      }

      const [room] = await db.insert(customerChatRooms).values({
        visitorId,
        visitorName: visitorName || "방문자",
      }).returning();
      console.log("[CHAT] 새 채팅방 생성 완료:", room.id, "visitorId:", visitorId);

      // 관리자에게 푸시 알림 (모든 구독자에게 발송)
      try {
        console.log("[CHAT] 모든 푸시 구독자에게 알림 발송");
        sendAdminPushNotifications("새 채팅 문의", `${visitorName || "방문자"}님이 채팅을 시작했습니다`, "/admin/chat");
      } catch (pushErr) {
        console.error("[CHAT] 푸시 알림 오류 (채팅방 생성은 성공):", pushErr);
      }

      res.json(room);
    } catch (err) {
      console.error("[CHAT] 채팅방 생성 오류:", err);
      res.status(500).json({ error: "채팅방 생성 실패" });
    }
  });

  // 고객: 내 채팅방 메시지 가져오기 (visitorId 검증)
  app.get("/api/customer-chat/room/:roomId/messages", async (req, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const visitorId = req.query.visitorId as string;

      const user = (req as any).user;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      const adminAccess = await isUserAdminWithDb(userId, userEmail);

      if (!adminAccess) {
        if (!visitorId) return res.status(403).json({ error: "접근 권한 없음" });
        const [room] = await db.select().from(customerChatRooms)
          .where(and(eq(customerChatRooms.id, roomId), eq(customerChatRooms.visitorId, visitorId)))
          .limit(1);
        if (!room) return res.status(403).json({ error: "접근 권한 없음" });
      }

      const messages = await db.select().from(customerChatMessages)
        .where(eq(customerChatMessages.roomId, roomId))
        .orderBy(customerChatMessages.createdAt);

      if (adminAccess) {
        await db.update(customerChatRooms).set({ unreadByAdmin: 0 }).where(eq(customerChatRooms.id, roomId));
      } else {
        await db.update(customerChatRooms).set({ unreadByVisitor: 0 }).where(eq(customerChatRooms.id, roomId));
      }

      res.json(messages);
    } catch (err) {
      res.status(500).json({ error: "메시지 조회 실패" });
    }
  });

  // 고객/관리자: 메시지 전송 (REST API)
  app.post("/api/customer-chat/room/:roomId/messages", async (req: any, res) => {
    try {
      const roomId = parseInt(req.params.roomId);
      const { visitorId, message, senderName } = req.body;
      if (!message || !message.trim()) return res.status(400).json({ error: "메시지 필요" });
      if (message.length > 2000) return res.status(400).json({ error: "메시지가 너무 깁니다" });

      const user = req.user;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      const adminAccess = await isUserAdminWithDb(userId, userEmail);

      let actualRole: string;
      let actualSenderId: string;
      let actualSenderName: string;

      if (adminAccess) {
        actualRole = "admin";
        actualSenderId = userId || "admin";
        actualSenderName = "관리자";
      } else {
        if (!visitorId) return res.status(400).json({ error: "visitorId 필요" });
        const [room] = await db.select().from(customerChatRooms)
          .where(and(eq(customerChatRooms.id, roomId), eq(customerChatRooms.visitorId, visitorId)))
          .limit(1);
        if (!room) return res.status(403).json({ error: "접근 권한 없음" });
        actualRole = "customer";
        actualSenderId = visitorId;
        actualSenderName = senderName || "방문자";
      }

      const [saved] = await db.insert(customerChatMessages).values({
        roomId,
        senderId: actualSenderId,
        senderRole: actualRole,
        senderName: actualSenderName,
        message: message.trim(),
      }).returning();

      const updateData: any = {
        lastMessage: message.trim().substring(0, 100),
        lastMessageAt: new Date(),
      };
      if (actualRole === "customer") {
        updateData.unreadByAdmin = sql`${customerChatRooms.unreadByAdmin} + 1`;
      } else {
        updateData.unreadByVisitor = sql`${customerChatRooms.unreadByVisitor} + 1`;
      }
      await db.update(customerChatRooms).set(updateData).where(eq(customerChatRooms.id, roomId));

      broadcastToRoom(roomId, JSON.stringify({ type: "new_message", roomId, message: saved }));

      if (actualRole === "customer") {
        notifyAdmins(JSON.stringify({
          type: "new_chat_notification",
          roomId,
          senderName: actualSenderName,
          preview: message.trim().substring(0, 50),
        }));
        sendAdminPushNotifications("고객 문의", `${actualSenderName}: ${message.trim().substring(0, 50)}`, "/admin/chat");
      }

      res.json(saved);
    } catch (err) {
      console.error("메시지 전송 오류:", err);
      res.status(500).json({ error: "메시지 전송 실패" });
    }
  });

  app.get("/api/admin/customer-chat/rooms", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      const admin = await isUserAdminWithDb(userId, userEmail);
      if (!admin) {
        return res.status(403).json({ error: "관리자 권한 필요" });
      }

      const rooms = await db.select().from(customerChatRooms).orderBy(desc(customerChatRooms.lastMessageAt));
      res.json(rooms);
    } catch (err) {
      res.status(500).json({ error: "채팅방 목록 조회 실패" });
    }
  });

  app.patch("/api/admin/customer-chat/rooms/:roomId/close", isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user as any;
      const userId = user?.claims?.sub || user?.id || (req.session as any)?.userId;
      const userEmail = user?.claims?.email || user?.email;
      if (!(await isUserAdminWithDb(userId, userEmail))) {
        return res.status(403).json({ error: "관리자 권한 필요" });
      }

      const roomId = parseInt(req.params.roomId);
      await db.update(customerChatRooms).set({ status: "closed" }).where(eq(customerChatRooms.id, roomId));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "채팅방 닫기 실패" });
    }
  });

  // WebSocket: 고객센터 1:1 채팅
  const supportWss = new WebSocketServer({ server: httpServer, path: "/ws/support" });

  interface SupportClient {
    ws: WebSocket;
    visitorId?: string;
    roomId?: number;
    isAdmin: boolean;
    userId?: string;
  }

  const supportClients = new Set<SupportClient>();

  function broadcastToRoom(roomId: number, message: string, excludeWs?: WebSocket) {
    supportClients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        if (client.roomId === roomId || client.isAdmin) {
          if (client.ws !== excludeWs) {
            client.ws.send(message);
          }
        }
      }
    });
  }

  function notifyAdmins(message: string) {
    supportClients.forEach((client) => {
      if (client.isAdmin && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  supportWss.on("connection", (ws: WebSocket) => {
    const client: SupportClient = { ws, isAdmin: false };
    supportClients.add(client);

    ws.on("message", async (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === "join_customer") {
          client.visitorId = msg.visitorId;
          client.roomId = msg.roomId;
          client.isAdmin = false;
          // 방 소유권 검증
          if (msg.roomId && msg.visitorId) {
            const [room] = await db.select().from(customerChatRooms)
              .where(and(eq(customerChatRooms.id, msg.roomId), eq(customerChatRooms.visitorId, msg.visitorId)))
              .limit(1);
            if (!room) {
              ws.send(JSON.stringify({ type: "error", message: "접근 권한 없음" }));
              client.roomId = undefined;
              return;
            }
          }
        } else if (msg.type === "join_admin") {
          // 관리자 검증: userId로 DB에서 isAdmin 확인
          if (msg.userId) {
            const adminCheck = await isUserAdminWithDb(msg.userId, undefined);
            if (adminCheck) {
              client.isAdmin = true;
              client.userId = msg.userId;
              if (msg.roomId) client.roomId = msg.roomId;
            } else {
              ws.send(JSON.stringify({ type: "error", message: "관리자 권한 없음" }));
            }
          }
        } else if (msg.type === "admin_focus_room") {
          if (!client.isAdmin) return;
          client.roomId = msg.roomId;
          await db.update(customerChatRooms).set({ unreadByAdmin: 0 }).where(eq(customerChatRooms.id, msg.roomId));
        } else if (msg.type === "message") {
          const { roomId, message } = msg;
          if (!roomId || !message) return;

          // 서버에서 senderRole 강제 설정
          const actualRole = client.isAdmin ? "admin" : "customer";
          const actualSenderId = client.isAdmin ? (client.userId || "admin") : (client.visitorId || "unknown");
          const actualSenderName = client.isAdmin ? "관리자" : (msg.senderName || "방문자");

          // 방 소유권 확인 (고객이면 자기 방만)
          if (!client.isAdmin && client.roomId !== roomId) return;

          const [saved] = await db.insert(customerChatMessages).values({
            roomId,
            senderId: actualSenderId,
            senderRole: actualRole,
            senderName: actualSenderName,
            message,
          }).returning();

          const updateData: any = {
            lastMessage: message.substring(0, 100),
            lastMessageAt: new Date(),
          };
          if (actualRole === "customer") {
            updateData.unreadByAdmin = sql`${customerChatRooms.unreadByAdmin} + 1`;
          } else {
            updateData.unreadByVisitor = sql`${customerChatRooms.unreadByVisitor} + 1`;
          }
          await db.update(customerChatRooms).set(updateData).where(eq(customerChatRooms.id, roomId));

          const broadcastMsg = JSON.stringify({
            type: "new_message",
            roomId,
            message: saved,
          });

          broadcastToRoom(roomId, broadcastMsg);

          if (actualRole === "customer") {
            notifyAdmins(JSON.stringify({
              type: "new_chat_notification",
              roomId,
              senderName: actualSenderName,
              preview: message.substring(0, 50),
            }));

            const anyAdminOnline = Array.from(supportClients).some(c => c.isAdmin && c.roomId === roomId);
            if (!anyAdminOnline) {
              sendAdminPushNotifications("고객 문의", `${actualSenderName}: ${message.substring(0, 50)}`, "/admin/chat");
            }
          }
        }
      } catch (err) {
        console.error("Support WS error:", err);
      }
    });

    ws.on("close", () => {
      supportClients.delete(client);
    });
  });

  return httpServer;
}
