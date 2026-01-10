import { db } from "./db";
import {
  quotes,
  type InsertQuote,
  type Quote
} from "@shared/schema";

export interface IStorage {
  createQuote(quote: InsertQuote): Promise<Quote>;
  getQuotes(): Promise<Quote[]>;
}

export class DatabaseStorage implements IStorage {
  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const [quote] = await db.insert(quotes).values(insertQuote).returning();
    return quote;
  }

  async getQuotes(): Promise<Quote[]> {
    return await db.select().from(quotes).orderBy(quotes.createdAt);
  }
}

export const storage = new DatabaseStorage();
