# Backend Implementation Plan

## Current Status

### ✅ Fully Implemented

- **Authentication Routes** (`/api/auth/register`, `/api/auth/login`)
  - User registration with bank creation
  - Password hashing (bcrypt)
  - JWT generation (7-day expiry)
  - Input validation with Zod
  - Auto-initializes bank with market rates and equal risk allocation

- **Bank Management Routes** (`/api/bank/*`)
  - `GET /bank` - Get bank state with buckets
  - `PUT /bank/rates` - Update interest rates
  - `PUT /bank/allocation` - Update risk allocation (validates sum = 1.0)
  - `POST /bank/collect` - Core game loop with rate limiting (60s cooldown)

- **Leaderboard Routes** (`/api/banks/*`)
  - `GET /banks` - Paginated list with sorting (by equity/loans)
  - `GET /banks/:id` - View specific bank details

- **Market Data Routes** (`/api/market/rates`)
  - Returns fixed market rates and product configs

- **Game Engine** (all modules complete)
  - `CollectionSimulator` - Orchestrates collection flow
  - `DemandCalculator` - Rate-sensitive loan/deposit demand
  - `InterestCalculator` - Quarterly interest calculations
  - `DefaultRoller` - Deterministic seeded RNG for defaults

- **Database Schema** (Prisma)
  - All tables implemented per design

### ⚠️ Issues & Missing Features

**Critical Issues:**
- No JWT verification middleware (all routes use `findFirst()` instead of auth)
- JWT returned in JSON response (design calls for HTTP-only cookies)
- No refresh token flow
- Deposit bucket interest not accrued during collection
- CORS allows all origins (hardcoded `origin: true`)
- Routes at bank.ts:27, 54, 109, 152 have TODOs for auth

**Lower Priority:**
- Quarterly snapshots schema exists but no generation logic
- No tests
- JWT secret defaults to hardcoded string if env var missing

---

## Phase 1: Critical Fixes

### 🔴 High Priority

- [ ] **JWT Middleware**
  - [ ] Create `src/lib/authMiddleware.ts`
  - [ ] Fastify hook that reads JWT from `Authorization: Bearer <token>` header
  - [ ] Verifies JWT using `verifyToken()`
  - [ ] Looks up user and bank
  - [ ] Attaches to `request.user` and `request.bank`
  - [ ] Returns 401 if invalid/missing token

- [ ] **Refresh Token Flow**
  - [ ] Add `refreshToken` field to User model (or separate RefreshToken table)
  - [ ] Create `POST /api/auth/refresh` endpoint
  - [ ] Generate refresh token on login/register (30-day expiry)
  - [ ] Refresh endpoint: validate refresh token → issue new access token
  - [ ] Add rotation: invalidate old refresh token when used

- [ ] **Update Bank Routes to Use Auth**
  - [ ] `GET /bank` - Remove `findFirst()`, use `request.bank.id`
  - [ ] `PUT /bank/rates` - Use `request.bank.id`
  - [ ] `PUT /bank/allocation` - Use `request.bank.id`
  - [ ] `POST /bank/collect` - Use `request.bank.id`
  - [ ] Register auth middleware on all `/bank/*` routes

- [ ] **CORS Configuration**
  - [ ] Create environment variable `ALLOWED_ORIGINS` (comma-separated)
  - [ ] Update `server.ts` to read from env
  - [ ] Default to `*` in development
  - [ ] Restrict in production

- [ ] **Deposit Interest Accrual**
  - [ ] Update `CollectionSimulator.ts` to calculate interest for existing deposits
  - [ ] Add accrued interest to deposit bucket `currentBalance`
  - [ ] Add updated deposit buckets to `updatedDepositBuckets` array
  - [ ] Update collection route to persist deposit bucket updates

---

## Phase 2: Testing Infrastructure

### Testing Stack
- **Vitest** - Fast, modern, TypeScript-native
- **Supertest or Fastify inject** - HTTP request testing
- **In-memory SQLite** - Fast test database (may need schema adjustments for SQLite compatibility)
- **Prisma test helpers** - Clean DB between tests

### Setup Tasks

- [ ] **Install Testing Dependencies**
  - [ ] `pnpm add -D vitest @vitest/ui`
  - [ ] `pnpm add -D @types/supertest` (if using supertest)

- [ ] **Configure Test Environment**
  - [ ] Create `vitest.config.ts`
  - [ ] Create `tests/setup.ts` with:
    - Test database connection (SQLite)
    - Prisma migrations for test DB
    - Helper functions (createTestUser, createAuthHeaders, cleanDatabase)
  - [ ] Update `package.json` with test scripts (`test`, `test:ui`, `test:watch`)

- [ ] **SQLite Compatibility**
  - [ ] Review Prisma schema for SQLite compatibility
  - [ ] Adjust UUID fields if needed (SQLite uses TEXT for UUIDs)
  - [ ] Test migrations work on SQLite
  - [ ] Document any schema differences

### Test Suite Structure

```
backend/
├── tests/
│   ├── setup.ts              # Test DB setup/teardown, helper functions
│   ├── auth.test.ts          # Registration, login, refresh, JWT validation
│   ├── bank-rates.test.ts    # Rate updates, validation
│   ├── bank-allocation.test.ts # Allocation updates, sum validation
│   ├── collection.test.ts    # Collection flow, rate limiting, determinism
│   ├── leaderboard.test.ts   # Banks list, pagination, sorting
│   ├── market.test.ts        # Market data endpoint
│   └── engine/               # Unit tests for pure engine functions
│       ├── DemandCalculator.test.ts
│       ├── InterestCalculator.test.ts
│       ├── DefaultRoller.test.ts
│       └── CollectionSimulator.test.ts
```

### Test Implementation Order

- [ ] **Auth Tests** (`auth.test.ts`)
  - [ ] Register new user → returns JWT and bank
  - [ ] Register duplicate email → 400 error
  - [ ] Login with valid credentials → JWT
  - [ ] Login with invalid credentials → 401
  - [ ] Refresh token flow
  - [ ] JWT expiry validation

- [ ] **Engine Unit Tests** (pure functions)
  - [ ] `DemandCalculator.test.ts`
    - [ ] Rates above market → lower demand (loans)
    - [ ] Rates below market → higher demand (loans)
    - [ ] Rates above market → higher demand (deposits)
    - [ ] Rates below market → lower demand (deposits)
  - [ ] `InterestCalculator.test.ts`
    - [ ] Correct quarterly interest for loans
    - [ ] Correct quarterly interest for deposits
    - [ ] Multiple quarters calculation
  - [ ] `DefaultRoller.test.ts`
    - [ ] Seeded RNG produces deterministic results
    - [ ] Variance stays within 0.8-1.2 range
    - [ ] Different risk classes have different default rates
  - [ ] `CollectionSimulator.test.ts`
    - [ ] Full collection flow integration
    - [ ] Determinism: same inputs → same outputs

- [ ] **Collection Tests** (`collection.test.ts`)
  - [ ] First collection → originates loans/deposits, records transactions
  - [ ] Second collection within 60s → 429 rate limit error
  - [ ] Collection after 1 hour → correct game time calculation
  - [ ] Collection after 24+ hours → caps at 24 hours
  - [ ] Deposit interest accrual works correctly
  - [ ] Default calculations reduce bucket balances

- [ ] **Bank Management Tests**
  - [ ] `bank-rates.test.ts`
    - [ ] Update rates → persists correctly
    - [ ] Update rates with invalid values → 400
    - [ ] Protected route without token → 401
  - [ ] `bank-allocation.test.ts`
    - [ ] Update allocation (sum = 1.0) → success
    - [ ] Update allocation (sum ≠ 1.0) → 400
    - [ ] Protected route without token → 401
  - [ ] Get bank state → returns buckets, requires auth

- [ ] **Leaderboard Tests** (`leaderboard.test.ts`)
  - [ ] List banks → sorted by equity descending
  - [ ] Pagination works correctly
  - [ ] Sorting by loans works
  - [ ] View other bank → returns public data

- [ ] **Market Tests** (`market.test.ts`)
  - [ ] GET /market/rates → returns all products and rates

---

## Phase 3: Lower Priority Features

- [ ] **HTTP-Only Cookie Auth** (instead of JSON response)
  - [ ] Return JWT in HTTP-only cookie on login/register
  - [ ] Update frontend to handle cookie-based auth
  - [ ] Add CSRF protection if needed

- [ ] **Quarterly Snapshots**
  - [ ] Create `src/lib/snapshotGenerator.ts`
  - [ ] Query transactions for date range
  - [ ] Aggregate by type
  - [ ] Calculate ratios (capital ratio, NIM, ROE)
  - [ ] Build portfolio breakdowns
  - [ ] Add cron job or manual endpoint

- [ ] **Production Hardening**
  - [ ] Add request rate limiting (global + per-user)
  - [ ] Add structured logging (Pino)
  - [ ] Validate JWT_SECRET is set in production (fail fast)
  - [ ] Add request ID tracking
  - [ ] Health check improvements (DB connectivity)
  - [ ] Metrics endpoint (optional)

---

## Testing Notes

**Framework:** Vitest

**Test Database:** In-memory SQLite
- Fast test execution
- May require schema adjustments for SQLite compatibility
- Need to test Prisma migrations work on SQLite

**Coverage:** No specific goals, but aim for:
- At least 2-3 test cases per endpoint
- Happy path + error cases
- Critical game logic (collection, defaults, interest)

---

## Known Issues to Document

- [ ] Document that deposit interest accrual was missing (fixed in Phase 1)
- [ ] Document auth middleware implementation approach
- [ ] Document refresh token rotation strategy
- [ ] Document CORS configuration for production
- [ ] Document SQLite test setup for future contributors
