import { initServer } from "@ts-rest/fastify";
import { contract } from "@bank-game/shared";
import type { FastifyInstance } from "fastify";
import { authenticate } from "../lib/authMiddleware.js";
import * as authLogic from "../logic/auth.js";
import * as bankLogic from "../logic/bank.js";

const s = initServer();

export const router = s.router(contract, {
  auth: {
    register: async ({ body }) => {
      const result = await authLogic.createUser(body);
      if (!result.success) {
        return { status: 400, body: { error: result.error } };
      }
      return { status: 200, body: result };
    },
    login: async ({ body }) => {
      const result = await authLogic.authenticateUser(body);
      if (!result.success) {
        return { status: 401, body: { error: result.error } };
      }
      return { status: 200, body: result };
    },
    refresh: async ({ body }) => {
      const result = await authLogic.refreshUserToken(body);
      if (!result.success) {
        return { status: 401, body: { error: result.error } };
      }
      return { status: 200, body: result };
    },
  },
  bank: {
    get: async ({ request }) => {
      const result = await bankLogic.getBankById(request.bank!.id);
      if (!result.success) {
        return { status: 404, body: { error: result.error } };
      }
      return { status: 200, body: result.bank };
    },
    updateRates: async ({ body, request }) => {
      const result = await bankLogic.updateBankRates(request.bank!.id, body.rates);
      return { status: 200, body: result };
    },
    updateAllocation: async ({ body, request }) => {
      const result = await bankLogic.updateBankAllocation(
        request.bank!.id,
        body.allocations,
      );
      if (!result.success) {
        return { status: 400, body: { error: result.error } };
      }
      return { status: 200, body: result };
    },
    collect: async ({ request }) => {
      const result = await bankLogic.collectBank(request.bank!.id);
      if (!result.success) {
        if ("retryAfter" in result) {
          return {
            status: 429,
            body: { error: result.error, retryAfter: result.retryAfter },
          };
        }
        return { status: 404, body: { error: result.error } };
      }
      return { status: 200, body: result.report };
    },
  },
});

export async function registerApiRoutes(fastify: FastifyInstance) {
  await fastify.register(s.plugin(router), {
    logInitialization: false,
    responseValidation: true,
    requestValidation: true,
  });

  // Add middleware to bank routes
  fastify.addHook("preHandler", async (request, reply) => {
    if (request.url.startsWith("/api/bank")) {
      await authenticate(request, reply);
    }
  });
}
