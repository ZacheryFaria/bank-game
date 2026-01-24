import { beforeAll, afterAll } from "vitest";

beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-jwt-secret-for-testing-only";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-for-testing-only";
  if (!process.env.TEST_DATABASE_URL) {
    process.env.TEST_DATABASE_URL =
      "postgresql://postgres:postgres@localhost:5432/bank_game_test";
  }
});

afterAll(() => {
  // Global cleanup if needed
});
