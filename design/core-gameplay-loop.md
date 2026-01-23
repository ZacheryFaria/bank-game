# Core Gameplay Loop

## Overview

The game follows an idle game model where real time passes continuously. Players configure their bank, then return later to collect results and adjust.

```
┌──────────────────┐
│   1. SET RATES   │◄──────────────────────────────┐
└────────┬─────────┘                               │
         ▼                                         │
┌──────────────────┐                               │
│  2. SET POLICIES │  (portfolio allocation)       │
└────────┬─────────┘                               │
         ▼                                         │
┌──────────────────┐                               │
│   3. WAIT        │  (real time passes)           │
└────────┬─────────┘                               │
         ▼                                         │
┌──────────────────┐                               │
│   4. COLLECT     │  (click button, server        │
└────────┬─────────┘   calculates delta)           │
         ▼                                         │
┌──────────────────┐                               │
│   5. ANALYZE     │  (spreadsheets, financials)   │
└────────┬─────────┘                               │
         │                                         │
         └─────────────────────────────────────────┘
```

## Time Model

- Real clock time passes continuously
- When player clicks "Collect", server calculates elapsed time
- Maximum idle time: 24 hours (prevents gaming by waiting weeks)
- Time multiplier: 1 real hour = 1 game quarter

```
elapsed = min(now - lastCollect, 24 hours)
gameTime = elapsed * (1 quarter per hour)
results = simulate(gameTime)
```

## Player Controls

Players have two main control surfaces:

### 1. Interest Rates

Set rates for each loan and deposit product. One rate per product.

```
LOAN RATES (what you charge borrowers):
- Credit Cards     [___]%   (market: ~22%)
- Personal Loans   [___]%   (market: ~12%)
- Auto Loans       [___]%   (market: ~7%)
- Mortgages        [___]%   (market: ~6%)

DEPOSIT RATES (what you pay depositors):
- Savings          [___]%   (market: ~3%)
- CDs              [___]%   (market: ~4%)
```

**Tradeoffs:**
- Lower loan rates → More volume, thinner margins
- Higher deposit rates → More capital to lend, higher cost of funds

### 2. Portfolio Allocation

Distribute incoming loan demand across risk classes (must sum to 100%).

```
- Subprime      [__]%   (high risk, high yield)
- Near-Prime    [__]%
- Prime         [__]%
- Super-Prime   [__]%   (low risk, low yield)
                ─────
Total:          100%
```

The system auto-accepts loans to match target allocation (up to available demand and capital).

## Collection Results

When player clicks Collect, they see a summary:

```
┌─────────────────────────────────────────────────────────────┐
│  COLLECTED: 14h 23m (3.5 game years)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  New Loans Issued:        $847,000                          │
│  Interest Earned:         $124,000                          │
│  Interest Paid:           ($31,000)                         │
│  Operating Costs:         ($18,000)                         │
│  Defaults:                ($28,000)  [47 loans]             │
│                          ─────────                          │
│  Net Income:              $47,000                           │
│                                                             │
│  Total Portfolio:         $2.4M → $3.2M                     │
│  Cash Reserves:           $890K → $1.1M                     │
│                                                             │
│  [View Income Statement]  [View Balance Sheet]              │
│  [View Portfolio Details]                                   │
└─────────────────────────────────────────────────────────────┘
```

## Detailed Financials

Players can drill into full financial statements:

### Income Statement

```
INCOME STATEMENT - Q3 2024
─────────────────────────────────────────
Interest Income
  Credit Card Interest          $487,000
  Mortgage Interest             $412,000
  Auto Loan Interest            $198,000
  Personal Loan Interest        $150,000
                               ──────────
  Total Interest Income                      $1,247,000

Interest Expense
  Savings Account Interest      ($156,000)
  CD Interest                   ($256,000)
                               ──────────
  Total Interest Expense                      ($412,000)

NET INTEREST INCOME                            $835,000

Provision for Loan Losses                      ($89,000)
Operating Expenses                            ($120,000)
                                             ──────────
NET INCOME                                     $626,000
```

### Balance Sheet

```
BALANCE SHEET - End of Q3 2024
─────────────────────────────────────────
ASSETS
  Cash & Reserves             $4,200,000
  Loans Receivable
    Credit Cards              $8,400,000
    Mortgages                $42,100,000
    Auto Loans                $6,200,000
    Personal Loans            $2,100,000
  Less: Allowance for Losses   ($890,000)
                             ───────────
TOTAL ASSETS                              $62,110,000

LIABILITIES
  Deposits                   $51,000,000
  Other Liabilities           $1,200,000
                             ───────────
TOTAL LIABILITIES                         $52,200,000

EQUITY                                     $9,910,000

Capital Ratio: 16.0% (Required: 8%)  ✓
```

### Portfolio Breakdown

```
LOAN PORTFOLIO BY RISK CLASS
─────────────────────────────────────────────────────────────
             │ Balance │ % Port  │ Def Rate │ Avg Rate
─────────────┼─────────┼─────────┼──────────┼───────────
Super-Prime  │ $24.2M  │  41.2%  │   0.1%   │   5.2%
Prime        │ $22.1M  │  37.6%  │   0.8%   │   7.8%
Near-Prime   │  $9.4M  │  16.0%  │   2.1%   │  12.4%
Subprime     │  $3.1M  │   5.3%  │   4.2%   │  18.9%
─────────────┼─────────┼─────────┼──────────┼───────────
TOTAL        │ $58.8M  │  100%   │   1.1%   │   8.4%
```

## Constraints / Failure States

### Capital Ratio Requirement

Must maintain minimum reserves vs loans. If you drop below:
- Cannot issue new loans until recovered
- Possible regulatory fines eating into profits

### Liquidity

Cannot lend more than deposits allow. Deposits grow based on your savings/CD rates.

### Bankruptcy

If defaults exceed capital, game over (or major setback requiring restart/prestige).
