# Test Strategy

Testing strategy for bank-game project. See `auth-tests.md` and `collection-tests.md` for detailed test cases.

---

## Current Status

**Backend Testing: 🚧 In Progress**
- ✅ Test infrastructure setup (Vitest + PostgreSQL test database)
- ✅ Auth API integration tests (12/12 passing)
  - Registration (success, duplicate email, missing fields)
  - Login (success, invalid credentials)
  - Token refresh (success, invalid token, rotation, deleted user)
- ⏳ Collection API tests (next priority)
- ⏳ Engine unit tests (CollectionSimulator, DemandCalculator, etc.)

**Frontend Testing: ❌ Not Yet Implemented**

---

## Backend Testing

### Unit Tests (`logic/`)

Test business logic functions in isolation:
- `logic/auth.ts` - createUser, authenticateUser, refreshUserToken
- `logic/bank.ts` - getBankById, updateBankRates, updateBankAllocation, collectBank

Focus on:
- Success paths
- Error handling (duplicate email, invalid data, etc.)
- Business rule validation (allocations sum to 1.0, rate limits, etc.)

### Engine Tests (`engine/`)

Test pure game logic functions:
- `CollectionSimulator` - Orchestrates full collection flow
- `DemandCalculator` - Loan/deposit demand based on rates
- `InterestCalculator` - Interest income and expense calculations
- `DefaultRoller` - Deterministic default simulation with seeded RNG

Focus on:
- Math correctness (formulas from `docs/game-design.md`)
- Deterministic behavior (same seed = same results)
- Edge cases (zero balances, extreme rates, etc.)

### Integration Tests (`routes/api.ts`)

Test API endpoints end-to-end:
- Auth routes (register, login, refresh)
- Bank routes (GET /bank, PUT /rates, PUT /allocation, POST /collect)
- Contract validation (ts-rest schema compliance)

Focus on:
- HTTP status codes
- Response format validation
- Authentication middleware
- Error responses

---

## Contract Testing (ts-rest)

Verify type safety across the stack:
- Backend responses match contract schemas
- Web frontend requests match contract schemas
- TypeScript catches breaking changes at compile time

Use ts-rest's built-in validation for automatic checking.

---

## Test Infrastructure

### Setup

- **Test Database**: Separate PostgreSQL instance with migrations
- **Seed Data**: Helper functions to create test users/banks
- **Time Mocking**: Mock `Date.now()` for deterministic collection tests
- **Cleanup**: Reset database between tests

### Frameworks

- **Backend**: Vitest (fast, TypeScript-native)
- **Web Frontend**: Vitest + Testing Library
- **E2E**: Playwright (for web frontend)

### CI/CD

- Run all tests on every commit
- Block merges if tests fail
- Track test coverage (aim for >80% on business logic)
- Run E2E tests on pull requests only (slower)

---

## Testing Priorities

**Phase 1: Critical Paths**
1. Auth flow (register, login, token refresh)
2. Collection flow (core game mechanic)
3. Contract validation (type safety)

**Phase 2: Edge Cases**
4. Error handling (network errors, validation errors)
5. Edge cases (zero balances, extreme rates, boundary conditions)
6. Rate limiting and concurrency

**Phase 3: Polish**
7. Web component tests (full coverage)
8. Performance tests (load testing, query optimization)
9. E2E tests (full user journeys)

---

## Performance Testing

### Load Tests

- 100 concurrent users collecting
- Database query performance with 1000+ banks
- Collection simulation with large portfolios (1000+ buckets)

### Benchmarks

- Collection endpoint response time (target: < 500ms)
- Web frontend render performance (target: < 100ms for interactions)
- Database queries (identify and optimize slow queries)

---

## Security Testing

- JWT token validation (expiration, signature verification)
- Refresh token rotation (single-use enforcement)
- SQL injection prevention (Prisma handles this)
- Rate limiting effectiveness (brute force protection)
- Input validation (XSS, injection attacks)

---

## Notes

- See `auth-tests.md` for detailed auth test cases
- See `collection-tests.md` for detailed collection test cases
- Use Vitest for all testing (consistent across backend and web frontend)
- Mock external dependencies (database, time, random number generation)
- Aim for fast unit tests (< 10ms each), slower integration tests (< 100ms), slow E2E tests (< 5s)
