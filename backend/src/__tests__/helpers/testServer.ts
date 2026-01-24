import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { registerApiRoutes } from "../../routes/api.js";
import { banksRoutes } from "../../routes/banks.js";
import { marketRoutes } from "../../routes/market.js";

export async function createTestServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: false,
  });

  await fastify.register(cors, {
    origin: true,
  });

  fastify.get("/health", () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  await fastify.register(registerApiRoutes);
  await fastify.register(banksRoutes, { prefix: "/api" });
  await fastify.register(marketRoutes, { prefix: "/api" });

  return fastify;
}

export async function closeTestServer(server: FastifyInstance) {
  await server.close();
}
