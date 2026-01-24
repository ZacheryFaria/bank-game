# Known Issues and Improvements

## Known Issues

### Backend

**Auth Middleware**
- [ ] auth middleware exists but may not be correctly handling all edge cases
- [ ] Need to verify JWT expiration handling
- [ ] Refresh token rotation not fully tested

**Collection Flow**
- [ ] Deposit bucket interest updates not implemented (mentioned in CLAUDE.md)
- [ ] Need to verify transaction ledger accuracy
- [ ] Operating expenses calculation may need review

**Quarterly Snapshots**
- [ ] Schema exists but generation logic not implemented
- [ ] Need cron job or scheduled task to generate snapshots
- [ ] Determine snapshot retention policy

**Error Handling**
- [ ] Generic "Internal server error" messages don't help debugging
- [ ] Need structured error responses with error codes
- [ ] Add request ID tracking for debugging

### TUI

**Authentication**
- [ ] No token persistence (clears on app restart)
- [ ] Need to save token to file or config
- [ ] Auto-refresh token before expiration not implemented

**Dashboard**
- [ ] No loading state during initial fetch
- [ ] Error boundary for uncaught errors
- [ ] No retry mechanism on failed requests

**Input Handling**
- [ ] Text input doesn't support Ctrl+W to delete word
- [ ] No clipboard paste support
- [ ] Arrow keys in text input not handled

**Visual Polish**
- [ ] No colors for positive/negative equity changes
- [ ] Timestamps show raw ISO strings, not human-readable
- [ ] Currency formatting could be improved
- [ ] No ASCII art/logo on startup

## Improvements

### Backend Architecture

**Database Optimization**
- [ ] Add indexes on frequently queried fields (bankId, userId, collectedAt)
- [ ] Consider partitioning transactions table by date
- [ ] Add database query logging to identify slow queries

**API Response Format**
- [ ] Add pagination to transaction history
- [ ] Add filtering/sorting to leaderboard
- [ ] Include metadata (request ID, server time) in responses

**Observability**
- [ ] Add structured logging (JSON logs)
- [ ] Add metrics (Prometheus/OpenTelemetry)
- [ ] Add distributed tracing
- [ ] Add health check endpoint with DB status

**Caching**
- [ ] Cache market rates (changes infrequently)
- [ ] Cache leaderboard (update every minute)
- [ ] Add Redis for distributed caching

### TUI Architecture

**State Management**
- [ ] Persist auth token to filesystem (~/.bank-game/token)
- [ ] Add state persistence for preferences
- [ ] Implement optimistic updates for better UX

**Networking**
- [ ] Add retry logic with exponential backoff
- [ ] Show network status indicator
- [ ] Queue mutations when offline, retry when back online

**Performance**
- [ ] Debounce rapid keybindings (j/k spam)
- [ ] Virtualize long lists (1000+ transactions)
- [ ] Lazy load components (code splitting)

**UX Improvements**
- [ ] Add sound effects (terminal bell on collect)
- [ ] Add progress indicators for long operations
- [ ] Add confirmation dialogs for destructive actions
- [ ] Show keyboard shortcuts in help overlay

**Developer Experience**
- [ ] Add TUI-specific logging (debug mode)
- [ ] Add performance profiling mode
- [ ] Add mock API mode for offline development

### Cross-Cutting

**Type Safety**
- [ ] Ensure all Prisma Decimal fields are correctly converted to numbers
- [ ] Add runtime validation for environment variables
- [ ] Strict null checks for all optional fields

**Documentation**
- [ ] Add JSDoc comments to all exported functions
- [ ] Generate API documentation from ts-rest contract
- [ ] Add inline help in TUI (? key)

**Deployment**
- [ ] Create Dockerfile for backend
- [ ] Create docker-compose for full stack
- [ ] Add health checks to containers
- [ ] Create systemd service for backend

**Monitoring**
- [ ] Add error tracking (Sentry)
- [ ] Add uptime monitoring
- [ ] Alert on high error rates

## Tech Debt

### Backend
- [ ] Remove old auth.ts and bank.ts route files (replaced by api.ts)
- [ ] Standardize error response format across all endpoints
- [ ] Extract constants to environment variables
- [ ] Add input sanitization for bank names
- [ ] Wrap rate upserts in transaction for atomicity (logic/bank.ts updateBankRates)
- [ ] Wrap allocation upserts in transaction for atomicity (logic/bank.ts updateBankAllocation)
- [ ] Ensure refresh token hash update is atomic with user creation (logic/auth.ts)
- [ ] Fix markdown linting in TESTING_PLAN.md (use headings instead of bold labels)

### TUI
- [ ] Extract magic numbers to constants
- [ ] Create reusable UI components (Box with border, StatusBar, etc.)
- [ ] Standardize error handling across components
- [x] TypeScript strict mode enabled (tui/tsconfig.json)
- [ ] Fix duplicate polling in Dashboard (remove setInterval, use only refetchInterval)
- [ ] DRY: Extract shared header configuration in api.ts
- [ ] Handle "menu" context in useKeyBindings or remove from KeyBindingContext type
- [ ] Type `key` parameter properly in useKeyBindings (use Ink's Key type instead of any)
- [ ] Extract shared auth form components (LoginScreen/RegisterScreen share structure)
- [ ] Fix password validation in RegisterScreen (validate trimmed length consistently)

### Build System
- [ ] Optimize build times (parallel builds)
- [ ] Add watch mode for shared package
- [ ] Add pre-commit hooks (lint, format, type-check)
- [ ] Add bundle size monitoring

## Feature Parity with Web Frontend

Currently the web frontend is minimal, but as it grows:
- [ ] Ensure TUI and web have feature parity
- [ ] Share business logic validation (import from shared package)
- [ ] Coordinate UX patterns between TUI and web
- [ ] Allow seamless switching between interfaces

## Accessibility

### TUI
- [ ] Test with screen readers (terminal compatibility)
- [ ] Ensure high contrast mode works
- [ ] Add audio cues option for important events
- [ ] Support alternative keybindings for accessibility

## Security Hardening

- [ ] Rate limiting on auth endpoints (prevent brute force)
- [ ] HTTPS enforcement in production
- [ ] Helmet.js for security headers
- [ ] Input validation for all user-supplied data
- [ ] Audit dependencies for vulnerabilities
- [ ] Implement CSP for web frontend
- [ ] Add CORS whitelist in production

## Performance Monitoring

- [ ] Track API response times
- [ ] Track collection simulation time
- [ ] Track database query performance
- [ ] Track TUI render performance
- [ ] Set up SLO/SLA monitoring
