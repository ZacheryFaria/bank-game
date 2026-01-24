# Bank Game TUI

Terminal User Interface for the Bank Game, built with Ink (React for CLIs).

## Features

- **Full type safety** with ts-rest contract shared between backend and TUI
- **Vim-like keybindings** for navigation and actions
- **Real-time updates** with TanStack Query
- **Auth flow** with login/register screens
- **Dashboard** with bank financials and collection

## Installation

```bash
cd tui
pnpm install
```

## Development

```bash
pnpm dev
```

## Keybindings

### Global (Vim-style)

- `:q` or `:quit` - Quit the application
- `:logout` - Logout (when authenticated)
- `Esc` - Cancel current operation

### Auth Screens

- `l` - Switch to login screen
- `r` - Switch to register screen

### Dashboard

- `c` - Trigger collection (rate-limited to 1/min)
- `j` or `↓` - Navigate down (for future menu navigation)
- `k` or `↑` - Navigate up (for future menu navigation)
- `h` or `←` - Navigate left (for future controls)
- `l` or `→` - Navigate right (for future controls)
- `Enter` - Select/confirm (for future interactions)

## Architecture

- **`src/App.tsx`** - Main app router, handles auth state
- **`src/components/`** - UI components (LoginScreen, RegisterScreen, Dashboard)
- **`src/hooks/`** - Custom hooks (useKeyBindings)
- **`src/lib/`** - Utilities
  - `api.ts` - ts-rest client for type-safe API calls
  - `store.ts` - Zustand store for auth state
- **`src/index.tsx`** - Entry point

## Type Safety

All API calls are fully type-safe using the shared ts-rest contract from `@bank-game/shared`. TypeScript will catch any API request/response mismatches at compile time.

## Future Enhancements

- Rate adjustment screen with h/l to increase/decrease
- Portfolio allocation screen with visual sliders
- Transaction history viewer with j/k navigation
- Leaderboard screen
- Search functionality with `/` key
