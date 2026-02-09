import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

type RouteMetadata = {
  requiresAuth?: boolean;
};

const BankRateSchema = z.object({
  product: z.string(),
  rate: z.number(),
});

const BankAllocationSchema = z.object({
  riskClass: z.string(),
  percentage: z.number(),
});

const LoanBucketSchema = z.object({
  id: z.string(),
  product: z.string(),
  riskClass: z.string(),
  originationHour: z.coerce.date(),
  originalPrincipal: z.number(),
  currentBalance: z.number(),
  interestRate: z.number(),
  loanCount: z.number(),
  activeLoanCount: z.number(),
});

const DepositBucketSchema = z.object({
  id: z.string(),
  product: z.string(),
  originationHour: z.coerce.date(),
  originalAmount: z.number(),
  currentBalance: z.number(),
  interestRate: z.number(),
  maturityDate: z.coerce.date().nullable().optional(),
});

const BankSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  currentEquity: z.number(),
  currentLoans: z.number(),
  currentDeposits: z.number(),
  lastCollectedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  rates: z.array(BankRateSchema).optional(),
  allocations: z.array(BankAllocationSchema).optional(),
  loanBuckets: z.array(LoanBucketSchema).optional(),
  depositBuckets: z.array(DepositBucketSchema).optional(),
});

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  bank: BankSchema.nullable().optional(),
});

const TransactionSchema = z.object({
  timestamp: z.coerce.date(),
  type: z.string(),
  amount: z.number(),
  loanBucketId: z.string().nullable().optional(),
  depositBucketId: z.string().nullable().optional(),
  details: z.record(z.string(), z.unknown()).nullable().optional(),
});

const CollectionReportSchema = z.object({
  realHoursElapsed: z.number(),
  loansOriginated: z.number(),
  interestIncome: z.number(),
  interestExpense: z.number(),
  defaultLosses: z.number(),
  operatingExpenses: z.number(),
  netIncome: z.number(),
  endingEquity: z.number(),
  endingLoans: z.number(),
  endingDeposits: z.number(),
  randomSeed: z.string(),
  transactions: z.array(TransactionSchema),
  newLoanBuckets: z.array(LoanBucketSchema),
  updatedLoanBuckets: z.array(LoanBucketSchema),
  newDepositBuckets: z.array(DepositBucketSchema),
  updatedDepositBuckets: z.array(DepositBucketSchema),
});

const BankListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.coerce.date(),
  currentEquity: z.number(),
  currentLoans: z.number(),
  currentDeposits: z.number(),
  lastCollectedAt: z.coerce.date(),
});

const SnapshotSchema = z.object({
  id: z.string(),
  periodEnd: z.coerce.date(),
  totalAssets: z.number(),
  totalLoans: z.number(),
  loanLossReserve: z.number(),
  cashAndReserves: z.number(),
  totalDeposits: z.number(),
  totalLiabilities: z.number(),
  totalEquity: z.number(),
  interestIncome: z.number(),
  interestExpense: z.number(),
  netInterestIncome: z.number(),
  provisionForLosses: z.number(),
  operatingExpenses: z.number(),
  netIncome: z.number(),
  capitalRatio: z.number(),
  netInterestMargin: z.number(),
  returnOnEquity: z.number(),
  defaultRate: z.number(),
  portfolioByProduct: z.record(z.string(), z.number()),
  portfolioByRiskClass: z.record(z.string(), z.number()),
  createdAt: z.coerce.date(),
});

const PaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

const PortfolioHistoryPointSchema = z.object({
  timestamp: z.coerce.date(),
  balance: z.number(),
  defaultRate: z.number(),
  totalEquity: z.number(),
  totalLoans: z.number(),
  totalDeposits: z.number(),
  portfolioByProduct: z.record(z.string(), z.number()),
  portfolioByRiskClass: z.record(z.string(), z.number()),
});

const PortfolioHistoryQuerySchema = z.object({
  product: z.string().optional(),
  riskClass: z.string().optional(),
  period: z.enum(["1h", "12h", "1d", "7d", "30d", "90d", "1y", "all"]).default("30d"),
});

const PortfolioHistoryResponseSchema = z.object({
  dataPoints: z.array(PortfolioHistoryPointSchema),
  metadata: z.object({
    period: z.string(),
    product: z.string().optional(),
    riskClass: z.string().optional(),
    totalDataPoints: z.number(),
  }),
});

const LoanProductInfoSchema = z.object({
  product: z.string(),
  marketRate: z.number(),
  baseDemandPerHour: z.number(),
  sensitivity: z.number(),
  avgLoanSize: z.number(),
});

const DepositProductInfoSchema = z.object({
  product: z.string(),
  marketRate: z.number(),
  baseInflowPerHour: z.number(),
  sensitivity: z.number(),
});

const MarketRatesSchema = z.object({
  rates: z.record(z.string(), z.number()),
  timeMultiplier: z.number(),
  loanProducts: z.array(LoanProductInfoSchema),
  depositProducts: z.array(DepositProductInfoSchema),
});

const TransactionQuerySchema = z.object({
  type: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const TransactionListItemSchema = z.object({
  id: z.string(),
  timestamp: z.coerce.date(),
  type: z.string(),
  amount: z.number(),
  loanBucketId: z.string().nullable().optional(),
  depositBucketId: z.string().nullable().optional(),
  details: z.record(z.string(), z.unknown()).nullable().optional(),
});

const TransactionSummarySchema = z.object({
  type: z.string(),
  total: z.number(),
  count: z.number(),
});

const TransactionListResponseSchema = z.object({
  transactions: z.array(TransactionListItemSchema),
  pagination: PaginationSchema,
  summary: z.array(TransactionSummarySchema),
});

// Export schemas for reuse
export { BankRateSchema, BankAllocationSchema, BankSchema, UserSchema, CollectionReportSchema, DepositBucketSchema };

export const contract = c.router({
  auth: {
    register: {
      method: "POST",
      path: "/api/auth/register",
      responses: {
        200: z.object({
          token: z.string(),
          refreshToken: z.string(),
          user: UserSchema,
        }),
        400: z.object({
          error: z.string(),
          details: z.unknown().optional(),
        }),
      },
      body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        bankName: z.string().min(1).max(100),
      }),
      summary: "Register a new user",
    },
    login: {
      method: "POST",
      path: "/api/auth/login",
      responses: {
        200: z.object({
          token: z.string(),
          refreshToken: z.string(),
          user: UserSchema,
        }),
        401: z.object({
          error: z.string(),
        }),
        400: z.object({
          error: z.string(),
          details: z.unknown().optional(),
        }),
      },
      body: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      summary: "Login existing user",
    },
    refresh: {
      method: "POST",
      path: "/api/auth/refresh",
      responses: {
        200: z.object({
          token: z.string(),
          refreshToken: z.string(),
        }),
        401: z.object({
          error: z.string(),
        }),
        400: z.object({
          error: z.string(),
          details: z.unknown().optional(),
        }),
      },
      body: z.object({
        refreshToken: z.string(),
      }),
      summary: "Refresh access token",
    },
  },
  bank: {
    get: {
      method: "GET",
      path: "/api/bank",
      responses: {
        200: BankSchema,
        404: z.object({
          error: z.string(),
        }),
      },
      metadata: { requiresAuth: true } as RouteMetadata,
      summary: "Get your bank's current state",
    },
    updateRates: {
      method: "PUT",
      path: "/api/bank/rates",
      responses: {
        200: z.object({
          success: z.boolean(),
          rates: z.array(BankRateSchema),
        }),
        400: z.object({
          error: z.string(),
          details: z.unknown().optional(),
        }),
      },
      body: z.object({
        rates: z.record(z.string(), z.number().min(0).max(0.5)),
      }),
      metadata: { requiresAuth: true } as RouteMetadata,
      summary: "Update your bank's interest rates",
    },
    updateAllocation: {
      method: "PUT",
      path: "/api/bank/allocation",
      responses: {
        200: z.object({
          success: z.boolean(),
          allocations: z.array(BankAllocationSchema),
        }),
        400: z.object({
          error: z.string(),
          details: z.unknown().optional(),
        }),
      },
      body: z.object({
        allocations: z.record(z.string(), z.number().min(0).max(1)),
      }),
      metadata: { requiresAuth: true } as RouteMetadata,
      summary: "Update your bank's risk allocation",
    },
    collect: {
      method: "POST",
      path: "/api/bank/collect",
      responses: {
        200: CollectionReportSchema,
        404: z.object({
          error: z.string(),
        }),
        429: z.object({
          error: z.string(),
          retryAfter: z.number(),
        }),
      },
      body: z.object({}),
      metadata: { requiresAuth: true } as RouteMetadata,
      summary: "Trigger collection (rate limited: 1/min)",
    },
    portfolioHistory: {
      method: "GET",
      path: "/api/bank/portfolio/history",
      responses: {
        200: PortfolioHistoryResponseSchema,
        400: z.object({ error: z.string() }),
        404: z.object({ error: z.string() }),
      },
      query: PortfolioHistoryQuerySchema,
      metadata: { requiresAuth: true } as RouteMetadata,
      summary: "Get historical portfolio data for charting",
    },
    transactions: {
      method: "GET",
      path: "/api/bank/transactions",
      responses: {
        200: TransactionListResponseSchema,
        404: z.object({ error: z.string() }),
      },
      query: TransactionQuerySchema,
      metadata: { requiresAuth: true } as RouteMetadata,
      summary: "Get transaction ledger with optional type filter",
    },
  },
  banks: {
    list: {
      method: "GET",
      path: "/api/banks",
      responses: {
        200: z.object({
          banks: z.array(BankListItemSchema),
          pagination: PaginationSchema,
        }),
      },
      query: z.object({
        page: z.coerce.number().optional(),
        limit: z.coerce.number().optional(),
        sortBy: z.enum(["equity", "loans"]).optional(),
      }),
      summary: "List all banks (leaderboard)",
    },
    getById: {
      method: "GET",
      path: "/api/banks/:id",
      responses: {
        200: BankSchema.extend({
          _count: z
            .object({
              loanBuckets: z.number(),
              depositBuckets: z.number(),
            })
            .optional(),
        }),
        404: z.object({
          error: z.string(),
        }),
      },
      pathParams: z.object({
        id: z.string(),
      }),
      summary: "Get details of a specific bank",
    },
    getFinancials: {
      method: "GET",
      path: "/api/banks/:id/financials",
      responses: {
        200: z.object({
          snapshots: z.array(SnapshotSchema),
        }),
        404: z.object({
          error: z.string(),
        }),
      },
      pathParams: z.object({
        id: z.string(),
      }),
      query: z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        limit: z.coerce.number().min(1).max(1000).optional(),
      }),
      summary: "Get financial statement snapshots",
    },
  },
  market: {
    getRates: {
      method: "GET",
      path: "/api/market/rates",
      responses: {
        200: MarketRatesSchema,
      },
      summary: "Get fixed market rates and product info",
    },
  },
});

export type Contract = typeof contract;
