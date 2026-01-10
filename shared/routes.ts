import { z } from 'zod';
import { calculateQuoteSchema, quoteBreakdownSchema, insertQuoteSchema, quotes } from './schema';

export const api = {
  quotes: {
    calculate: {
      method: 'POST' as const,
      path: '/api/quotes/calculate',
      input: calculateQuoteSchema,
      responses: {
        200: quoteBreakdownSchema,
        400: z.object({ message: z.string() }),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/quotes',
      input: insertQuoteSchema,
      responses: {
        201: z.custom<typeof quotes.$inferSelect>(),
        400: z.object({ message: z.string() }),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/quotes',
      responses: {
        200: z.array(z.custom<typeof quotes.$inferSelect>()),
      },
    },
  },
};
