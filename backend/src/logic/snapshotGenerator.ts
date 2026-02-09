import { PrismaClient, LoanBucket } from "@prisma/client";
import type { CollectionReport } from "../engine/types.js";
import { TIME_MULTIPLIER } from "../engine/constants.js";

type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Helper: Build portfolio breakdown by product
 */
function buildProductBreakdown(loanBuckets: LoanBucket[]): Record<string, number> {
  const breakdown: Record<string, number> = {};

  for (const bucket of loanBuckets) {
    const product = bucket.product;
    const balance = Number(bucket.currentBalance);
    breakdown[product] = (breakdown[product] || 0) + balance;
  }

  return breakdown;
}

/**
 * Helper: Build portfolio breakdown by risk class
 */
function buildRiskClassBreakdown(loanBuckets: LoanBucket[]): Record<string, number> {
  const breakdown: Record<string, number> = {};

  for (const bucket of loanBuckets) {
    const riskClass = bucket.riskClass;
    const balance = Number(bucket.currentBalance);
    breakdown[riskClass] = (breakdown[riskClass] || 0) + balance;
  }

  return breakdown;
}

const INITIAL_BANK_EQUITY = 200000;

/**
 * Generate a snapshot for a bank after a collection.
 * Uses the collection report's financial data directly rather than
 * re-querying transactions.
 *
 * @param bankId - The bank's UUID
 * @param periodEnd - The real timestamp of this collection
 * @param realHoursElapsed - Hours elapsed in this collection period
 * @param report - The collection report with income statement data
 * @param tx - Prisma client or transaction
 */
export async function generateSnapshot(
  bankId: string,
  periodEnd: Date,
  realHoursElapsed: number,
  report: CollectionReport,
  tx: PrismaTransaction | PrismaClient
) {
  // 1. Income statement items from the collection report
  const interestIncome = report.interestIncome;
  const interestExpense = report.interestExpense;
  const netInterestIncome = interestIncome - interestExpense;
  const provisionForLosses = report.defaultLosses;
  const operatingExpenses = report.operatingExpenses;
  const netIncome = report.netIncome;

  // 2. Query current bucket state for balance sheet
  const loanBuckets = await tx.loanBucket.findMany({
    where: {
      bankId,
      currentBalance: { gt: 0 },
    },
  });

  const depositBuckets = await tx.depositBucket.findMany({
    where: {
      bankId,
      currentBalance: { gt: 0 },
    },
  });

  // 3. Calculate balance sheet items
  const totalLoans = loanBuckets.reduce(
    (sum, bucket) => sum + Number(bucket.currentBalance),
    0
  );

  const totalDeposits = depositBuckets.reduce(
    (sum, bucket) => sum + Number(bucket.currentBalance),
    0
  );

  const loanLossReserve = provisionForLosses;

  // Get opening equity from previous snapshot or use initial bank equity
  const previousSnapshot = await tx.snapshot.findFirst({
    where: {
      bankId,
      periodEnd: { lt: periodEnd },
    },
    orderBy: { periodEnd: 'desc' },
    select: { totalEquity: true },
  });

  const openingEquity = previousSnapshot
    ? Number(previousSnapshot.totalEquity)
    : INITIAL_BANK_EQUITY;

  const totalEquity = openingEquity + netIncome;

  const totalLiabilities = totalDeposits;
  const totalAssets = totalLiabilities + totalEquity;

  const cashAndReserves = totalAssets - totalLoans - loanLossReserve;

  // 4. Calculate key ratios (annualized dynamically based on collection period)
  // Cap at 4 (minimum 1-hour period) to prevent DECIMAL(5,4) overflow
  const effectiveHours = realHoursElapsed * TIME_MULTIPLIER;
  const annualizationFactor = effectiveHours >= 1 ? 4 / effectiveHours : 4;

  const capitalRatio = totalAssets > 0 ? totalEquity / totalAssets : 0;

  const netInterestMargin = totalAssets > 0
    ? (netInterestIncome / totalAssets) * annualizationFactor
    : 0;

  const returnOnEquity = totalEquity > 0
    ? (netIncome / totalEquity) * annualizationFactor
    : 0;

  const defaultRate = totalLoans > 0
    ? (provisionForLosses / totalLoans) * annualizationFactor
    : 0;

  // 5. Build portfolio breakdowns
  const portfolioByProduct = buildProductBreakdown(loanBuckets);
  const portfolioByRiskClass = buildRiskClassBreakdown(loanBuckets);

  // 6. Upsert snapshot record
  const snapshotData = {
    totalAssets,
    totalLoans,
    loanLossReserve,
    cashAndReserves,
    totalDeposits,
    totalLiabilities,
    totalEquity,
    interestIncome,
    interestExpense,
    netInterestIncome,
    provisionForLosses,
    operatingExpenses,
    netIncome,
    capitalRatio,
    netInterestMargin,
    returnOnEquity,
    defaultRate,
    portfolioByProduct,
    portfolioByRiskClass,
  };

  const snapshot = await tx.snapshot.upsert({
    where: {
      bankId_periodEnd: {
        bankId,
        periodEnd,
      },
    },
    update: snapshotData,
    create: {
      bankId,
      periodEnd,
      ...snapshotData,
    },
  });

  return snapshot;
}
