# Known Issues

Tracked bugs and issues in the bank-game project.

---

## Critical

None currently identified.

---

## High Priority

None currently identified.

---

## Medium Priority

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

**Quarterly Snapshots Not Generated**
- **Issue**: Schema exists but no logic to generate snapshots from transaction ledger
- **Expected**: Scheduled task to create quarterly financial snapshots
- **Impact**: No historical performance tracking
- **Fix**: Implement snapshot generation cron job or on-collection logic
- **Files**: New file or `backend/src/logic/bank.ts`

---

## Low Priority / Polish

**Visual Polish Issues**
- Timestamps show raw ISO strings, not human-readable
- Currency formatting could be improved (e.g., $1,234,567.89 vs $1234567.89)

---

## Security Concerns

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

**No Query Logging**
- **Issue**: Can't identify slow database queries
- **Expected**: Log slow queries for optimization
- **Impact**: Hard to identify performance bottlenecks
- **Fix**: Enable Prisma query logging in development
