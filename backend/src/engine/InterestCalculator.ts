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
 * Formula: periodInterest = loanBalance * (annualRate / 4) * realHoursElapsed
 *          Total interest = sum across all buckets
 *
 * @param loanBuckets - Array of loan buckets
 * @param realHoursElapsed - Number of real hours elapsed (1 hour = 1/4 year for rate math)
 * @returns Interest result with total income and per-bucket breakdown
 */
export function calculateLoanInterest(
  loanBuckets: LoanBucketData[],
  realHoursElapsed: number
): { totalInterest: number; interestByBucket: Map<string, number> } {
  let totalInterest = 0
  const interestByBucket = new Map<string, number>()

  for (const bucket of loanBuckets) {
    if (bucket.currentBalance <= 0) continue

    const quarterlyRate = bucket.interestRate / 4
    const interest = bucket.currentBalance * quarterlyRate * realHoursElapsed

    totalInterest += interest
    interestByBucket.set(bucket.id, interest)
  }

  return { totalInterest, interestByBucket }
}

/**
 * Calculate interest expense on deposits for a given period
 *
 * Formula: periodExpense = depositBalance * (annualRate / 4) * realHoursElapsed
 *          Total expense = sum across all buckets
 *
 * @param depositBuckets - Array of deposit buckets
 * @param realHoursElapsed - Number of real hours elapsed (1 hour = 1/4 year for rate math)
 * @returns Interest result with total expense and per-bucket breakdown
 */
export function calculateDepositInterest(
  depositBuckets: DepositBucketData[],
  realHoursElapsed: number
): { totalInterest: number; interestByBucket: Map<string, number> } {
  let totalInterest = 0
  const interestByBucket = new Map<string, number>()

  for (const bucket of depositBuckets) {
    if (bucket.currentBalance <= 0) continue

    const quarterlyRate = bucket.interestRate / 4
    const interest = bucket.currentBalance * quarterlyRate * realHoursElapsed

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
 * @param realHoursElapsed - Number of real hours elapsed (1 hour = 1/4 year for rate math)
 * @returns Complete interest result
 */
export function calculateInterest(
  loanBuckets: LoanBucketData[],
  depositBuckets: DepositBucketData[],
  realHoursElapsed: number
): InterestResult {
  const loanResult = calculateLoanInterest(loanBuckets, realHoursElapsed)
  const depositResult = calculateDepositInterest(depositBuckets, realHoursElapsed)

  return {
    interestIncome: loanResult.totalInterest,
    interestExpense: depositResult.totalInterest,
    netInterestIncome: loanResult.totalInterest - depositResult.totalInterest,
    loanInterestByBucket: loanResult.interestByBucket,
    depositInterestByBucket: depositResult.interestByBucket,
  }
}
