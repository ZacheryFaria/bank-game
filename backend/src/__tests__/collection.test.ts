import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  resetTestDatabase,
} from "./helpers/testDb.js";
import { createTestServer, closeTestServer } from "./helpers/testServer.js";
import {
  createTestUser,
  createAuthHeader,
  hoursAgo,
  secondsAgo,
} from "./helpers/factories.js";
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";

describe("Collection API Integration Tests", () => {
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

  describe("POST /api/bank/collect", () => {
    it("should require authentication", async () => {
      const response = await server.inject({
        method: "POST",
        url: "/api/bank/collect",
        payload: {},
      });

      expect(response.statusCode).toBe(401);
    });

    it("should successfully collect after cooldown period", async () => {
      const userData = createTestUser();

      const registerResponse = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: userData,
      });
      const { token, user } = JSON.parse(registerResponse.body);

      await prisma.bank.update({
        where: { id: user.bank.id },
        data: { lastCollectedAt: secondsAgo(61) },
      });

      const response = await server.inject({
        method: "POST",
        url: "/api/bank/collect",
        headers: createAuthHeader(token),
        payload: {},
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.gameTimeStart).toBeDefined();
      expect(body.gameTimeEnd).toBeDefined();
      expect(body.realHoursElapsed).toBeGreaterThan(0);
      expect(body.gameQuartersElapsed).toBeGreaterThan(0);
      expect(body.endingEquity).toBeDefined();
      expect(body.endingLoans).toBeDefined();
      expect(body.endingDeposits).toBeDefined();
      expect(body.transactions).toBeDefined();
      expect(Array.isArray(body.transactions)).toBe(true);
    });

    it("should enforce rate limit (429 if collected < 60s ago)", async () => {
      const userData = createTestUser();

      const registerResponse = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: userData,
      });
      const { token } = JSON.parse(registerResponse.body);

      const response = await server.inject({
        method: "POST",
        url: "/api/bank/collect",
        headers: createAuthHeader(token),
        payload: {},
      });

      expect(response.statusCode).toBe(429);
      const body = JSON.parse(response.body);
      expect(body.error).toBeDefined();
      expect(body.retryAfter).toBeGreaterThan(0);
    });

    it("should update bank state after collection", async () => {
      const userData = createTestUser();

      const registerResponse = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: userData,
      });
      const { token, user } = JSON.parse(registerResponse.body);

      const bankBefore = await prisma.bank.findUnique({
        where: { id: user.bank.id },
      });

      await prisma.bank.update({
        where: { id: user.bank.id },
        data: { lastCollectedAt: secondsAgo(61) },
      });

      const response = await server.inject({
        method: "POST",
        url: "/api/bank/collect",
        headers: createAuthHeader(token),
        payload: {},
      });

      expect(response.statusCode).toBe(200);

      const bankAfter = await prisma.bank.findUnique({
        where: { id: user.bank.id },
      });

      expect(bankAfter!.lastCollectedAt.getTime()).toBeGreaterThan(
        bankBefore!.lastCollectedAt.getTime()
      );
    });

    it("should create collection record in database", async () => {
      const userData = createTestUser();

      const registerResponse = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: userData,
      });
      const { token, user } = JSON.parse(registerResponse.body);

      await prisma.bank.update({
        where: { id: user.bank.id },
        data: { lastCollectedAt: secondsAgo(61) },
      });

      const collectionsBefore = await prisma.collection.count({
        where: { bankId: user.bank.id },
      });

      const response = await server.inject({
        method: "POST",
        url: "/api/bank/collect",
        headers: createAuthHeader(token),
        payload: {},
      });

      expect(response.statusCode).toBe(200);

      const collectionsAfter = await prisma.collection.count({
        where: { bankId: user.bank.id },
      });

      expect(collectionsAfter).toBe(collectionsBefore + 1);
    });

    it("should create transactions during collection", async () => {
      const userData = createTestUser();

      const registerResponse = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: userData,
      });
      const { token, user } = JSON.parse(registerResponse.body);

      await prisma.bank.update({
        where: { id: user.bank.id },
        data: { lastCollectedAt: hoursAgo(1) },
      });

      const transactionsBefore = await prisma.transaction.count({
        where: { bankId: user.bank.id },
      });

      const response = await server.inject({
        method: "POST",
        url: "/api/bank/collect",
        headers: createAuthHeader(token),
        payload: {},
      });

      expect(response.statusCode).toBe(200);

      const transactionsAfter = await prisma.transaction.count({
        where: { bankId: user.bank.id },
      });

      expect(transactionsAfter).toBeGreaterThan(transactionsBefore);
    });

    it("should create deposit buckets with accrued interest", async () => {
      const userData = createTestUser();

      const registerResponse = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: userData,
      });
      const { token, user } = JSON.parse(registerResponse.body);

      await prisma.bank.update({
        where: { id: user.bank.id },
        data: { lastCollectedAt: hoursAgo(1) },
      });

      const response = await server.inject({
        method: "POST",
        url: "/api/bank/collect",
        headers: createAuthHeader(token),
        payload: {},
      });

      expect(response.statusCode).toBe(200);

      const depositBuckets = await prisma.depositBucket.findMany({
        where: { bankId: user.bank.id },
      });

      expect(depositBuckets.length).toBeGreaterThan(0);
    });

    it("should accrue interest on existing deposits over multiple collections", async () => {
      const userData = createTestUser();

      const registerResponse = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: userData,
      });
      const { token, user } = JSON.parse(registerResponse.body);

      await prisma.bank.update({
        where: { id: user.bank.id },
        data: { lastCollectedAt: hoursAgo(1) },
      });

      const firstResponse = await server.inject({
        method: "POST",
        url: "/api/bank/collect",
        headers: createAuthHeader(token),
        payload: {},
      });
      expect(firstResponse.statusCode).toBe(200);

      const firstDeposits = await prisma.depositBucket.findMany({
        where: { bankId: user.bank.id },
      });
      const firstTotalDeposits = firstDeposits.reduce(
        (sum, b) => sum + Number(b.currentBalance),
        0
      );

      await prisma.bank.update({
        where: { id: user.bank.id },
        data: { lastCollectedAt: hoursAgo(1) },
      });

      const secondResponse = await server.inject({
        method: "POST",
        url: "/api/bank/collect",
        headers: createAuthHeader(token),
        payload: {},
      });
      expect(secondResponse.statusCode).toBe(200);

      const secondDeposits = await prisma.depositBucket.findMany({
        where: { bankId: user.bank.id },
      });
      const secondTotalDeposits = secondDeposits.reduce(
        (sum, b) => sum + Number(b.currentBalance),
        0
      );

      expect(secondTotalDeposits).toBeGreaterThan(firstTotalDeposits);
    });

    it("should calculate endingLoans from actual bucket balances, not denormalized currentLoans", async () => {
      const userData = createTestUser();

      const registerResponse = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: userData,
      });
      const { token, user } = JSON.parse(registerResponse.body);

      // Simulate a database inconsistency: set currentLoans to incorrect value
      // This mimics the scenario where denormalized currentLoans drifted from actual bucket sum
      await prisma.bank.update({
        where: { id: user.bank.id },
        data: {
          lastCollectedAt: hoursAgo(1),
          currentLoans: 999999, // Intentionally wrong value
        },
      });

      // Get actual sum of loan bucket balances
      const loanBuckets = await prisma.loanBucket.findMany({
        where: { bankId: user.bank.id },
      });
      const actualLoanBalance = loanBuckets.reduce(
        (sum, b) => sum + Number(b.currentBalance),
        0
      );

      // Verify currentLoans is indeed wrong (different from bucket sum)
      expect(actualLoanBalance).not.toBe(999999);

      // Run collection
      const response = await server.inject({
        method: "POST",
        url: "/api/bank/collect",
        headers: createAuthHeader(token),
        payload: {},
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Get final bucket balances after collection
      const finalBuckets = await prisma.loanBucket.findMany({
        where: { bankId: user.bank.id },
      });
      const finalActualBalance = finalBuckets.reduce(
        (sum, b) => sum + Number(b.currentBalance),
        0
      );

      // endingLoans should match actual bucket sum, NOT the incorrect denormalized value
      // Allow for small floating point differences
      expect(Math.abs(body.endingLoans - finalActualBalance)).toBeLessThan(0.01);

      // Verify the bank record was updated with correct value
      const updatedBank = await prisma.bank.findUnique({
        where: { id: user.bank.id },
      });
      expect(Math.abs(Number(updatedBank!.currentLoans) - finalActualBalance)).toBeLessThan(0.01);
    });

    it("should calculate endingDeposits from actual bucket balances, not denormalized currentDeposits", async () => {
      const userData = createTestUser();

      const registerResponse = await server.inject({
        method: "POST",
        url: "/api/auth/register",
        payload: userData,
      });
      const { token, user } = JSON.parse(registerResponse.body);

      // Simulate database inconsistency for deposits
      await prisma.bank.update({
        where: { id: user.bank.id },
        data: {
          lastCollectedAt: hoursAgo(1),
          currentDeposits: 888888, // Intentionally wrong value
        },
      });

      // Get actual sum of deposit bucket balances
      const depositBuckets = await prisma.depositBucket.findMany({
        where: { bankId: user.bank.id },
      });
      const actualDepositBalance = depositBuckets.reduce(
        (sum, b) => sum + Number(b.currentBalance),
        0
      );

      // Verify currentDeposits is wrong
      expect(actualDepositBalance).not.toBe(888888);

      // Run collection
      const response = await server.inject({
        method: "POST",
        url: "/api/bank/collect",
        headers: createAuthHeader(token),
        payload: {},
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      // Get final bucket balances
      const finalBuckets = await prisma.depositBucket.findMany({
        where: { bankId: user.bank.id },
      });
      const finalActualBalance = finalBuckets.reduce(
        (sum, b) => sum + Number(b.currentBalance),
        0
      );

      // endingDeposits should match actual bucket sum
      expect(Math.abs(body.endingDeposits - finalActualBalance)).toBeLessThan(0.01);

      // Verify the bank record was updated with correct value
      const updatedBank = await prisma.bank.findUnique({
        where: { id: user.bank.id },
      });
      expect(Math.abs(Number(updatedBank!.currentDeposits) - finalActualBalance)).toBeLessThan(0.01);
    });
  });
});
