/**
 * Game Constants
 * Based on design/math-and-formulas.md
 */

// Time conversion: 1 real hour = 1 game quarter (3 months)
export const TIME_MULTIPLIER = 2190 // hours in a quarter
export const MAX_IDLE_HOURS = 24 // Maximum idle time cap
export const MAX_IDLE_QUARTERS = 24 // 24 hours = 24 quarters = 6 years

// Rate limiting
export const COLLECT_COOLDOWN_SECONDS = 60

// Product types
export type LoanProduct = 'mortgage' | 'auto' | 'personal' | 'credit_card'
export type DepositProduct = 'savings' | 'cd'
export type Product = LoanProduct | DepositProduct

// Risk classes
export type RiskClass = 'subprime' | 'near_prime' | 'prime' | 'super_prime'

// Fixed market rates (V1 - no dynamic rates)
export const MARKET_RATES: Record<Product, number> = {
  mortgage: 0.06, // 6%
  auto: 0.07, // 7%
  personal: 0.12, // 12%
  credit_card: 0.22, // 22%
  savings: 0.03, // 3%
  cd: 0.04, // 4%
}

// Loan product configuration
export interface LoanProductConfig {
  baseDemandPerHour: number // Base demand in dollars/hour
  sensitivity: number // Rate sensitivity multiplier
  avgLoanSize: number // Average loan size in dollars
  marketRate: number // Market rate for this product
}

export const LOAN_PRODUCTS: Record<LoanProduct, LoanProductConfig> = {
  credit_card: {
    baseDemandPerHour: 5000,
    sensitivity: 0.3,
    avgLoanSize: 2500,
    marketRate: MARKET_RATES.credit_card,
  },
  personal: {
    baseDemandPerHour: 3000,
    sensitivity: 0.5,
    avgLoanSize: 8000,
    marketRate: MARKET_RATES.personal,
  },
  auto: {
    baseDemandPerHour: 4000,
    sensitivity: 0.4,
    avgLoanSize: 25000,
    marketRate: MARKET_RATES.auto,
  },
  mortgage: {
    baseDemandPerHour: 8000,
    sensitivity: 0.6,
    avgLoanSize: 250000,
    marketRate: MARKET_RATES.mortgage,
  },
}

// Deposit product configuration
export interface DepositProductConfig {
  baseInflowPerHour: number // Base inflow in dollars/hour
  sensitivity: number // Rate sensitivity multiplier
  marketRate: number // Market rate for this product
}

export const DEPOSIT_PRODUCTS: Record<DepositProduct, DepositProductConfig> = {
  savings: {
    baseInflowPerHour: 10000,
    sensitivity: 0.4,
    marketRate: MARKET_RATES.savings,
  },
  cd: {
    baseInflowPerHour: 5000,
    sensitivity: 0.8,
    marketRate: MARKET_RATES.cd,
  },
}

// Risk class default rates (annual)
export const DEFAULT_RATES: Record<RiskClass, number> = {
  super_prime: 0.005, // 0.5%
  prime: 0.02, // 2%
  near_prime: 0.06, // 6%
  subprime: 0.15, // 15%
}

// Default randomness variance range (multiplier)
export const DEFAULT_VARIANCE_MIN = 0.8
export const DEFAULT_VARIANCE_MAX = 1.2

// Capital constraints
export const RESERVE_REQUIREMENT = 0.1 // 10% of deposits must be held in reserve

// Operating costs
export const OPERATING_COST_RATE = 0.01 // 1% of total assets per year

// Starting capital
export const STARTING_EQUITY = 200000 // $200,000
