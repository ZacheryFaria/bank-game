/**
 * Collection Simulator
 * Orchestrates the entire game collection process
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
 * @param bankState - Current bank state
 * @param collectionTime - Time of collection (real time)
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

  // 2. Generate deterministic seed
  const randomSeed = generateSeed(bankState.id, lastCollected)

  // Initialize tracking
  const transactions: TransactionRecord[] = []
  const newLoanBuckets: LoanBucketData[] = []
  const newDepositBuckets: DepositBucketData[] = []

  // Use maps to track bucket updates, keyed by bucket ID
  const loanBucketUpdates = new Map<string, LoanBucketData>()
  const depositBucketUpdates = new Map<string, DepositBucketData>()

  let currentEquity = bankState.currentEquity
  let currentLoans = bankState.currentLoans
  let currentDeposits = bankState.currentDeposits

  // Truncate to hour for bucket grouping
  const periodStart = new Date(collectionTime)
  periodStart.setUTCMinutes(0, 0, 0)

  // 3. Simulate demand and originations
  const loanDemands = calculateAllLoanDemands(bankState.rates)
  const depositDemands = calculateAllDepositDemands(bankState.rates)

  let totalLoansOriginated = 0

  for (const demand of loanDemands) {
    const product = demand.product
    const productConfig = LOAN_PRODUCTS[product]
    const totalDemandDollars = demand.hourlyDemand * realHoursElapsed

    for (const [riskClass, allocationPct] of Object.entries(
      bankState.allocations
    )) {
      const allocatedDemand = totalDemandDollars * allocationPct

      const availableCapital =
        currentDeposits - currentLoans - currentDeposits * RESERVE_REQUIREMENT
      const actualLoanAmount = Math.min(
        allocatedDemand,
        Math.max(0, availableCapital)
      )

      if (actualLoanAmount > 0) {
        const existingBucket = bankState.loanBuckets.find(
          b => b.product === product &&
          b.riskClass === riskClass &&
          b.originationHour.getTime() === periodStart.getTime()
        )

        const loanCount = Math.max(
          1,
          Math.round(actualLoanAmount / productConfig.avgLoanSize)
        )

        let bucketId: string
        if (existingBucket) {
          bucketId = existingBucket.id
          const priorUpdate = loanBucketUpdates.get(bucketId) || existingBucket

          const updatedBucket: LoanBucketData = {
            ...priorUpdate,
            originalPrincipal: priorUpdate.originalPrincipal + actualLoanAmount,
            currentBalance: priorUpdate.currentBalance + actualLoanAmount,
            loanCount: priorUpdate.loanCount + loanCount,
            activeLoanCount: priorUpdate.activeLoanCount + loanCount,
          }
          loanBucketUpdates.set(bucketId, updatedBucket)
        } else {
          bucketId = `new-${product}-${riskClass}-${periodStart.toISOString()}`

          const bucket: LoanBucketData = {
            id: bucketId,
            product,
            riskClass: riskClass as RiskClass,
            originationHour: periodStart,
            originalPrincipal: actualLoanAmount,
            currentBalance: actualLoanAmount,
            interestRate: bankState.rates[product] || 0,
            loanCount,
            activeLoanCount: loanCount,
          }

          newLoanBuckets.push(bucket)
        }

        currentLoans += actualLoanAmount
        totalLoansOriginated += actualLoanAmount

        transactions.push({
          type: 'loan_origination',
          amount: -actualLoanAmount, // Negative = outflow
          timestamp: collectionTime,
          loanBucketId: bucketId,
          details: { product, riskClass },
        })
      }
    }
  }

  // Process deposit inflows
  for (const demand of depositDemands) {
    const product = demand.product
    const totalInflowDollars = demand.hourlyDemand * realHoursElapsed

    if (totalInflowDollars > 0) {
      const existingBucket = bankState.depositBuckets.find(
        b => b.product === product &&
        b.originationHour.getTime() === periodStart.getTime()
      )

      let depositBucketId: string
      if (existingBucket) {
        depositBucketId = existingBucket.id
        const priorUpdate = depositBucketUpdates.get(depositBucketId) || existingBucket

        const updatedBucket: DepositBucketData = {
          ...priorUpdate,
          originalAmount: priorUpdate.originalAmount + totalInflowDollars,
          currentBalance: priorUpdate.currentBalance + totalInflowDollars,
        }
        depositBucketUpdates.set(depositBucketId, updatedBucket)
      } else {
        depositBucketId = `new-deposit-${product}-${periodStart.toISOString()}`

        const bucket: DepositBucketData = {
          id: depositBucketId,
          product,
          originationHour: periodStart,
          originalAmount: totalInflowDollars,
          currentBalance: totalInflowDollars,
          interestRate: bankState.rates[product] || 0,
        }

        newDepositBuckets.push(bucket)
      }

      currentDeposits += totalInflowDollars

      transactions.push({
        type: 'deposit_inflow',
        amount: totalInflowDollars, // Positive = inflow
        timestamp: collectionTime,
        depositBucketId: depositBucketId,
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
    realHoursElapsed
  )

  transactions.push({
    type: 'interest_income',
    amount: interestResult.interestIncome,
    timestamp: collectionTime,
    details: { realHoursElapsed },
  })

  transactions.push({
    type: 'interest_expense',
    amount: -interestResult.interestExpense, // Negative = outflow
    timestamp: collectionTime,
    details: { realHoursElapsed },
  })

  currentEquity += interestResult.netInterestIncome

  for (const [bucketId, interest] of interestResult.depositInterestByBucket.entries()) {
    if (interest <= 0) continue

    const isExistingBucket = bankState.depositBuckets.some(b => b.id === bucketId)
    const isNewBucket = newDepositBuckets.some(b => b.id === bucketId)

    if (isExistingBucket) {
      const currentBucket = depositBucketUpdates.get(bucketId) ||
        bankState.depositBuckets.find(b => b.id === bucketId)!

      const updatedBucket: DepositBucketData = {
        ...currentBucket,
        currentBalance: currentBucket.currentBalance + interest,
      }
      depositBucketUpdates.set(bucketId, updatedBucket)
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
    realHoursElapsed,
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
        const currentBucket = loanBucketUpdates.get(bucketId) ||
          bankState.loanBuckets.find(b => b.id === bucketId)!

        const updatedBucket: LoanBucketData = {
          ...currentBucket,
          currentBalance: update.currentBalance,
          activeLoanCount: update.activeLoanCount,
        }
        loanBucketUpdates.set(bucketId, updatedBucket)
      } else if (isNewBucket) {
        const bucket = newLoanBuckets.find(b => b.id === bucketId)!
        bucket.currentBalance = update.currentBalance
        bucket.activeLoanCount = update.activeLoanCount
      }
    }

    transactions.push({
      type: 'loan_default',
      amount: -defaultAmount,
      timestamp: collectionTime,
      loanBucketId: bucketId,
      details: { realHoursElapsed },
    })

    currentLoans -= defaultAmount
    currentEquity -= defaultAmount
  }

  // 6. Calculate operating expenses
  const totalAssets = currentLoans + (currentDeposits - currentLoans)
  const annualOpex = totalAssets * OPERATING_COST_RATE
  const periodOpex = annualOpex * (realHoursElapsed / 4)

  transactions.push({
    type: 'operating_expense',
    amount: -periodOpex, // Negative = expense
    timestamp: collectionTime,
    details: { totalAssets, realHoursElapsed },
  })

  currentEquity -= periodOpex

  // 7. Calculate net income
  const netIncome =
    interestResult.netInterestIncome - defaultResult.totalDefaults - periodOpex

  // 8. Build collection report
  const updatedLoanBuckets = Array.from(loanBucketUpdates.values())
  const updatedDepositBuckets = Array.from(depositBucketUpdates.values())

  // Calculate ending balances from actual bucket data to prevent drift
  const unchangedLoanBuckets = bankState.loanBuckets.filter(
    b => !loanBucketUpdates.has(b.id)
  )
  const actualEndingLoans = [
    ...newLoanBuckets,
    ...updatedLoanBuckets,
    ...unchangedLoanBuckets,
  ].reduce((sum, b) => sum + b.currentBalance, 0)

  const unchangedDepositBuckets = bankState.depositBuckets.filter(
    b => !depositBucketUpdates.has(b.id)
  )
  const actualEndingDeposits = [
    ...newDepositBuckets,
    ...updatedDepositBuckets,
    ...unchangedDepositBuckets,
  ].reduce((sum, b) => sum + b.currentBalance, 0)

  const report: CollectionReport = {
    realHoursElapsed,
    loansOriginated: totalLoansOriginated,
    interestIncome: interestResult.interestIncome,
    interestExpense: interestResult.interestExpense,
    defaultLosses: defaultResult.totalDefaults,
    operatingExpenses: periodOpex,
    netIncome,
    endingEquity: currentEquity,
    endingLoans: actualEndingLoans,
    endingDeposits: actualEndingDeposits,
    randomSeed,
    transactions,
    newLoanBuckets,
    updatedLoanBuckets,
    newDepositBuckets,
    updatedDepositBuckets,
  }

  return report
}
