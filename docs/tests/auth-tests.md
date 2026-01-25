# Auth Test Cases

**Status: ✅ 12/12 API Integration Tests Passing** (see `backend/src/__tests__/auth.test.ts`)

## Next Steps for Backend Auth Testing

### Priority 1: Complete Basic Coverage
1. **JWT Middleware Tests** - Test protected route authentication
   - Access without token, invalid token, expired token
   - Verify user and bank are populated in request
   - Test deleted user rejection

2. **Validation Tests** - Test input validation edge cases
   - Invalid email formats
   - Password length constraints
   - Bank name length limits
   - Special characters in fields

### Priority 2: Security & Edge Cases
3. **Token Expiration Tests** - Mock time to test token lifecycle
   - Access token expiration (7 days)
   - Refresh token expiration (30 days)
   - Proper rejection of expired tokens

4. **Security Tests**
   - JWT tampering (signature verification)
   - HMAC-SHA256 refresh token hashing validation
   - Concurrent login behavior

5. **Edge Cases**
   - Very long emails (255 chars max)
   - Unicode in bank names
   - Concurrent refresh attempts

### Priority 3: Move to Collection Tests
After completing auth coverage, move to collection API tests (see `collection-tests.md`)

---

## Registration Tests

### Happy Path
- [x] Register new user with valid email, password, and bank name
  - Should return `{ token, refreshToken, user }`
  - User should have bank created with market rates and equal allocation
  - Both tokens should be valid JWTs
  - Initial transaction created for starting equity

### Error Cases
- [x] Register with duplicate email → 400 "Email already registered"
- [x] Register with missing email → 400 validation error
- [x] Register with missing password → 400 validation error
- [x] Register with missing bank name → 400 validation error
- [ ] Register with invalid email format → 400 validation error
- [ ] Register with password < 8 chars → 400 validation error
- [ ] Register with bank name > 100 chars → 400 validation error

---

## Login Tests

### Happy Path
- [x] Login with valid credentials
  - Should return `{ token, refreshToken, user }`
  - Should include user's bank data
  - Both tokens should be valid JWTs
- [ ] Login invalidates previous refresh token
  - Old refresh token should fail after new login

### Error Cases
- [x] Login with non-existent email → 401 "Invalid credentials"
- [x] Login with wrong password → 401 "Invalid credentials"
- [ ] Login with invalid email format → 400 validation error
- [ ] Login with missing password → 400 validation error

---

## Refresh Token Tests

### Happy Path
- [x] Refresh with valid refresh token
  - Should return new `{ token, refreshToken }`
  - New access token should be valid
  - New refresh token should be valid
  - Tokens have different timestamps (iat)
- [x] Token rotation: old refresh token becomes invalid
  - Using old refresh token after refresh → 401 error
  - New refresh token should work
  - **Note**: Fixed bcrypt 72-byte limit bug by switching to HMAC-SHA256

### Error Cases
- [x] Refresh with invalid refresh token → 401 "Invalid refresh token"
- [x] Refresh for deleted user → 401 "Invalid refresh token"
- [ ] Refresh with expired refresh token → 401 "Invalid or expired refresh token"
- [ ] Refresh with access token instead of refresh token → 401
- [ ] Refresh with malformed token → 401
- [ ] Refresh with missing token → 400 validation error

---

## JWT Middleware Tests

### Protected Routes
- [ ] Access protected route without Authorization header → 401
- [ ] Access protected route with malformed header (no "Bearer ") → 401
- [ ] Access protected route with invalid JWT → 401
- [ ] Access protected route with expired JWT → 401
- [ ] Access protected route with valid JWT → Success
  - `request.user` should be populated
  - `request.bank` should be populated

### Token Validation
- [ ] Middleware properly extracts user and bank from database
- [ ] Middleware rejects user without bank → 401
- [ ] Middleware rejects deleted/non-existent user → 401

---

## Integration Tests

### Full Auth Flow
- [ ] Register → Login → Use access token → Refresh → Use new access token
- [ ] Register → Use access token immediately (from registration response)
- [ ] Multiple users can register and login independently
- [ ] Each user can only access their own bank data via protected routes

### Token Lifecycle
- [ ] Access token expires after 7 days (test with mocked time)
- [ ] Refresh token expires after 30 days (test with mocked time)
- [ ] Refresh token rotation invalidates old tokens immediately

---

## Security Tests

### Hash Verification
- [ ] Passwords are hashed in database (not stored as plaintext)
- [ ] Refresh tokens are hashed in database (not stored as plaintext)
- [ ] Different users have different hashes for same password
- [ ] Same user gets different refresh token hash on each login

### JWT Security
- [ ] JWT cannot be modified without invalidating signature
- [ ] JWT contains userId and email in payload
- [ ] Expired JWTs are rejected
- [ ] JWTs signed with different secret are rejected

---

## Edge Cases

- [ ] Register user, delete refresh token from DB, try to refresh → 401
- [ ] Concurrent logins from same user (last login wins, previous refresh tokens invalid)
- [ ] Very long email (255 chars) → Should work (db allows VarChar(255))
- [ ] Email with special characters → Should work if valid email format
- [ ] Unicode characters in bank name → Should work
