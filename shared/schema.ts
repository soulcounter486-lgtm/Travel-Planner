import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// Re-export chat models for AI integrations
export * from "./models/chat";

// === TABLE DEFINITIONS ===
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  userId: text("user_id"), // 저장한 사용자 ID (선택사항 - 비로그인 사용자도 저장 가능)
  customerName: text("customer_name").notNull(),
  totalPrice: integer("total_price").notNull(),
  breakdown: jsonb("breakdown").notNull(), // Stores the detailed calculation result
  depositPaid: boolean("deposit_paid").default(false), // 예약금 입금 완료 여부
  depositAmount: integer("deposit_amount").default(0), // 예약금 금액
  checkInDate: text("check_in_date"), // 체크인 날짜 (YYYY-MM-DD)
  checkOutDate: text("check_out_date"), // 체크아웃 날짜 (YYYY-MM-DD)
  memo: text("memo").default(""), // 메모
  memoImages: jsonb("memo_images").$type<string[]>().default([]), // 메모 이미지 URL 배열
  createdAt: timestamp("created_at").defaultNow(),
});

export const visitorCount = pgTable("visitor_count", {
  id: serial("id").primaryKey(),
  count: integer("count").notNull().default(0),
  lastResetDate: text("last_reset_date"), // YYYY-MM-DD format for daily reset
});

// 여행 가계부 - 지출 그룹 (여행별)
export const expenseGroups = pgTable("expense_groups", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // 그룹 생성자 ID (로그인 사용자)
  name: text("name").notNull(),
  participants: jsonb("participants").notNull().$type<string[]>(), // 참여자 이름 배열
  budget: integer("budget").default(0), // 총 예산 (VND)
  createdAt: timestamp("created_at").defaultNow(),
});

// 여행 가계부 - 개별 지출
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  description: text("description").default(""), // 선택사항
  amount: integer("amount").notNull().default(0), // VND 단위
  category: text("category").default("other"), // 식비, 교통, 숙박, 관광, 쇼핑, 기타
  paidBy: text("paid_by").default(""), // 결제한 사람 (선택)
  splitAmong: jsonb("split_among").$type<string[]>().default([]), // 나눌 사람들 (선택)
  date: text("date").notNull(), // YYYY-MM-DD
  memo: text("memo").default(""), // 메모
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===
export const insertQuoteSchema = createInsertSchema(quotes).omit({ id: true, createdAt: true });

// Input schema for calculation
export const calculateQuoteSchema = z.object({
  // Villa
  villa: z.object({
    enabled: z.boolean(),
    checkIn: z.string(), // YYYY-MM-DD
    checkOut: z.string(), // YYYY-MM-DD
    rooms: z.number().optional(), // Number of rooms (default 1)
  }).optional(),

  // Vehicle
  vehicle: z.object({
    enabled: z.boolean(),
    selections: z.array(z.object({
      date: z.string(), // YYYY-MM-DD
      type: z.enum([
        "7_seater",
        "16_seater",
        "9_limo",
        "9_lux_limo",
        "12_lux_limo",
        "16_lux_limo",
        "29_seater",
        "45_seater"
      ]),
      route: z.enum(["city", "oneway", "roundtrip", "city_pickup_drop"]),
    })).optional(),
  }).optional(),

  // Golf
  golf: z.object({
    enabled: z.boolean(),
    selections: z.array(z.object({
      date: z.string(), // YYYY-MM-DD
      course: z.enum(["paradise", "chouduc", "hocham"]),
      players: z.number().min(1).default(1),
    })).optional(),
  }).optional(),

  // Eco
  ecoGirl: z.object({
    enabled: z.boolean(),
    selections: z.array(z.object({
      date: z.string(), // YYYY-MM-DD
      count: z.number().min(1).default(1),
      hours: z.enum(["12", "22"]).default("12"), // 12시간 or 22시간
    })).optional(),
  }).optional(),

  // Guide
  guide: z.object({
    enabled: z.boolean(),
    days: z.number().min(0).default(0),
    groupSize: z.number().min(1).default(1),
  }).optional(),

  // Fast Track
  fastTrack: z.object({
    enabled: z.boolean(),
    type: z.enum(["oneway", "roundtrip"]).default("oneway"),
    persons: z.number().min(0).default(0),
  }).optional(),
});

// Output schema for calculation result
export const quoteBreakdownSchema = z.object({
  villa: z.object({
    price: z.number(),
    details: z.array(z.string()), // e.g., "Friday: $380"
    checkIn: z.string().optional(), // YYYY-MM-DD
    checkOut: z.string().optional(), // YYYY-MM-DD
    rooms: z.number().optional(), // Number of rooms
  }),
  vehicle: z.object({
    price: z.number(),
    description: z.string(),
  }),
  golf: z.object({
    price: z.number(),
    description: z.string(),
  }),
  ecoGirl: z.object({
    price: z.number(),
    description: z.string(),
    details: z.array(z.string()).optional(),
  }),
  guide: z.object({
    price: z.number(),
    description: z.string(),
  }),
  fastTrack: z.object({
    price: z.number(),
    description: z.string(),
  }),
  total: z.number(),
});

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type CalculateQuoteRequest = z.infer<typeof calculateQuoteSchema>;
export type QuoteBreakdown = z.infer<typeof quoteBreakdownSchema>;

// 여행 가계부 스키마
export const insertExpenseGroupSchema = createInsertSchema(expenseGroups).omit({ id: true, createdAt: true, userId: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true }).extend({
  amount: z.coerce.number().int().nonnegative({ message: "Amount cannot be negative" }).default(0),
});

export type ExpenseGroup = typeof expenseGroups.$inferSelect;
export type InsertExpenseGroup = z.infer<typeof insertExpenseGroupSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

// 게시판 - 게시글 (관리자만 작성 가능)
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"), // Object Storage 이미지 URL
  authorId: text("author_id").notNull(), // Replit Auth 사용자 ID
  authorName: text("author_name").notNull(),
  isHidden: boolean("is_hidden").default(false), // 게시글 숨김 여부
  viewCount: integer("view_count").default(0), // 조회수 (관리자만 볼 수 있음)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 게시판 - 댓글 (누구나 작성 가능)
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  authorName: text("author_name").notNull(), // 닉네임 (로그인 불필요)
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 게시판 스키마
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, createdAt: true, updatedAt: true, authorId: true, authorName: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, postId: true });

export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

// 인스타그램 동기화 추적
export const instagramSyncedPosts = pgTable("instagram_synced_posts", {
  id: serial("id").primaryKey(),
  instagramId: text("instagram_id").notNull().unique(), // 인스타그램 게시물 ID
  postId: integer("post_id").notNull(), // 연결된 게시판 게시물 ID
  syncedAt: timestamp("synced_at").defaultNow(),
});

export type InstagramSyncedPost = typeof instagramSyncedPosts.$inferSelect;

// 푸시 알림 구독
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull().unique(),
  keys: jsonb("keys").notNull(), // { p256dh, auth }
  createdAt: timestamp("created_at").defaultNow(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;

// 위치 공유 테이블
export const userLocations = pgTable("user_locations", {
  id: serial("id").primaryKey(),
  nickname: text("nickname").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  placeName: text("place_name"), // 선택: 장소 이름 (예: "Bi Roen 이발소")
  placeCategory: text("place_category"), // 선택: 장소 카테고리 (예: "coffee", "localFood")
  message: text("message"), // 선택: 메시지 (예: "여기 추천해요!")
  expiresAt: timestamp("expires_at").notNull(), // 위치 만료 시간 (24시간 후 자동 삭제)
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserLocationSchema = createInsertSchema(userLocations).omit({ id: true, createdAt: true });

export type UserLocation = typeof userLocations.$inferSelect;
export type InsertUserLocation = z.infer<typeof insertUserLocationSchema>;

// 풀빌라 테이블
export const villas = pgTable("villas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 빌라 이름
  mainImage: text("main_image"), // 대표 사진 URL
  images: jsonb("images").$type<string[]>().default([]), // 상세 사진들
  weekdayPrice: integer("weekday_price").notNull().default(350), // 평일 가격 (USD)
  fridayPrice: integer("friday_price").notNull().default(380), // 금요일 가격 (USD)
  weekendPrice: integer("weekend_price").notNull().default(500), // 주말 가격 (USD)
  holidayPrice: integer("holiday_price").notNull().default(550), // 공휴일 가격 (USD)
  latitude: text("latitude"), // 위도
  longitude: text("longitude"), // 경도
  address: text("address"), // 주소
  mapUrl: text("map_url"), // 지도 URL
  maxGuests: integer("max_guests").default(10), // 최대 인원
  bedrooms: integer("bedrooms").default(3), // 침실 수
  notes: text("notes"), // 참고사항
  isActive: boolean("is_active").default(true), // 활성화 여부
  sortOrder: integer("sort_order").default(0), // 정렬 순서
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVillaSchema = createInsertSchema(villas).omit({ id: true, createdAt: true, updatedAt: true });

export type Villa = typeof villas.$inferSelect;
export type InsertVilla = z.infer<typeof insertVillaSchema>;
