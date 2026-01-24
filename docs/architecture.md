# Technical Architecture

## Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                 │
│                   Vite → Cloudflare CDN                         │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS (fetch on demand, no polling)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Docker)                            │
│                     Self-hosted server                          │
│                                                                 │
│              API Server + Game Engine                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL                                 │
└─────────────────────────────────────────────────────────────────┘
```

- **Frontend:** Vite build, deployed to Cloudflare CDN
- **Backend:** Docker container, self-hosted
- **Database:** PostgreSQL
- **Real-time:** None. Client fetches on demand (navigate, click collect)

---

## API Endpoints

```
AUTH
  POST   /auth/register
  POST   /auth/login

BANK (your bank)
  GET    /bank                 # Your bank's current state
  PUT    /bank/rates           # Update your rates
  PUT    /bank/allocation      # Update risk allocation
  POST   /bank/collect         # Trigger collection (rate limited: 1/min)

OTHER BANKS
  GET    /banks                # List all banks (paginated)
  GET    /banks/:id            # View specific bank
  GET    /banks/:id/financials # Full financial statements

MARKET
  GET    /market/rates         # Fixed market rates (reference)

LEADERBOARDS
  GET    /leaderboards         # All leaderboard categories
  GET    /leaderboards/:type   # Specific leaderboard
```

---

## Game Engine

Pure functions, no side effects, easy to test.

```
CollectionSimulator
  Input:  bankState, elapsedTime, marketRates (fixed)
  Output: newBankState, collectionReport, transactions[]

DemandCalculator
  Input:  bankRates, marketRates (fixed), elapsedGameTime
  Output: demandByProduct

DefaultRoller
  Input:  loanBuckets[], elapsedGameTime, seed
  Output: defaultsByBucket, totalLosses

InterestCalculator
  Input:  loanBuckets[], depositBuckets[], elapsedGameTime
  Output: interestIncome, interestExpense
```

---

## Database Schema

### `users`

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `banks`

The bank entity with denormalized current balances.

```sql
CREATE TABLE banks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) UNIQUE,
    name                VARCHAR(100) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_collected_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Denormalized current state (derived from ledger, cached for perf)
    current_equity      DECIMAL(18,2) NOT NULL DEFAULT 200000.00,
    current_loans       DECIMAL(18,2) NOT NULL DEFAULT 0,
    current_deposits    DECIMAL(18,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_banks_equity ON banks(current_equity DESC);
CREATE INDEX idx_banks_loans ON banks(current_loans DESC);
```

### `bank_rates`

Current rate settings.

```sql
CREATE TABLE bank_rates (
    bank_id     UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
    product     VARCHAR(20) NOT NULL,  -- mortgage, auto, personal, credit_card, savings, cd
    rate        DECIMAL(5,4) NOT NULL, -- e.g., 0.0650 = 6.50%
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (bank_id, product),
    CHECK (rate >= 0 AND rate <= 0.5)
);
```

### `bank_allocation`

Risk class allocation.

```sql
CREATE TABLE bank_allocation (
    bank_id     UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
    risk_class  VARCHAR(20) NOT NULL,  -- subprime, near_prime, prime, super_prime
    percentage  DECIMAL(5,4) NOT NULL, -- e.g., 0.2500 = 25%
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (bank_id, risk_class),
    CHECK (percentage >= 0 AND percentage <= 1)
);
-- Application enforces sum = 1.0
```

### `loan_buckets`

Hourly aggregates of loans. Tracks aging without storing individual loans.

```sql
CREATE TABLE loan_buckets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id             UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
    product             VARCHAR(20) NOT NULL,
    risk_class          VARCHAR(20) NOT NULL,

    origination_hour    TIMESTAMPTZ NOT NULL,  -- Truncated to hour

    original_principal  DECIMAL(18,2) NOT NULL,
    current_balance     DECIMAL(18,2) NOT NULL,
    interest_rate       DECIMAL(5,4) NOT NULL,
    loan_count          INTEGER NOT NULL,
    active_loan_count   INTEGER NOT NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(bank_id, product, risk_class, origination_hour)
);

CREATE INDEX idx_loan_buckets_bank ON loan_buckets(bank_id);
CREATE INDEX idx_loan_buckets_balance ON loan_buckets(bank_id, current_balance)
    WHERE current_balance > 0;
```

### `deposit_buckets`

Hourly aggregates of deposits.

```sql
CREATE TABLE deposit_buckets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id             UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
    product             VARCHAR(20) NOT NULL,  -- savings, cd

    origination_hour    TIMESTAMPTZ NOT NULL,

    original_amount     DECIMAL(18,2) NOT NULL,
    current_balance     DECIMAL(18,2) NOT NULL,
    interest_rate       DECIMAL(5,4) NOT NULL,
    maturity_date       TIMESTAMPTZ,           -- For CDs

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(bank_id, product, origination_hour)
);

CREATE INDEX idx_deposit_buckets_bank ON deposit_buckets(bank_id);
```

### `transactions`

The ledger. Source of truth for all financial changes.

```sql
CREATE TABLE transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id             UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,

    timestamp           TIMESTAMPTZ NOT NULL,     -- Game time
    collected_at        TIMESTAMPTZ NOT NULL,     -- Real time of collection

    type                VARCHAR(30) NOT NULL,
    amount              DECIMAL(18,2) NOT NULL,   -- Positive = inflow, Negative = outflow

    loan_bucket_id      UUID REFERENCES loan_buckets(id),
    deposit_bucket_id   UUID REFERENCES deposit_buckets(id),

    details             JSONB,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_bank ON transactions(bank_id, timestamp);
CREATE INDEX idx_transactions_type ON transactions(bank_id, type);
```

**Transaction Types:**

| Type | Sign | Description |
|------|------|-------------|
| `loan_origination` | - | Capital lent out |
| `loan_repayment` | + | Principal repaid |
| `interest_income` | + | Interest earned |
| `loan_default` | - | Principal lost |
| `deposit_inflow` | + | New deposits |
| `deposit_outflow` | - | Withdrawals |
| `interest_expense` | - | Interest paid to depositors |
| `operating_expense` | - | Opex costs |

### `collections`

Summary of each collect action.

```sql
CREATE TABLE collections (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id                 UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,

    collected_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    game_time_start         TIMESTAMPTZ NOT NULL,
    game_time_end           TIMESTAMPTZ NOT NULL,
    real_hours_elapsed      DECIMAL(10,4) NOT NULL,
    game_quarters_elapsed   DECIMAL(10,4) NOT NULL,

    loans_originated        DECIMAL(18,2) NOT NULL,
    interest_income         DECIMAL(18,2) NOT NULL,
    interest_expense        DECIMAL(18,2) NOT NULL,
    default_losses          DECIMAL(18,2) NOT NULL,
    operating_expenses      DECIMAL(18,2) NOT NULL,
    net_income              DECIMAL(18,2) NOT NULL,

    ending_equity           DECIMAL(18,2) NOT NULL,
    ending_loans            DECIMAL(18,2) NOT NULL,
    ending_deposits         DECIMAL(18,2) NOT NULL,

    random_seed             BIGINT NOT NULL,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_collections_bank ON collections(bank_id, collected_at DESC);
```

### `quarterly_snapshots`

End-of-quarter snapshots for 10-Q style reports.

```sql
CREATE TABLE quarterly_snapshots (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id                 UUID NOT NULL REFERENCES banks(id) ON DELETE CASCADE,

    quarter_end             DATE NOT NULL,
    fiscal_year             INTEGER NOT NULL,
    fiscal_quarter          INTEGER NOT NULL,

    -- Balance sheet
    total_assets            DECIMAL(18,2) NOT NULL,
    total_loans             DECIMAL(18,2) NOT NULL,
    loan_loss_reserve       DECIMAL(18,2) NOT NULL,
    cash_and_reserves       DECIMAL(18,2) NOT NULL,
    total_deposits          DECIMAL(18,2) NOT NULL,
    total_liabilities       DECIMAL(18,2) NOT NULL,
    total_equity            DECIMAL(18,2) NOT NULL,

    -- Income statement (for the quarter)
    interest_income         DECIMAL(18,2) NOT NULL,
    interest_expense        DECIMAL(18,2) NOT NULL,
    net_interest_income     DECIMAL(18,2) NOT NULL,
    provision_for_losses    DECIMAL(18,2) NOT NULL,
    operating_expenses      DECIMAL(18,2) NOT NULL,
    net_income              DECIMAL(18,2) NOT NULL,

    -- Key ratios
    capital_ratio           DECIMAL(5,4) NOT NULL,
    net_interest_margin     DECIMAL(5,4) NOT NULL,
    return_on_equity        DECIMAL(5,4) NOT NULL,
    default_rate            DECIMAL(5,4) NOT NULL,

    -- Portfolio breakdown
    portfolio_by_product    JSONB NOT NULL,
    portfolio_by_risk_class JSONB NOT NULL,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(bank_id, quarter_end)
);
```

---

## Fixed Market Rates (V1)

No dynamic market calculation. Fixed reference rates stored in config or constants:

```
MARKET_RATES = {
    mortgage: 0.06,
    auto: 0.07,
    personal: 0.12,
    credit_card: 0.22,
    savings: 0.03,
    cd: 0.04
}
```

Player demand calculated as:

```
demandMultiplier = 1 + (MARKET_RATES[product] - playerRate) * sensitivity
playerDemand = baseDemand * demandMultiplier
```

Dynamic market rates (derived from player behavior) are backlogged.

---

## Collection Flow

```
POST /bank/collect

1. RATE LIMIT CHECK
   - If last_collected_at < 60 seconds ago → 429 error

2. LOAD STATE
   - Load bank, rates, allocation, active buckets

3. CALCULATE TIME
   - realElapsed = min(now - last_collected_at, 24 hours)
   - gameQuarters = realElapsed (hours)  // 1 hour = 1 quarter

4. GENERATE SEED
   - seed = hash(bank_id + last_collected_at)
   - Used for deterministic default rolls

5. SIMULATE (per game-hour)
   For each hour in game time:
     a. Calculate demand (vs fixed market rates)
     b. Allocate demand to risk classes
     c. Create/update loan buckets
     d. Create/update deposit buckets
     e. Calculate interest income by bucket
     f. Calculate interest expense by bucket
     g. Roll defaults (seeded, age-weighted by bucket)
     h. Calculate operating costs
     i. Record transactions

6. QUARTERLY SNAPSHOTS
   - If quarter boundary crossed, generate snapshot

7. UPDATE STATE
   - Update denormalized balances on banks table
   - Update last_collected_at

8. SAVE
   - Write all new buckets, transactions, collections in single transaction

9. RETURN
   - Collection summary report
```

---

## Generating Financial Reports

### Income Statement (any period)

```sql
SELECT
    type,
    SUM(amount) as total
FROM transactions
WHERE bank_id = $1
  AND timestamp >= $period_start
  AND timestamp < $period_end
GROUP BY type;
```

### Balance Sheet (current)

```sql
-- Loans by product
SELECT product, SUM(current_balance) as balance
FROM loan_buckets
WHERE bank_id = $1 AND current_balance > 0
GROUP BY product;

-- Loans by risk class
SELECT risk_class, SUM(current_balance) as balance
FROM loan_buckets
WHERE bank_id = $1 AND current_balance > 0
GROUP BY risk_class;

-- Deposits
SELECT product, SUM(current_balance) as balance
FROM deposit_buckets
WHERE bank_id = $1 AND current_balance > 0
GROUP BY product;
```

### Loan Aging Report

```sql
SELECT
    product,
    risk_class,
    DATE_TRUNC('quarter', origination_hour) as vintage,
    SUM(original_principal) as originated,
    SUM(current_balance) as outstanding,
    (1 - SUM(current_balance) / NULLIF(SUM(original_principal), 0)) as paydown_rate
FROM loan_buckets
WHERE bank_id = $1
GROUP BY product, risk_class, DATE_TRUNC('quarter', origination_hour)
ORDER BY vintage;
```

---

## Rate Limiting

```sql
-- In /collect endpoint
SELECT last_collected_at FROM banks WHERE id = $1;

IF now() - last_collected_at < interval '60 seconds' THEN
    RETURN 429 {
        error: "Too soon",
        retry_after: 60 - (now - last_collected_at).seconds
    }
END IF;
```

Also enforce at API middleware layer.

---

## Data Retention

| Table | Retention | Notes |
|-------|-----------|-------|
| `transactions` | Forever | Audit trail, report generation |
| `loan_buckets` | Forever | Active until fully paid/defaulted |
| `deposit_buckets` | Forever | Active until withdrawn |
| `collections` | Forever | Player action history |
| `quarterly_snapshots` | Forever | 10-Q reports |

Transactions are append-only. Buckets updated in place but never deleted.

---

## Security

| Risk | Mitigation |
|------|------------|
| Cheating (fake collect times) | Server calculates elapsed from DB timestamp |
| Rate manipulation | Validate bounds (0-50%) |
| Collect spam | Rate limit 1/minute |
| Data tampering | All state server-side |

---

## Summary

```
V1 ARCHITECTURE
├── Frontend: Vite → Cloudflare CDN
├── Backend: Docker container, self-hosted
├── Database: PostgreSQL
├── API: REST, no WebSockets, no polling
├── Market rates: Fixed (dynamic backlogged)
├── Loan storage: Hourly buckets (not individual loans)
├── Accounting: Transaction ledger (source of truth)
├── Reports: Derived from transactions + snapshots
├── Randomness: Seeded for reproducibility
└── Rate limit: 1 collect per minute
```
