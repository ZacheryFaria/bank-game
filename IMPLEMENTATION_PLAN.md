# Backend Implementation Plan

## Current Status

### ✅ Fully Implemented

- **Authentication Routes** (`/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`)
  - User registration with bank creation
  - Password hashing (bcrypt)
  - JWT access token generation (7-day expiry)
  - Refresh token generation (30-day expiry)
  - Refresh token rotation (old token invalidated on use)
  - Input validation with Zod
  - Auto-initializes bank with market rates and equal risk allocation

- **Authentication Middleware**
  - JWT verification from `Authorization: Bearer <token>` header
  - Automatic user and bank lookup
  - Attaches `request.user` and `request.bank` to authenticated requests
  - Returns 401 for invalid/missing/expired tokens

- **Bank Management Routes** (`/api/bank/*`) - All protected with auth middleware
  - `GET /bank` - Get bank state with buckets (requires auth)
  - `PUT /bank/rates` - Update interest rates (requires auth)
  - `PUT /bank/allocation` - Update risk allocation (requires auth, validates sum = 1.0)
  - `POST /bank/collect` - Core game loop with rate limiting (requires auth, 60s cooldown)

- **Leaderboard Routes** (`/api/banks/*`)
  - `GET /banks` - Paginated list with sorting (by equity/loans)
  - `GET /banks/:id` - View specific bank details

- **Market Data Routes** (`/api/market/rates`)
  - Returns fixed market rates and product configs

- **Game Engine** (all modules complete)
  - `CollectionSimulator` - Orchestrates collection flow with deposit interest accrual
  - `DemandCalculator` - Rate-sensitive loan/deposit demand
  - `InterestCalculator` - Quarterly interest calculations
  - `DefaultRoller` - Deterministic seeded RNG for defaults

- **Database Schema** (Prisma)
  - All tables implemented per design
  - User model includes `refreshTokenHash` field

- **Security & Configuration**
  - Configurable CORS via `ALLOWED_ORIGINS` environment variable
  - Refresh tokens hashed before storage
  - Token rotation on refresh

### ⚠️ Issues & Missing Features

**Lower Priority:**
- JWT returned in JSON response (design calls for HTTP-only cookies) - currently using Bearer token in Authorization header
- Quarterly snapshots schema exists but no generation logic
- No tests
- JWT secret defaults to hardcoded string if env var missing

---

## Phase 1: Critical Fixes ✅ COMPLETED

### ✅ High Priority - All Completed

- [x] **JWT Middleware**
  - [x] Create `src/lib/authMiddleware.ts`
  - [x] Fastify hook that reads JWT from `Authorization: Bearer <token>` header
  - [x] Verifies JWT using `verifyToken()`
  - [x] Looks up user and bank
  - [x] Attaches to `request.user` and `request.bank`
  - [x] Returns 401 if invalid/missing token

- [x] **Refresh Token Flow**
  - [x] Add `refreshTokenHash` field to User model
  - [x] Create `POST /api/auth/refresh` endpoint
  - [x] Generate refresh token on login/register (30-day expiry)
  - [x] Refresh endpoint: validate refresh token → issue new access token
  - [x] Add rotation: invalidate old refresh token when used

- [x] **Update Bank Routes to Use Auth**
  - [x] `GET /bank` - Remove `findFirst()`, use `request.bank.id`
  - [x] `PUT /bank/rates` - Use `request.bank.id`
  - [x] `PUT /bank/allocation` - Use `request.bank.id`
  - [x] `POST /bank/collect` - Use `request.bank.id`
  - [x] Register auth middleware on all `/bank/*` routes

- [x] **CORS Configuration**
  - [x] Create environment variable `ALLOWED_ORIGINS` (comma-separated)
  - [x] Update `server.ts` to read from env
  - [x] Default to `*` in development
  - [x] Restrict in production

- [x] **Deposit Interest Accrual**
  - [x] Update `CollectionSimulator.ts` to calculate interest for existing deposits
  - [x] Add accrued interest to deposit bucket `currentBalance`
  - [x] Add updated deposit buckets to `updatedDepositBuckets` array
  - [x] Update collection route to persist deposit bucket updates

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

- [x] Document that deposit interest accrual was missing (fixed in Phase 1)
- [x] Document auth middleware implementation approach
- [x] Document refresh token rotation strategy
- [x] Document CORS configuration for production
- [ ] Document SQLite test setup for future contributors (pending Phase 2 implementation)
