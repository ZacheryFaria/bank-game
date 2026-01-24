# CLAUDE.md

Bank Game - multiplayer idle game where players manage financial institutions.

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start PostgreSQL
docker-compose up -d

# Backend setup
cd backend
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev                 # Runs on :3001

# TUI (Terminal Interface)
cd tui
pnpm dev                 # Connects to :3001

# Web Frontend
cd frontend
pnpm dev                 # Runs on :5173, proxies API to :3001
```

---

## Testing & Validation

**Validate changes before committing:**

```bash
# Type checking (fast - always run first)
pnpm type-check              # Check all packages
cd backend && pnpm type-check
cd tui && pnpm type-check

# Run tests
cd tui && pnpm test          # Run TUI tests once
cd tui && pnpm test:watch    # Run in watch mode
cd tui && pnpm test:ui       # Open test UI in browser

# Linting & formatting
pnpm lint                    # Check linting
pnpm format                  # Auto-format code
```

**Quick validation workflow:**
```bash
# Before committing TUI changes
cd tui
pnpm type-check && pnpm test && pnpm lint

# Before committing backend changes
cd backend
pnpm type-check && pnpm lint
```

**Note:** `pnpm build` also type-checks but is slower. Use `pnpm type-check` for faster feedback during development.

---

## Documentation Structure

**ALL documentation lives in `/docs/` - never create docs elsewhere.**

### Work & Planning
- **`docs/TODO.md`** - Current priorities, next steps, backlog (single source of truth for what to work on)
- **`docs/BUGS.md`** - Known issues and tech debt

### Technical Reference
- **`docs/architecture.md`** - Database schema, API endpoints, backend structure, collection flow
- **`docs/game-design.md`** - Game mechanics, formulas, balance, multiplayer, deferred features
- **`docs/tui-patterns.md`** - TUI implementation patterns, keybindings, ts-rest integration
- **`docs/wireframes.md`** - UI/UX wireframes for all screens

### Testing
- **`docs/tests/test-strategy.md`** - Testing approach and priorities
- **`docs/tests/auth-tests.md`** - Detailed auth test cases
- **`docs/tests/collection-tests.md`** - Detailed collection test cases

---

## Tech Stack

**Backend:** Node.js 24 (LTS) + Fastify + TypeScript, Prisma ORM, ts-rest + Zod validation, PostgreSQL

**TUI:** Ink (React for CLIs) + TypeScript, ts-rest client, TanStack Query, Zustand, vim-like keybindings

**Web Frontend:** React 19 + Vite + TypeScript, Tailwind + shadcn/ui, TanStack Query + Table, Zustand

**Shared:** ts-rest contract + Zod schemas (full type safety across stack)

**Package Manager:** pnpm (workspace: backend, frontend, tui, packages/shared)

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
// TUI gets full TypeScript autocomplete and type checking
```

### Adding a New API Endpoint

1. **Define in contract first** (`packages/shared/src/contract.ts`)
2. **Implement business logic** (`backend/src/logic/`)
3. **Wire up thin handler** (`backend/src/routes/api.ts`)
4. **Use in TUI** with full type safety via ts-rest client

See `docs/tui-patterns.md` for detailed examples.

### Adding a New TUI Screen

1. **Create component** (`tui/src/components/`)
2. **Add keybindings** (`tui/src/hooks/useKeyBindings.ts`)
3. **Wire up in App.tsx** router
4. **Use ts-rest client** for type-safe API calls

See `docs/tui-patterns.md` for detailed examples.

---

## Key Concepts

**Game Engine** (`backend/src/engine/`): Pure functions with no side effects - CollectionSimulator, DemandCalculator, DefaultRoller, InterestCalculator. Use seeded randomness for deterministic results.

**Loan Buckets**: Loans stored as hourly aggregates (not individual loans) to track aging without excessive data. See `loan_buckets` table in `docs/architecture.md`.

**Transaction Ledger**: All financial changes recorded as transactions - this is the source of truth. Financial reports derived from transaction queries.

**Collection Flow**: Core game mechanic. Rate limited to 1/minute. Calculates elapsed time (max 24 hours), simulates game time, records transactions, updates denormalized balances.

**Time Model**: 1 real hour = 1 game quarter. Max 24 hours idle = 6 game years per collection.

**Keybindings** (`tui/src/hooks/useKeyBindings.ts`): Centralized vim-like keybinding system. Context-aware (auth, dashboard, menu). Global command mode (`:q`, `:logout`).

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
├── tui/                  # Terminal interface (Ink)
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks (useKeyBindings)
│   │   └── lib/          # API client, Zustand store
│
├── frontend/             # Web interface (React + Vite)
│   └── src/
│       ├── components/   # UI components (shadcn/ui)
│       └── pages/        # Route pages
│
├── packages/
│   └── shared/           # ts-rest contract + Zod schemas
│
├── docs/                 # ALL documentation (see above)
│   ├── TODO.md
│   ├── BUGS.md
│   ├── architecture.md
│   ├── game-design.md
│   ├── tui-patterns.md
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
