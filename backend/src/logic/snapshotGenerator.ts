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

/**
 * Helper: Calculate loan loss reserve
 * Simplified: sum of all loan defaults in the period
 */
function calculateLoanLossReserve(transactions: Transaction[]): number {
  const defaults = transactions.filter(tx => tx.type === 'loan_default');
  return sumTransactionAmounts(defaults);
}

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

  // 2. Group transactions by type
  const txByType = {
    loan_origination: transactions.filter(t => t.type === 'loan_origination'),
    loan_repayment: transactions.filter(t => t.type === 'loan_repayment'),
    interest_income: transactions.filter(t => t.type === 'interest_income'),
    interest_expense: transactions.filter(t => t.type === 'interest_expense'),
    loan_default: transactions.filter(t => t.type === 'loan_default'),
    deposit_inflow: transactions.filter(t => t.type === 'deposit_inflow'),
    deposit_outflow: transactions.filter(t => t.type === 'deposit_outflow'),
    operating_expense: transactions.filter(t => t.type === 'operating_expense'),
  };

  // 3. Calculate income statement items
  const interestIncome = sumTransactionAmounts(txByType.interest_income);
  const interestExpense = sumTransactionAmounts(txByType.interest_expense);
  const netInterestIncome = interestIncome - interestExpense;
  const provisionForLosses = sumTransactionAmounts(txByType.loan_default);
  const operatingExpenses = sumTransactionAmounts(txByType.operating_expense);
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

  const loanLossReserve = calculateLoanLossReserve(txByType.loan_default);

  // Simplified: cash = deposits - loans
  const cashAndReserves = Math.max(0, totalDeposits - totalLoans);

  const totalAssets = totalLoans + cashAndReserves;
  const totalLiabilities = totalDeposits;
  const totalEquity = totalAssets - totalLiabilities;

  // 6. Calculate key ratios (guard against division by zero)
  const capitalRatio = totalAssets > 0 ? totalEquity / totalAssets : 0;

  // Annualize quarterly values (divide by 0.25 = multiply by 4)
  const netInterestMargin = totalAssets > 0
    ? (netInterestIncome / totalAssets) / 0.25
    : 0;

  const returnOnEquity = totalEquity > 0
    ? (netIncome / totalEquity) / 0.25
    : 0;

  const defaultRate = totalLoans > 0
    ? (provisionForLosses / totalLoans) / 0.25
    : 0;

  // 7. Build portfolio breakdowns
  const portfolioByProduct = buildProductBreakdown(loanBuckets);
  const portfolioByRiskClass = buildRiskClassBreakdown(loanBuckets);

  // 8. Upsert snapshot record
  const snapshot = await tx.quarterlySnapshot.upsert({
    where: {
      bankId_quarterEnd: {
        bankId,
        quarterEnd,
      },
    },
    update: {
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
    },
    create: {
      bankId,
      quarterEnd,
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
    },
  });

  return snapshot;
}
