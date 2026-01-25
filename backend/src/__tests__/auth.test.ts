import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  resetTestDatabase,
  getTestPrisma,
} from "./helpers/testDb.js";
import { createTestServer, closeTestServer } from "./helpers/testServer.js";
import { createTestUser } from "./helpers/factories.js";
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

describe("Auth API Integration Tests", () => {
  let server: FastifyInstance;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
    server = await createTestServer();
  });

  afterAll(async () => {
    await closeTestServer(server);
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase(prisma);
  });

  describe("POST /api/auth/register", () => {
    it("should successfully create new account with valid data", async () => {
      const userData = createTestUser();

      const response = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: userData,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.token).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe(userData.email);
      expect(body.user.bank).toBeDefined();
      expect(body.user.bank.name).toBe(userData.bankName);

      const tokenPayload = jwt.verify(
        body.token,
        process.env.JWT_SECRET!
      ) as any;
      expect(tokenPayload.userId).toBeDefined();
      expect(tokenPayload.email).toBe(userData.email);

      const dbUser = await prisma.user.findUnique({
        where: { email: userData.email },
        include: { bank: true },
      });
      expect(dbUser).toBeDefined();
      expect(dbUser!.email).toBe(userData.email);
      expect(dbUser!.bank).toBeDefined();
      expect(dbUser!.bank.name).toBe(userData.bankName);

      const bankRates = await prisma.bankRate.findMany({
        where: { bankId: dbUser!.bank.id },
      });
      expect(bankRates.length).toBeGreaterThan(0);

      const bankAllocations = await prisma.bankAllocation.findMany({
        where: { bankId: dbUser!.bank.id },
      });
      expect(bankAllocations.length).toBe(4);

      const transactions = await prisma.transaction.findMany({
        where: { bankId: dbUser!.bank.id },
      });
      expect(transactions.length).toBe(1);
      expect(transactions[0].type).toBe("initial_funding");
    });

    it("should reject duplicate email registration", async () => {
      const userData = createTestUser();

      await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: userData,
      });

      const response = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: userData,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Email already registered");
    });

    it("should reject registration with missing email", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          password: "password123",
          bankName: "Test Bank",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should reject registration with missing password", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email: "test@example.com",
          bankName: "Test Bank",
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it("should reject registration with missing bankName", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: {
          email: "test@example.com",
          password: "password123",
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should successfully login with valid credentials", async () => {
      const userData = createTestUser();

      await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: userData,
      });

      const response = await server.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email: userData.email,
          password: userData.password,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.token).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe(userData.email);

      const tokenPayload = jwt.decode(body.token) as any;
      expect(tokenPayload.userId).toBeDefined();
      expect(tokenPayload.email).toBe(userData.email);

      const refreshPayload = jwt.decode(body.refreshToken) as any;
      expect(refreshPayload.userId).toBeDefined();
      expect(refreshPayload.email).toBe(userData.email);
    });

    it("should reject login with invalid email (user does not exist)", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email: "nonexistent@example.com",
          password: "password123",
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Invalid credentials");
    });

    it("should reject login with invalid password", async () => {
      const userData = createTestUser();

      await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: userData,
      });

      const response = await server.inject({
        method: "POST",
        url: "/api/auth/login",
        payload: {
          email: userData.email,
          password: "wrongpassword",
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Invalid credentials");
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("should successfully refresh with valid refresh token", async () => {
      const userData = createTestUser();

      const registerResponse = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: userData,
      });
      const registerBody = JSON.parse(registerResponse.body);
      const originalToken = registerBody.token;
      const originalRefreshToken = registerBody.refreshToken;

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await server.inject({
        method: "POST",
        url: "/api/auth/refresh",
        payload: {
          refreshToken: originalRefreshToken,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.token).toBeDefined();
      expect(body.refreshToken).toBeDefined();

      expect(body.token).not.toBe(originalToken);
      expect(body.refreshToken).not.toBe(originalRefreshToken);

      const tokenPayload = jwt.verify(
        body.token,
        process.env.JWT_SECRET!
      ) as any;
      expect(tokenPayload.userId).toBeDefined();
      expect(tokenPayload.email).toBe(userData.email);
    });

    it("should reject invalid refresh token", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/api/auth/refresh",
        payload: {
          refreshToken: "invalid-token",
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();
    });

    it("should reject reused refresh token (after rotation)", async () => {
      const userData = createTestUser();

      const registerResponse = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: userData,
      });
      const registerBody = JSON.parse(registerResponse.body);
      const originalRefreshToken = registerBody.refreshToken;

      await new Promise((resolve) => setTimeout(resolve, 1100));

      const firstRefreshResponse = await server.inject({
        method: "POST",
        url: "/api/auth/refresh",
        payload: { refreshToken: originalRefreshToken },
      });
      const firstRefreshBody = JSON.parse(firstRefreshResponse.body);

      expect(firstRefreshResponse.statusCode).toBe(200);
      expect(firstRefreshBody.refreshToken).toBeDefined();
      expect(firstRefreshBody.refreshToken).not.toBe(originalRefreshToken);

      const secondRefreshResponse = await server.inject({
        method: "POST",
        url: "/api/auth/refresh",
        payload: { refreshToken: originalRefreshToken },
      });

      expect(secondRefreshResponse.statusCode).toBe(401);
      const body = JSON.parse(secondRefreshResponse.body);
      expect(body.error).toBe("Invalid refresh token");
    });

    it("should reject refresh token for deleted user", async () => {
      const userData = createTestUser();

      const registerResponse = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: userData,
      });
      const registerBody = JSON.parse(registerResponse.body);
      const refreshToken = registerBody.refreshToken;
      const userId = registerBody.user.id;

      await prisma.user.delete({
        where: { id: userId },
      });

      const response = await server.inject({
        method: "POST",
        url: "/api/auth/refresh",
        payload: {
          refreshToken,
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe("Invalid refresh token");
    });
  });
});
