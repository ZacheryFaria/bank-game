import { FastifyInstance } from "fastify";
import { createServer } from "../../server.js";

export async function createTestServer(): Promise<FastifyInstance> {
  return await createServer();
}

export async function closeTestServer(server: FastifyInstance) {
  await server.close();
}
