# CLAUDE.md

Bank Game - multiplayer idle game where players manage financial institutions.

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start PostgreSQL
docker-compose up -d

# Backend setup (first time only)
cd backend
cp .env.example .env     # Copy environment variables
pnpm prisma:generate
pnpm prisma:migrate

# Run all interfaces in parallel
pnpm dev                 # Starts backend + web

# Or run individually:
cd backend && pnpm dev   # API server on :3001
cd web && pnpm dev       # Web interface on :5173
```

---

## Testing & Validation

**Validate changes before committing:**

```bash
# Type checking (fast - always run first)
pnpm type-check              # Check all packages
cd backend && pnpm type-check
cd web && pnpm type-check

# Linting & formatting
pnpm lint                    # Check linting
pnpm format                  # Auto-format code
```

**Quick validation workflow:**
```bash
# Before committing backend changes
cd backend
pnpm type-check && pnpm lint

# Before committing web changes
cd web
pnpm type-check && pnpm lint
```

**Note:** `pnpm build` also type-checks but is slower. Use `pnpm type-check` for faster feedback during development.

---

## Database Schema Changes

**⚠️ CRITICAL: When editing Prisma schema files, you MUST create a migration.**

Editing `backend/prisma/schema.prisma` directly without creating a migration will cause database drift - where your schema file and actual database structure become out of sync. This has caused issues multiple times.

**Correct workflow for schema changes:**

```bash
# 1. Edit backend/prisma/schema.prisma
# 2. Create and apply migration
cd backend
pnpm prisma migrate dev --name describe_your_changes

# 3. Verify migration was created
ls -la prisma/migrations/
```

**What this does:**
- Generates SQL migration file in `prisma/migrations/`
- Applies changes to database
- Updates Prisma Client types
- Keeps schema and database in sync

**Common mistakes to avoid:**
- ❌ Editing schema.prisma and running `prisma generate` only
- ❌ Editing schema.prisma and running `prisma db push` (only for prototyping)
- ❌ Manually editing the database without updating schema
- ✅ Edit schema.prisma → run `prisma migrate dev`

**Fixing database drift:**
If you encounter drift, check status first:
```bash
cd backend
pnpm prisma migrate status
```

For development databases, reset is often cleanest:
```bash
cd backend
pnpm prisma migrate reset  # Drops all data, recreates from schema
```

---

## Documentation Structure

**ALL documentation lives in `/docs/` - never create docs elsewhere.**

### Work & Planning
- **`docs/TODO.md`** - Current priorities, next steps, backlog (single source of truth for what to work on)
- **`docs/BUGS.md`** - Known issues and tech debt

### Technical Reference
- **`docs/architecture.md`** - Database schema, API endpoints, backend structure, collection flow
- **`docs/game-design.md`** - Game mechanics, formulas, balance, multiplayer, deferred features
- **`docs/web-patterns.md`** - Web frontend patterns, React Query, authentication, routing
- **`docs/wireframes.md`** - UI/UX wireframes for all screens

### Testing
- **`docs/tests/test-strategy.md`** - Testing approach and priorities
- **`docs/tests/auth-tests.md`** - Detailed auth test cases
- **`docs/tests/collection-tests.md`** - Detailed collection test cases

---

## Tech Stack

**Backend:** Node.js 24 (LTS) + Fastify + TypeScript, Prisma ORM, ts-rest + Zod validation, PostgreSQL

**Web:** React 19 + TypeScript + Vite, shadcn/ui (Bloomberg Terminal theme), TanStack Query, Zustand, React Router

**Shared:** ts-rest contract + Zod schemas (full type safety across stack)

**Package Manager:** pnpm (workspace: backend, web, packages/shared)

**Development:** Nix (flake.nix + direnv for reproducible dev environment)

**Auth:** Email/password with JWT + refresh tokens (OAuth and magic links planned)

See `docs/architecture.md` for detailed technical architecture.

---

## Key Implementation Patterns

### Business Logic Extraction

All business logic lives in `backend/src/logic/` as pure functions. Routes are thin wrappers that call logic and return HTTP responses.

**Pattern:**
```typescript
// backend/src/logic/bank.ts
export function updateBankRates(bankId, rates) {
  // Validation
  if (/* invalid */) {
    return { success: false, error: "..." };
  }

  // Business logic
  const result = await prisma.bankRates.upsert(...);

  return { success: true, data: result };
}

// backend/src/routes/api.ts
router.put('/bank/rates', async (req, res) => {
  const result = await updateBankRates(req.bank.id, req.body);

  if (!result.success) {
    return res.status(400).send({ error: result.error });
  }

  return res.status(200).send(result.data);
});
```

### ts-rest Contract (Single Source of Truth)

Define all API endpoints in `packages/shared/src/contract.ts`. Full type safety from client → server → database → response.

**Pattern:**
```typescript
// packages/shared/src/contract.ts
export const contract = c.router({
  bank: {
    get: {
      method: 'GET',
      path: '/bank',
      responses: {
        200: BankResponseSchema,
        401: UnauthorizedSchema,
      },
    },
  },
});

// Backend automatically validates against contract
// Web gets full TypeScript autocomplete and type checking
```

### Adding a New API Endpoint

1. **Define in contract first** (`packages/shared/src/contract.ts`)
2. **Implement business logic** (`backend/src/logic/`)
3. **Wire up thin handler** (`backend/src/routes/api.ts`)
4. **Use in clients** (Web) with full type safety via ts-rest client

See `docs/web-patterns.md` for detailed examples.

### Adding a New Web Page

1. **Create page component** (`web/src/pages/`)
2. **Add route** in `web/src/App.tsx`
3. **Create API hooks** (`web/src/hooks/`) using React Query
4. **Use Bloomberg UI components** from `web/src/components/bloomberg/`

See `docs/web-patterns.md` for detailed examples.

---

## Key Concepts

**Game Engine** (`backend/src/engine/`): Pure functions with no side effects - CollectionSimulator, DemandCalculator, DefaultRoller, InterestCalculator. Use seeded randomness for deterministic results.

**Loan Buckets**: Loans stored as hourly aggregates (not individual loans) to track aging without excessive data. See `loan_buckets` table in `docs/architecture.md`.

**Transaction Ledger**: All financial changes recorded as transactions - this is the source of truth. Financial reports derived from transaction queries.

**Collection Flow**: Core game mechanic. Rate limited to 1/minute. Calculates elapsed time (max 24 hours), simulates game time, records transactions, updates denormalized balances.

**Time Model**: 1 real hour = 1 game quarter. Max 24 hours idle = 6 game years per collection.

---

## Project Structure

```
bank-game/
├── backend/              # Fastify API server
│   ├── src/
│   │   ├── engine/       # Game logic (pure functions)
│   │   ├── logic/        # Business logic (auth, bank)
│   │   ├── routes/       # API routes (thin handlers)
│   │   └── lib/          # Utilities (db, auth helpers)
│   └── prisma/           # Database schema + migrations
│
├── web/                  # Web frontend (React + Vite)
│   ├── src/
│   │   ├── components/   # UI components (Bloomberg + shadcn)
│   │   ├── pages/        # Page components (Login, Dashboard, etc.)
│   │   ├── hooks/        # Custom hooks (useAuth, useBank)
│   │   └── lib/          # API client, stores, utils
│
├── packages/
│   └── shared/           # ts-rest contract + Zod schemas
│
├── docs/                 # ALL documentation (see above)
│   ├── TODO.md
│   ├── BUGS.md
│   ├── architecture.md
│   ├── game-design.md
│   ├── web-patterns.md
│   ├── wireframes.md
│   └── tests/
│
├── CLAUDE.md             # This file (navigation guide)
├── flake.nix             # Nix development environment
└── pnpm-workspace.yaml   # pnpm workspace config
```

---

## What to Work On

See `docs/TODO.md` for current priorities and backlog. Always check there first for what needs to be done.

For bugs and issues, see `docs/BUGS.md`.

For game design questions, see `docs/game-design.md`.

For technical architecture questions, see `docs/architecture.md`.
