import prisma from "../lib/db.js";
import { simulateCollection } from "../engine/CollectionSimulator.js";
import { COLLECT_COOLDOWN_SECONDS } from "../engine/constants.js";
import type { BankState, CollectionReport } from "../engine/types.js";
import {
  convertBankDecimals,
  convertRateDecimals,
  convertAllocationDecimals,
} from "../lib/prismaHelpers.js";
import { getQuartersCrossed } from "../engine/quarterUtils.js";
import { generateQuarterlySnapshot } from "./snapshotGenerator.js";

type CollectBankSuccess = {
  kind: "success";
  report: CollectionReport;
};

type CollectBankRateLimitError = {
  kind: "rate_limit";
  error: string;
  retryAfter: number;
};

type CollectBankNotFoundError = {
  kind: "not_found";
  error: string;
};

type CollectBankResult =
  | CollectBankSuccess
  | CollectBankRateLimitError
  | CollectBankNotFoundError;

export async function getBankById(bankId: string) {
  const bank = await prisma.bank.findUnique({
    where: { id: bankId },
    include: {
      rates: true,
      allocations: true,
      loanBuckets: {
        where: { currentBalance: { gt: 0 } },
      },
      depositBuckets: {
        where: { currentBalance: { gt: 0 } },
      },
    },
  });

  if (!bank) {
    return { success: false as const, error: "Bank not found" };
  }

  return { success: true as const, bank: convertBankDecimals(bank) };
}

export async function updateBankRates(
  bankId: string,
  rates: Record<string, number>,
) {
  const result = await prisma.$transaction(async (tx) => {
    for (const [product, rate] of Object.entries(rates)) {
      await tx.bankRate.upsert({
        where: {
          bankId_product: {
            bankId,
            product,
          },
        },
        update: { rate },
        create: {
          bankId,
          product,
          rate,
        },
      });
    }

    const updatedRates = await tx.bankRate.findMany({
      where: { bankId },
    });

    return convertRateDecimals(updatedRates);
  });

  return { success: true as const, rates: result };
}

export async function updateBankAllocation(
  bankId: string,
  allocations: Record<string, number>,
) {
  const total = Object.values(allocations).reduce((sum, val) => sum + val, 0);
  if (Math.abs(total - 1.0) > 0.0001) {
    return { success: false as const, error: "Allocations must sum to 1.0" };
  }

  const result = await prisma.$transaction(async (tx) => {
    for (const [riskClass, percentage] of Object.entries(allocations)) {
      await tx.bankAllocation.upsert({
        where: {
          bankId_riskClass: {
            bankId,
            riskClass,
          },
        },
        update: { percentage },
        create: {
          bankId,
          riskClass,
          percentage,
        },
      });
    }

    const updatedAllocations = await tx.bankAllocation.findMany({
      where: { bankId },
    });

    return convertAllocationDecimals(updatedAllocations);
  });

  return {
    success: true as const,
    allocations: result,
  };
}

async function buildLoanBucketIdMap(
  tx: any,
  bankId: string,
  newBuckets: Array<{
    id: string;
    product: string;
    riskClass: string;
    originationHour: Date;
  }>,
): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();
  for (const bucket of newBuckets) {
    const createdBucket = await tx.loanBucket.findFirst({
      where: {
        bankId,
        product: bucket.product,
        riskClass: bucket.riskClass,
        originationHour: bucket.originationHour,
      },
    });
    if (createdBucket) {
      idMap.set(bucket.id, createdBucket.id);
    }
  }
  return idMap;
}

async function buildDepositBucketIdMap(
  tx: any,
  bankId: string,
  newBuckets: Array<{
    id: string;
    product: string;
    originationHour: Date;
  }>,
): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();
  for (const bucket of newBuckets) {
    const createdBucket = await tx.depositBucket.findFirst({
      where: {
        bankId,
        product: bucket.product,
        originationHour: bucket.originationHour,
      },
    });
    if (createdBucket) {
      idMap.set(bucket.id, createdBucket.id);
    }
  }
  return idMap;
}

async function createNewLoanBuckets(tx: any, bankId: string, buckets: any[]) {
  for (const bucket of buckets) {
    await tx.loanBucket.create({
      data: {
        bankId,
        product: bucket.product,
        riskClass: bucket.riskClass,
        originationHour: bucket.originationHour,
        originalPrincipal: bucket.originalPrincipal,
        currentBalance: bucket.currentBalance,
        interestRate: bucket.interestRate,
        loanCount: bucket.loanCount,
        activeLoanCount: bucket.activeLoanCount,
      },
    });
  }
}

async function updateExistingLoanBuckets(tx: any, buckets: any[]) {
  for (const bucket of buckets) {
    await tx.loanBucket.update({
      where: { id: bucket.id },
      data: {
        currentBalance: bucket.currentBalance,
        activeLoanCount: bucket.activeLoanCount,
      },
    });
  }
}

async function createNewDepositBuckets(tx: any, bankId: string, buckets: any[]) {
  for (const bucket of buckets) {
    await tx.depositBucket.create({
      data: {
        bankId,
        product: bucket.product,
        originationHour: bucket.originationHour,
        originalAmount: bucket.originalAmount,
        currentBalance: bucket.currentBalance,
        interestRate: bucket.interestRate,
        maturityDate: bucket.maturityDate,
      },
    });
  }
}

async function updateExistingDepositBuckets(tx: any, buckets: any[]) {
  for (const bucket of buckets) {
    await tx.depositBucket.update({
      where: { id: bucket.id },
      data: {
        currentBalance: bucket.currentBalance,
      },
    });
  }
}

async function createCollectionRecord(tx: any, bankId: string, now: Date, report: any) {
  await tx.collection.create({
    data: {
      bankId,
      collectedAt: now,
      gameTimeStart: report.gameTimeStart,
      gameTimeEnd: report.gameTimeEnd,
      realHoursElapsed: report.realHoursElapsed,
      gameQuartersElapsed: report.gameQuartersElapsed,
      loansOriginated: report.loansOriginated,
      interestIncome: report.interestIncome,
      interestExpense: report.interestExpense,
      defaultLosses: report.defaultLosses,
      operatingExpenses: report.operatingExpenses,
      netIncome: report.netIncome,
      endingEquity: report.endingEquity,
      endingLoans: report.endingLoans,
      endingDeposits: report.endingDeposits,
      randomSeed: report.randomSeed,
    },
  });
}

async function createTransactions(
  tx: any,
  bankId: string,
  now: Date,
  transactions: any[],
  loanBucketIdMap: Map<string, string>,
  depositBucketIdMap: Map<string, string>,
) {
  for (const txn of transactions) {
    const loanBucketId = txn.loanBucketId
      ? loanBucketIdMap.get(txn.loanBucketId) ?? txn.loanBucketId
      : null;
    const depositBucketId = txn.depositBucketId
      ? depositBucketIdMap.get(txn.depositBucketId) ?? txn.depositBucketId
      : null;

    await tx.transaction.create({
      data: {
        bankId,
        timestamp: txn.timestamp,
        collectedAt: now,
        type: txn.type,
        amount: txn.amount,
        loanBucketId,
        depositBucketId,
        details: txn.details,
      },
    });
  }
}

export async function collectBank(bankId: string): Promise<CollectBankResult> {
  const bank = await prisma.bank.findUnique({
    where: { id: bankId },
    include: {
      rates: true,
      allocations: true,
      loanBuckets: {
        where: { currentBalance: { gt: 0 } },
      },
      depositBuckets: {
        where: { currentBalance: { gt: 0 } },
      },
    },
  });

  if (!bank) {
    return { kind: "not_found", error: "Bank not found" };
  }

  const now = new Date();

  const bankState: BankState = {
    id: bank.id,
    name: bank.name,
    lastCollectedAt: bank.lastCollectedAt,
    currentEquity: Number(bank.currentEquity),
    currentLoans: Number(bank.currentLoans),
    currentDeposits: Number(bank.currentDeposits),
    rates: Object.fromEntries(bank.rates.map((r) => [r.product, Number(r.rate)])),
    allocations: Object.fromEntries(
      bank.allocations.map((a) => [a.riskClass, Number(a.percentage)]),
    ),
    loanBuckets: bank.loanBuckets.map((b) => ({
      id: b.id,
      product: b.product as BankState["loanBuckets"][number]["product"],
      riskClass: b.riskClass as BankState["loanBuckets"][number]["riskClass"],
      originationHour: b.originationHour,
      originalPrincipal: Number(b.originalPrincipal),
      currentBalance: Number(b.currentBalance),
      interestRate: Number(b.interestRate),
      loanCount: b.loanCount,
      activeLoanCount: b.activeLoanCount,
    })),
    depositBuckets: bank.depositBuckets.map((b) => ({
      id: b.id,
      product: b.product as BankState["depositBuckets"][number]["product"],
      originationHour: b.originationHour,
      originalAmount: Number(b.originalAmount),
      currentBalance: Number(b.currentBalance),
      interestRate: Number(b.interestRate),
      maturityDate: b.maturityDate || undefined,
    })),
  };

  const report = simulateCollection(bankState, now);

  try {
    await prisma.$transaction(async (tx) => {
      const cooldownThreshold = new Date(
        now.getTime() - COLLECT_COOLDOWN_SECONDS * 1000,
      );

      const updateResult = await tx.bank.updateMany({
        where: {
          id: bank.id,
          lastCollectedAt: { lte: cooldownThreshold },
        },
        data: {
          lastCollectedAt: now,
          currentEquity: report.endingEquity,
          currentLoans: report.endingLoans,
          currentDeposits: report.endingDeposits,
        },
      });

      if (updateResult.count === 0) {
        const currentBank = await tx.bank.findUnique({
          where: { id: bank.id },
          select: { lastCollectedAt: true },
        });

        if (currentBank) {
          const currentSecondsSince =
            (now.getTime() - new Date(currentBank.lastCollectedAt).getTime()) /
            1000;
          const retryAfter = Math.ceil(
            COLLECT_COOLDOWN_SECONDS - currentSecondsSince,
          );
          throw new Error(`COOLDOWN_ACTIVE:${retryAfter}`);
        }
      }

      await createNewLoanBuckets(tx, bank.id, report.newLoanBuckets);
      await updateExistingLoanBuckets(tx, report.updatedLoanBuckets);
      await createNewDepositBuckets(tx, bank.id, report.newDepositBuckets);
      await updateExistingDepositBuckets(tx, report.updatedDepositBuckets);
      await createCollectionRecord(tx, bank.id, now, report);

      const loanBucketIdMap = await buildLoanBucketIdMap(
        tx,
        bank.id,
        report.newLoanBuckets,
      );
      const depositBucketIdMap = await buildDepositBucketIdMap(
        tx,
        bank.id,
        report.newDepositBuckets,
      );

      await createTransactions(
        tx,
        bank.id,
        now,
        report.transactions,
        loanBucketIdMap,
        depositBucketIdMap,
      );

      // Generate quarterly snapshots for any quarters crossed
      const quartersCrossed = getQuartersCrossed(
        report.gameTimeStart,
        report.gameTimeEnd
      );

      for (const quarter of quartersCrossed) {
        await generateQuarterlySnapshot(bank.id, quarter.quarterEnd, tx);
      }
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("COOLDOWN_ACTIVE:")
    ) {
      const retryAfter = parseInt(error.message.split(":")[1], 10);
      return {
        kind: "rate_limit",
        error: "Too soon",
        retryAfter,
      };
    }
    throw error;
  }

  return { kind: "success", report };
}
