/**
 * Game Constants
 * Values loaded from config.yml
 */

import { config } from '../lib/config.js'

// Product types
export type LoanProduct = 'mortgage' | 'auto' | 'personal' | 'credit_card'
export type DepositProduct = 'savings' | 'cd'
export type Product = LoanProduct | DepositProduct

// Risk classes
export type RiskClass = 'subprime' | 'near_prime' | 'prime' | 'super_prime'

// Loan product configuration
export interface LoanProductConfig {
  baseDemandPerHour: number
  sensitivity: number
  avgLoanSize: number
  marketRate: number
}

// Deposit product configuration
export interface DepositProductConfig {
  baseInflowPerHour: number
  sensitivity: number
  marketRate: number
}

// Time conversion
export const TIME_MULTIPLIER = config.time.multiplier
export const MAX_IDLE_HOURS = config.time.maxIdleHours
export const MAX_IDLE_QUARTERS = config.computed.maxIdleQuarters

// Rate limiting
export const COLLECT_COOLDOWN_SECONDS = config.rateLimit.collectCooldownSeconds

// Economy
export const STARTING_EQUITY = config.economy.startingEquity
export const RESERVE_REQUIREMENT = config.economy.reserveRequirement
export const OPERATING_COST_RATE = config.economy.operatingCostRate

// Market rates
export const MARKET_RATES: Record<Product, number> =
  config.marketRates as Record<Product, number>

// Loan products with market rates injected
export const LOAN_PRODUCTS: Record<LoanProduct, LoanProductConfig> = {
  credit_card: {
    ...config.loanProducts.credit_card,
    marketRate: config.marketRates.credit_card,
  },
  personal: {
    ...config.loanProducts.personal,
    marketRate: config.marketRates.personal,
  },
  auto: {
    ...config.loanProducts.auto,
    marketRate: config.marketRates.auto,
  },
  mortgage: {
    ...config.loanProducts.mortgage,
    marketRate: config.marketRates.mortgage,
  },
}

// Deposit products with market rates injected
export const DEPOSIT_PRODUCTS: Record<DepositProduct, DepositProductConfig> = {
  savings: {
    ...config.depositProducts.savings,
    marketRate: config.marketRates.savings,
  },
  cd: {
    ...config.depositProducts.cd,
    marketRate: config.marketRates.cd,
  },
}

// Risk class default rates
export const DEFAULT_RATES: Record<RiskClass, number> =
  config.defaultRates as Record<RiskClass, number>

// Default randomness variance
export const DEFAULT_VARIANCE_MIN = config.defaultVariance.min
export const DEFAULT_VARIANCE_MAX = config.defaultVariance.max
