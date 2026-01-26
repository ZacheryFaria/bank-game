# Backend Roadmap

## Current Status (January 2026)

### ✅ Completed Features

**Core Backend:**
- Authentication system with JWT tokens (access + refresh tokens with rotation)
- ts-rest contract for type-safe API
- Fastify server with CORS configuration
- Rate limiting (global + auth endpoints)
- Transaction wrapping for data integrity
- Database indexes for performance

**Game Engine:**
- Collection simulator with deterministic seeded RNG
- Demand calculator with rate-sensitive loan/deposit origination
- Interest calculator for quarterly accrual
- Default roller for loan losses
- Risk class allocation system

**API Endpoints:**
- `/api/auth/*` - Registration, login, refresh
- `/api/bank/*` - Bank state, rates, allocations, collection
- `/api/banks/*` - Leaderboard and public bank viewing
- `/api/market/*` - Market rates and product configurations

**Database:**
- Prisma schema with PostgreSQL
- User, Bank, BankRate, BankAllocation models
- LoanBucket, DepositBucket for portfolio tracking
- Transaction ledger with JSONB details
- Collection records for game time tracking
- Quarterly snapshot schema (generation not implemented)

**Testing:**
- Vitest test infrastructure
- PostgreSQL test database
- Auth integration tests (12 passing)
- Test helpers and factories

---

## High Priority

### Testing Expansion
- [ ] Unit tests for engine functions (CollectionSimulator, DemandCalculator, InterestCalculator, DefaultRoller)
- [ ] Integration tests for bank management endpoints (rates, allocations)
- [ ] Collection flow tests with rate limiting verification
- [ ] Leaderboard tests with pagination

### Performance & Reliability
- [ ] Monitor database query performance with new indexes
- [ ] Add database connection pooling configuration
- [ ] Implement structured logging (Pino or similar)
- [ ] Add request ID tracking for debugging

---

## Medium Priority

### Features
- [ ] Quarterly snapshot generation logic
- [ ] Historical data queries (transaction history, collection history)
- [ ] Bank deletion/reset functionality
- [ ] Admin endpoints for system monitoring

### Code Quality
- [ ] Increase test coverage to 80%+
- [ ] Add API endpoint documentation beyond TypeScript types
- [ ] Standardize error response format across all endpoints
- [ ] Add more comprehensive input validation

---

## Low Priority / Future Enhancements

### Security Hardening
- [ ] HTTP-only cookie authentication (instead of Bearer tokens)
- [ ] CSRF protection for cookie-based auth
- [ ] Rate limiting per-user (not just per-IP)
- [ ] Request payload size limits
- [ ] SQL injection audit (Prisma provides protection, but verify)

### Monitoring & Operations
- [ ] Metrics endpoint (request counts, latencies, error rates)
- [ ] Health check improvements (database connectivity verification)
- [ ] Graceful shutdown handling
- [ ] Database migration rollback procedures

### Performance Optimization
- [ ] Response caching for market data
- [ ] Database query optimization based on production metrics
- [ ] Bucket aggregation for old data (reduce query size)

### Developer Experience
- [ ] OpenAPI/Swagger documentation generation
- [ ] Development seed data scripts
- [ ] Load testing scripts
- [ ] CI/CD pipeline setup

---

## Archived Work

See [IMPLEMENTATION_PLAN_ARCHIVED.md](IMPLEMENTATION_PLAN_ARCHIVED.md) for historical implementation details.
