import { db } from "./db";
import { eq, desc, and, isNull, or } from "drizzle-orm";
import {
  quotes,
  type InsertQuote,
  type Quote
} from "@shared/schema";

export interface IStorage {
  createQuote(quote: InsertQuote & { userId?: string; checkInDate?: string; checkOutDate?: string }): Promise<Quote>;
  getQuotesByUser(userId?: string): Promise<Quote[]>;
  deleteQuote(id: number, userId?: string): Promise<void>;
  updateQuoteDepositStatus(id: number, depositPaid: boolean): Promise<Quote | null>;
  getDepositPaidQuotes(): Promise<Quote[]>;
}

export class DatabaseStorage implements IStorage {
  async createQuote(insertQuote: InsertQuote & { userId?: string; checkInDate?: string; checkOutDate?: string }): Promise<Quote> {
    const [quote] = await db.insert(quotes).values(insertQuote).returning();
    return quote;
  }

  async getQuotesByUser(userId?: string): Promise<Quote[]> {
    if (userId) {
      return await db.select().from(quotes).where(eq(quotes.userId, userId)).orderBy(desc(quotes.createdAt));
    }
    return [];
  }

  async deleteQuote(id: number, userId?: string): Promise<void> {
    if (userId) {
      await db.delete(quotes).where(and(eq(quotes.id, id), eq(quotes.userId, userId)));
    }
  }

  async updateQuoteDepositStatus(id: number, depositPaid: boolean): Promise<Quote | null> {
    const [quote] = await db.update(quotes).set({ depositPaid }).where(eq(quotes.id, id)).returning();
    return quote || null;
  }

  async updateQuoteMemo(id: number, memo: string): Promise<Quote | null> {
    const [quote] = await db.update(quotes).set({ memo }).where(eq(quotes.id, id)).returning();
    return quote || null;
  }

  async updateQuoteMemoImages(id: number, memoImages: string[]): Promise<Quote | null> {
    const [quote] = await db.update(quotes).set({ memoImages }).where(eq(quotes.id, id)).returning();
    return quote || null;
  }

  async updateQuoteTotal(id: number, totalPrice: number): Promise<Quote | null> {
    const [quote] = await db.update(quotes).set({ totalPrice }).where(eq(quotes.id, id)).returning();
    return quote || null;
  }

  async updateQuoteTotalAndBreakdown(id: number, totalPrice: number, breakdown: any, depositAmount?: number): Promise<Quote | null> {
    const updateData: any = { totalPrice, breakdown };
    if (depositAmount !== undefined) {
      updateData.depositAmount = depositAmount;
    }
    const [quote] = await db.update(quotes).set(updateData).where(eq(quotes.id, id)).returning();
    return quote || null;
  }

  async getDepositPaidQuotes(): Promise<Quote[]> {
    return await db.select().from(quotes).where(eq(quotes.depositPaid, true)).orderBy(desc(quotes.createdAt));
  }
}

export const storage = new DatabaseStorage();
