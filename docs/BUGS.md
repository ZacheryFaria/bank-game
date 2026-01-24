# Known Issues

Tracked bugs and issues in the bank-game project.

---

## Critical

**Deposit Bucket Interest Not Accruing**
- **Issue**: During collection, existing deposit buckets are not updated with accrued interest
- **Impact**: Deposit balances don't compound correctly over multiple collections
- **Expected**: $10,000 deposit at 3% APR for 1 quarter should become $10,075
- **Actual**: Balance stays at $10,000, only new deposits are created
- **Fix**: Update deposit bucket balances in `CollectionSimulator` or `collectBank` logic
- **Files**: `backend/src/engine/CollectionSimulator.ts`, `backend/src/logic/bank.ts`

---

## High Priority

**No Auto-refresh for Expiring Tokens**
- **Issue**: Access tokens expire after 7 days with no automatic refresh
- **Expected**: TUI should auto-refresh token before expiration using refresh token
- **Impact**: Users get logged out unexpectedly
- **Fix**: Add token expiration check and auto-refresh logic
- **Files**: `tui/src/lib/api.ts`

**Missing Error Boundary in TUI**
- **Issue**: Uncaught errors crash the entire TUI with no recovery
- **Expected**: Error boundary should catch errors and show recovery options
- **Impact**: Poor UX, requires full restart
- **Fix**: Add React error boundary component
- **Files**: `tui/src/App.tsx`

**banks.ts and market.ts Not Migrated to ts-rest**
- **Issue**: Still using old route pattern, not integrated with ts-rest contract
- **Impact**: Missing type safety, inconsistent API patterns
- **Fix**: Migrate to ts-rest following pattern in `routes/api.ts`
- **Files**: `backend/src/routes/banks.ts`, `backend/src/routes/market.ts`

**No Client-Side Error Logging**
- **Issue**: TUI errors not logged, making debugging difficult
- **Expected**: Log client errors to `~/.bank-game/errors.log` or similar
- **Impact**: Hard to diagnose issues in production
- **Fix**: Add error logging utility that writes to user's home directory
- **Files**: `tui/src/lib/` (new errorLogger.ts)

---

## Medium Priority

**No Server Health Status Indicator**
- **Issue**: TUI doesn't show server connection/health status
- **Expected**: Visual indicator showing server status (connected, disconnected, error)
- **Impact**: Users don't know if issues are client or server side
- **Fix**: Poll `/health` endpoint and display status symbol in TUI
- **Files**: `tui/src/components/Dashboard.tsx` or status bar component

**Missing Development Fixtures**
- **Issue**: No default test data for development
- **Expected**: Pre-populate database with test user on dev server startup
  - User: `dead@beef.com`
  - Password: `deadbeef`
  - Bank: `Beef Bank`
- **Impact**: Tedious to manually create test account for every dev session
- **Fix**: Create seed script or dev-only startup logic
- **Files**: `backend/prisma/seed.ts` or `backend/src/server.ts`

**Generic Error Messages**
- **Issue**: Backend returns "Internal server error" without details
- **Expected**: Structured error responses with error codes and helpful messages
- **Impact**: Hard to debug issues for users and developers
- **Fix**: Standardize error response format with codes and context

**No Retry Logic for Failed Requests**
- **Issue**: TUI doesn't retry failed API calls
- **Expected**: Exponential backoff retry for transient network errors
- **Impact**: Users see errors that could self-resolve
- **Fix**: Add retry logic with exponential backoff
- **Files**: `tui/src/lib/api.ts`

**No Loading State During Initial Fetch**
- **Issue**: Dashboard shows empty/stale data while loading
- **Expected**: Spinner or skeleton UI during initial load
- **Impact**: Confusing UX
- **Fix**: Check `isLoading` state and render spinner
- **Files**: `tui/src/components/Dashboard.tsx`

**Transaction Atomicity Issues**
- **Issue**: Rate and allocation updates use multiple upserts without transactions
- **Expected**: Wrap in database transaction for atomicity
- **Impact**: Partial updates possible if operation fails mid-way
- **Fix**: Use Prisma `$transaction` in business logic
- **Files**: `backend/src/logic/bank.ts` (`updateBankRates`, `updateBankAllocation`)

**Quarterly Snapshots Not Generated**
- **Issue**: Schema exists but no logic to generate snapshots from transaction ledger
- **Expected**: Scheduled task to create quarterly financial snapshots
- **Impact**: No historical performance tracking
- **Fix**: Implement snapshot generation cron job or on-collection logic
- **Files**: New file or `backend/src/logic/bank.ts`

---

## Low Priority / Polish

**Input Handling Limitations**
- No Ctrl+W to delete word in text inputs
- No clipboard paste support
- Arrow keys not handled in text inputs

**Visual Polish Issues**
- No colors for positive/negative equity changes
- Timestamps show raw ISO strings, not human-readable
- Currency formatting could be improved (e.g., $1,234,567.89 vs $1234567.89)
- No ASCII art/logo on TUI startup

**Duplicate Polling in Dashboard**
- **Issue**: Dashboard uses both `setInterval` and TanStack Query's `refetchInterval`
- **Expected**: Use only TanStack Query's built-in refetch
- **Impact**: Unnecessary duplicate requests
- **Fix**: Remove manual `setInterval`, rely on `refetchInterval` option
- **Files**: `tui/src/components/Dashboard.tsx`

**Missing Context Handler in useKeyBindings**
- **Issue**: `KeyBindingContext` type includes "menu" but it's not handled
- **Expected**: Either implement menu context or remove from type
- **Impact**: Type confusion
- **Files**: `tui/src/hooks/useKeyBindings.ts`

**Password Validation Inconsistency**
- **Issue**: RegisterScreen validates trimmed password length inconsistently
- **Expected**: Consistent validation (either always trim or never trim)
- **Impact**: Minor UX inconsistency
- **Files**: `tui/src/components/RegisterScreen.tsx`

---

## Security Concerns

**No Rate Limiting on Auth Endpoints**
- **Issue**: No protection against brute force attacks on login
- **Expected**: Rate limiting on `/auth/login` and `/auth/register`
- **Impact**: Vulnerable to brute force
- **Fix**: Add rate limiting middleware (e.g., `fastify-rate-limit`)

**No HTTPS Enforcement**
- **Issue**: Backend doesn't enforce HTTPS in production
- **Expected**: Redirect HTTP to HTTPS or reject HTTP entirely
- **Impact**: Credentials could be intercepted
- **Fix**: Add HTTPS redirect or configure reverse proxy (nginx)

**No Input Sanitization**
- **Issue**: Bank names and other user input not sanitized
- **Expected**: Sanitize/validate all user input
- **Impact**: Potential XSS or injection issues
- **Fix**: Add input sanitization in business logic

**Missing Security Headers**
- **Issue**: No security headers (CSP, X-Frame-Options, etc.)
- **Expected**: Use Helmet.js or similar for security headers
- **Impact**: Vulnerable to various web attacks
- **Fix**: Add `@fastify/helmet` middleware

---

## Performance Issues

**No Database Indexes**
- **Issue**: No indexes on frequently queried fields (bankId, userId, collectedAt)
- **Expected**: Add indexes for common query patterns
- **Impact**: Slow queries as data grows
- **Fix**: Add Prisma schema indexes

**No Query Logging**
- **Issue**: Can't identify slow database queries
- **Expected**: Log slow queries for optimization
- **Impact**: Hard to identify performance bottlenecks
- **Fix**: Enable Prisma query logging in development
