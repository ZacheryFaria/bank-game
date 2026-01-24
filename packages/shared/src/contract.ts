import { initContract } from "@ts-rest/core";
import { z } from "zod";

const c = initContract();

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
  originationHour: z.number(),
  originalPrincipal: z.number(),
  currentBalance: z.number(),
  interestRate: z.number(),
  loanCount: z.number(),
  activeLoanCount: z.number(),
});

const DepositBucketSchema = z.object({
  id: z.string(),
  product: z.string(),
  originationHour: z.number(),
  originalAmount: z.number(),
  currentBalance: z.number(),
  interestRate: z.number(),
  maturityDate: z.date().nullable().optional(),
});

const BankSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  currentEquity: z.number(),
  currentLoans: z.number(),
  currentDeposits: z.number(),
  lastCollectedAt: z.date(),
  createdAt: z.date(),
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
  timestamp: z.date(),
  type: z.string(),
  amount: z.number(),
  loanBucketId: z.string().nullable().optional(),
  depositBucketId: z.string().nullable().optional(),
  details: z.record(z.unknown()).nullable().optional(),
});

const CollectionReportSchema = z.object({
  gameTimeStart: z.date(),
  gameTimeEnd: z.date(),
  realHoursElapsed: z.number(),
  gameQuartersElapsed: z.number(),
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
      body: z.null(),
      summary: "Trigger collection (rate limited: 1/min)",
    },
  },
});

export type Contract = typeof contract;
