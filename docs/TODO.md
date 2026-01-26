# TODO

Work priorities and backlog for the bank-game project.

---

## Current Work

### TUI UX Improvements (In Progress)

Based on user testing feedback (2026-01-23):

**1. Fix Vim Keybinding Modality**
- [ ] Add `inputMode` state to track when user is in text input
- [ ] Disable `useKeyBindings` hook when `inputMode === true`
- [ ] Require Esc to exit input fields before vim keybindings work
- [ ] Add visual feedback (border color) to show input focus state
- [ ] Add "Press Esc to exit" hint near active inputs
- Files: `tui/src/hooks/useKeyBindings.ts`, `LoginScreen.tsx`, `RegisterScreen.tsx`

**2. Add Visual Borders and Structure**
- [ ] Create reusable `<Section>` component with borders (`tui/src/components/ui/Section.tsx`)
- [ ] Create `<InputBox>` component for bordered text inputs
- [ ] Add outer screen container border with title bar
- [ ] Wrap dashboard sections in bordered boxes (Financials, Rates, Collection Status)
- [ ] Add distinct command mode bar at bottom
- [ ] Use `borderColor` prop for active/inactive states

**3. Input Field UX**
- [ ] Add placeholder text in inputs
- [ ] Show character count for password fields
- [ ] Display validation errors inline (red text below input)
- [ ] Add help text: "Esc to exit input | Enter to submit"
- [ ] Show "typing mode" indicator (like vim's `-- INSERT --`)

**4. Command Mode Improvements**
- [ ] Always show command bar at bottom (even when inactive)
- [ ] Show available commands when not in command mode: `[c] collect | [:logout] logout | [:q] quit`
- [ ] Add command history (↑/↓ to navigate)
- [ ] Add tab completion for commands
- [ ] Improve visual distinction of command bar

---

## High Priority

### Backend

- [ ] **Apply Decimal Helper to Bank Logic** - Use `convertBankDecimals()` in all bank endpoints
- [ ] **Quarterly Snapshots** - Implement snapshot generation from transaction ledger
- [ ] **Wrap Rate Upserts in Transaction** - Make rate updates atomic in `logic/bank.ts updateBankRates`
- [ ] **Wrap Allocation Upserts in Transaction** - Make allocation updates atomic in `logic/bank.ts updateBankAllocation`
- [ ] **Implement Time Multiplier** - Integrate `time.multiplier` config into CollectionSimulator's time calculations so it actually affects game speed. Currently defined in config but unused. See `backend/src/engine/CollectionSimulator.ts:63` and `docs/configuration.md`

### TUI

- [ ] **Token Persistence** - Save JWT to `~/.bank-game/token` file instead of clearing on restart
- [ ] **Auto-refresh Token** - Refresh token before expiration automatically
- [ ] **Rate Editor Screen** - Interactive rate adjustment with h/l keys, visual bar chart vs market rates
- [ ] **Portfolio Allocation Screen** - Adjust risk class allocations with visual sliders
- [ ] **Help Screen** - Press `?` to view all keybindings organized by context

### Testing

See `docs/tests/test-strategy.md` for full test plan.

- [ ] **Backend Unit Tests** - Test `logic/auth.ts` and `logic/bank.ts` business logic
- [ ] **Engine Tests** - CollectionSimulator, DemandCalculator, DefaultRoller, InterestCalculator
- [ ] **Contract Validation Tests** - Verify all route responses match ts-rest contract schemas
- [ ] **TUI Component Tests** - LoginScreen, RegisterScreen, Dashboard (using ink-testing-library)
- [ ] **Integration Tests** - Full auth flow, collection flow, multi-user scenarios
- [ ] **E2E Tests** - Register → Collect → Update Rates → Collect

### Infrastructure

- [ ] **CI/CD Pipeline** - Run tests on every commit, block merge if tests fail

---

## Medium Priority

### TUI Features

- [ ] **Settings Screen** - Configure auto-collect interval, API URL, color theme
- [ ] **Collection History** - View past collections with equity growth chart (ASCII art)
- [ ] **Notifications System** - Toast-style notifications for collection success, errors
- [ ] **Dashboard Customization** - Reorder widgets, hide/show sections, save preferences
- [ ] **Background Collection** - Auto-collect every N minutes with visual indicator

---

## Low Priority

### Web Frontend

- [ ] **ts-rest Integration** - Add ts-rest client following TUI pattern (`frontend/src/lib/api.ts`)
- [ ] **Auth Flow** - Login/register screens, protected routes
- [ ] **Dashboard Screen** - Implement main game screen from `docs/wireframes.md`
- [ ] **API Integration** - Set up TanStack Query, connect to backend
- [ ] **Routing** - Configure react-router with screens from wireframes
- [ ] **State Management** - Set up Zustand stores for auth and game state

### Backend Improvements

- [ ] **Database Indexes** - Add indexes on `bankId`, `userId`, `collectedAt` for performance
- [ ] **Error Response Format** - Standardize error responses with error codes
- [ ] **Request ID Tracking** - Add request IDs for debugging
- [ ] **Health Check Endpoint** - Add `/health` with database status
- [ ] **Structured Logging** - Switch to JSON logs for production

### TUI Features (Deferred)

- [ ] **Transaction History Viewer** - Scrollable list with j/k navigation, filter with `/`, export to CSV
- [ ] **Leaderboard Screen** - View top banks, navigate with j/k, press Enter to view details
- [ ] **Bank Details Screen** - View other banks' public data, compare rates side-by-side

### Infrastructure

- [ ] **OAuth Providers** - Add Google OAuth support
- [ ] **Magic Link Auth** - Implement passwordless email login
- [ ] **Dockerfile for Backend** - Containerize backend application
- [ ] **docker-compose Full Stack** - Single command to run entire stack
- [ ] **Systemd Service** - Create service file for backend deployment

### TUI Polish

- [ ] **Color Scheme** - Positive values in green, negative in red, warnings in yellow
- [ ] **Improved Formatting** - Better currency formatting, human-readable timestamps
- [ ] **Progress Indicators** - Show progress bars for collection cooldown
- [ ] **Animation** - Number counter animations, smooth transitions

### Observability

- [ ] **Metrics** - Add Prometheus/OpenTelemetry metrics
- [ ] **Distributed Tracing** - Track requests across services
- [ ] **Error Tracking** - Integrate Sentry for error monitoring
- [ ] **Performance Monitoring** - Track API response times, collection simulation time

---

## Tech Debt

### Backend

- [ ] Add input sanitization for bank names

### TUI

- [ ] Extract magic numbers to constants
- [ ] Fix duplicate polling in Dashboard (remove setInterval, use only refetchInterval from TanStack Query)
- [ ] Type `key` parameter properly in useKeyBindings (use Ink's Key type instead of any)
- [ ] Extract shared auth form components (LoginScreen/RegisterScreen share structure)
- [ ] Fix password validation inconsistency in RegisterScreen

### Build System

- [ ] Add pre-commit hooks (lint, format, type-check)
- [ ] Optimize parallel builds

---

## Ideas / Future Features

### Advanced TUI Features

- [ ] ASCII charts (equity over time, loan composition pie chart)
- [ ] Export/import strategies (save rate/allocation configs as YAML)

### Gameplay Enhancements

See `docs/game-design.md` "Deferred Features" section for details.

- [ ] Dynamic market rates (derived from aggregate player behavior)
- [ ] Zero-sum demand pool (true competition for fixed demand)
- [ ] Interbank lending (player-to-player loans)
- [ ] Systemic contagion (bank failures affect others)
- [ ] Prestige system (reset at $100M with permanent bonuses)
- [ ] Economic events (Fed rate changes, recessions, housing bubbles)

### Platform Expansion

- [ ] Electron desktop wrapper for TUI
