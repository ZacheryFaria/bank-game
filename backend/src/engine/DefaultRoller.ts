/**
 * Default Roller
 * Pure function to calculate loan defaults with seeded randomness
 * Based on design/math-and-formulas.md
 */

import {
  DEFAULT_RATES,
  DEFAULT_VARIANCE_MIN,
  DEFAULT_VARIANCE_MAX,
} from './constants.js'
import type { LoanBucketData, DefaultResult } from './types.js'

/**
 * Seeded pseudo-random number generator (LCG algorithm)
 * Returns a number between 0 and 1
 */
class SeededRandom {
  private seed: number

  constructor(seed: bigint) {
    // Convert bigint to number for the RNG (modulo to keep it reasonable)
    this.seed = Number(seed % BigInt(2147483647))
  }

  next(): number {
    // Linear congruential generator
    this.seed = (this.seed * 1103515245 + 12345) % 2147483647
    return this.seed / 2147483647
  }

  /**
   * Generate a random number between min and max
   */
  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }
}

/**
 * Calculate defaults for a single loan bucket
 *
 * Formula:
 *   annualDefaultRate = baseRate for risk class
 *   periodDefaultRate = annualDefaultRate * (gameQuarters / 4)
 *   expectedDefaults = balance * periodDefaultRate
 *   actualDefaults = expectedDefaults * randomVariance(0.8, 1.2)
 *
 * @param bucket - Loan bucket data
 * @param gameQuarters - Number of game quarters elapsed
 * @param rng - Seeded random number generator
 * @returns Default amount for this bucket
 */
function calculateBucketDefaults(
  bucket: LoanBucketData,
  gameQuarters: number,
  rng: SeededRandom
): number {
  if (bucket.currentBalance <= 0 || bucket.activeLoanCount === 0) {
    return 0
  }

  const annualDefaultRate = DEFAULT_RATES[bucket.riskClass]
  const periodDefaultRate = annualDefaultRate * (gameQuarters / 4)

  // Calculate expected defaults
  const expectedDefaults = bucket.currentBalance * periodDefaultRate

  // Apply random variance (0.8 to 1.2)
  const variance = rng.range(DEFAULT_VARIANCE_MIN, DEFAULT_VARIANCE_MAX)
  const actualDefaults = expectedDefaults * variance

  // Cap at current balance
  return Math.min(actualDefaults, bucket.currentBalance)
}

/**
 * Calculate defaults across all loan buckets
 *
 * @param loanBuckets - Array of loan buckets
 * @param gameQuarters - Number of game quarters elapsed
 * @param seed - Random seed for deterministic results
 * @returns Default result with totals and per-bucket breakdown
 */
export function calculateDefaults(
  loanBuckets: LoanBucketData[],
  gameQuarters: number,
  seed: bigint
): DefaultResult {
  const rng = new SeededRandom(seed)
  let totalDefaults = 0
  const defaultsByBucket = new Map<string, number>()
  const bucketUpdates = new Map<
    string,
    {
      currentBalance: number
      activeLoanCount: number
    }
  >()

  for (const bucket of loanBuckets) {
    const defaultAmount = calculateBucketDefaults(bucket, gameQuarters, rng)

    if (defaultAmount > 0) {
      totalDefaults += defaultAmount
      defaultsByBucket.set(bucket.id, defaultAmount)

      // Calculate new balance and active loan count
      const newBalance = bucket.currentBalance - defaultAmount
      const defaultRate = defaultAmount / bucket.currentBalance
      const loansDefaulted = Math.ceil(bucket.activeLoanCount * defaultRate)
      const newActiveLoanCount = Math.max(
        0,
        bucket.activeLoanCount - loansDefaulted
      )

      bucketUpdates.set(bucket.id, {
        currentBalance: Math.max(0, newBalance),
        activeLoanCount: newActiveLoanCount,
      })
    }
  }

  return {
    totalDefaults,
    defaultsByBucket,
    bucketUpdates,
  }
}

/**
 * Generate a deterministic seed from bank ID and timestamp
 * Used to ensure the same collection always produces the same defaults
 *
 * @param bankId - Bank UUID
 * @param timestamp - Collection timestamp
 * @returns Seed as bigint
 */
export function generateSeed(bankId: string, timestamp: Date): bigint {
  // Simple hash: combine bank ID and timestamp
  const combined = `${bankId}-${timestamp.getTime()}`
  let hash = 0n

  for (let i = 0; i < combined.length; i++) {
    const char = BigInt(combined.charCodeAt(i))
    hash = (hash << 5n) - hash + char
    hash = hash & hash // Convert to 32-bit integer equivalent
  }

  return hash < 0n ? -hash : hash
}
