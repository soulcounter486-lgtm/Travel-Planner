import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { calculateQuoteSchema } from "@shared/schema";
import { addDays, getDay, parseISO } from "date-fns";

let exchangeRateCache: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION = 12 * 60 * 60 * 1000;

async function getExchangeRate(): Promise<number> {
  if (exchangeRateCache && Date.now() - exchangeRateCache.timestamp < CACHE_DURATION) {
    return exchangeRateCache.rate;
  }
  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=USD&to=KRW");
    const data = await response.json() as { rates: { KRW: number } };
    const rate = data.rates?.KRW || 1350;
    exchangeRateCache = { rate, timestamp: Date.now() };
    return rate;
  } catch (error) {
    console.error("Exchange rate fetch error:", error);
    return exchangeRateCache?.rate || 1350;
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/exchange-rate", async (req, res) => {
    try {
      const rate = await getExchangeRate();
      res.json({ rate, timestamp: exchangeRateCache?.timestamp || Date.now() });
    } catch (error) {
      res.status(500).json({ rate: 1350, timestamp: Date.now() });
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

  return httpServer;
}
