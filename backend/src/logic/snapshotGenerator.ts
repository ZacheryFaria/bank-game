import { PrismaClient, LoanBucket, Transaction } from "@prisma/client";
import { getFiscalQuarter, getFiscalYear, getQuarterStart } from "../engine/quarterUtils.js";

type PrismaTransaction = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Helper: Sum amounts from transactions, taking absolute value for outflows
 */
function sumTransactionAmounts(transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => {
    return sum + Math.abs(Number(tx.amount));
  }, 0);
}

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
 * Generate a quarterly snapshot for a bank.
 * This function aggregates transaction data and bucket balances to create
 * a complete financial statement for a specific quarter.
 *
 * @param bankId - The bank's UUID
 * @param quarterEnd - The last moment of the quarter
 * @param tx - Prisma client or transaction
 */
export async function generateQuarterlySnapshot(
  bankId: string,
  quarterEnd: Date,
  tx: PrismaTransaction | PrismaClient
) {
  const quarterStart = getQuarterStart(quarterEnd);
  const fiscalYear = getFiscalYear(quarterEnd);
  const fiscalQuarter = getFiscalQuarter(quarterEnd);

  // 1. Fetch all transactions for this quarter
  const transactions = await tx.transaction.findMany({
    where: {
      bankId,
      timestamp: {
        gte: quarterStart,
        lte: quarterEnd,
      },
    },
  });

  // 2. Group transactions by type using a single pass for efficiency
  const txByType = transactions.reduce((acc, t) => {
    if (!acc[t.type]) {
      acc[t.type] = [];
    }
    acc[t.type].push(t);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Ensure all transaction types exist (empty arrays if none)
  const groupedTx = {
    loan_origination: txByType.loan_origination || [],
    loan_repayment: txByType.loan_repayment || [],
    interest_income: txByType.interest_income || [],
    interest_expense: txByType.interest_expense || [],
    loan_default: txByType.loan_default || [],
    deposit_inflow: txByType.deposit_inflow || [],
    deposit_outflow: txByType.deposit_outflow || [],
    operating_expense: txByType.operating_expense || [],
  };

  // 3. Calculate income statement items
  const interestIncome = sumTransactionAmounts(groupedTx.interest_income);
  const interestExpense = sumTransactionAmounts(groupedTx.interest_expense);
  const netInterestIncome = interestIncome - interestExpense;
  const provisionForLosses = sumTransactionAmounts(groupedTx.loan_default);
  const operatingExpenses = sumTransactionAmounts(groupedTx.operating_expense);
  const netIncome = netInterestIncome - provisionForLosses - operatingExpenses;

  // 4. Query loan and deposit buckets at quarter end
  // Note: This is an approximation using current state
  // Buckets originated after quarter end are excluded
  const loanBuckets = await tx.loanBucket.findMany({
    where: {
      bankId,
      originationHour: { lte: quarterEnd },
      currentBalance: { gt: 0 },
    },
  });

  const depositBuckets = await tx.depositBucket.findMany({
    where: {
      bankId,
      originationHour: { lte: quarterEnd },
      currentBalance: { gt: 0 },
    },
  });

  // 5. Calculate balance sheet items
  const totalLoans = loanBuckets.reduce(
    (sum, bucket) => sum + Number(bucket.currentBalance),
    0
  );

  const totalDeposits = depositBuckets.reduce(
    (sum, bucket) => sum + Number(bucket.currentBalance),
    0
  );

  // Reuse provision for losses calculation (already computed from loan_default transactions)
  const loanLossReserve = provisionForLosses;

  // Get opening equity from previous quarter or use initial bank equity
  const previousSnapshot = await tx.quarterlySnapshot.findFirst({
    where: {
      bankId,
      quarterEnd: { lt: quarterEnd },
    },
    orderBy: { quarterEnd: 'desc' },
    select: { totalEquity: true },
  });

  const openingEquity = previousSnapshot
    ? Number(previousSnapshot.totalEquity)
    : INITIAL_BANK_EQUITY;

  // Calculate closing equity: Opening Equity + Net Income
  const totalEquity = openingEquity + netIncome;

  // Use accounting equation: Assets = Liabilities + Equity
  const totalLiabilities = totalDeposits;
  const totalAssets = totalLiabilities + totalEquity;

  // Calculate cash as the balancing item: Cash = Total Assets - Loans - Loan Loss Reserve
  const cashAndReserves = totalAssets - totalLoans - loanLossReserve;

  // 6. Calculate key ratios (guard against division by zero)
  const capitalRatio = totalAssets > 0 ? totalEquity / totalAssets : 0;

  // Annualize quarterly values (multiply by 4)
  const netInterestMargin = totalAssets > 0
    ? (netInterestIncome / totalAssets) * 4
    : 0;

  const returnOnEquity = totalEquity > 0
    ? (netIncome / totalEquity) * 4
    : 0;

  const defaultRate = totalLoans > 0
    ? (provisionForLosses / totalLoans) * 4
    : 0;

  // 7. Build portfolio breakdowns
  const portfolioByProduct = buildProductBreakdown(loanBuckets);
  const portfolioByRiskClass = buildRiskClassBreakdown(loanBuckets);

  // 8. Upsert snapshot record
  const snapshotData = {
    fiscalYear,
    fiscalQuarter,
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

  const snapshot = await tx.quarterlySnapshot.upsert({
    where: {
      bankId_quarterEnd: {
        bankId,
        quarterEnd,
      },
    },
    update: snapshotData,
    create: {
      bankId,
      quarterEnd,
      ...snapshotData,
    },
  });

  return snapshot;
}
