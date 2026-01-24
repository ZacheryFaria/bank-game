import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  setupTestDatabase,
  cleanupTestDatabase,
} from "./helpers/testDb.js";
import { createTestServer, closeTestServer } from "./helpers/testServer.js";
import type { FastifyInstance } from "fastify";
import type { PrismaClient } from "@prisma/client";

describe("Infrastructure Smoke Tests", () => {
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

  it("should start server successfully", () => {
    expect(server).toBeDefined();
  });

  it("should connect to test database", async () => {
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    expect(result).toBeDefined();
  });

  it("should respond to health check", async () => {
    const response = await server.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
  });

  it("should have empty database on start", async () => {
    const userCount = await prisma.user.count();
    expect(userCount).toBe(0);
  });
});
