import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email"),
  password: varchar("password"), // 해시된 비밀번호 (이메일 가입 시)
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  nickname: varchar("nickname"), // 별명
  profileImageUrl: varchar("profile_image_url"),
  gender: varchar("gender"), // 성별 (male, female)
  birthDate: varchar("birth_date"), // 생년월일 (YYYY-MM-DD)
  loginMethod: varchar("login_method"), // 로그인 방법 (email, kakao, google, replit)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
