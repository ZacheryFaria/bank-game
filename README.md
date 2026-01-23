# Bank Management Game

A multiplayer idle game where you manage a financial institution. Set interest rates, manage risk exposure, and grow your bank over time.

## Status

**Phase: Bootstrap Complete - Ready for Development**

The project structure has been set up with:
- Backend: Node.js 24 + Fastify + TypeScript + Prisma
- Frontend: React 19 + Vite + TypeScript + Tailwind CSS
- Development environment managed via Nix flake

## Core Concept

- Idle game mechanics (collect button calculates time delta)
- Compete with other players for market share
- Balance risk vs reward through rate setting and portfolio allocation
- Spreadsheet-heavy UI (income statements, balance sheets, portfolio breakdowns)

## Design Documents

- [Core Gameplay Loop](design/core-gameplay-loop.md)
- [Math & Formulas](design/math-and-formulas.md)
- [Balance & Pacing](design/balance-and-pacing.md)
- [Multiplayer](design/multiplayer.md)
- [Architecture](design/architecture.md)
- [Tech Stack](design/tech-stack.md)
- [Wireframes](design/wireframes.md)
- [Backlog](design/backlog.md)

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

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start backend (terminal 1)
cd backend
pnpm install
pnpm dev  # Runs on http://localhost:3001

# Start frontend (terminal 2)
cd frontend
pnpm install
pnpm dev  # Runs on http://localhost:5173
```

### Project Structure

```
bank-game/
├── backend/           # Fastify API server
│   ├── src/
│   │   ├── engine/    # Pure game logic functions
│   │   ├── routes/    # API endpoints
│   │   ├── services/  # Business logic
│   │   └── server.ts  # Server entry point
│   └── prisma/        # Database schema (to be added)
├── frontend/          # React SPA
│   └── src/
│       ├── components/ # React components
│       ├── lib/       # Utilities
│       └── App.tsx    # Main app component
└── design/            # Design documents
```

## Next Steps

- [x] Core gameplay loop design
- [x] Math & formulas design
- [x] Balance & pacing design
- [x] Multiplayer mechanics design
- [x] Technical architecture design
- [x] Tech stack decision
- [x] UI/UX wireframes
- [x] Project bootstrap
- [ ] Prisma schema implementation
- [ ] Game engine implementation
- [ ] API endpoints implementation
- [ ] Frontend UI implementation
