import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import {
  quotes,
  type InsertQuote,
  type Quote
} from "@shared/schema";

export interface IStorage {
  createQuote(quote: InsertQuote): Promise<Quote>;
  getQuotes(): Promise<Quote[]>;
  deleteQuote(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const [quote] = await db.insert(quotes).values(insertQuote).returning();
    return quote;
  }

  async getQuotes(): Promise<Quote[]> {
    return await db.select().from(quotes).orderBy(desc(quotes.createdAt));
  }

  async deleteQuote(id: number): Promise<void> {
    await db.delete(quotes).where(eq(quotes.id, id));
  }
}

export const storage = new DatabaseStorage();
