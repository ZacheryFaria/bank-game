/**
 * Game Engine Types
 */

import type { LoanProduct, DepositProduct, RiskClass, Product } from './constants.js';

export interface BankRates {
  [product: string]: number; // product -> rate mapping
}

export interface BankAllocation {
  [riskClass: string]: number; // risk class -> percentage mapping
}

export interface LoanBucketData {
  id: string;
  product: LoanProduct;
  riskClass: RiskClass;
  originationHour: Date;
  originalPrincipal: number;
  currentBalance: number;
  interestRate: number;
  loanCount: number;
  activeLoanCount: number;
}

export interface DepositBucketData {
  id: string;
  product: DepositProduct;
  originationHour: Date;
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  maturityDate?: Date;
}

export interface BankState {
  id: string;
  name: string;
  lastCollectedAt: Date;
  currentEquity: number;
  currentLoans: number;
  currentDeposits: number;
  rates: BankRates;
  allocations: BankAllocation;
  loanBuckets: LoanBucketData[];
  depositBuckets: DepositBucketData[];
}

export interface DemandResult {
  product: Product;
  demandMultiplier: number;
  hourlyDemand: number;
}

export interface InterestResult {
  interestIncome: number;
  interestExpense: number;
  netInterestIncome: number;
  loanInterestByBucket: Map<string, number>;
  depositInterestByBucket: Map<string, number>;
}

export interface DefaultResult {
  totalDefaults: number;
  defaultsByBucket: Map<string, number>;
  bucketUpdates: Map<string, {
    currentBalance: number;
    activeLoanCount: number;
  }>;
}

export interface TransactionRecord {
  type: 'loan_origination' | 'loan_repayment' | 'interest_income' | 'loan_default' |
        'deposit_inflow' | 'deposit_outflow' | 'interest_expense' | 'operating_expense';
  amount: number;
  timestamp: Date;
  loanBucketId?: string;
  depositBucketId?: string;
  details?: Record<string, any>;
}

export interface CollectionReport {
  gameTimeStart: Date;
  gameTimeEnd: Date;
  realHoursElapsed: number;
  gameQuartersElapsed: number;
  loansOriginated: number;
  interestIncome: number;
  interestExpense: number;
  defaultLosses: number;
  operatingExpenses: number;
  netIncome: number;
  endingEquity: number;
  endingLoans: number;
  endingDeposits: number;
  randomSeed: bigint;
  transactions: TransactionRecord[];
  newLoanBuckets: LoanBucketData[];
  updatedLoanBuckets: LoanBucketData[];
  newDepositBuckets: DepositBucketData[];
  updatedDepositBuckets: DepositBucketData[];
}
