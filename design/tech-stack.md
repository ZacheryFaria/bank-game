# Tech Stack

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                 │
│  React + Vite + TypeScript                                      │
│  TanStack Query + Zustand                                       │
│  TanStack Table + Tailwind + shadcn/ui                          │
│                        ↓                                        │
│                 Cloudflare CDN                                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND                                  │
│  Node.js + Fastify + TypeScript                                 │
│  Prisma ORM + Zod validation                                    │
│                        ↓                                        │
│                 Docker (self-hosted)                            │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Backend

| Layer | Choice | Notes |
|-------|--------|-------|
| Runtime | Node.js | LTS version |
| Language | TypeScript | Strict mode |
| Framework | Fastify | Fast, good plugin ecosystem |
| ORM | Prisma | Type-safe, migrations, great DX |
| Validation | Zod | Schema validation, shared with frontend |
| Auth | Custom | Google OAuth + email/password + magic link |

### Key Dependencies

```json
{
  "dependencies": {
    "fastify": "^4.x",
    "@fastify/cors": "^8.x",
    "@fastify/cookie": "^9.x",
    "@prisma/client": "^5.x",
    "zod": "^3.x",
    "@fastify/oauth2": "^7.x",
    "bcrypt": "^5.x",
    "jsonwebtoken": "^9.x",
    "nodemailer": "^6.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "prisma": "^5.x",
    "@types/node": "^20.x",
    "@types/bcrypt": "^5.x",
    "@types/jsonwebtoken": "^9.x"
  }
}
```

### Project Structure

```
backend/
├── src/
│   ├── index.ts              # Entry point
│   ├── app.ts                # Fastify app setup
│   ├── routes/
│   │   ├── auth.ts           # Auth routes
│   │   ├── bank.ts           # Bank routes
│   │   ├── banks.ts          # Other banks routes
│   │   └── leaderboards.ts   # Leaderboard routes
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── bank.service.ts
│   │   └── collection.service.ts
│   ├── engine/               # Game logic (pure functions)
│   │   ├── simulator.ts
│   │   ├── demand.ts
│   │   ├── interest.ts
│   │   ├── defaults.ts
│   │   └── constants.ts
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client
│   │   └── email.ts          # Email sending
│   └── types/
│       └── index.ts          # Shared types
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## Frontend

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | React 18+ | |
| Build | Vite | Fast dev, good defaults |
| Language | TypeScript | Strict mode |
| Styling | Tailwind CSS | Utility-first |
| Components | shadcn/ui | Copy-paste components, customizable |
| Server State | TanStack Query | Caching, refetching, mutations |
| Client State | Zustand | Simple, minimal boilerplate |
| Tables | TanStack Table | Headless, powerful |
| Routing | React Router | v6 |
| Forms | React Hook Form + Zod | Validation shared with backend |

### Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "@tanstack/react-query": "^5.x",
    "@tanstack/react-table": "^8.x",
    "zustand": "^4.x",
    "zod": "^3.x",
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x",
    "tailwindcss": "^3.x",
    "class-variance-authority": "^0.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "lucide-react": "^0.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "@vitejs/plugin-react": "^4.x",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x"
  }
}
```

### Project Structure

```
frontend/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Router setup
│   ├── components/
│   │   ├── ui/               # shadcn components
│   │   ├── layout/           # Header, sidebar, etc.
│   │   ├── bank/             # Bank-specific components
│   │   ├── tables/           # Data tables
│   │   └── charts/           # Chart components
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Settings.tsx      # Rates, allocation
│   │   ├── Financials.tsx    # Income stmt, balance sheet
│   │   ├── Portfolio.tsx     # Loan breakdown
│   │   ├── Banks.tsx         # Other banks list
│   │   ├── BankDetail.tsx    # View other bank
│   │   ├── Leaderboards.tsx
│   │   ├── Login.tsx
│   │   └── Register.tsx
│   ├── hooks/
│   │   ├── useBank.ts        # Bank queries
│   │   ├── useCollection.ts  # Collect mutation
│   │   └── useAuth.ts        # Auth state
│   ├── stores/
│   │   └── auth.store.ts     # Zustand auth store
│   ├── lib/
│   │   ├── api.ts            # Fetch wrapper
│   │   └── utils.ts          # Helpers
│   ├── types/
│   │   └── index.ts          # Shared types (can import from shared pkg)
│   └── styles/
│       └── globals.css       # Tailwind imports
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── package.json
```

---

## Authentication

Three auth methods, unified into single session system.

### Flows

**1. Google OAuth**
```
User clicks "Sign in with Google"
  → Redirect to Google
  → Google redirects back with code
  → Backend exchanges code for tokens
  → Backend creates/finds user
  → Backend issues session (JWT or cookie)
  → Redirect to app
```

**2. Email + Password**
```
User submits email + password
  → Backend verifies bcrypt hash
  → Backend issues session
  → Return to app
```

**3. Magic Link**
```
User submits email
  → Backend generates token, stores with expiry
  → Backend sends email with link
  → User clicks link
  → Backend verifies token
  → Backend issues session
  → Redirect to app
```

### Session Strategy

Use HTTP-only cookies with JWT:

```
POST /auth/login → Set-Cookie: session=<jwt>; HttpOnly; Secure; SameSite=Strict
POST /auth/logout → Clear cookie
GET /auth/me → Read cookie, return user
```

**Why cookies over bearer tokens:**
- HttpOnly = not accessible to JS (XSS protection)
- Automatic on every request
- Simpler client code

### Database Tables

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String?  // Null if OAuth-only
  googleId      String?  @unique
  createdAt     DateTime @default(now())

  bank          Bank?
  magicLinks    MagicLink[]
}

model MagicLink {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  token     String   @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
}
```

---

## Shared Code

Types and Zod schemas shared between frontend and backend.

### Option A: Monorepo with shared package

```
bank-game/
├── packages/
│   ├── shared/           # Shared types, schemas
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   └── schemas.ts
│   │   └── package.json
│   ├── backend/
│   │   └── package.json  # depends on @bank-game/shared
│   └── frontend/
│       └── package.json  # depends on @bank-game/shared
├── package.json          # Workspace root
└── pnpm-workspace.yaml   # or npm/yarn workspaces
```

### Option B: Copy types (simpler)

Just manually keep types in sync. Fine for small project.

### Recommendation

Start with Option B. Move to monorepo if it becomes painful.

---

## Development Setup

```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npm run dev              # Runs on :3001

# Frontend
cd frontend
npm install
npm run dev              # Runs on :5173, proxies API to :3001
```

### Vite Proxy Config

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

---

## Docker

### Backend Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build
RUN npx prisma generate

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
EXPOSE 3001
CMD ["npm", "start"]
```

### docker-compose.yml (local dev)

```yaml
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: bankgame
      POSTGRES_PASSWORD: bankgame
      POSTGRES_DB: bankgame
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## Environment Variables

### Backend

```env
# Database
DATABASE_URL="postgresql://bankgame:bankgame@localhost:5432/bankgame"

# Auth
JWT_SECRET="your-secret-key"
COOKIE_SECRET="your-cookie-secret"

# Google OAuth
GOOGLE_CLIENT_ID="xxx"
GOOGLE_CLIENT_SECRET="xxx"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/auth/google/callback"

# Email (magic links)
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="xxx"
SMTP_PASS="xxx"
EMAIL_FROM="noreply@yourgame.com"

# App
APP_URL="http://localhost:5173"
```

---

## Summary

```
TECH STACK
├── Backend
│   ├── Node.js + TypeScript
│   ├── Fastify
│   ├── Prisma
│   ├── Zod
│   └── JWT cookies
│
├── Frontend
│   ├── React + TypeScript
│   ├── Vite
│   ├── Tailwind + shadcn/ui
│   ├── TanStack Query
│   ├── TanStack Table
│   └── Zustand
│
├── Auth
│   ├── Google OAuth
│   ├── Email + password
│   └── Magic link
│
├── Database
│   └── PostgreSQL
│
└── Deployment
    ├── Backend: Docker, self-hosted
    └── Frontend: Cloudflare CDN
```
