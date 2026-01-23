# Balance & Pacing

## The Problem

Without balance mechanics:
- Early game ($200K): Returns feel too slow
- Late game ($50M): Exponential growth breaks the game

## Solution 1: Accelerated Game Time

```
1 real hour = 1 game quarter
1 real day (24h cap) = 6 game years
```

This makes early game returns feel meaningful without changing the core math.

## Solution 2: Scaling Friction

Multiple mechanics that increase costs/constraints as portfolio grows.

### Operating Expenses

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

### Market Saturation

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

### Deposit Competition

Larger banks must pay more to attract deposits.

```
effectiveCostOfFunds = yourRate + (depositMarketShare * 0.5%)
```

| Deposit Share | Rate Premium |
|---------------|--------------|
| 5% | +0.025% |
| 20% | +0.10% |
| 50% | +0.25% |

### Tiered Capital Requirements

Bigger banks face stricter reserve requirements.

```
Tier 1: < $1M portfolio      → 8% reserve requirement
Tier 2: $1M - $10M           → 10% reserve
Tier 3: $10M - $50M          → 12% reserve
Tier 4: > $50M               → 15% reserve
```

Higher reserves = less leverage = slower growth.

## Expected Progression

### Early Game (< $1M)

- Time feels fast (1 hour = 1 quarter)
- Low operating costs
- No saturation effects
- Minimal reserve requirements
- **Result:** Rapid, satisfying growth (~10% daily)

### Mid Game ($1M - $20M)

- Same time multiplier
- Growing operating costs
- Slight saturation effects
- Higher reserves required
- **Result:** Steady progress, optimization matters

### Late Game (> $20M)

- Significant operating costs
- Real saturation limits
- Strict capital requirements
- Deposit competition raises costs
- **Result:** Growth slows, focus shifts to efficiency

## Progression Timeline (Active Player)

| Real Time | Game Time | Approximate Portfolio |
|-----------|-----------|----------------------|
| Day 1 | 1.5 years | $200K → $400K |
| Day 3 | 4.5 years | $400K → $1M |
| Week 1 | 10 years | $1M → $3M |
| Week 2 | 20 years | $3M → $8M |
| Month 1 | 45 years | $8M → $25M |
| Month 2 | 90 years | $25M → $50M |

Growth is exciting in week 1, then becomes more strategic.

## Hourly Returns by Stage

### Early Game ($200K portfolio, $150K in loans)

```
Quarterly interest (8% rate): $3,000
Costs: ~$500
Defaults: ~$200
─────────────────────────────
Net per hour: ~$2,300
Net per 8 hours: ~$18,000

Daily growth rate: ~10%
```

### Mid Game ($5M portfolio)

```
Quarterly interest: $87,500
Costs: ~$15,000
Defaults: ~$12,000
─────────────────────────────
Net per hour: ~$60,000
Net per 8 hours: ~$480,000

Daily growth rate: ~5%
```

### Late Game ($50M portfolio)

```
Quarterly interest: $875,000
Operating costs: ~$150,000
Defaults: ~$180,000
Saturation: limits new loan volume
─────────────────────────────
Net per hour: ~$545,000
Net per 8 hours: ~$4.3M

Daily growth rate: ~1-2%
```

## The 24-Hour Cap

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

## Future Consideration: Prestige System

For extended gameplay arc (v2):

- Hit $100M → Option to "go public" or "sell the bank"
- Reset to $500K with permanent bonuses
- Unlocks: better base rates, lower default rates, new products
- Adds replayability and long-term goals
