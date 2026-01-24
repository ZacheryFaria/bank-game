import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

let testPrisma: PrismaClient | null = null;

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/bank_game_test";

export async function setupTestDatabase() {
  process.env.DATABASE_URL = TEST_DB_URL;

  try {
    execSync("pnpm prisma db push --skip-generate --accept-data-loss", {
      env: { ...process.env, DATABASE_URL: TEST_DB_URL },
      stdio: "pipe",
    });
  } catch (error) {
    console.error("Failed to push schema:", error);
    throw error;
  }

  testPrisma = new PrismaClient({
    datasources: {
      db: {
        url: TEST_DB_URL,
      },
    },
  });

  await testPrisma.$connect();

  return testPrisma;
}

export async function cleanupTestDatabase() {
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = null;
  }
}

export async function resetTestDatabase(prisma: PrismaClient) {
  const tables = [
    "quarterly_snapshots",
    "collections",
    "transactions",
    "deposit_buckets",
    "loan_buckets",
    "bank_allocation",
    "bank_rates",
    "banks",
    "users",
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM ${table}`);
  }
}

export function getTestPrisma(): PrismaClient {
  if (!testPrisma) {
    throw new Error(
      "Test database not initialized. Call setupTestDatabase() first.",
    );
  }
  return testPrisma;
}
