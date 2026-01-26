import { db } from "./db";
import { eq, desc, and, isNull, or } from "drizzle-orm";
import {
  quotes,
  type InsertQuote,
  type Quote
} from "@shared/schema";

export interface IStorage {
  createQuote(quote: InsertQuote & { userId?: string }): Promise<Quote>;
  getQuotesByUser(userId?: string): Promise<Quote[]>;
  deleteQuote(id: number, userId?: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createQuote(insertQuote: InsertQuote & { userId?: string }): Promise<Quote> {
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
}

export const storage = new DatabaseStorage();
