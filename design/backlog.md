# Backlog

Features and systems intentionally deferred from V1.

---

## Dynamic Market System

**What:** Market rates derived from aggregate player behavior instead of fixed values.

**How it would work:**
- Market rate = weighted average of all player rates (weighted by portfolio size)
- Creates a living market that shifts based on collective behavior
- If most banks offer 6% mortgages, that becomes the benchmark

**Why deferred:** Adds query complexity on every collection. Fixed rates are simpler to implement and balance initially.

---

## Zero-Sum Demand Pool

**What:** True competition where banks compete for a fixed pool of loan demand.

**How it would work:**
- Total demand is fixed (or slowly growing)
- Each bank's "attractiveness" calculated based on rate vs market
- Demand distributed proportionally: `bankDemand = totalDemand * (bankAttractiveness / totalAttractiveness)`
- Aggressive pricing = larger slice, but everyone being aggressive compresses margins

**Why deferred:** Requires calculating all banks' attractiveness to determine any single bank's demand. More complex queries.

**Implementation notes when ready:**
```sql
WITH attractiveness AS (
    SELECT
        b.id as bank_id,
        br.product,
        GREATEST(0.1, 1 + sensitivity * (market_rate - br.rate)) as score
    FROM banks b
    JOIN bank_rates br ON br.bank_id = b.id
),
totals AS (
    SELECT product, SUM(score) as total_score
    FROM attractiveness
    GROUP BY product
)
SELECT
    a.bank_id,
    a.product,
    (a.score / t.total_score) * base_demand as hourly_demand
FROM attractiveness a
JOIN totals t ON t.product = a.product;
```

---

## Interbank Lending

**What:** Players can lend excess reserves to each other.

**How it would work:**
- Post offers: "Lending $500K at 4.2% for 1 quarter"
- Other players accept offers
- Creates player-driven money market
- Risk: borrower could go bankrupt

**Why deferred:** Needs active player base. Complex failure handling.

---

## Systemic Contagion

**What:** Bank failures affect other players.

**How it would work:**
- Large bank fails → interbank loans default
- Market-wide panic → slight deposit outflows everywhere
- Opportunity to buy distressed assets at discount

**Why deferred:** Complex to balance fairly. Could feel punishing.

---

## Prestige System

**What:** Reset mechanic for long-term progression.

**How it would work:**
- Hit $100M → option to "go public" or "sell the bank"
- Reset to $500K with permanent bonuses
- Unlocks: better base rates, lower defaults, new products

**Why deferred:** V1 needs to be fun first. Add replayability later.

---

## Economic Events

**What:** Random or scheduled events that affect the market.

**How it would work:**
- Fed rate changes → affects cost of funds
- Recessions → spike default rates
- Housing bubbles → mortgage-specific impacts
- Visible in advance so players can prepare

**Why deferred:** Core loop needs to work first. Events add spice later.
