import { initServer } from "@ts-rest/fastify";
import { contract } from "@bank-game/shared";
import type { FastifyInstance } from "fastify";
import { authenticate } from "../lib/authMiddleware.js";
import * as authLogic from "../logic/auth.js";
import * as bankLogic from "../logic/bank.js";
import * as financialsLogic from "../logic/financials.js";
import prisma from "../lib/db.js";
import {
  MARKET_RATES,
  LOAN_PRODUCTS,
  DEPOSIT_PRODUCTS,
} from "../engine/constants.js";

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

      switch (result.kind) {
        case "success":
          return {
            status: 200,
            body: result.report,
          };
        case "rate_limit":
          return {
            status: 429,
            body: { error: result.error, retryAfter: result.retryAfter },
          };
        case "not_found":
          return { status: 404, body: { error: result.error } };
      }
    },
  },
  banks: {
    list: async ({ query }) => {
      const { page = 1, limit = 50, sortBy = "equity" } = query;

      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      let orderBy: any = { currentEquity: "desc" };
      if (sortBy === "loans") {
        orderBy = { currentLoans: "desc" };
      }

      const [banks, total] = await Promise.all([
        prisma.bank.findMany({
          select: {
            id: true,
            name: true,
            createdAt: true,
            currentEquity: true,
            currentLoans: true,
            currentDeposits: true,
            lastCollectedAt: true,
          },
          orderBy,
          skip,
          take,
        }),
        prisma.bank.count(),
      ]);

      return {
        status: 200,
        body: {
          banks: banks.map((b) => ({
            ...b,
            currentEquity: Number(b.currentEquity),
            currentLoans: Number(b.currentLoans),
            currentDeposits: Number(b.currentDeposits),
          })),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit)),
          },
        },
      };
    },
    getById: async ({ params }) => {
      const bank = await prisma.bank.findUnique({
        where: { id: params.id },
        include: {
          rates: true,
          allocations: true,
          _count: {
            select: {
              loanBuckets: true,
              depositBuckets: true,
            },
          },
        },
      });

      if (!bank) {
        return { status: 404, body: { error: "Bank not found" } };
      }

      return {
        status: 200,
        body: {
          ...bank,
          currentEquity: Number(bank.currentEquity),
          currentLoans: Number(bank.currentLoans),
          currentDeposits: Number(bank.currentDeposits),
          rates: bank.rates?.map((r) => ({
            product: r.product,
            rate: Number(r.rate),
          })),
          allocations: bank.allocations?.map((a) => ({
            riskClass: a.riskClass,
            percentage: Number(a.percentage),
          })),
        },
      };
    },
    getFinancials: async ({ params, query }) => {
      const result = await financialsLogic.getQuarterlySnapshots(
        params.id,
        query
      );

      if (!result.success) {
        return { status: 404, body: { error: result.error || "Bank not found" } };
      }

      return {
        status: 200,
        body: { snapshots: result.snapshots || [] },
      };
    },
  },
  market: {
    getRates: async () => {
      return {
        status: 200,
        body: {
          rates: MARKET_RATES,
          loanProducts: Object.entries(LOAN_PRODUCTS).map(
            ([product, config]) => ({
              product,
              marketRate: config.marketRate,
              baseDemandPerHour: config.baseDemandPerHour,
              sensitivity: config.sensitivity,
              avgLoanSize: config.avgLoanSize,
            }),
          ),
          depositProducts: Object.entries(DEPOSIT_PRODUCTS).map(
            ([product, config]) => ({
              product,
              marketRate: config.marketRate,
              baseInflowPerHour: config.baseInflowPerHour,
              sensitivity: config.sensitivity,
            }),
          ),
        },
      };
    },
  },
});

export async function registerApiRoutes(fastify: FastifyInstance) {
  await fastify.register(s.plugin(router), {
    logInitialization: false,
    responseValidation: true,
  });

  // Apply stricter rate limit to auth endpoints using onRoute hook
  fastify.addHook("onRoute", (routeOptions) => {
    if (routeOptions.url?.startsWith("/api/auth")) {
      routeOptions.config = {
        ...routeOptions.config,
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
        },
      };
    }
  });

  // Authentication middleware for bank endpoints
  fastify.addHook("preHandler", async (request, reply) => {
    if (request.url.startsWith("/api/bank")) {
      await authenticate(request, reply);
    }
  });
}
