# Math & Formulas

## Time Conversion

```
1 real hour = 1 game quarter (3 months)
1 real day (24h cap) = 6 game years

timeMultiplier = 2190 (hours in a quarter)
gameHours = realHours * timeMultiplier
```

## Loan Demand

How much loan demand you attract based on your rate vs market rate.

```
demandMultiplier = 1 + (marketRate - yourRate) * sensitivity
hourlyDemand = baseDemand * demandMultiplier
```

**Example:**
- Market mortgage rate: 6%
- Your rate: 5%
- Sensitivity: 0.6

```
demandMultiplier = 1 + (6 - 5) * 0.6 = 1.6
You get 160% of base demand
```

### Loan Product Constants

| Product | Base Demand/hr | Sensitivity | Avg Loan Size | Market Rate |
|---------|---------------|-------------|---------------|-------------|
| Credit Cards | $5,000 | 0.3 | $2,500 | 22% |
| Personal Loans | $3,000 | 0.5 | $8,000 | 12% |
| Auto Loans | $4,000 | 0.4 | $25,000 | 7% |
| Mortgages | $8,000 | 0.6 | $250,000 | 6% |

Lower sensitivity = convenience-driven (credit cards)
Higher sensitivity = rate shoppers (mortgages)

## Deposit Inflow

Same concept, but you're competing for depositors.

```
depositMultiplier = 1 + (yourRate - marketRate) * sensitivity
hourlyDeposits = baseDeposits * depositMultiplier
```

### Deposit Product Constants

| Product | Base Inflow/hr | Sensitivity | Market Rate |
|---------|---------------|-------------|-------------|
| Savings | $10,000 | 0.4 | 3% |
| CDs | $5,000 | 0.8 | 4% |

CDs are more rate-sensitive (people shop for best rates).

## Loan Allocation

Incoming demand is distributed based on player's allocation percentages.

```
For each risk class:
  allocatedDemand = totalDemand * allocationPercent
  actualLoans = min(allocatedDemand, availableCapital, incomingDemand)
```

If allocation is set to 50% subprime but there's not enough subprime demand, you get less volume.

## Interest Income (Loans)

```
quarterlyInterest = loanBalance * (annualRate / 4)
interestIncome = totalLoanBalance * weightedAvgRate * (gameQuarters)
```

## Interest Expense (Deposits)

```
quarterlyExpense = depositBalance * (annualRate / 4)
interestExpense = totalDeposits * weightedAvgRate * (gameQuarters)
```

## Defaults

Each risk class has an annual default rate. Calculated per collection period.

```
For each risk class:
  annualDefaultRate = baseRate for that class
  periodDefaultRate = annualDefaultRate * (gameQuarters / 4)

  expectedDefaults = classBalance * periodDefaultRate
  actualDefaults = expectedDefaults * randomVariance(0.8, 1.2)
```

### Default Rate Constants

| Risk Class | Annual Default Rate |
|------------|---------------------|
| Super-Prime | 0.5% |
| Prime | 2% |
| Near-Prime | 6% |
| Subprime | 15% |

## Net Income

```
netInterestIncome = interestIncome - interestExpense
netIncome = netInterestIncome - defaults - operatingCosts
```

## Capital Constraint

```
availableToLend = totalDeposits - currentLoans - minimumReserve
minimumReserve = totalDeposits * reserveRequirement
```

If `availableToLend <= 0`, no new loans are issued.

## Full Collection Example

**Player settings:**
- Mortgage rate: 5.5% (market: 6%)
- Savings rate: 3.5% (market: 3%)
- Allocation: 10% subprime, 20% near-prime, 40% prime, 30% super-prime

**Current state:**
- Loan portfolio: $5M
- Deposits: $6M

**Elapsed time:** 12 real hours = 12 game quarters = 3 years

```
1. DEMAND
   mortgageDemandMult = 1 + (6 - 5.5) * 0.6 = 1.3
   mortgageDemand = $8,000/hr * 1.3 = $10,400/hr
   Over 12 quarters (game time): significant volume

2. DEPOSITS
   savingsInflowMult = 1 + (3.5 - 3) * 0.4 = 1.2
   savingsInflow = $10,000/hr * 1.2 = $12,000/hr

3. ALLOCATION
   Of incoming mortgage demand:
     Subprime: 10%
     Near-prime: 20%
     Prime: 40%
     Super-prime: 30%

4. INTEREST INCOME
   $5M * 5.5% * 3 years = $825,000

5. INTEREST EXPENSE
   $6M * 3.5% * 3 years = $630,000

6. DEFAULTS (over 3 years)
   Subprime ($500K): $500K * 15% * 3 = $225K
   Near-prime ($1M): $1M * 6% * 3 = $180K
   Prime ($2M): $2M * 2% * 3 = $120K
   Super-prime ($1.5M): $1.5M * 0.5% * 3 = $22.5K
   Total defaults: ~$547K

7. NET INCOME
   $825K - $630K - $547K - opex = negative (bad allocation!)
```

This example shows high subprime allocation can be dangerous over long periods.
