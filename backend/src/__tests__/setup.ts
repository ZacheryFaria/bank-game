import { beforeAll, afterAll } from "vitest";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-for-testing-only";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-token-secret-for-testing-only";

// Allow custom test DB URL, but validate it's actually a test database
const dbUrl = process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/bank_game_test";

// Safety check: ensure we're not accidentally testing against prod
if (!dbUrl.includes('_test') && !dbUrl.includes('test_')) {
  throw new Error(
    `DATABASE_URL must contain "_test" or "test_" to prevent accidental data loss. ` +
    `Got: ${dbUrl.replace(/:[^:@]+@/, ':***@')}` // hide password in error
  );
}

process.env.DATABASE_URL = dbUrl;

beforeAll(() => {
  // Setup runs before any imports
});

afterAll(() => {
  // Global cleanup if needed
});
