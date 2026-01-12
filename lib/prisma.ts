import { Pool, PoolConfig } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

// Global scope for Prisma instance to prevent multiple connections in dev
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Database Connection Pooling & SSL Configuration
const poolConfig: PoolConfig = {
  connectionString,
  max: 10, // Default pool sizing, adjustable based on load/tier
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000, 
  ssl: process.env.NODE_ENV === "production" 
    ? { rejectUnauthorized: false } // Common for cloud DBs; adjust for strict CA compliance if needed
    : undefined,
};

const pool = new Pool(poolConfig);
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
