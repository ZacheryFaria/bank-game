# Collection Flow Test Cases

## Basic Collection Tests

### Happy Path
- [ ] First collection after registration
  - Should originate loans based on rates and allocation
  - Should originate deposits based on rates
  - Should calculate interest income from loans
  - Should calculate interest expense from deposits
  - Should record all transactions
  - Should update bank state (equity, loans, deposits)
  - Should create new loan buckets
  - Should create new deposit buckets
  - Should record collection history

### Rate Limiting
- [ ] Collection within 60 seconds of last collection → 429 error
  - Error should include `retryAfter` in seconds
- [ ] Collection after 60+ seconds → Success
- [ ] Multiple rapid collection attempts → All but first return 429

---

## Time Calculations

### Elapsed Time
- [ ] Collection after 1 hour → gameQuartersElapsed = 1
- [ ] Collection after 6 hours → gameQuartersElapsed = 6
- [ ] Collection after 24 hours → gameQuartersElapsed = 24
- [ ] Collection after 48 hours → gameQuartersElapsed = 24 (capped at MAX_IDLE_HOURS)
- [ ] Collection after 1 week → gameQuartersElapsed = 24 (capped)

### Game Time Tracking
- [ ] `gameTimeStart` = `lastCollectedAt`
- [ ] `gameTimeEnd` = gameTimeStart + (quarters * 90 days)
- [ ] Transaction timestamps are in game time

---

## Loan Origination Tests

### Demand Calculation
- [ ] Lower rates than market → Higher loan demand
- [ ] Higher rates than market → Lower loan demand
- [ ] Market rate → Baseline demand
- [ ] Extremely high rates (above market) → Minimal/zero demand

### Risk Allocation
- [ ] Equal allocation (25% each) → Loans distributed evenly across risk classes
- [ ] Unequal allocation (e.g., 50% super_prime, 50% prime) → Correct distribution
- [ ] Allocation changes persist between collections

### Capital Constraints
- [ ] Insufficient capital (deposits - loans < reserve) → No new loans originated
- [ ] Exactly sufficient capital → Originate up to available amount
- [ ] Excess capital → Originate based on demand, not capital

---

## Deposit Tests

### Deposit Inflow
- [ ] Higher deposit rates → More deposit inflow
- [ ] Lower deposit rates → Less deposit inflow
- [ ] Market rate → Baseline inflow

### Product Types
- [ ] Savings deposits created correctly
- [ ] CD deposits created with maturity date
- [ ] Multiple deposit products per collection

---

## Interest Calculation Tests

### Loan Interest Income
- [ ] Interest calculated correctly for 1 quarter
- [ ] Interest calculated correctly for multiple quarters
- [ ] Interest scales with loan balance
- [ ] Interest uses correct annual rate / 4

### Deposit Interest Expense
- [ ] Interest calculated correctly for 1 quarter
- [ ] Interest calculated correctly for multiple quarters
- [ ] Interest scales with deposit balance
- [ ] Interest uses correct annual rate / 4

### **Deposit Interest Accrual (Critical Fix)**
- [ ] Existing deposit buckets have interest added to `currentBalance`
- [ ] Multiple collections compound interest correctly
- [ ] Interest accrual updates both bucket balance and total deposits
- [ ] Updated deposit buckets persisted to database
- [ ] Example: $10,000 deposit at 3% APR for 1 quarter → balance becomes $10,075

---

## Default Tests

### Deterministic Defaults
- [ ] Same bank state + timestamp → Same default results (seeded RNG)
- [ ] Different timestamp → Different default results
- [ ] Seed generation uses bankId + timestamp

### Default Calculations
- [ ] Super prime loans → ~0.5% annual default rate
- [ ] Prime loans → ~2% annual default rate
- [ ] Near prime loans → ~6% annual default rate
- [ ] Subprime loans → ~15% annual default rate
- [ ] Defaults scale with quarters elapsed

### Default Variance
- [ ] Actual defaults vary between 0.8x and 1.2x expected
- [ ] Over many collections, average approaches expected rate

### Bucket Updates
- [ ] Defaulted loans reduce bucket `currentBalance`
- [ ] Defaulted loans reduce `activeLoanCount`
- [ ] Fully defaulted buckets (balance = 0) handled correctly

---

## Operating Expenses Tests

- [ ] Operating expenses = 1% of total assets per year
- [ ] Scales correctly with quarters elapsed
- [ ] Calculated based on end-of-period assets

---

## Transaction Ledger Tests

### Transaction Types
- [ ] `loan_origination` - Recorded with negative amount (outflow)
- [ ] `deposit_inflow` - Recorded with positive amount (inflow)
- [ ] `interest_income` - Recorded with positive amount
- [ ] `interest_expense` - Recorded with negative amount
- [ ] `loan_default` - Recorded with negative amount (loss)
- [ ] `operating_expense` - Recorded with negative amount

### Transaction Metadata
- [ ] Each transaction has `bankId`, `timestamp`, `collectedAt`
- [ ] Loan transactions linked to `loanBucketId`
- [ ] Deposit transactions linked to `depositBucketId`
- [ ] Details JSON includes relevant context

---

## Collection Report Tests

### Report Fields
- [ ] `gameTimeStart` and `gameTimeEnd` correct
- [ ] `realHoursElapsed` matches actual time
- [ ] `gameQuartersElapsed` matches time conversion
- [ ] `loansOriginated` = sum of all new loans
- [ ] `interestIncome` = sum of loan interest
- [ ] `interestExpense` = sum of deposit interest
- [ ] `defaultLosses` = sum of all defaults
- [ ] `operatingExpenses` calculated correctly
- [ ] `netIncome` = interest income - interest expense - defaults - opex
- [ ] `endingEquity`, `endingLoans`, `endingDeposits` match final state
- [ ] `randomSeed` recorded for reproducibility

### Array Fields
- [ ] `newLoanBuckets` contains all originated loan buckets
- [ ] `updatedLoanBuckets` contains buckets with defaults
- [ ] `newDepositBuckets` contains all new deposit buckets
- [ ] `updatedDepositBuckets` contains buckets with accrued interest
- [ ] `transactions` contains all transaction records

---

## Database Persistence Tests

### Bank State Updates
- [ ] `lastCollectedAt` updated to collection time
- [ ] `currentEquity` updated correctly
- [ ] `currentLoans` updated correctly
- [ ] `currentDeposits` updated correctly

### Bucket Persistence
- [ ] New loan buckets saved to database
- [ ] Updated loan buckets (with defaults) persisted
- [ ] New deposit buckets saved to database
- [ ] **Updated deposit buckets (with interest) persisted**

### Collection History
- [ ] Collection record saved with all report fields
- [ ] Previous collections remain in history
- [ ] Can query collection history by bank

### Transactions
- [ ] All transactions persisted to database
- [ ] Can query transactions by bank
- [ ] Can query transactions by type
- [ ] Can reconstruct financial state from transaction ledger

---

## Edge Cases

### Zero Balances
- [ ] Bank with no loans → No interest income, no defaults
- [ ] Bank with no deposits → No interest expense, no new loans (capital constraint)
- [ ] Loan bucket with $0 balance → No interest, no defaults

### Extreme Values
- [ ] Very high rates (49.99%) → Demand approaches zero
- [ ] Very low rates (0.01%) → Maximum demand
- [ ] Zero rate → Baseline demand calculation

### First vs. Subsequent Collections
- [ ] First collection (no existing buckets) → Creates new buckets only
- [ ] Second collection (existing buckets) → Updates existing + creates new
- [ ] Multiple collections → Interest compounds correctly

### Boundary Conditions
- [ ] Allocation sum = 0.9999 (within tolerance) → Accepted
- [ ] Allocation sum = 1.0001 (within tolerance) → Accepted
- [ ] Allocation sum = 0.99 (outside tolerance) → Rejected in rate update

---

## Integration Tests

### Full Lifecycle
- [ ] Register → Collect → Update Rates → Collect → Verify state changes
- [ ] Register → Collect → Update Allocation → Collect → Verify loan distribution
- [ ] Register → Wait 2 hours → Collect → Verify 2 quarters elapsed

### Multi-User Scenarios
- [ ] Two users collect independently → No interference
- [ ] Collections use separate database transactions
- [ ] No race conditions on shared resources
