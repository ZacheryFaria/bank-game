/**
 * Collection Simulator
 * Orchestrates the entire game collection process
 * Based on design/architecture.md collection flow
 */

import {
  MAX_IDLE_HOURS,
  RESERVE_REQUIREMENT,
  OPERATING_COST_RATE,
  LOAN_PRODUCTS,
  type RiskClass,
} from './constants.js'
import {
  calculateAllLoanDemands,
  calculateAllDepositDemands,
} from './DemandCalculator.js'
import { calculateInterest } from './InterestCalculator.js'
import { calculateDefaults, generateSeed } from './DefaultRoller.js'
import type {
  BankState,
  CollectionReport,
  TransactionRecord,
  LoanBucketData,
  DepositBucketData,
} from './types.js'

/**
 * Simulate a collection period for a bank
 *
 * Steps:
 * 1. Calculate elapsed time (capped at 24 hours)
 * 2. Generate deterministic seed
 * 3. For each game hour/quarter:
 *    a. Calculate loan and deposit demand
 *    b. Allocate demand to risk classes
 *    c. Originate loans (if capital available)
 *    d. Process deposit inflows/outflows
 * 4. Calculate interest income and expense
 * 5. Roll defaults
 * 6. Calculate operating expenses
 * 7. Generate transaction records
 * 8. Update bank state
 * 9. Return collection report
 *
 * @param bankState - Current bank state
 * @param collectionTime - Time of collection
 * @returns Collection report with all changes
 */
export function simulateCollection(
  bankState: BankState,
  collectionTime: Date
): CollectionReport {
  // 1. Calculate elapsed time
  const lastCollected = new Date(bankState.lastCollectedAt)
  const realMillisecondsElapsed =
    collectionTime.getTime() - lastCollected.getTime()
  const realHoursElapsed = Math.min(
    realMillisecondsElapsed / (1000 * 60 * 60),
    MAX_IDLE_HOURS
  )
  const gameQuartersElapsed = realHoursElapsed // 1 real hour = 1 game quarter

  // 2. Generate deterministic seed
  const randomSeed = generateSeed(bankState.id, lastCollected)

  // Initialize tracking
  const transactions: TransactionRecord[] = []
  const newLoanBuckets: LoanBucketData[] = []
  const newDepositBuckets: DepositBucketData[] = []
  const updatedLoanBuckets: LoanBucketData[] = []
  const updatedDepositBuckets: DepositBucketData[] = []

  let currentEquity = bankState.currentEquity
  let currentLoans = bankState.currentLoans
  let currentDeposits = bankState.currentDeposits

  // Game time tracking
  const gameTimeStart = new Date(lastCollected)
  const gameTimeEnd = new Date(
    gameTimeStart.getTime() + gameQuartersElapsed * 90 * 24 * 60 * 60 * 1000
  )

  // 3. Simulate demand and originations
  const loanDemands = calculateAllLoanDemands(bankState.rates)
  const depositDemands = calculateAllDepositDemands(bankState.rates)

  // Calculate total demand for the period
  let totalLoansOriginated = 0

  for (const demand of loanDemands) {
    const product = demand.product
    const productConfig = LOAN_PRODUCTS[product]
    const totalDemandDollars = demand.hourlyDemand * gameQuartersElapsed

    // Allocate to risk classes based on bank's allocation
    for (const [riskClass, allocationPct] of Object.entries(
      bankState.allocations
    )) {
      const allocatedDemand = totalDemandDollars * allocationPct

      // Check if we have capital available
      const availableCapital =
        currentDeposits - currentLoans - currentDeposits * RESERVE_REQUIREMENT
      const actualLoanAmount = Math.min(
        allocatedDemand,
        Math.max(0, availableCapital)
      )

      if (actualLoanAmount > 0) {
        // Create a new loan bucket (or find existing for this hour)
        const bucketId = `new-${product}-${riskClass}-${gameTimeStart.toISOString()}`
        const loanCount = Math.max(
          1,
          Math.floor(actualLoanAmount / productConfig.avgLoanSize)
        )

        const bucket: LoanBucketData = {
          id: bucketId,
          product,
          riskClass: riskClass as RiskClass,
          originationHour: gameTimeStart,
          originalPrincipal: actualLoanAmount,
          currentBalance: actualLoanAmount,
          interestRate: bankState.rates[product] || 0,
          loanCount,
          activeLoanCount: loanCount,
        }

        newLoanBuckets.push(bucket)
        currentLoans += actualLoanAmount
        totalLoansOriginated += actualLoanAmount

        // Record transaction
        transactions.push({
          type: 'loan_origination',
          amount: -actualLoanAmount, // Negative = outflow
          timestamp: gameTimeStart,
          loanBucketId: bucketId,
          details: { product, riskClass },
        })
      }
    }
  }

  // Process deposit inflows
  for (const demand of depositDemands) {
    const product = demand.product
    const totalInflowDollars = demand.hourlyDemand * gameQuartersElapsed

    if (totalInflowDollars > 0) {
      const bucketId = `new-deposit-${product}-${gameTimeStart.toISOString()}`

      const bucket: DepositBucketData = {
        id: bucketId,
        product,
        originationHour: gameTimeStart,
        originalAmount: totalInflowDollars,
        currentBalance: totalInflowDollars,
        interestRate: bankState.rates[product] || 0,
      }

      newDepositBuckets.push(bucket)
      currentDeposits += totalInflowDollars

      transactions.push({
        type: 'deposit_inflow',
        amount: totalInflowDollars, // Positive = inflow
        timestamp: gameTimeStart,
        depositBucketId: bucketId,
        details: { product },
      })
    }
  }

  // 4. Calculate interest
  const allLoanBuckets = [...bankState.loanBuckets, ...newLoanBuckets]
  const allDepositBuckets = [...bankState.depositBuckets, ...newDepositBuckets]

  const interestResult = calculateInterest(
    allLoanBuckets,
    allDepositBuckets,
    gameQuartersElapsed
  )

  // Record interest transactions
  transactions.push({
    type: 'interest_income',
    amount: interestResult.interestIncome,
    timestamp: gameTimeEnd,
    details: { gameQuartersElapsed },
  })

  transactions.push({
    type: 'interest_expense',
    amount: -interestResult.interestExpense, // Negative = outflow
    timestamp: gameTimeEnd,
    details: { gameQuartersElapsed },
  })

  currentEquity += interestResult.netInterestIncome

  for (const [bucketId, interest] of interestResult.depositInterestByBucket.entries()) {
    if (interest <= 0) continue

    const isExistingBucket = bankState.depositBuckets.some(b => b.id === bucketId)
    const isNewBucket = newDepositBuckets.some(b => b.id === bucketId)

    if (isExistingBucket) {
      const bucket = bankState.depositBuckets.find(b => b.id === bucketId)!
      const updatedBucket: DepositBucketData = {
        ...bucket,
        currentBalance: bucket.currentBalance + interest,
      }
      updatedDepositBuckets.push(updatedBucket)
      currentDeposits += interest
    } else if (isNewBucket) {
      const bucket = newDepositBuckets.find(b => b.id === bucketId)!
      bucket.currentBalance += interest
      currentDeposits += interest
    }
  }

  // 5. Roll defaults
  const defaultResult = calculateDefaults(
    allLoanBuckets,
    gameQuartersElapsed,
    randomSeed
  )

  for (const [
    bucketId,
    defaultAmount,
  ] of defaultResult.defaultsByBucket.entries()) {
    const update = defaultResult.bucketUpdates.get(bucketId)
    if (update) {
      const isExistingBucket = bankState.loanBuckets.some(b => b.id === bucketId)
      const isNewBucket = newLoanBuckets.some(b => b.id === bucketId)

      if (isExistingBucket) {
        const bucket = bankState.loanBuckets.find(b => b.id === bucketId)!
        const updatedBucket: LoanBucketData = {
          ...bucket,
          currentBalance: update.currentBalance,
          activeLoanCount: update.activeLoanCount,
        }
        updatedLoanBuckets.push(updatedBucket)
      } else if (isNewBucket) {
        const bucket = newLoanBuckets.find(b => b.id === bucketId)!
        bucket.currentBalance = update.currentBalance
        bucket.activeLoanCount = update.activeLoanCount
      }
    }

    transactions.push({
      type: 'loan_default',
      amount: -defaultAmount,
      timestamp: gameTimeEnd,
      loanBucketId: bucketId,
      details: { gameQuartersElapsed },
    })

    currentLoans -= defaultAmount
    currentEquity -= defaultAmount
  }

  // 6. Calculate operating expenses
  const totalAssets = currentLoans + (currentDeposits - currentLoans)
  const annualOpex = totalAssets * OPERATING_COST_RATE
  const periodOpex = annualOpex * (gameQuartersElapsed / 4)

  transactions.push({
    type: 'operating_expense',
    amount: -periodOpex, // Negative = expense
    timestamp: gameTimeEnd,
    details: { totalAssets, gameQuartersElapsed },
  })

  currentEquity -= periodOpex

  // 7. Calculate net income
  const netIncome =
    interestResult.netInterestIncome - defaultResult.totalDefaults - periodOpex

  // 8. Build collection report
  const report: CollectionReport = {
    gameTimeStart,
    gameTimeEnd,
    realHoursElapsed,
    gameQuartersElapsed,
    loansOriginated: totalLoansOriginated,
    interestIncome: interestResult.interestIncome,
    interestExpense: interestResult.interestExpense,
    defaultLosses: defaultResult.totalDefaults,
    operatingExpenses: periodOpex,
    netIncome,
    endingEquity: currentEquity,
    endingLoans: currentLoans,
    endingDeposits: currentDeposits,
    randomSeed,
    transactions,
    newLoanBuckets,
    updatedLoanBuckets,
    newDepositBuckets,
    updatedDepositBuckets,
  }

  return report
}
