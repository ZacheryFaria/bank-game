# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multiplayer idle game where players manage financial institutions. Players set interest rates, manage risk exposure through portfolio allocation, and grow their bank over time. Currently in **active development** - core backend engine and API complete, frontend implementation in progress.

## Project Status

**Backend: ~80% Complete**
- ✅ Database schema (Prisma) - fully implemented per design/architecture.md
- ✅ Game engine - all modules complete (CollectionSimulator, DemandCalculator, InterestCalculator, DefaultRoller)
- ✅ API routes - auth, bank management, leaderboards, market data
- ✅ Collection flow - core idle game mechanic working
- ⚠️ Auth - basic email/password only (no OAuth or magic links yet)
- ❌ Auth middleware - routes have TODOs, currently no JWT verification
- ❌ Quarterly snapshots - schema exists but generation logic not implemented
- ❌ Tests - no test suite yet

**Frontend: ~20% Complete**
- ✅ React 19 + Vite + TypeScript setup
- ✅ Tailwind CSS 4 + shadcn/ui components (button, card, input, table)
- ✅ Basic UI styling established
- ❌ No routing (react-router installed but not configured)
- ❌ No API integration (TanStack Query installed but not used)
- ❌ No state management (Zustand installed but not used)
- ❌ No screens from design/wireframes.md implemented
- ❌ No auth flow

**Infrastructure:**
- ✅ Nix development environment (flake.nix + direnv)
- ✅ docker-compose.yml for PostgreSQL
- ✅ ESLint + Prettier configured
- ✅ pnpm workspace setup
- ❌ Deployment setup not configured

The `design/` folder contains comprehensive design documents that should be followed during implementation:

- **core-gameplay-loop.md** - Idle game mechanics, time model (1 real hour = 1 game quarter), player controls
- **math-and-formulas.md** - Demand calculations, interest formulas, default rates by risk class
- **balance-and-pacing.md** - Scaling friction mechanics, progression timeline
- **multiplayer.md** - Shared market, full transparency, leaderboards
- **architecture.md** - Database schema, API endpoints, collection flow
- **tech-stack.md** - Full stack details, project structure, auth flows
- **wireframes.md** - ASCII wireframes for all screens
- **backlog.md** - Features deferred from V1 (dynamic market rates, interbank lending, etc.)

## Tech Stack

**Backend:** Node.js 24 (LTS) + Fastify + TypeScript, Prisma ORM, Zod validation, PostgreSQL

**Frontend:** React 19 + Vite + TypeScript, Tailwind + shadcn/ui, TanStack Query + Table, Zustand

**Package Manager:** pnpm

**Development:** Nix (flake.nix + direnv for reproducible dev environment)

**Auth:** Google OAuth + email/password + magic link (HTTP-only JWT cookies)

**Deployment:** Backend in Docker (self-hosted), Frontend on Cloudflare CDN

## Development Setup

Development environment is managed via Nix for reproducible builds:

**Required Files:**
- `flake.nix` - Nix flake configuration with Node.js 24 LTS, pnpm, PostgreSQL, and development tools
- `.envrc` - direnv configuration to automatically load the Nix environment

```bash
# Enter the development environment (with direnv)
direnv allow             # Automatically loads flake.nix environment

# Or manually
nix develop
```

## Development Commands

```bash
# Backend
cd backend
pnpm install
pnpm prisma:generate     # Generate Prisma client
pnpm prisma:migrate      # Run migrations (creates database schema)
pnpm dev                 # Runs on :3001

# Frontend
cd frontend
pnpm install
pnpm dev                 # Runs on :5173, proxies API to :3001

# Database
# PostgreSQL runs on :5432 (via docker-compose or local)
docker-compose up -d     # Start PostgreSQL in Docker

# Linting & Formatting (both projects)
pnpm lint                # Run ESLint
pnpm format              # Format with Prettier
```

## Implementation Details

### Backend Structure (`backend/src/`)

**Engine (`engine/`)** - Game logic (pure functions, no side effects):
- `CollectionSimulator.ts` - Orchestrates collection flow, simulates game time
- `DemandCalculator.ts` - Calculates loan/deposit demand based on rates
- `InterestCalculator.ts` - Computes interest income/expense
- `DefaultRoller.ts` - Deterministic default simulation using seeded RNG
- `constants.ts` - Game constants (rates, products, risk classes)
- `types.ts` - TypeScript type definitions

**Routes (`routes/`)** - API endpoints:
- `auth.ts` - POST /api/auth/register, /api/auth/login
- `bank.ts` - GET /api/bank (your bank), PUT /api/bank/rates, PUT /api/bank/allocation, POST /api/bank/collect
- `banks.ts` - GET /api/banks (leaderboard), GET /api/banks/:id (view other banks)
- `market.ts` - GET /api/market/rates (reference market rates)

**Lib (`lib/`)** - Utilities:
- `db.ts` - Prisma client singleton
- `auth.ts` - Password hashing (bcrypt), JWT generation/verification

**Database (`prisma/`)** - Schema matches design/architecture.md:
- Users, Banks, BankRates, BankAllocations
- LoanBuckets, DepositBuckets (hourly aggregates)
- Transactions (ledger), Collections (history), QuarterlySnapshots

### Frontend Structure (`frontend/src/`)

- `App.tsx` - Main component (currently placeholder UI)
- `components/ui/` - shadcn/ui components (button, card, input, table)
- `lib/utils.ts` - Tailwind merge utility

**Not Yet Implemented:**
- Routing (screens from design/wireframes.md)
- API client/hooks (TanStack Query)
- State management (Zustand stores)
- Auth flow (login/register forms, protected routes)

### Known Issues & TODOs

1. **Auth Middleware Missing**: All `/api/bank/*` routes have `// TODO: Get bank ID from auth` - currently use `findFirst()` which gets any bank
2. **JWT in Response Body**: Design calls for HTTP-only cookies, currently returns JWT in JSON response
3. **OAuth Not Implemented**: Only email/password auth exists, no Google OAuth or magic links
4. **Frontend Not Connected**: No API calls to backend, all data is hardcoded placeholders
5. **No Tests**: Neither backend nor frontend have test suites
6. **Quarterly Snapshots**: Schema exists but no logic to generate snapshots from transactions
7. **Deposit Bucket Updates**: Collection flow creates new deposit buckets but doesn't update existing ones with interest

## Key Architecture Concepts

**Game Engine** (`backend/src/engine/`): Pure functions with no side effects for game logic - CollectionSimulator, DemandCalculator, DefaultRoller, InterestCalculator. Use seeded randomness for deterministic default rolls.

**Loan Buckets**: Loans are stored as hourly aggregates (not individual loans) to track aging without excessive data. See `loan_buckets` table in architecture.md.

**Transaction Ledger**: All financial changes recorded as transactions - this is the source of truth. Financial reports are derived from transaction queries.

**Collection Flow**: The core game action. Rate limited to 1/minute. Calculates elapsed time (max 24 hours), simulates game time, records transactions, updates denormalized balances.

**Time Model**: 1 real hour = 1 game quarter. Max 24 hours idle = 6 game years per collection.

## Recommended Next Steps

**High Priority:**
1. **Auth Middleware** - Implement JWT verification middleware, protect all `/api/bank/*` routes
2. **Frontend Auth Flow** - Login/register screens, JWT storage, protected routes
3. **Frontend Dashboard** - Implement main game screen from design/wireframes.md
4. **API Integration** - Set up TanStack Query, connect frontend to backend
5. **Fix Auth Token Delivery** - Switch from JSON response to HTTP-only cookies

**Medium Priority:**
6. **Deposit Bucket Interest** - Update existing deposit buckets with accrued interest during collection
7. **Quarterly Snapshots** - Implement snapshot generation from transaction ledger
8. **Leaderboard Screen** - Implement leaderboard UI using `/api/banks` endpoint
9. **Bank View Screen** - View other banks' public data

**Lower Priority:**
10. **OAuth Providers** - Add Google OAuth support
11. **Magic Link Auth** - Implement passwordless email login
12. **Tests** - Add test coverage for engine and API routes
13. **Deployment** - Docker setup for backend, Cloudflare Pages for frontend

**Design Documents (for reference):**
- Follow `design/wireframes.md` for all UI screens
- Use `design/math-and-formulas.md` for any calculation tweaks
- Check `design/backlog.md` for features explicitly deferred from V1
