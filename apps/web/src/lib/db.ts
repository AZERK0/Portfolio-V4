import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalDatabase = globalThis as typeof globalThis & {
  portfolioDatabase?: PrismaClient;
};

export function getDatabase(): PrismaClient | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  if (!globalDatabase.portfolioDatabase) {
    const adapter = new PrismaPg({
      connectionString,
      max: 3,
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 10000,
      statement_timeout: 5000,
    });
    globalDatabase.portfolioDatabase = new PrismaClient({ adapter });
  }

  return globalDatabase.portfolioDatabase;
}
