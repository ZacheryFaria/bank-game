import { beforeAll, afterAll } from "vitest";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-for-testing-only";
process.env.REFRESH_TOKEN_SECRET = "test-refresh-token-secret-for-testing-only";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/bank_game_test";

beforeAll(() => {
  // Setup runs before any imports
});

afterAll(() => {
  // Global cleanup if needed
});
