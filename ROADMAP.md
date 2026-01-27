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
- Quarterly snapshot generation (implemented in snapshotGenerator.ts)

**Testing:**
- Vitest test infrastructure
- PostgreSQL test database
- Auth integration tests (12 passing)
- Test helpers and factories

---

## Work Tracking

**All ongoing work and future features are now tracked in beads.**

```bash
bd ready              # Find available work
bd list --priority 0  # View high priority items
bd list --priority 1  # View medium priority items
bd list --priority 2  # View low priority items
bd show <id>          # View issue details
```

Run `bd list --all` to see all tracked work items.

---

## Archived Work

See [IMPLEMENTATION_PLAN_ARCHIVED.md](IMPLEMENTATION_PLAN_ARCHIVED.md) for historical implementation details.
