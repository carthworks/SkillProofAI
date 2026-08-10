import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

// Add an extension for slow query logging
export const prisma = prismaClient.$extends({
  query: {
    async $allOperations({ operation, model, args, query }) {
      const start = performance.now();
      const result = await query(args);
      const end = performance.now();
      const time = end - start;
      
      if (time > 500) {
        console.warn(`[Slow Query Alert] ${model || 'Unknown'}.${operation} took ${time.toFixed(2)}ms`);
      }
      
      return result;
    },
  },
});
