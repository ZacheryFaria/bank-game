/**
 * Demand Calculator
 * Pure function to calculate loan and deposit demand based on rates
 * Based on design/math-and-formulas.md
 */

import {
  LOAN_PRODUCTS,
  DEPOSIT_PRODUCTS,
  type LoanProduct,
  type DepositProduct,
} from './constants.js'
import type { BankRates, DemandResult } from './types.js'

/**
 * Calculate loan demand for a specific product
 *
 * Formula: demandMultiplier = 1 + (marketRate - yourRate) * sensitivity
 *          hourlyDemand = baseDemand * demandMultiplier
 *
 * Lower rates attract more demand (good for loans)
 */
export function calculateLoanDemand(
  product: LoanProduct,
  yourRate: number
): DemandResult {
  const config = LOAN_PRODUCTS[product]
  const demandMultiplier =
    1 + (config.marketRate - yourRate) * config.sensitivity
  const hourlyDemand = config.baseDemandPerHour * Math.max(0, demandMultiplier)

  return {
    product,
    demandMultiplier,
    hourlyDemand,
  }
}

/**
 * Calculate deposit inflow for a specific product
 *
 * Formula: depositMultiplier = 1 + (yourRate - marketRate) * sensitivity
 *          hourlyDeposits = baseDeposits * depositMultiplier
 *
 * Higher rates attract more deposits
 */
export function calculateDepositDemand(
  product: DepositProduct,
  yourRate: number
): DemandResult {
  const config = DEPOSIT_PRODUCTS[product]
  const demandMultiplier =
    1 + (yourRate - config.marketRate) * config.sensitivity
  const hourlyDemand = config.baseInflowPerHour * Math.max(0, demandMultiplier)

  return {
    product,
    demandMultiplier,
    hourlyDemand,
  }
}

/**
 * Calculate all loan demands based on bank's rates
 */
export function calculateAllLoanDemands(bankRates: BankRates): DemandResult[] {
  const results: DemandResult[] = []

  for (const product of Object.keys(LOAN_PRODUCTS) as LoanProduct[]) {
    const rate = bankRates[product]
    if (rate !== undefined) {
      results.push(calculateLoanDemand(product, rate))
    }
  }

  return results
}

/**
 * Calculate all deposit inflows based on bank's rates
 */
export function calculateAllDepositDemands(
  bankRates: BankRates
): DemandResult[] {
  const results: DemandResult[] = []

  for (const product of Object.keys(DEPOSIT_PRODUCTS) as DepositProduct[]) {
    const rate = bankRates[product]
    if (rate !== undefined) {
      results.push(calculateDepositDemand(product, rate))
    }
  }

  return results
}
