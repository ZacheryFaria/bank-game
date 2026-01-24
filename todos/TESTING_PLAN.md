# Testing Plan

## Backend Testing

### Unit Tests (logic/)

**`logic/auth.ts`**
- [ ] createUser: successful registration
- [ ] createUser: duplicate email returns error
- [ ] createUser: creates bank with default rates/allocations
- [ ] authenticateUser: successful login
- [ ] authenticateUser: invalid email returns error
- [ ] authenticateUser: invalid password returns error
- [ ] refreshUserToken: valid refresh token returns new tokens
- [ ] refreshUserToken: invalid/expired token returns error

**`logic/bank.ts`**
- [ ] getBankById: returns bank with all relations
- [ ] getBankById: non-existent bank returns error
- [ ] updateBankRates: successfully updates rates
- [ ] updateBankAllocation: successfully updates allocations
- [ ] updateBankAllocation: allocations not summing to 1.0 returns error
- [ ] collectBank: successful collection
- [ ] collectBank: rate limit (< 60s) returns 429 with retryAfter
- [ ] collectBank: creates transactions, loan buckets, deposit buckets
- [ ] collectBank: updates bank equity/loans/deposits
- [ ] collectBank: bucket ID mapping - new loan buckets are correctly mapped in transactions
- [ ] collectBank: bucket ID mapping - new deposit buckets are correctly mapped in transactions
- [ ] collectBank: bucket ID mapping - existing bucket IDs are preserved in transactions
- [ ] collectBank: bucket ID mapping - transactions reference valid bucket IDs (no FK violations)
- [ ] collectBank: bucket ID mapping - mixed new/existing buckets handled correctly
- [ ] collectBank: transaction atomicity - all operations succeed or all rollback
- [ ] collectBank: buildLoanBucketIdMap correctly maps simulator IDs to DB UUIDs
- [ ] collectBank: buildDepositBucketIdMap correctly maps simulator IDs to DB UUIDs

### Integration Tests (routes/api.ts)

**Auth Routes**
- [ ] POST /api/auth/register: 200 with valid data
- [ ] POST /api/auth/register: 400 with duplicate email
- [ ] POST /api/auth/register: 400 with invalid email
- [ ] POST /api/auth/register: 400 with short password
- [ ] POST /api/auth/login: 200 with valid credentials
- [ ] POST /api/auth/login: 401 with invalid credentials
- [ ] POST /api/auth/refresh: 200 with valid refresh token
- [ ] POST /api/auth/refresh: 401 with invalid refresh token

**Bank Routes** (all require auth)
- [ ] GET /api/bank: 200 with bank data
- [ ] GET /api/bank: 401 without auth token
- [ ] PUT /api/bank/rates: 200 with valid rates
- [ ] PUT /api/bank/rates: 400 with invalid rates (negative, > 0.5)
- [ ] PUT /api/bank/allocation: 200 with valid allocations
- [ ] PUT /api/bank/allocation: 400 when allocations don't sum to 1.0
- [ ] POST /api/bank/collect: 200 after cooldown period
- [ ] POST /api/bank/collect: 429 during cooldown

### Contract Validation Tests

- [ ] All route responses match contract schemas
- [ ] Invalid request bodies are rejected by Zod
- [ ] Response validation catches unexpected fields

## Engine Testing

### CollectionSimulator
- [ ] Simulates correct number of game quarters
- [ ] Caps at 24 hours (96 quarters) elapsed time
- [ ] Creates appropriate loan/deposit buckets
- [ ] Calculates interest correctly
- [ ] Handles defaults deterministically with same seed

### DemandCalculator
- [ ] Higher rates decrease loan demand
- [ ] Lower deposit rates decrease deposit supply
- [ ] Demand scales with bank equity

### DefaultRoller
- [ ] Uses seeded RNG for deterministic results
- [ ] Default rates match expected values by risk class
- [ ] Same seed produces same defaults

### InterestCalculator
- [ ] Calculates loan interest correctly
- [ ] Calculates deposit interest correctly
- [ ] Handles compounding if applicable

## TUI Testing

### Component Tests (ink-testing-library)

**LoginScreen**
- [ ] Renders email input on load
- [ ] Switches to password input after email submit
- [ ] Shows error message on failed login
- [ ] Calls login API with correct credentials
- [ ] Stores token in Zustand store on success

**RegisterScreen**
- [ ] Renders email → bank name → password flow
- [ ] Validates password length (min 8 chars)
- [ ] Shows error on duplicate email
- [ ] Calls register API with correct data
- [ ] Stores token in Zustand store on success

**Dashboard**
- [ ] Displays bank name, equity, loans, deposits
- [ ] Shows rates if available
- [ ] Shows time since last collection
- [ ] Collect button triggers mutation
- [ ] Shows error message on failed collection
- [ ] Shows success message after collection
- [ ] Auto-refreshes every 5 seconds

### Keybinding Tests

**Auth Context**
- [ ] `r` switches to register screen
- [ ] `l` switches to login screen
- [ ] `:q` quits application

**Dashboard Context**
- [ ] `c` triggers collection
- [ ] `:logout` logs out user
- [ ] `:q` quits application
- [ ] `j`/`k` navigation (when implemented)

### E2E Tests

- [ ] Full flow: register → dashboard → collect
- [ ] Full flow: login → dashboard → collect
- [ ] Token refresh flow
- [ ] Logout and login again
- [ ] Network error handling
- [ ] Backend down scenario

## API Contract Tests

### ts-rest Contract Compliance
- [ ] Backend responses match contract schemas (use ts-rest validation)
- [ ] TUI sends requests matching contract schemas
- [ ] Type errors caught at compile time for breaking changes

## Performance Tests

### Backend
- [ ] Collection endpoint handles 100 concurrent requests
- [ ] Database connection pool doesn't exhaust
- [ ] Collection with 1000+ loan buckets completes in < 5s

### TUI
- [ ] Renders 1000+ transaction rows without lag (when virtualized)
- [ ] Keybindings respond in < 50ms
- [ ] Dashboard updates don't cause flicker

## Load Testing

- [ ] 100 concurrent users collecting
- [ ] 1000 banks in database (leaderboard queries)
- [ ] Database query performance with large dataset

## Security Tests

- [ ] JWT tokens expire correctly
- [ ] Refresh tokens are single-use
- [ ] SQL injection attempts are blocked (Prisma)
- [ ] XSS in bank names doesn't break TUI
- [ ] Rate limiting works on collect endpoint

## Test Infrastructure

### Setup
- [ ] Create test database with migrations
- [ ] Seed test data (users, banks, transactions)
- [ ] Mock time for deterministic collection tests
- [ ] Helper functions for creating test users/banks

### CI/CD
- [ ] Run backend tests on every commit
- [ ] Run TUI component tests on every commit
- [ ] Run contract validation tests
- [ ] Block merge if tests fail
- [ ] Test coverage reporting

## Future: Contract Testing with Pact

- [ ] Generate Pact contracts from ts-rest
- [ ] Backend verifies it satisfies contract
- [ ] TUI verifies it uses contract correctly
- [ ] Independent versioning of backend/TUI
