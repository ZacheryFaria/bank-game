# Configuration Guide

## Overview

The Bank Game backend is configured through two main files:
- **`backend/config.yml`**: Game mechanics, balance, and economic parameters
- **`backend/.env`**: Environment variables for deployment and secrets

---

## config.yml Structure

Located at: `backend/config.yml`

### Time Settings

Controls game time progression and idle caps.

```yaml
time:
  multiplier: 2190        # Hours in a quarter (3 months)
  maxIdleHours: 24        # Maximum idle time cap
```

**Parameters:**

- **`multiplier`** (number): Hours in one game quarter
  - Default: `2190` (24 hours/day × 91.25 days/quarter)
  - **Effect**: With 2190, 1 real hour = 180 game hours = 7.5 game days
  - **Calculation**: Real hours are multiplied by (multiplier / 2190) to get game hours

- **`maxIdleHours`** (number): Maximum game hours allowed per collection
  - Default: `24` (1 game day)
  - **Effect**: Prevents excessive advantage from long absences
  - **Example**: Player offline for 1 week still only gets 24 game hours of progress

**Tuning Guide:**

| Real Time Ratio | Multiplier | Description |
|-----------------|------------|-------------|
| 1 hour = 7.5 days (default) | 2190 | Idle game, slow progression |
| 1 hour = 15 days | 4380 | Faster progression |
| 1 hour = 30 days | 8760 | Very fast progression |

---

### Rate Limiting

Controls collection cooldown to prevent spam.

```yaml
rateLimit:
  collectCooldownSeconds: 60
```

**Parameters:**

- **`collectCooldownSeconds`** (number): Minimum seconds between collections
  - Default: `60` (1 minute)
  - **Effect**: Players can only collect once per minute
  - **Recommendation**: Keep at 60 for development, increase to 300+ (5 min) for production to reduce server load

---

### Economy Settings

Starting conditions and operational costs.

```yaml
economy:
  startingEquity: 200000         # $200,000
  reserveRequirement: 0.1        # 10% of deposits
  operatingCostRate: 0.01        # 1% of assets per year
```

**Parameters:**

- **`startingEquity`** (number): Initial bank equity on registration
  - Default: `200000` ($200,000)
  - **Effect**: Higher starting capital = easier early game
  - **Balance**: $200k allows ~$1.8M in loans (with $2M deposits at 10% reserve)

- **`reserveRequirement`** (decimal, 0-1): Fraction of deposits held as reserves
  - Default: `0.1` (10%)
  - **Effect**: With 10% reserve, $1M deposits allows $900k in loans
  - **Realistic**: Real-world reserve ratios are 0-10%
  - **Balance**: Lower = more lending, higher = safer but less profit

- **`operatingCostRate`** (decimal): Annual operating costs as % of total assets
  - Default: `0.01` (1% per year)
  - **Effect**: $10M bank pays ~$25k per quarter in operating expenses
  - **Balance**: Higher = harder difficulty, lower = easier profits

---

### Market Rates

Fixed interest rate benchmarks for each product.

```yaml
marketRates:
  mortgage: 0.06          # 6%
  auto: 0.07              # 7%
  personal: 0.12          # 12%
  credit_card: 0.22       # 22%
  savings: 0.03           # 3%
  cd: 0.04                # 4%
```

**Parameters:**

Each rate is a decimal (0-1) representing annual percentage rate (APR).

**Loan Products:**
- **`mortgage`**: Home loans, long-term, lowest rates
- **`auto`**: Car loans, medium-term
- **`personal`**: Unsecured loans, higher rates
- **`credit_card`**: Revolving credit, highest rates

**Deposit Products:**
- **`savings`**: Liquid savings accounts
- **`cd`**: Certificates of deposit, higher rate for illiquidity

**How Market Rates Affect Gameplay:**

- **Loan demand**: Your rate vs market rate
  - Your rate < market rate → More demand
  - Your rate > market rate → Less demand

- **Deposit demand**: Inverse of loans
  - Your rate > market rate → More deposits
  - Your rate < market rate → Less deposits

**Balancing:**

Maintain spread between loan and deposit rates for profitability:
- **Net Interest Margin (NIM)**: (Loan rates - Deposit rates)
- Example: 10% average loan rate, 3.5% average deposit rate = 6.5% NIM

---

### Loan Products

Configure demand sensitivity and loan sizes.

```yaml
loanProducts:
  mortgage:
    baseDemandPerHour: 8000     # Base $ demand per game hour
    sensitivity: 0.6            # Rate sensitivity multiplier
    avgLoanSize: 250000         # Average loan amount
```

**Parameters:**

- **`baseDemandPerHour`** (number): Dollar demand at market rate
  - **Effect**: Higher = more loan originations
  - **Example**: 8000 base demand = $8k/hour if your rate = market rate

- **`sensitivity`** (decimal): How responsive demand is to rate changes
  - **Formula**: `demand = baseDemand * (1 + sensitivity * (marketRate - yourRate))`
  - **Effect**:
    - Higher sensitivity (0.6-0.8): Demand swings wildly with rate changes
    - Lower sensitivity (0.2-0.4): Demand more stable
  - **Example**: Sensitivity 0.6, market 6%, your rate 5%:
    - Demand multiplier: 1 + 0.6 × (0.06 - 0.05) = 1.006 (0.6% increase)

- **`avgLoanSize`** (number): Average individual loan amount
  - **Effect**: Determines number of loans originated from demand
  - **Example**: $8000 demand ÷ $250000 avg size = 0.032 loans = ~1 loan per 31 hours

**Product Characteristics:**

| Product | Base Demand | Sensitivity | Avg Size | Notes |
|---------|-------------|-------------|----------|-------|
| Mortgage | 8000 | 0.6 | $250k | Large loans, sensitive to rates |
| Auto | 4000 | 0.4 | $25k | Medium loans, moderate sensitivity |
| Personal | 3000 | 0.5 | $8k | Small loans, moderate sensitivity |
| Credit Card | 5000 | 0.3 | $2.5k | Very small, less sensitive |

**Tuning Tips:**

- **Increase `baseDemandPerHour`**: More loan volume, faster growth
- **Increase `sensitivity`**: Reward competitive pricing more
- **Increase `avgLoanSize`**: Fewer but larger loans

---

### Deposit Products

Configure deposit inflow.

```yaml
depositProducts:
  savings:
    baseInflowPerHour: 10000    # Base $ inflow per game hour
    sensitivity: 0.4            # Rate sensitivity multiplier
```

**Parameters:**

- **`baseInflowPerHour`** (number): Dollar inflow at market rate
  - **Effect**: Funding source for loans
  - **Example**: 10000 = $10k/hour in deposits if your rate = market rate

- **`sensitivity`** (decimal): How responsive deposits are to rate changes
  - **Formula**: `inflow = baseInflow * (1 + sensitivity * (yourRate - marketRate))`
  - **Effect**:
    - Offering above market rate → More deposits
    - Offering below market rate → Less deposits

**Product Comparison:**

| Product | Base Inflow | Sensitivity | Notes |
|---------|-------------|-------------|-------|
| Savings | 10000 | 0.4 | Liquid, moderate sensitivity |
| CD | 5000 | 0.8 | Illiquid, very sensitive to rates |

**Balancing:**

- Total deposit inflow should exceed loan demand to avoid liquidity issues
- Default config: ~15k deposit inflow vs ~20k loan demand = needs competitive deposit rates

---

### Default Rates

Annual default rates by risk class.

```yaml
defaultRates:
  super_prime: 0.005      # 0.5% annual
  prime: 0.02             # 2% annual
  near_prime: 0.06        # 6% annual
  subprime: 0.15          # 15% annual
```

**Parameters:**

Each rate is annual default percentage (0-1).

**Risk Classes:**

| Risk Class | Default Rate | Expected Return | Strategy |
|------------|--------------|-----------------|----------|
| Super Prime | 0.5% | Safest, lowest losses | Conservative |
| Prime | 2% | Low risk, stable | Balanced |
| Near Prime | 6% | Medium risk | Growth |
| Subprime | 15% | High risk, high loss | Aggressive |

**How Defaults Work:**

- Calculated each game quarter (every 3 game months)
- **Variance applied**: Actual default = base rate × random(0.8-1.2)
- **Effect**: Reduces loan bucket balances (direct equity loss)

**Example:**

$1M in subprime loans, 15% annual default rate:
- Quarterly default: 15% ÷ 4 = 3.75%
- With 1.0 variance: $1M × 0.0375 = $37,500 loss
- With 1.2 variance: $1M × 0.045 = $45,000 loss (bad quarter)
- With 0.8 variance: $1M × 0.03 = $30,000 loss (good quarter)

**Tuning:**

- **Increase default rates**: Harder difficulty, punish aggressive strategies
- **Decrease default rates**: Easier difficulty, reward growth
- **Realistic values**: Prime ~1-2%, Subprime ~10-15%

---

### Default Variance

Randomness range for defaults.

```yaml
defaultVariance:
  min: 0.8
  max: 1.2
```

**Parameters:**

- **`min`** (decimal): Minimum variance multiplier
  - Default: `0.8` (20% below base rate)

- **`max`** (decimal): Maximum variance multiplier
  - Default: `1.2` (20% above base rate)

**Effect:**

- **Wider range (0.5-1.5)**: More volatility, unpredictable results
- **Narrower range (0.9-1.1)**: More predictable, skill-based
- **No variance (1.0-1.0)**: Fully deterministic (testing only)

**Randomness Properties:**

- Uses seeded RNG (deterministic given same seed)
- New seed generated per collection
- Seed stored in collection record for reproducibility

---

## Environment Variables

Located at: `backend/.env`

### Required Variables

```bash
# Server
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bank_game

# JWT Secrets
JWT_SECRET=your-secret-key
REFRESH_TOKEN_SECRET=your-refresh-secret

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Descriptions:**

- **`NODE_ENV`**: Environment mode (`development`, `production`, `test`)
  - Affects logging verbosity
  - Disables Fastify logger in `test` mode

- **`PORT`**: Server port (default: 3001)

- **`HOST`**: Bind address (use `0.0.0.0` for Docker, `127.0.0.1` for local-only)

- **`DATABASE_URL`**: PostgreSQL connection string
  - Format: `postgresql://user:password@host:port/database`
  - Can include options: `?schema=public&connection_limit=10`

- **`JWT_SECRET`**: Secret for signing access tokens
  - **CRITICAL**: Must be strong and unique
  - Generate: `openssl rand -base64 64`
  - Expiry: 7 days (hardcoded in `src/logic/auth.ts`)

- **`REFRESH_TOKEN_SECRET`**: Secret for signing refresh tokens
  - **CRITICAL**: Must be different from JWT_SECRET
  - Expiry: 30 days (hardcoded in `src/logic/auth.ts`)

- **`ALLOWED_ORIGINS`**: CORS allowed origins (comma-separated)
  - Use `*` for development (accept all origins)
  - Production: List specific domains

### Optional Variables

```bash
# Logging
LOG_LEVEL=info

# Database Pool
DB_POOL_MIN=2
DB_POOL_MAX=10
```

**Descriptions:**

- **`LOG_LEVEL`**: Log verbosity (`debug`, `info`, `warn`, `error`)
  - Default: `info`

- **`DB_POOL_MIN`**: Minimum database connections
  - Default: 2

- **`DB_POOL_MAX`**: Maximum database connections
  - Default: 10
  - **Recommendation**: `totalConnections / number of instances`

---

## Configuration Examples

### Easy Mode (Faster Progression)

```yaml
# config.yml
time:
  multiplier: 4380         # 1 real hour = 15 game days
  maxIdleHours: 48         # Allow more idle time

economy:
  startingEquity: 500000   # Start with $500k
  operatingCostRate: 0.005 # Half the operating costs

defaultRates:
  super_prime: 0.003
  prime: 0.01
  near_prime: 0.04
  subprime: 0.10           # Lower default rates
```

---

### Hard Mode (Realistic Banking)

```yaml
# config.yml
time:
  multiplier: 2190         # 1 real hour = 7.5 game days
  maxIdleHours: 12         # Penalize idle time

economy:
  startingEquity: 100000   # Start with only $100k
  reserveRequirement: 0.15 # Higher reserves required
  operatingCostRate: 0.02  # Double operating costs

defaultRates:
  super_prime: 0.01
  prime: 0.03
  near_prime: 0.08
  subprime: 0.20           # Realistic high default rates
```

---

### Production Environment

```bash
# .env
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

DATABASE_URL=postgresql://bank_user:strong_password@db.example.com:5432/bank_game?sslmode=require

JWT_SECRET=<64-char-random-string>
REFRESH_TOKEN_SECRET=<different-64-char-random-string>

ALLOWED_ORIGINS=https://bankgame.example.com

LOG_LEVEL=warn
DB_POOL_MAX=20
```

---

## Reloading Configuration

### config.yml Changes

**Requires server restart:**

```bash
# PM2
pm2 restart bank-game-api

# Docker
docker-compose restart api

# Direct
# Stop server (Ctrl+C), then:
pnpm dev
```

**Note:** Configuration is loaded once on server startup.

---

### .env Changes

**Requires server restart** (same as above)

---

## Validation

### Test Configuration

After making changes, verify:

```bash
# Start server
pnpm dev

# Check logs for errors
# Look for: "Configuration loaded" or similar

# Test collection
curl -X POST http://localhost:3001/api/bank/collect \
  -H "Authorization: Bearer $TOKEN"

# Verify game time calculations match expected multiplier
```

---

## Backup Configuration

Before making changes:

```bash
cp backend/config.yml backend/config.yml.backup
cp backend/.env backend/.env.backup
```

---

## Common Issues

### Server Won't Start

**Check:**
1. Valid YAML syntax in config.yml
2. All environment variables set
3. Database connection string correct

**Debug:**
```bash
# Test YAML syntax
pnpm add -D js-yaml
npx js-yaml backend/config.yml

# Test database connection
psql "$DATABASE_URL" -c "SELECT 1;"
```

---

### Unexpected Game Behavior

**Check:**
1. Time multiplier is correctly set
2. Default rates are reasonable (0-1 range)
3. Market rates allow profitable spread

**Debug:**
- Add console.log in `src/lib/config.ts` to inspect loaded config
- Verify calculations in `src/engine/` match expectations

---

## Best Practices

✅ **Version control config.yml** (contains no secrets)

❌ **Never commit .env** (contains secrets)

✅ **Document any config changes** in comments

✅ **Test config changes in development first**

✅ **Use `.env.example` as template** for new environments

---

## Resources

- [YAML Specification](https://yaml.org/)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
