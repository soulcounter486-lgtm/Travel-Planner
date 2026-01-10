import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { calculateQuoteSchema } from "@shared/schema";
import { addDays, differenceInDays, getDay, parseISO, isSameDay } from "date-fns";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Vehicle Pricing Table
  // Type -> { city, oneway, roundtrip }
  // City hours are informational for this logic, but prices are key
  const vehiclePrices: Record<string, { city: number; oneway: number; roundtrip: number }> = {
    "7_seater": { city: 100, oneway: 80, roundtrip: 150 },
    "16_seater": { city: 130, oneway: 130, roundtrip: 250 },
    "9_limo": { city: 160, oneway: 160, roundtrip: 300 },
    "9_lux_limo": { city: 210, oneway: 210, roundtrip: 400 },
    "12_lux_limo": { city: 250, oneway: 250, roundtrip: 480 },
    "16_lux_limo": { city: 280, oneway: 280, roundtrip: 530 },
    "29_seater": { city: 230, oneway: 230, roundtrip: 430 },
  };

  app.post(api.quotes.calculate.path, (req, res) => {
    try {
      const input = calculateQuoteSchema.parse(req.body);
      
      let total = 0;
      const breakdown = {
        villa: { price: 0, details: [] as string[] },
        vehicle: { price: 0, description: "" },
        ecoGirl: { price: 0, description: "" },
        guide: { price: 0, description: "" },
        total: 0
      };

      // 1. Villa Calculation
      if (input.villa?.enabled && input.villa.checkIn && input.villa.checkOut) {
        let current = parseISO(input.villa.checkIn);
        const end = parseISO(input.villa.checkOut);
        
        // Calculate nights (days between checkin and checkout)
        // If checkIn = checkOut, it's 0 nights
        // Iterate until current < end
        
        while (current < end) {
          const dayOfWeek = getDay(current); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
          let dailyPrice = 350; // Default (Sun-Thu)
          let dayName = "Weekday";

          if (dayOfWeek === 5) { // Friday
            dailyPrice = 380;
            dayName = "Friday";
          } else if (dayOfWeek === 6) { // Saturday
            dailyPrice = 500;
            dayName = "Saturday";
          } else if (dayOfWeek === 0) { // Sunday is Weekday per spec
            dailyPrice = 350;
             dayName = "Sunday (Weekday rate)";
          }

          breakdown.villa.price += dailyPrice;
          breakdown.villa.details.push(`${dayName}: $${dailyPrice}`);
          
          current = addDays(current, 1);
        }
      }

      // 2. Vehicle Calculation
      if (input.vehicle?.enabled && input.vehicle.type) {
        const prices = vehiclePrices[input.vehicle.type];
        if (prices) {
          let basePrice = 0;
          let description = "";
          const days = input.vehicle.days || 1;

          switch (input.vehicle.route) {
            case "city":
              basePrice = prices.city;
              description = `City Tour (${days} days)`;
              break;
            case "oneway":
              basePrice = prices.oneway;
              description = `One Way (${days} trips)`;
              break;
            case "roundtrip":
              basePrice = prices.roundtrip;
              description = `Round Trip (${days} trips)`;
              break;
            case "city_pickup_drop":
              // "Pickup, drop + City use is city amount + 50%"
              basePrice = prices.city * 1.5;
              description = `Pickup/Drop + City Tour (${days} days)`;
              break;
          }

          breakdown.vehicle.price = basePrice * days;
          breakdown.vehicle.description = `${input.vehicle.type.replace(/_/g, " ")} - ${description}`;
        }
      }

      // 3. Eco Girl Calculation
      if (input.ecoGirl?.enabled) {
        const rate = 220;
        const count = input.ecoGirl.count;
        const nights = input.ecoGirl.nights;
        breakdown.ecoGirl.price = rate * count * nights;
        breakdown.ecoGirl.description = `${count} Girls x ${nights} Nights @ $${rate}`;
      }

      // 4. Guide Calculation
      if (input.guide?.enabled) {
        const baseRate = 120;
        const extraRate = 20;
        const days = input.guide.days;
        const groupSize = input.guide.groupSize;
        
        let dailyTotal = baseRate;
        if (groupSize > 4) {
          dailyTotal += (groupSize - 4) * extraRate;
        }

        breakdown.guide.price = dailyTotal * days;
        breakdown.guide.description = `${days} Days for ${groupSize} People (Base $120 + Extra)`;
      }

      // Final Total
      breakdown.total = 
        breakdown.villa.price + 
        breakdown.vehicle.price + 
        breakdown.ecoGirl.price + 
        breakdown.guide.price;

      res.json(breakdown);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.quotes.create.path, async (req, res) => {
    try {
      const input = api.quotes.create.input.parse(req.body);
      const quote = await storage.createQuote(input);
      res.status(201).json(quote);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get(api.quotes.list.path, async (req, res) => {
    const quotes = await storage.getQuotes();
    res.json(quotes);
  });

  return httpServer;
}
