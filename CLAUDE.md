# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multiplayer idle game where players manage financial institutions. Players set interest rates, manage risk exposure through portfolio allocation, and grow their bank over time. Currently in **active development** - core backend engine complete with ts-rest API integration, TUI (Terminal User Interface) functional with auth and basic gameplay, web frontend minimal.

## Project Status

**Backend: ~90% Complete**
- ✅ Database schema (Prisma) - fully implemented per design/architecture.md
- ✅ Game engine - all modules complete (CollectionSimulator, DemandCalculator, InterestCalculator, DefaultRoller)
- ✅ Business logic extracted to `logic/` folder (auth.ts, bank.ts)
- ✅ ts-rest API integration - full type safety with shared contract
- ✅ Thin route handlers in `routes/api.ts` calling business logic
- ✅ Collection flow - core idle game mechanic working
- ✅ Auth middleware - JWT verification implemented
- ✅ Auth - email/password with refresh tokens
- ❌ OAuth not implemented (Google OAuth, magic links)
- ❌ Quarterly snapshots - schema exists but generation logic not implemented
- ❌ Tests - no test suite yet

**TUI (Terminal Interface): ~60% Complete**
- ✅ Ink (React for CLIs) + TypeScript setup
- ✅ ts-rest client with full type safety
- ✅ TanStack Query for server state management
- ✅ Zustand for auth state
- ✅ Login/Register screens with auth flow
- ✅ Dashboard showing bank financials
- ✅ Collection functionality with rate limiting
- ✅ Vim-like keybindings (`j/k` navigation, `:q` to quit, `c` to collect)
- ✅ Command mode (`:q`, `:logout`)
- ❌ Rate editor screen
- ❌ Portfolio allocation editor
- ❌ Transaction history viewer
- ❌ Leaderboard screen
- ❌ Token persistence (clears on restart)

**Web Frontend: ~20% Complete**
- ✅ React 19 + Vite + TypeScript setup
- ✅ Tailwind CSS 4 + shadcn/ui components (button, card, input, table)
- ✅ Basic UI styling established
- ❌ No routing (react-router installed but not configured)
- ❌ No API integration (TanStack Query installed but not used)
- ❌ No state management (Zustand installed but not used)
- ❌ No screens from design/wireframes.md implemented
- ❌ No auth flow

**Shared Package: ✅ Complete**
- ✅ ts-rest contract defining all API endpoints
- ✅ Zod schemas for validation
- ✅ Shared between backend, TUI, and (future) web frontend

**Infrastructure:**
- ✅ Nix development environment (flake.nix + direnv)
- ✅ docker-compose.yml for PostgreSQL
- ✅ ESLint + Prettier configured
- ✅ pnpm workspace setup (backend, frontend, tui, packages/shared)
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
- **TUI_ARCHITECTURE.md** - Complete TUI architecture, ts-rest integration, business logic extraction patterns

The `todos/` folder contains planning documents:

- **TUI_FEATURES.md** - Planned TUI features (rate editor, allocation screen, etc.)
- **TESTING_PLAN.md** - Comprehensive testing strategy for backend, TUI, and contracts
- **BUGS_AND_IMPROVEMENTS.md** - Known issues and improvement ideas
- **ADVANCED_FEATURES.md** - Long-term feature ideas (multiplayer, AI, analytics)

## Tech Stack

**Backend:** Node.js 24 (LTS) + Fastify + TypeScript, Prisma ORM, ts-rest + Zod validation, PostgreSQL

**TUI:** Ink (React for CLIs) + TypeScript, ts-rest client, TanStack Query, Zustand, vim-like keybindings

**Web Frontend:** React 19 + Vite + TypeScript, Tailwind + shadcn/ui, TanStack Query + Table, Zustand

**Shared:** ts-rest contract + Zod schemas (full type safety across stack)

**Package Manager:** pnpm (workspace with backend, frontend, tui, packages/shared)

**Development:** Nix (flake.nix + direnv for reproducible dev environment)

**Auth:** Email/password with JWT + refresh tokens (OAuth and magic links planned)

**Deployment:** Backend in Docker (self-hosted), Frontend on Cloudflare CDN (planned)

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
# Install all packages (from root)
pnpm install             # Installs backend, frontend, tui, and shared packages

# Backend
cd backend
pnpm prisma:generate     # Generate Prisma client
pnpm prisma:migrate      # Run migrations (creates database schema)
pnpm dev                 # Runs on :3001

# TUI (Terminal Interface)
cd tui
pnpm dev                 # Start TUI client (connects to :3001)

# Web Frontend
cd frontend
pnpm dev                 # Runs on :5173, proxies API to :3001

# Shared Package (ts-rest contract)
cd packages/shared
pnpm build               # Build shared types (auto-imported by backend/tui)

# Database
# PostgreSQL runs on :5432 (via docker-compose or local)
docker-compose up -d     # Start PostgreSQL in Docker

# Linting & Formatting (run from root or individual packages)
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

**Logic (`logic/`)** - Business logic extracted from routes:
- `auth.ts` - createUser, authenticateUser, refreshUserToken (pure business logic)
- `bank.ts` - getBankById, updateBankRates, updateBankAllocation, collectBank
- **Pattern**: All return `{ success: true, ...data } | { success: false, error }` for easy HTTP mapping

**Routes (`routes/`)** - Thin HTTP handlers:
- `api.ts` - ts-rest route handlers (calls logic/, returns HTTP responses)
- `banks.ts` - GET /api/banks (leaderboard), GET /api/banks/:id (view other banks) - NOT yet migrated to ts-rest
- `market.ts` - GET /api/market/rates (reference market rates) - NOT yet migrated to ts-rest

**Lib (`lib/`)** - Utilities:
- `db.ts` - Prisma client singleton
- `auth.ts` - Password hashing (bcrypt), JWT generation/verification
- `authMiddleware.ts` - JWT verification middleware (adds request.bank to Fastify request)

**Database (`prisma/`)** - Schema matches design/architecture.md:
- Users, Banks, BankRates, BankAllocations
- LoanBuckets, DepositBuckets (hourly aggregates)
- Transactions (ledger), Collections (history), QuarterlySnapshots

### Shared Package Structure (`packages/shared/src/`)

**Contract (`contract.ts`)** - Single source of truth for API:
- ts-rest contract defining all endpoints (auth, bank)
- Zod schemas for request/response validation
- Exported as `contract` and used by both backend and TUI

### TUI Structure (`tui/src/`)

**Components (`components/`)** - Ink (React) UI components:
- `LoginScreen.tsx` - Email/password login with step-by-step input
- `RegisterScreen.tsx` - Email/bankName/password registration flow
- `Dashboard.tsx` - Main game screen (bank stats, collection, auto-refresh)

**Hooks (`hooks/`)** - Custom React hooks:
- `useKeyBindings.ts` - Centralized vim-like keybinding system with context awareness

**Lib (`lib/`)** - Utilities:
- `api.ts` - ts-rest client initialization with auth token injection
- `store.ts` - Zustand auth state (user, token, login, logout)

**App (`App.tsx`)** - Main router, switches between auth screens and dashboard

**Entry (`index.tsx`)** - CLI entry point, renders Ink app

### Web Frontend Structure (`frontend/src/`)

- `App.tsx` - Main component (currently placeholder UI)
- `components/ui/` - shadcn/ui components (button, card, input, table)
- `lib/utils.ts` - Tailwind merge utility

**Not Yet Implemented:**
- Routing (screens from design/wireframes.md)
- ts-rest client integration
- API client/hooks (TanStack Query)
- State management (Zustand stores)
- Auth flow (login/register forms, protected routes)

**Note**: The TUI is currently the primary interface. Web frontend will be updated later with ts-rest integration following the same pattern as TUI.

### Known Issues & TODOs

See `todos/BUGS_AND_IMPROVEMENTS.md` for comprehensive list. Key issues:

1. **TUI Token Persistence**: Token not saved to disk, clears on app restart
2. **OAuth Not Implemented**: Only email/password auth exists, no Google OAuth or magic links
3. **Web Frontend Not Connected**: No API calls to backend, all data is hardcoded placeholders
4. **No Tests**: Neither backend nor TUI have test suites (see `todos/TESTING_PLAN.md`)
5. **Quarterly Snapshots**: Schema exists but no logic to generate snapshots from transactions
6. **Deposit Bucket Interest Updates**: Collection flow creates new deposit buckets but doesn't update existing ones with accrued interest
7. **banks.ts and market.ts**: Not yet migrated to ts-rest (still using old route pattern)

## Key Architecture Concepts

**Business Logic Extraction** (`backend/src/logic/`): All business logic extracted from routes into pure functions. Routes are thin wrappers that call logic and return HTTP responses. Pattern: `{ success: true, ...data } | { success: false, error }` for easy error handling.

**ts-rest Contract** (`packages/shared/src/contract.ts`): Single source of truth for API. Defines all endpoints, request/response schemas with Zod. Full type safety from client → server → database → response. TypeScript catches breaking changes at compile time.

**Game Engine** (`backend/src/engine/`): Pure functions with no side effects for game logic - CollectionSimulator, DemandCalculator, DefaultRoller, InterestCalculator. Use seeded randomness for deterministic default rolls.

**Loan Buckets**: Loans are stored as hourly aggregates (not individual loans) to track aging without excessive data. See `loan_buckets` table in architecture.md.

**Transaction Ledger**: All financial changes recorded as transactions - this is the source of truth. Financial reports are derived from transaction queries.

**Collection Flow**: The core game action. Rate limited to 1/minute. Calculates elapsed time (max 24 hours), simulates game time, records transactions, updates denormalized balances.

**Time Model**: 1 real hour = 1 game quarter. Max 24 hours idle = 6 game years per collection.

**Keybindings** (`tui/src/hooks/useKeyBindings.ts`): Centralized vim-like keybinding system. Context-aware (auth, dashboard, menu). Global command mode (`:q`, `:logout`). Easy to extend.

## Recommended Next Steps

**Current Focus: TUI UX Improvements** (see `todos/USER_FEEDBACK.md`)

**TUI - Immediate Priority (UX Fixes):**
1. **Fix Vim Keybinding Modality** - Disable keybindings during text input, require Esc to exit
2. **Add Visual Borders** - Screen container, section borders, input focus, command bar
3. **Input Field UX** - Validation feedback, placeholders, help text
4. **Command Mode Improvements** - Command history, tab completion, better visibility

**TUI - High Priority (Features):**
5. **Token Persistence** - Save JWT to ~/.bank-game/token file
6. **Rate Editor Screen** - Interactive rate adjustment with h/l keys
7. **Allocation Editor Screen** - Portfolio allocation adjustment
8. **Transaction History** - Scrollable transaction viewer with j/k navigation
9. **Leaderboard Screen** - View top banks, navigate with j/k

**Backend (High Priority):**
10. **Apply Decimal Helper to Bank Logic** - Use `convertBankDecimals()` in all bank endpoints
11. **Migrate banks.ts and market.ts to ts-rest** - Complete ts-rest migration
12. **Deposit Bucket Interest** - Update existing deposit buckets with accrued interest during collection
13. **Quarterly Snapshots** - Implement snapshot generation from transaction ledger
14. **Tests** - Add test coverage (see `todos/TESTING_PLAN.md`)

**Web Frontend (Medium Priority):**
15. **ts-rest Integration** - Add ts-rest client like TUI
16. **Auth Flow** - Login/register screens following TUI pattern
17. **Dashboard** - Implement main game screen from design/wireframes.md
18. **API Integration** - Set up TanStack Query, connect to backend

**Lower Priority:**
19. **OAuth Providers** - Add Google OAuth support
20. **Magic Link Auth** - Implement passwordless email login
21. **Deployment** - Docker setup for backend, Cloudflare Pages for frontend

**Architecture Documents (for implementation guidance):**
- **`todos/USER_FEEDBACK.md`** - Current UX issues and implementation details
- Read `design/TUI_ARCHITECTURE.md` for complete architecture overview
- Follow `todos/TUI_FEATURES.md` for planned TUI features
- Follow `design/wireframes.md` for all UI screens (web frontend)
- Use `design/math-and-formulas.md` for any calculation tweaks
- Check `design/backlog.md` for features explicitly deferred from V1
- See `todos/TESTING_PLAN.md` for testing strategy

## Important Implementation Patterns

### Adding a New API Endpoint

1. **Define in contract first** (`packages/shared/src/contract.ts`)
2. **Implement business logic** (`backend/src/logic/`)
3. **Wire up thin handler** (`backend/src/routes/api.ts`)
4. **Use in TUI** with full type safety via ts-rest client

### Adding a New TUI Screen

1. **Create component** (`tui/src/components/`)
2. **Add keybindings** (`tui/src/hooks/useKeyBindings.ts`)
3. **Wire up in App.tsx** router
4. **Use ts-rest client** for type-safe API calls

See `design/TUI_ARCHITECTURE.md` for detailed patterns and examples.
