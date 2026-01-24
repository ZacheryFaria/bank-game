# Game Design

Complete game design specification for bank-game.

---

## Core Gameplay Loop

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

### Time Model

- Real clock time passes continuously
- When player clicks "Collect", server calculates elapsed time
- Maximum idle time: 24 hours (prevents gaming by waiting weeks)
- Time multiplier: **1 real hour = 1 game quarter**

```
elapsed = min(now - lastCollect, 24 hours)
gameTime = elapsed * (1 quarter per hour)
results = simulate(gameTime)
```

### Player Controls

Players have two main control surfaces:

#### 1. Interest Rates

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

#### 2. Portfolio Allocation

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

### Collection Results

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

### Constraints / Failure States

**Capital Ratio Requirement**
- Must maintain minimum reserves vs loans
- If you drop below: Cannot issue new loans until recovered
- Possible regulatory fines eating into profits

**Liquidity**
- Cannot lend more than deposits allow
- Deposits grow based on your savings/CD rates

**Bankruptcy**
- If defaults exceed capital, game over (or major setback requiring restart/prestige)

---

## Math & Formulas

### Time Conversion

```
1 real hour = 1 game quarter (3 months)
1 real day (24h cap) = 6 game years

timeMultiplier = 2190 (hours in a quarter)
gameHours = realHours * timeMultiplier
```

### Loan Demand

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

#### Loan Product Constants

| Product | Base Demand/hr | Sensitivity | Avg Loan Size | Market Rate |
|---------|---------------|-------------|---------------|-------------|
| Credit Cards | $5,000 | 0.3 | $2,500 | 22% |
| Personal Loans | $3,000 | 0.5 | $8,000 | 12% |
| Auto Loans | $4,000 | 0.4 | $25,000 | 7% |
| Mortgages | $8,000 | 0.6 | $250,000 | 6% |

Lower sensitivity = convenience-driven (credit cards)
Higher sensitivity = rate shoppers (mortgages)

### Deposit Inflow

Same concept, but you're competing for depositors.

```
depositMultiplier = 1 + (yourRate - marketRate) * sensitivity
hourlyDeposits = baseDeposits * depositMultiplier
```

#### Deposit Product Constants

| Product | Base Inflow/hr | Sensitivity | Market Rate |
|---------|---------------|-------------|-------------|
| Savings | $10,000 | 0.4 | 3% |
| CDs | $5,000 | 0.8 | 4% |

CDs are more rate-sensitive (people shop for best rates).

### Loan Allocation

Incoming demand is distributed based on player's allocation percentages.

```
For each risk class:
  allocatedDemand = totalDemand * allocationPercent
  actualLoans = min(allocatedDemand, availableCapital, incomingDemand)
```

If allocation is set to 50% subprime but there's not enough subprime demand, you get less volume.

### Interest Income (Loans)

```
quarterlyInterest = loanBalance * (annualRate / 4)
interestIncome = totalLoanBalance * weightedAvgRate * (gameQuarters)
```

### Interest Expense (Deposits)

```
quarterlyExpense = depositBalance * (annualRate / 4)
interestExpense = totalDeposits * weightedAvgRate * (gameQuarters)
```

### Defaults

Each risk class has an annual default rate. Calculated per collection period.

```
For each risk class:
  annualDefaultRate = baseRate for that class
  periodDefaultRate = annualDefaultRate * (gameQuarters / 4)

  expectedDefaults = classBalance * periodDefaultRate
  actualDefaults = expectedDefaults * randomVariance(0.8, 1.2)
```

#### Default Rate Constants

| Risk Class | Annual Default Rate |
|------------|---------------------|
| Super-Prime | 0.5% |
| Prime | 2% |
| Near-Prime | 6% |
| Subprime | 15% |

### Net Income

```
netInterestIncome = interestIncome - interestExpense
netIncome = netInterestIncome - defaults - operatingCosts
```

### Capital Constraint

```
availableToLend = totalDeposits - currentLoans - minimumReserve
minimumReserve = totalDeposits * reserveRequirement
```

If `availableToLend <= 0`, no new loans are issued.

---

## Balance & Pacing

### The Problem

Without balance mechanics:
- Early game ($200K): Returns feel too slow
- Late game ($50M): Exponential growth breaks the game

### Solution 1: Accelerated Game Time

```
1 real hour = 1 game quarter
1 real day (24h cap) = 6 game years
```

This makes early game returns feel meaningful without changing the core math.

### Solution 2: Scaling Friction

Multiple mechanics that increase costs/constraints as portfolio grows.

#### Operating Expenses

Scales with portfolio size.

```
monthlyOpex = baseOpex + (portfolioSize * opexRate)

baseOpex = $500/month
opexRate = 0.1% annually
```

| Portfolio | Monthly Opex | Annual Opex |
|-----------|-------------|-------------|
| $200K | $517 | $6,200 |
| $5M | $917 | $11,000 |
| $50M | $4,667 | $56,000 |

#### Market Saturation

You can't capture infinite demand. Growth slows as you dominate the market.

```
saturationFactor = 1 / (1 + yourMarketShare)
actualDemand = baseDemand * demandMultiplier * saturationFactor
```

| Your Market Share | Saturation Factor | Effect |
|-------------------|-------------------|--------|
| 1% | 0.99 | Negligible |
| 10% | 0.91 | Slight slowdown |
| 25% | 0.80 | Noticeable |
| 50% | 0.67 | Significant |

#### Deposit Competition

Larger banks must pay more to attract deposits.

```
effectiveCostOfFunds = yourRate + (depositMarketShare * 0.5%)
```

| Deposit Share | Rate Premium |
|---------------|--------------|
| 5% | +0.025% |
| 20% | +0.10% |
| 50% | +0.25% |

#### Tiered Capital Requirements

Bigger banks face stricter reserve requirements.

```
Tier 1: < $1M portfolio      → 8% reserve requirement
Tier 2: $1M - $10M           → 10% reserve
Tier 3: $10M - $50M          → 12% reserve
Tier 4: > $50M               → 15% reserve
```

Higher reserves = less leverage = slower growth.

### Expected Progression

#### Early Game (< $1M)

- Time feels fast (1 hour = 1 quarter)
- Low operating costs
- No saturation effects
- Minimal reserve requirements
- **Result:** Rapid, satisfying growth (~10% daily)

#### Mid Game ($1M - $20M)

- Same time multiplier
- Growing operating costs
- Slight saturation effects
- Higher reserves required
- **Result:** Steady progress, optimization matters

#### Late Game (> $20M)

- Significant operating costs
- Real saturation limits
- Strict capital requirements
- Deposit competition raises costs
- **Result:** Growth slows, focus shifts to efficiency

### Progression Timeline (Active Player)

| Real Time | Game Time | Approximate Portfolio |
|-----------|-----------|----------------------|
| Day 1 | 1.5 years | $200K → $400K |
| Day 3 | 4.5 years | $400K → $1M |
| Week 1 | 10 years | $1M → $3M |
| Week 2 | 20 years | $3M → $8M |
| Month 1 | 45 years | $8M → $25M |
| Month 2 | 90 years | $25M → $50M |

Growth is exciting in week 1, then becomes more strategic.

### The 24-Hour Cap

Maximum idle accumulation prevents:
- Gaming by waiting weeks
- Returning to completely chaotic state
- Requires some engagement for optimal growth

With 1 hour = 1 quarter:
- 24 hours = 24 quarters = 6 game years maximum

This is significant time. Players who don't check in may see:
- Large accumulated defaults
- Portfolio drift from target allocation
- Regulatory issues if capital ratio dropped

Creates tension: checking in regularly is rewarded.

---

## Multiplayer - V1 Spec

### Core Model: Shared Market

All players exist in one global economy. You compete indirectly through the market.

No regional markets, no sharding. One world.

### Fixed Market Rates (V1)

For V1, market rates are fixed reference points (can be tuned by game balance):

```
marketRates:
  mortgage: 6%
  auto: 7%
  personal: 12%
  credit_card: 22%
  savings: 3%
  cd: 4%
```

Your rate vs the fixed market rate determines your demand multiplier. Lower than market = more demand, higher = less demand.

### Demand Calculation

Each bank's demand is calculated independently based on their rate vs fixed market:

```
yourDemand = baseDemand * (1 + (marketRate - yourRate) * sensitivity)
```

This is simpler than true competition but still creates meaningful rate-setting decisions.

### Player Visibility

#### Full Transparency

All player data is public. You can view any bank's complete financials.

```
┌─────────────────────────────────────────────────────────────┐
│  FIRST NATIONAL BANK                        [Compare to You]│
├─────────────────────────────────────────────────────────────┤
│  Owner: @player123                                          │
│  Founded: 2024 Q1 (game time)                               │
│  Portfolio: $42.3M          Market Share: 18.2%             │
├─────────────────────────────────────────────────────────────┤
│  CURRENT RATES                                              │
│    Mortgages: 5.8%    Credit Cards: 21.5%                   │
│    Auto: 6.9%         Personal: 11.2%                       │
│    Savings: 3.2%      CDs: 4.1%                             │
├─────────────────────────────────────────────────────────────┤
│  ALLOCATION                                                 │
│    Subprime: 5%  Near-Prime: 15%  Prime: 45%  Super: 35%    │
├─────────────────────────────────────────────────────────────┤
│  KEY METRICS                                                │
│    Net Interest Margin: 3.2%                                │
│    Default Rate: 1.8%                                       │
│    Capital Ratio: 14.2%                                     │
│    ROE: 12.4%                                               │
├─────────────────────────────────────────────────────────────┤
│  [View Income Statement]  [View Balance Sheet]              │
│  [View Portfolio Details] [View Historical Performance]     │
└─────────────────────────────────────────────────────────────┘
```

### Leaderboards

Multiple ranking categories:

| Leaderboard | Metric | Description |
|-------------|--------|-------------|
| Biggest Bank | Total portfolio | Raw size |
| Most Profitable | ROE | Return on equity |
| Safest Bank | Lowest default rate | Risk management |
| Fastest Growing | % growth this week | Momentum |
| Best Margins | Net interest margin | Efficiency |

### Bankruptcy & Failure

#### How Bankruptcy Happens

```
if (totalDefaults > equity) → BANKRUPT
```

Or gradual failure via capital ratio:

```
if (capitalRatio < minimumRequired for extended period) → FORCED LIQUIDATION
```

#### Forced Liquidation (Illiquidity Protection)

When capital ratio drops dangerously low, the system forces asset sales to restore solvency:

```
if (capitalRatio < 4%) {
  // Force sell loans at a discount until ratio recovers
  saleProceeds = loansToSell * 0.85  // 15% haircut
  // Reduces portfolio but restores capital ratio
}
```

This prevents zombie banks lingering while technically insolvent.

#### Full Bankruptcy

If liquidation can't save the bank:
- Bank is dissolved
- Player can restart with fresh $200K
- Historical record remains visible (hall of shame / history)

---

## Deferred Features

Features and systems intentionally deferred from V1.

### Dynamic Market System

**What:** Market rates derived from aggregate player behavior instead of fixed values.

**How it would work:**
- Market rate = weighted average of all player rates (weighted by portfolio size)
- Creates a living market that shifts based on collective behavior
- If most banks offer 6% mortgages, that becomes the benchmark

**Why deferred:** Adds query complexity on every collection. Fixed rates are simpler to implement and balance initially.

### Zero-Sum Demand Pool

**What:** True competition where banks compete for a fixed pool of loan demand.

**How it would work:**
- Total demand is fixed (or slowly growing)
- Each bank's "attractiveness" calculated based on rate vs market
- Demand distributed proportionally: `bankDemand = totalDemand * (bankAttractiveness / totalAttractiveness)`
- Aggressive pricing = larger slice, but everyone being aggressive compresses margins

**Why deferred:** Requires calculating all banks' attractiveness to determine any single bank's demand. More complex queries.

### Interbank Lending

**What:** Players can lend excess reserves to each other.

**How it would work:**
- Post offers: "Lending $500K at 4.2% for 1 quarter"
- Other players accept offers
- Creates player-driven money market
- Risk: borrower could go bankrupt

**Why deferred:** Needs active player base. Complex failure handling.

### Systemic Contagion

**What:** Bank failures affect other players.

**How it would work:**
- Large bank fails → interbank loans default
- Market-wide panic → slight deposit outflows everywhere
- Opportunity to buy distressed assets at discount

**Why deferred:** Complex to balance fairly. Could feel punishing.

### Prestige System

**What:** Reset mechanic for long-term progression.

**How it would work:**
- Hit $100M → option to "go public" or "sell the bank"
- Reset to $500K with permanent bonuses
- Unlocks: better base rates, lower defaults, new products

**Why deferred:** V1 needs to be fun first. Add replayability later.

### Economic Events

**What:** Random or scheduled events that affect the market.

**How it would work:**
- Fed rate changes → affects cost of funds
- Recessions → spike default rates
- Housing bubbles → mortgage-specific impacts
- Visible in advance so players can prepare

**Why deferred:** Core loop needs to work first. Events add spice later.
