# TODO

Work priorities and backlog for the bank-game project.

---

## Current Work

No active work in progress.

---

## High Priority

### Backend

- [ ] **Apply Decimal Helper to Bank Logic** - Use `convertBankDecimals()` in all bank endpoints
- [ ] **Quarterly Snapshots** - Implement snapshot generation from transaction ledger
- [ ] **Wrap Rate Upserts in Transaction** - Make rate updates atomic in `logic/bank.ts updateBankRates`
- [ ] **Wrap Allocation Upserts in Transaction** - Make allocation updates atomic in `logic/bank.ts updateBankAllocation`
- [ ] **Implement Time Multiplier** - Integrate `time.multiplier` config into CollectionSimulator's time calculations so it actually affects game speed. Currently defined in config but unused. See `backend/src/engine/CollectionSimulator.ts:63` and `docs/configuration.md`

### Testing

See `docs/tests/test-strategy.md` for full test plan.

- [ ] **Backend Unit Tests** - Test `logic/auth.ts` and `logic/bank.ts` business logic
- [ ] **Engine Tests** - CollectionSimulator, DemandCalculator, DefaultRoller, InterestCalculator
- [ ] **Contract Validation Tests** - Verify all route responses match ts-rest contract schemas
- [ ] **Integration Tests** - Full auth flow, collection flow, multi-user scenarios
- [ ] **E2E Tests** - Register → Collect → Update Rates → Collect

### Infrastructure

- [ ] **CI/CD Pipeline** - Run tests on every commit, block merge if tests fail

---

## Medium Priority

### Web Frontend

- [ ] **ts-rest Integration** - Add ts-rest client (`frontend/src/lib/api.ts`)
- [ ] **Auth Flow** - Login/register screens, protected routes
- [ ] **Dashboard Screen** - Implement main game screen from `docs/wireframes.md`
- [ ] **API Integration** - Set up TanStack Query, connect to backend
- [ ] **Routing** - Configure react-router with screens from wireframes
- [ ] **State Management** - Set up Zustand stores for auth and game state

---

## Low Priority

### Backend Improvements

- [ ] **Database Indexes** - Add indexes on `bankId`, `userId`, `collectedAt` for performance
- [ ] **Error Response Format** - Standardize error responses with error codes
- [ ] **Request ID Tracking** - Add request IDs for debugging
- [ ] **Health Check Endpoint** - Add `/health` with database status
- [ ] **Structured Logging** - Switch to JSON logs for production

### Infrastructure

- [ ] **OAuth Providers** - Add Google OAuth support
- [ ] **Magic Link Auth** - Implement passwordless email login
- [ ] **Dockerfile for Backend** - Containerize backend application
- [ ] **docker-compose Full Stack** - Single command to run entire stack
- [ ] **Systemd Service** - Create service file for backend deployment

### Observability

- [ ] **Metrics** - Add Prometheus/OpenTelemetry metrics
- [ ] **Distributed Tracing** - Track requests across services
- [ ] **Error Tracking** - Integrate Sentry for error monitoring
- [ ] **Performance Monitoring** - Track API response times, collection simulation time

---

## Tech Debt

### Backend

- [ ] Add input sanitization for bank names

### Build System

- [ ] Add pre-commit hooks (lint, format, type-check)
- [ ] Optimize parallel builds

---

## Ideas / Future Features

### Gameplay Enhancements

See `docs/game-design.md` "Deferred Features" section for details.

- [ ] Dynamic market rates (derived from aggregate player behavior)
- [ ] Zero-sum demand pool (true competition for fixed demand)
- [ ] Interbank lending (player-to-player loans)
- [ ] Systemic contagion (bank failures affect others)
- [ ] Prestige system (reset at $100M with permanent bonuses)
- [ ] Economic events (Fed rate changes, recessions, housing bubbles)

### Platform Expansion

- [ ] Mobile app (React Native)
