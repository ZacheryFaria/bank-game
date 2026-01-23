# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A multiplayer idle game where players manage financial institutions. Players set interest rates, manage risk exposure through portfolio allocation, and grow their bank over time. Currently in **design/pre-implementation phase**.

## Project Status

No code has been written yet. The `design/` folder contains comprehensive design documents that should be followed during implementation:

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

## Development Commands (Once Implemented)

```bash
# Backend
cd backend
pnpm install
pnpm prisma migrate dev
pnpm dev                 # Runs on :3001

# Frontend
cd frontend
pnpm install
pnpm dev                 # Runs on :5173, proxies API to :3001

# Database (development via Nix, production via Docker)
# PostgreSQL runs on :5432
```

## Key Architecture Concepts

**Game Engine** (`backend/src/engine/`): Pure functions with no side effects for game logic - CollectionSimulator, DemandCalculator, DefaultRoller, InterestCalculator. Use seeded randomness for deterministic default rolls.

**Loan Buckets**: Loans are stored as hourly aggregates (not individual loans) to track aging without excessive data. See `loan_buckets` table in architecture.md.

**Transaction Ledger**: All financial changes recorded as transactions - this is the source of truth. Financial reports are derived from transaction queries.

**Collection Flow**: The core game action. Rate limited to 1/minute. Calculates elapsed time (max 24 hours), simulates game time, records transactions, updates denormalized balances.

**Time Model**: 1 real hour = 1 game quarter. Max 24 hours idle = 6 game years per collection.
