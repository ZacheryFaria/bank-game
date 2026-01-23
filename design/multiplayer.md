# Multiplayer - V1 Spec

## Core Model: Shared Market

All players exist in one global economy. You compete indirectly through the market.

No regional markets, no sharding. One world.

---

## How It Works

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

### Future: Dynamic Market (Backlogged)

A more sophisticated system where market rates are derived from aggregate player behavior and demand is zero-sum is planned for a future version. See `backlog.md`.

---

## Player Visibility

### Full Transparency

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

### Side-by-Side Comparison

```
┌────────────────────────────────────────────────────────────────────┐
│  COMPARISON: Your Bank vs First National                           │
├────────────────────────┬───────────────┬───────────────┬───────────┤
│                        │ Your Bank     │ First National│ Δ         │
├────────────────────────┼───────────────┼───────────────┼───────────┤
│ Portfolio              │ $15.2M        │ $42.3M        │ -64%      │
│ Market Share           │ 6.5%          │ 18.2%         │ -11.7pp   │
│ Net Interest Margin    │ 3.8%          │ 3.2%          │ +0.6pp    │
│ Default Rate           │ 2.4%          │ 1.8%          │ +0.6pp    │
│ ROE                    │ 14.1%         │ 12.4%         │ +1.7pp    │
│ Capital Ratio          │ 12.8%         │ 14.2%         │ -1.4pp    │
├────────────────────────┴───────────────┴───────────────┴───────────┤
│ INSIGHT: You're more profitable per dollar but taking more risk.   │
└────────────────────────────────────────────────────────────────────┘
```

### Bank Directory

Browse and sort all banks in the market.

```
┌─────────────────────────────────────────────────────────────────────┐
│  ALL BANKS                                    Sort: [Portfolio ▼]   │
├─────┬──────────────────┬───────────┬─────────┬──────────┬───────────┤
│ Rank│ Bank             │ Portfolio │ Share   │ NIM      │ Def Rate  │
├─────┼──────────────────┼───────────┼─────────┼──────────┼───────────┤
│ 1   │ Titan Financial  │ $89.2M    │ 28.4%   │ 2.9%     │ 1.2%      │
│ 2   │ First National   │ $42.3M    │ 18.2%   │ 3.2%     │ 1.8%      │
│ 3   │ Metro Savings    │ $31.1M    │ 12.8%   │ 3.5%     │ 2.1%      │
│ ... │                  │           │         │          │           │
│ 12  │ >> Your Bank <<  │ $15.2M    │ 6.5%    │ 3.8%     │ 2.4%      │
│ ... │                  │           │         │          │           │
│ 847 │ New Start Bank   │ $203K     │ 0.1%    │ 4.2%     │ 3.1%      │
└─────┴──────────────────┴───────────┴─────────┴──────────┴───────────┘
```

---

## Leaderboards

Multiple ranking categories:

| Leaderboard | Metric | Description |
|-------------|--------|-------------|
| Biggest Bank | Total portfolio | Raw size |
| Most Profitable | ROE | Return on equity |
| Safest Bank | Lowest default rate | Risk management |
| Fastest Growing | % growth this week | Momentum |
| Best Margins | Net interest margin | Efficiency |

---

## Bankruptcy & Failure

### How Bankruptcy Happens

```
if (totalDefaults > equity) → BANKRUPT
```

Or gradual failure via capital ratio:

```
if (capitalRatio < minimumRequired for extended period) → FORCED LIQUIDATION
```

### Forced Liquidation (Illiquidity Protection)

When capital ratio drops dangerously low, the system forces asset sales to restore solvency:

```
if (capitalRatio < 4%) {
  // Force sell loans at a discount until ratio recovers
  saleProceeds = loansToSell * 0.85  // 15% haircut
  // Reduces portfolio but restores capital ratio
}
```

This prevents zombie banks lingering while technically insolvent.

### Full Bankruptcy

If liquidation can't save the bank:

- Bank is dissolved
- Player can restart with fresh $200K
- Historical record remains visible (hall of shame / history)

---

## What's NOT in V1

| Feature | Status | Reason |
|---------|--------|--------|
| Dynamic market rates | Backlog | Calculate market rate from player behavior - adds complexity |
| Zero-sum demand pool | Backlog | True competition for fixed demand - adds complexity |
| Interbank lending | Backlog | Adds complexity, needs active player base first |
| Systemic contagion | Backlog | Complex to balance fairly |
| Regional markets | Cut | One global market is cleaner |
| New player protection | Cut | Too much complexity for little payoff |

---

## Summary

```
V1 MULTIPLAYER
├── One global market
├── Dynamic market rates (derived from aggregate player behavior)
├── Shared demand pool (indirect competition for customers)
├── Full transparency (all player financials are public)
├── Bank directory with sorting/filtering
├── Side-by-side comparisons
├── Leaderboards (multiple categories)
├── Forced liquidation at critically low capital ratio
└── Bankruptcy → restart with fresh capital
```
