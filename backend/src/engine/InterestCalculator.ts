/**
 * Interest Calculator
 * Pure function to calculate interest income and expense
 * Based on design/math-and-formulas.md
 */

import type {
  LoanBucketData,
  DepositBucketData,
  InterestResult,
} from './types.js'

/**
 * Calculate interest income from loans for a given period
 *
 * Formula: quarterlyInterest = loanBalance * (annualRate / 4)
 *          Total interest = sum across all buckets
 *
 * @param loanBuckets - Array of loan buckets
 * @param gameQuarters - Number of game quarters elapsed
 * @returns Interest result with total income and per-bucket breakdown
 */
export function calculateLoanInterest(
  loanBuckets: LoanBucketData[],
  gameQuarters: number
): { totalInterest: number; interestByBucket: Map<string, number> } {
  let totalInterest = 0
  const interestByBucket = new Map<string, number>()

  for (const bucket of loanBuckets) {
    if (bucket.currentBalance <= 0) continue

    // Quarterly interest = balance * (annual rate / 4)
    // For multiple quarters: balance * rate * (quarters / 4)
    const quarterlyRate = bucket.interestRate / 4
    const interest = bucket.currentBalance * quarterlyRate * gameQuarters

    totalInterest += interest
    interestByBucket.set(bucket.id, interest)
  }

  return { totalInterest, interestByBucket }
}

/**
 * Calculate interest expense on deposits for a given period
 *
 * Formula: quarterlyExpense = depositBalance * (annualRate / 4)
 *          Total expense = sum across all buckets
 *
 * @param depositBuckets - Array of deposit buckets
 * @param gameQuarters - Number of game quarters elapsed
 * @returns Interest result with total expense and per-bucket breakdown
 */
export function calculateDepositInterest(
  depositBuckets: DepositBucketData[],
  gameQuarters: number
): { totalInterest: number; interestByBucket: Map<string, number> } {
  let totalInterest = 0
  const interestByBucket = new Map<string, number>()

  for (const bucket of depositBuckets) {
    if (bucket.currentBalance <= 0) continue

    // Quarterly interest = balance * (annual rate / 4)
    const quarterlyRate = bucket.interestRate / 4
    const interest = bucket.currentBalance * quarterlyRate * gameQuarters

    totalInterest += interest
    interestByBucket.set(bucket.id, interest)
  }

  return { totalInterest, interestByBucket }
}

/**
 * Calculate all interest (income and expense) for a collection period
 *
 * @param loanBuckets - Array of loan buckets
 * @param depositBuckets - Array of deposit buckets
 * @param gameQuarters - Number of game quarters elapsed
 * @returns Complete interest result
 */
export function calculateInterest(
  loanBuckets: LoanBucketData[],
  depositBuckets: DepositBucketData[],
  gameQuarters: number
): InterestResult {
  const loanResult = calculateLoanInterest(loanBuckets, gameQuarters)
  const depositResult = calculateDepositInterest(depositBuckets, gameQuarters)

  return {
    interestIncome: loanResult.totalInterest,
    interestExpense: depositResult.totalInterest,
    netInterestIncome: loanResult.totalInterest - depositResult.totalInterest,
    loanInterestByBucket: loanResult.interestByBucket,
    depositInterestByBucket: depositResult.interestByBucket,
  }
}
