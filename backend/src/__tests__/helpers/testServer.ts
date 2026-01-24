import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { registerApiRoutes } from "../../routes/api.js";

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

  return fastify;
}

export async function closeTestServer(server: FastifyInstance) {
  await server.close();
}
