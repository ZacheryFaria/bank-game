# Bank Management Game

A multiplayer idle game where you manage a financial institution. Set interest rates, manage risk exposure, and grow your bank over time.

## Status

### Phase: Core Backend Complete - TUI Development

The project has implemented:
- Backend: Node.js 24 + Fastify + TypeScript + Prisma + ts-rest
- TUI: Terminal user interface with Ink
- Development environment managed via Nix flake
- Comprehensive game engine with collection simulation
- Authentication system with JWT tokens
- Database schema with PostgreSQL

## Core Concept

- Idle game mechanics (collect button calculates time delta)
- Compete with other players for market share
- Balance risk vs reward through rate setting and portfolio allocation
- Spreadsheet-heavy UI (income statements, balance sheets, portfolio breakdowns)

## Documentation

- [Architecture](docs/architecture.md) - API endpoints, database schema, deployment
- [Game Design](docs/game-design.md) - Game mechanics and formulas
- [TUI Patterns](docs/tui-patterns.md) - Terminal UI implementation patterns
- [Wireframes](docs/wireframes.md) - UI/UX wireframes
- [Test Strategy](docs/tests/test-strategy.md) - Testing approach
- [TODO](docs/TODO.md) - Current priorities
- [BUGS](docs/BUGS.md) - Known issues

## Development Setup

This project uses Nix for a reproducible development environment.

### Prerequisites

- Nix (with flakes enabled)
- direnv (recommended)

### Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd bank-game

# Load the Nix environment
direnv allow  # Or: nix develop

# Copy environment file and configure database
cp backend/.env.example backend/.env
# Edit backend/.env and set DATABASE_URL, JWT_SECRET, REFRESH_TOKEN_SECRET

# Install dependencies and run migrations
cd backend
pnpm install
pnpm prisma:migrate

# Start backend server
pnpm dev  # Runs on http://localhost:3001

# Run tests
pnpm test
```

### Project Structure

```text
bank-game/
├── backend/               # Fastify API server
│   ├── src/
│   │   ├── engine/        # Pure game logic functions
│   │   ├── logic/         # Business logic layer
│   │   ├── routes/        # API endpoints (ts-rest)
│   │   ├── lib/           # Utilities (db, auth, config)
│   │   └── __tests__/     # Test suite
│   ├── prisma/            # Database schema
│   └── config.yml         # Game configuration
├── packages/shared/       # ts-rest contract + Zod schemas
├── tui/                   # Terminal user interface
├── web/                   # Web frontend (React + Vite)
└── docs/                  # Documentation
```

## Development Status

### Completed
- [x] Core gameplay loop design
- [x] Math & formulas design
- [x] Prisma schema implementation
- [x] Game engine implementation (CollectionSimulator, DemandCalculator, InterestCalculator, DefaultRoller)
- [x] API endpoints implementation (auth, bank management, collection, market data)
- [x] Authentication system with JWT tokens
- [x] Testing infrastructure with Vitest
- [x] ts-rest contract for type-safe API

### In Progress
- [ ] TUI implementation (Ink-based terminal interface)
- [ ] Web frontend (React + Bloomberg Terminal UI theme)
- [ ] Financial statements generation
- [ ] Expanding test coverage for edge cases and error handling

See [docs/TODO.md](docs/TODO.md) for detailed task list.
