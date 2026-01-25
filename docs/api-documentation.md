# Bank Game API Documentation

## Base URL

```
http://localhost:3001
```

## Authentication

Most endpoints require a JWT access token provided in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Tokens expire after 7 days. Use the `/api/auth/refresh` endpoint to obtain a new token.

---

## Rate Limiting

- **Global**: 100 requests per minute per IP
- **Auth endpoints** (`/api/auth/*`): 5 requests per minute per IP

Rate limit responses return `429 Too Many Requests` with a `retryAfter` field indicating seconds until retry.

---

## Endpoints

### Authentication

#### POST /api/auth/register

Register a new user and automatically create their bank.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "bankName": "First National Bank"
}
```

**Validation:**
- `email`: Valid email format
- `password`: Minimum 8 characters
- `bankName`: 1-100 characters

**Success Response (200):**
```json
{
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "bank": {
      "id": "uuid",
      "userId": "uuid",
      "name": "First National Bank",
      "currentEquity": 200000,
      "currentLoans": 0,
      "currentDeposits": 0,
      "lastCollectedAt": "2026-01-24T12:00:00Z",
      "createdAt": "2026-01-24T12:00:00Z"
    }
  }
}
```

**Error Response (400):**
```json
{
  "error": "User with this email already exists"
}
```

---

#### POST /api/auth/login

Authenticate existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "bank": { ... }
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

#### POST /api/auth/refresh

Refresh an expired access token using a refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

**Notes:**
- Refresh tokens are rotated on use (old token invalidated)
- Refresh tokens expire after 30 days

**Error Response (401):**
```json
{
  "error": "Invalid or expired refresh token"
}
```

---

### Bank Management (Protected)

All `/api/bank/*` endpoints require authentication.

#### GET /api/bank

Get your bank's current state with all buckets.

**Success Response (200):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "First National Bank",
  "currentEquity": 205000.50,
  "currentLoans": 150000.00,
  "currentDeposits": 180000.00,
  "lastCollectedAt": "2026-01-24T12:00:00Z",
  "createdAt": "2026-01-24T12:00:00Z",
  "rates": [
    { "product": "mortgage", "rate": 0.065 },
    { "product": "auto", "rate": 0.075 }
  ],
  "allocations": [
    { "riskClass": "prime", "percentage": 0.50 },
    { "riskClass": "near_prime", "percentage": 0.30 }
  ],
  "loanBuckets": [
    {
      "id": "uuid",
      "product": "mortgage",
      "riskClass": "prime",
      "originationHour": "2026-01-24T12:00:00Z",
      "originalPrincipal": 50000.00,
      "currentBalance": 49500.00,
      "interestRate": 0.065,
      "loanCount": 10,
      "activeLoanCount": 10
    }
  ],
  "depositBuckets": [
    {
      "id": "uuid",
      "product": "savings",
      "originationHour": "2026-01-24T12:00:00Z",
      "originalAmount": 30000.00,
      "currentBalance": 30075.00,
      "interestRate": 0.03,
      "maturityDate": null
    }
  ]
}
```

**Error Response (404):**
```json
{
  "error": "Bank not found"
}
```

---

#### PUT /api/bank/rates

Update your bank's interest rates.

**Request Body:**
```json
{
  "rates": {
    "mortgage": 0.065,
    "auto": 0.075,
    "personal": 0.12,
    "credit_card": 0.18,
    "savings": 0.03,
    "cd": 0.04
  }
}
```

**Validation:**
- Rate values must be between 0 and 0.5 (0% to 50%)
- Product names: `mortgage`, `auto`, `personal`, `credit_card`, `savings`, `cd`

**Success Response (200):**
```json
{
  "success": true,
  "rates": [
    { "product": "mortgage", "rate": 0.065 },
    { "product": "auto", "rate": 0.075 }
  ]
}
```

**Notes:**
- Rates take effect on next collection
- Higher loan rates = less demand, higher interest income
- Higher deposit rates = more demand, higher interest expense

---

#### PUT /api/bank/allocation

Update your bank's loan portfolio risk allocation.

**Request Body:**
```json
{
  "allocations": {
    "subprime": 0.10,
    "near_prime": 0.30,
    "prime": 0.40,
    "super_prime": 0.20
  }
}
```

**Validation:**
- Percentages must sum to exactly 1.0
- Risk classes: `subprime`, `near_prime`, `prime`, `super_prime`
- Each value must be between 0 and 1

**Success Response (200):**
```json
{
  "success": true,
  "allocations": [
    { "riskClass": "subprime", "percentage": 0.10 },
    { "riskClass": "near_prime", "percentage": 0.30 },
    { "riskClass": "prime", "percentage": 0.40 },
    { "riskClass": "super_prime", "percentage": 0.20 }
  ]
}
```

**Error Response (400):**
```json
{
  "error": "Allocations must sum to 1.0"
}
```

**Notes:**
- Higher risk classes have higher default rates but may accept higher interest rates
- Allocation takes effect on next collection

---

#### POST /api/bank/collect

Trigger the collection process (core game loop). Calculates game time elapsed since last collection and simulates loan origination, interest accrual, and defaults.

**Request Body:**
```json
null
```

**Success Response (200):**
```json
{
  "gameTimeStart": "2026-01-24T12:00:00Z",
  "gameTimeEnd": "2026-01-24T15:00:00Z",
  "realHoursElapsed": 0.0167,
  "gameQuartersElapsed": 0.5,
  "loansOriginated": 50000.00,
  "interestIncome": 1250.50,
  "interestExpense": 450.25,
  "defaultLosses": 500.00,
  "operatingExpenses": 50.00,
  "netIncome": 250.25,
  "endingEquity": 205250.25,
  "endingLoans": 149500.00,
  "endingDeposits": 180450.25,
  "randomSeed": "1234567890",
  "transactions": [
    {
      "timestamp": "2026-01-24T13:00:00Z",
      "type": "loan_origination",
      "amount": 5000.00,
      "loanBucketId": "uuid",
      "depositBucketId": null,
      "details": { "product": "mortgage", "riskClass": "prime" }
    }
  ],
  "newLoanBuckets": [ ... ],
  "updatedLoanBuckets": [ ... ],
  "newDepositBuckets": [ ... ],
  "updatedDepositBuckets": [ ... ]
}
```

**Rate Limit Response (429):**
```json
{
  "error": "Too soon",
  "retryAfter": 45
}
```

**Notes:**
- Rate limited to once per 60 seconds
- Game time progresses at 180x real time (1 real hour = 7.5 game days)
- Maximum 24 game hours per collection (caps long absences)
- Uses deterministic seeded RNG for defaults (same seed = same results)

---

### Leaderboard (Public)

#### GET /api/banks

List all banks with pagination and sorting.

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50, max: 100): Results per page
- `sortBy` (optional, default: "equity"): Sort field (`equity` or `loans`)

**Example Request:**
```
GET /api/banks?page=1&limit=20&sortBy=equity
```

**Success Response (200):**
```json
{
  "banks": [
    {
      "id": "uuid",
      "name": "First National Bank",
      "createdAt": "2026-01-24T12:00:00Z",
      "currentEquity": 205000.50,
      "currentLoans": 150000.00,
      "currentDeposits": 180000.00,
      "lastCollectedAt": "2026-01-24T15:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

#### GET /api/banks/:id

Get detailed information about a specific bank.

**Path Parameters:**
- `id`: Bank UUID

**Example Request:**
```
GET /api/banks/550e8400-e29b-41d4-a716-446655440000
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "name": "First National Bank",
  "currentEquity": 205000.50,
  "currentLoans": 150000.00,
  "currentDeposits": 180000.00,
  "lastCollectedAt": "2026-01-24T15:00:00Z",
  "createdAt": "2026-01-24T12:00:00Z",
  "rates": [ ... ],
  "allocations": [ ... ],
  "_count": {
    "loanBuckets": 25,
    "depositBuckets": 18
  }
}
```

**Error Response (404):**
```json
{
  "error": "Bank not found"
}
```

---

### Market Data (Public)

#### GET /api/market/rates

Get fixed market rates and product configurations.

**Success Response (200):**
```json
{
  "rates": {
    "loan_benchmark": 0.075,
    "deposit_benchmark": 0.025,
    "operating_expense_rate": 0.005
  },
  "loanProducts": [
    {
      "product": "mortgage",
      "marketRate": 0.07,
      "baseDemandPerHour": 10000,
      "sensitivity": 5,
      "avgLoanSize": 300000
    },
    {
      "product": "auto",
      "marketRate": 0.08,
      "baseDemandPerHour": 5000,
      "sensitivity": 4,
      "avgLoanSize": 35000
    }
  ],
  "depositProducts": [
    {
      "product": "savings",
      "marketRate": 0.03,
      "baseInflowPerHour": 8000,
      "sensitivity": 3
    },
    {
      "product": "cd",
      "marketRate": 0.04,
      "baseInflowPerHour": 5000,
      "sensitivity": 2
    }
  ]
}
```

**Notes:**
- These rates are fixed and configured in `backend/config.yml`
- Use as reference for competitive pricing

---

## Health Check

#### GET /health

Check if the server is running.

**Success Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-01-24T15:30:00.000Z"
}
```

---

## Error Responses

All error responses follow this general format:

```json
{
  "error": "Human-readable error message"
}
```

Some endpoints may include additional fields:
- `details`: Additional error context (validation errors, etc.)
- `retryAfter`: Seconds to wait before retrying (rate limit responses)

### Common HTTP Status Codes

- `200 OK`: Request succeeded
- `400 Bad Request`: Invalid request body or parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded

---

## Game Mechanics

### Time Progression

- **Real time to game time ratio**: 1 real hour = 180 game hours = 7.5 game days
- **Collection cap**: Maximum 24 game hours per collection
- **Interest calculations**: Quarterly (every 3 game months)

### Loan Origination

Loans originated each game hour based on:
- Your interest rate vs market rate
- Product type (mortgage, auto, personal, credit_card)
- Risk class allocation (subprime, near_prime, prime, super_prime)

**Formula**: `demand = baseDemand * (1 + sensitivity * (marketRate - yourRate))`

### Deposit Inflow

Deposits flow in each game hour based on:
- Your interest rate vs market rate
- Product type (savings, cd)

**Formula**: `inflow = baseInflow * (1 + sensitivity * (yourRate - marketRate))`

### Loan Defaults

Defaults calculated each game quarter using:
- Risk class base default rates (configured in `config.yml`)
- Variance factor (0.8 to 1.2, seeded RNG for determinism)
- Reduces loan bucket balances

### Interest Accrual

- **Loan interest**: Accrues quarterly, added to interest income
- **Deposit interest**: Accrues quarterly, added to deposit balance and interest expense

### Operating Expenses

Calculated as percentage of total assets each quarter.

---

## TypeScript Client

For TypeScript clients, use the ts-rest client with the exported contract:

```typescript
import { initClient } from '@ts-rest/core';
import { contract } from '@bank-game/shared';

const client = initClient(contract, {
  baseUrl: 'http://localhost:3001',
  baseHeaders: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// Fully type-safe API calls
const response = await client.bank.get();
```

---

## Configuration

See [configuration.md](configuration.md) for details on customizing game parameters via `config.yml`.
