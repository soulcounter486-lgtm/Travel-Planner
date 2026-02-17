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
  memo: text("memo").default(""), // 관리자 메모
  userMemo: text("user_memo").default(""), // 일반 회원 메모
  memoImages: jsonb("memo_images").$type<string[]>().default([]), // 메모 이미지 URL 배열
  ecoPicks: jsonb("eco_picks").$type<Record<string, { first: number[]; second: number[]; third: number[] }>>().default({}), // 날짜별 1/2/3지망 에코프로필 { "2026-02-20": { first: [1,2], second: [3,4], third: [5,6] } }
  assignedBy: text("assigned_by"), // 관리자가 배정한 경우 관리자 ID
  createdAt: timestamp("created_at").defaultNow(),
});

export const visitorCount = pgTable("visitor_count", {
  id: serial("id").primaryKey(),
  count: integer("count").notNull().default(0),
  totalCount: integer("total_count").notNull().default(15000), // 누적 방문자 수 (15000부터 시작)
  realCount: integer("real_count").notNull().default(0), // 실제 1일 방문자 수
  realTotalCount: integer("real_total_count").notNull().default(0), // 실제 누적 방문자 수
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
    villaId: z.number().optional(), // Selected villa ID
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
      date: z.string(),
      count: z.number().min(1).default(1),
      hours: z.enum(["12", "22"]).default("12"),
      picks: z.array(z.object({
        person: z.string(),
        profileId: z.number(),
        rank: z.number().min(1).max(3),
      })).optional(),
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

  // Custom Categories (관리자가 추가한 카테고리)
  customCategories: z.array(z.object({
    categoryId: z.number(),
    quantity: z.number().min(1).default(1),
    enabled: z.boolean().default(true),
    date: z.string().optional(),
    schedules: z.array(z.object({
      date: z.string().default(""),
      quantity: z.number().min(1).default(1),
      selectedOption: z.string().optional(),
    })).optional(),
  })).optional(),
});

// Output schema for calculation result
export const quoteBreakdownSchema = z.object({
  villa: z.object({
    price: z.number(),
    details: z.array(z.string()), // e.g., "Friday: $380"
    checkIn: z.string().optional(), // YYYY-MM-DD
    checkOut: z.string().optional(), // YYYY-MM-DD
    rooms: z.number().optional(), // Number of rooms
    villaId: z.number().optional(), // Selected villa ID
    villaName: z.string().optional(), // Selected villa name
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
    selections: z.array(z.object({
      date: z.string(),
      hours: z.string(),
      count: z.number(),
      picks: z.array(z.number()).optional(),
    })).optional(),
  }),
  guide: z.object({
    price: z.number(),
    description: z.string(),
  }),
  fastTrack: z.object({
    price: z.number(),
    description: z.string(),
  }),
  customCategories: z.array(z.object({
    categoryId: z.number(),
    name: z.string(),
    pricePerUnit: z.number(),
    quantity: z.number(),
    subtotal: z.number(),
    date: z.string().optional(),
    schedules: z.array(z.object({
      date: z.string().default(""),
      quantity: z.number().min(1).default(1),
      selectedOption: z.string().optional(),
      optionPrice: z.number().optional(),
    })).optional(),
  })).optional(),
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

// AI 여행 일정 저장
export const savedTravelPlans = pgTable("saved_travel_plans", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  purpose: text("purpose").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  planData: jsonb("plan_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSavedTravelPlanSchema = createInsertSchema(savedTravelPlans).omit({ id: true, createdAt: true });
export type SavedTravelPlan = typeof savedTravelPlans.$inferSelect;
export type InsertSavedTravelPlan = z.infer<typeof insertSavedTravelPlanSchema>;

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
  userId: text("user_id").notNull(), // 사용자 ID
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(), // 공개키
  auth: text("auth").notNull(), // 인증 토큰
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({ id: true, createdAt: true });
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;

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
// 빌라 편의사항 타입
export const villaAmenities = [
  "pool",        // 수영장
  "karaoke",     // 노래방
  "portableSpeaker", // 이동식 노래방스피커
  "bbq",         // 바베큐
  "livingAC",    // 거실에어컨
  "elevator",    // 엘레베이터
  "downtown",    // 시내
  "beach",       // 바닷가
  "outskirts",   // 외곽
] as const;

export type VillaAmenity = typeof villaAmenities[number];

export const villaAmenityLabels: Record<VillaAmenity, string> = {
  pool: "수영장",
  karaoke: "노래방",
  portableSpeaker: "이동식 노래방스피커",
  bbq: "바베큐",
  livingAC: "거실에어컨",
  elevator: "엘레베이터",
  downtown: "시내",
  beach: "바닷가",
  outskirts: "외곽",
};

export const villas = pgTable("villas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 빌라 이름
  mainImage: text("main_image"), // 대표 사진 URL
  images: jsonb("images").$type<string[]>().default([]), // 상세 사진들
  amenities: jsonb("amenities").$type<VillaAmenity[]>().default([]), // 편의사항
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
  isBest: boolean("is_best").default(false), // BEST 뱃지 표시 여부
  isActive: boolean("is_active").default(true), // 활성화 여부
  sortOrder: integer("sort_order").default(0), // 정렬 순서
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertVillaSchema = createInsertSchema(villas).omit({ id: true, createdAt: true, updatedAt: true });

export type Villa = typeof villas.$inferSelect;
export type InsertVilla = z.infer<typeof insertVillaSchema>;

// 관광 명소/맛집 테이블
export const places = pgTable("places", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 장소 이름
  category: text("category").notNull().default("attraction"), // 카테고리: attraction(관광명소), restaurant(맛집), cafe(카페), other(기타)
  description: text("description"), // 설명
  mainImage: text("main_image"), // 대표 이미지 URL
  images: jsonb("images").$type<string[]>().default([]), // 추가 이미지들
  latitude: text("latitude"), // 위도
  longitude: text("longitude"), // 경도
  address: text("address"), // 주소
  phone: text("phone"), // 전화번호
  website: text("website"), // 웹사이트/SNS URL
  openingHours: text("opening_hours"), // 영업시간
  priceRange: text("price_range"), // 가격대 (예: $, $$, $$$)
  tags: jsonb("tags").$type<string[]>().default([]), // 태그 (예: ["해산물", "현지인맛집"])
  isPartner: boolean("is_partner").default(false), // 협력업체 여부
  discountText: text("discount_text"), // 할인 텍스트 (예: "붕따우 도깨비 카톡으로 예약 시 5% 할인")
  menuImages: jsonb("menu_images").$type<string[]>().default([]), // 메뉴판 이미지들
  isActive: boolean("is_active").default(true), // 활성화 여부
  sortOrder: integer("sort_order").default(0), // 정렬 순서
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlaceSchema = createInsertSchema(places).omit({ id: true, createdAt: true, updatedAt: true });

export type Place = typeof places.$inferSelect;
export type InsertPlace = z.infer<typeof insertPlaceSchema>;

// 장소 카테고리 테이블 (관리자가 추가/수정/삭제/순서변경 가능)
export const placeCategories = pgTable("place_categories", {
  id: text("id").primaryKey(), // 카테고리 ID (예: "attraction", "nightlife18")
  labelKo: text("label_ko").notNull(), // 한국어 라벨
  labelEn: text("label_en").notNull(), // 영어 라벨
  labelZh: text("label_zh"), // 중국어 라벨
  labelVi: text("label_vi"), // 베트남어 라벨
  labelRu: text("label_ru"), // 러시아어 라벨
  labelJa: text("label_ja"), // 일본어 라벨
  color: text("color").default("#64748b"), // 지도 마커 색상
  gradient: text("gradient").default("from-gray-600 to-gray-700"), // 그라데이션 클래스
  icon: text("icon").default("MapPin"), // 아이콘 이름 (Lucide 아이콘)
  sortOrder: integer("sort_order").default(0), // 정렬 순서
  isActive: boolean("is_active").default(true), // 활성화 여부
  isAdultOnly: boolean("is_adult_only").default(false), // 성인 전용 (카카오 남성만)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlaceCategorySchema = createInsertSchema(placeCategories).omit({ createdAt: true, updatedAt: true });

export type PlaceCategory = typeof placeCategories.$inferSelect;
export type InsertPlaceCategory = z.infer<typeof insertPlaceCategorySchema>;

// 사이트 설정 (관리자가 수정 가능한 텍스트 등)
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // 설정 키 (예: "villa_price_note", "lowest_price_guarantee")
  value: text("value").notNull(), // 설정 값
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({ id: true, updatedAt: true });

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;

// === 회원 관리, 쪽지, 쿠폰, 공지사항 시스템 ===

// 관리자 쪽지 테이블
export const adminMessages = pgTable("admin_messages", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id").notNull(), // 발신자 ID (관리자)
  receiverId: text("receiver_id").notNull(), // 수신자 ID
  title: text("title").notNull(), // 제목
  content: text("content").notNull(), // 내용
  isRead: boolean("is_read").default(false), // 읽음 여부
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdminMessageSchema = createInsertSchema(adminMessages).omit({ id: true, createdAt: true, senderId: true });
export type AdminMessage = typeof adminMessages.$inferSelect;
export type InsertAdminMessage = z.infer<typeof insertAdminMessageSchema>;

// 쿠폰 테이블 (관리자가 생성하는 쿠폰 템플릿)
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // 쿠폰 이름
  description: text("description"), // 쿠폰 설명
  discountType: text("discount_type").notNull().default("percent"), // percent(%), fixed(고정금액), service(서비스항목)
  discountValue: integer("discount_value").notNull().default(0), // 할인 값
  serviceDescription: text("service_description"), // 서비스항목 설명 (discountType이 service일 때)
  validFrom: timestamp("valid_from"), // 유효 시작일
  validUntil: timestamp("valid_until"), // 유효 종료일
  placeId: integer("place_id"), // 연결된 관광명소/장소 ID
  isActive: boolean("is_active").default(true), // 활성화 여부
  isWelcomeCoupon: boolean("is_welcome_coupon").default(false), // 첫 로그인 쿠폰 여부
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCouponSchema = createInsertSchema(coupons).omit({ id: true, createdAt: true });
export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;

// 사용자 쿠폰 테이블 (개별 사용자에게 발급된 쿠폰)
export const userCoupons = pgTable("user_coupons", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // 사용자 ID
  couponId: integer("coupon_id").notNull(), // 쿠폰 ID
  isUsed: boolean("is_used").default(false), // 사용 여부
  usedAt: timestamp("used_at"), // 사용일시
  issuedAt: timestamp("issued_at").defaultNow(), // 발급일시
});

export const insertUserCouponSchema = createInsertSchema(userCoupons).omit({ id: true, issuedAt: true });
export type UserCoupon = typeof userCoupons.$inferSelect;
export type InsertUserCoupon = z.infer<typeof insertUserCouponSchema>;

// 공지사항/배너 테이블
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(), // 제목
  content: text("content"), // 내용
  imageUrl: text("image_url"), // 배너 이미지 URL
  linkUrl: text("link_url"), // 클릭 시 이동할 URL
  type: text("type").notNull().default("banner"), // banner(배너), popup(팝업), notice(공지)
  isActive: boolean("is_active").default(true), // 활성화 여부
  sortOrder: integer("sort_order").default(0), // 정렬 순서
  startDate: timestamp("start_date"), // 표시 시작일
  endDate: timestamp("end_date"), // 표시 종료일
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true, updatedAt: true });
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;

// 관리자 알림 (신규회원, 로그인 등)
export const adminNotifications = pgTable("admin_notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "new_member", "login"
  userId: text("user_id").notNull(), // 알림 대상 사용자 ID
  userEmail: text("user_email"), // 사용자 이메일
  userNickname: text("user_nickname"), // 사용자 닉네임
  message: text("message").notNull(), // 알림 메시지
  isRead: boolean("is_read").default(false), // 읽음 여부
  createdAt: timestamp("created_at").defaultNow(),
});

export type AdminNotification = typeof adminNotifications.$inferSelect;

// 견적 커스텀 카테고리 (관리자가 추가하는 관광코스 등)
export const quoteCategories = pgTable("quote_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  imageUrl: text("image_url").default(""),
  images: text("images").array().default([]),
  pricePerUnit: integer("price_per_unit").notNull().default(0),
  unitLabel: text("unit_label").notNull().default("인"),
  options: text("options").default("[]"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQuoteCategorySchema = createInsertSchema(quoteCategories).omit({ id: true, createdAt: true, updatedAt: true });
export type QuoteCategory = typeof quoteCategories.$inferSelect;
export type InsertQuoteCategory = z.infer<typeof insertQuoteCategorySchema>;

// 고객센터 채팅방
export const customerChatRooms = pgTable("customer_chat_rooms", {
  id: serial("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  visitorName: text("visitor_name").notNull().default("방문자"),
  status: text("status").notNull().default("open"),
  lastMessage: text("last_message"),
  lastMessageAt: timestamp("last_message_at"),
  unreadByAdmin: integer("unread_by_admin").default(0),
  unreadByVisitor: integer("unread_by_visitor").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CustomerChatRoom = typeof customerChatRooms.$inferSelect;

// 고객센터 채팅 메시지
export const customerChatMessages = pgTable("customer_chat_messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  senderId: text("sender_id").notNull(),
  senderRole: text("sender_role").notNull().default("customer"),
  senderName: text("sender_name").notNull().default("방문자"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CustomerChatMessage = typeof customerChatMessages.$inferSelect;

// 쇼핑 상품
export const shopProducts = pgTable("shop_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  brand: text("brand").default(""),
  price: integer("price").notNull().default(0),
  quantity: text("quantity").default(""),
  description: text("description").default(""),
  image: text("image").default(""),
  images: text("images").array().default([]),
  benefits: text("benefits").array().default([]),
  ingredients: text("ingredients").default(""),
  usage: text("usage").default(""),
  caution: text("caution").default(""),
  gradient: text("gradient").default("from-primary to-purple-600"),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertShopProductSchema = createInsertSchema(shopProducts).omit({ id: true, createdAt: true, updatedAt: true });
export type ShopProduct = typeof shopProducts.$inferSelect;
export type InsertShopProduct = z.infer<typeof insertShopProductSchema>;

export const ecoProfiles = pgTable("eco_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEcoProfileSchema = createInsertSchema(ecoProfiles).omit({ id: true, createdAt: true });
export type EcoProfile = typeof ecoProfiles.$inferSelect;
export type InsertEcoProfile = z.infer<typeof insertEcoProfileSchema>;
