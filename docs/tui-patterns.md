# TUI Architecture Documentation

## Overview

The TUI (Terminal User Interface) is built using Ink (React for CLIs) and shares a type-safe contract with the backend via ts-rest. This ensures full end-to-end type safety from the database to the terminal UI.

## Project Structure

```
bank-game/
├── backend/                 # Fastify API server
│   ├── src/
│   │   ├── logic/          # Business logic (extracted from routes)
│   │   │   ├── auth.ts     # User creation, authentication, token refresh
│   │   │   └── bank.ts     # Bank operations (get, updateRates, updateAllocation, collect)
│   │   ├── routes/
│   │   │   └── api.ts      # Thin ts-rest route handlers (calls logic/)
│   │   ├── lib/
│   │   │   ├── auth.ts     # JWT/bcrypt utilities
│   │   │   └── authMiddleware.ts  # JWT verification middleware
│   │   └── server.ts       # Fastify setup
│   └── package.json
├── tui/                     # Terminal UI client
│   ├── src/
│   │   ├── components/     # React (Ink) components
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── hooks/
│   │   │   └── useKeyBindings.ts  # Vim-like keybinding system
│   │   ├── lib/
│   │   │   ├── api.ts      # ts-rest client initialization
│   │   │   └── store.ts    # Zustand auth state management
│   │   ├── App.tsx         # Main router
│   │   └── index.tsx       # Entry point
│   └── package.json
└── packages/
    └── shared/             # Shared types and contract
        ├── src/
        │   ├── contract.ts # ts-rest API contract (single source of truth)
        │   └── index.ts
        └── package.json
```

## Key Architectural Decisions

### 1. **Extracted Business Logic Pattern**

**Problem**: Routes had business logic mixed with HTTP handling, making code hard to test and reuse.

**Solution**: Extract all business logic into `backend/src/logic/`:
- **`logic/auth.ts`**: Pure business logic for auth operations
- **`logic/bank.ts`**: Pure business logic for bank operations
- **`routes/api.ts`**: Thin handlers that call logic and return HTTP responses

**Benefits**:
- Business logic is testable without HTTP mocking
- Logic can be reused across different route handlers
- Clear separation of concerns
- Easier to add new transport layers (GraphQL, WebSocket, etc.)

**Example**:
```typescript
// logic/auth.ts - Pure business logic
export async function createUser(data: { email, password, bankName }) {
  // ... validation, database operations
  return { success: true, token, user } | { success: false, error };
}

// routes/api.ts - Thin HTTP handler
auth: {
  register: async ({ body }) => {
    const result = await authLogic.createUser(body);
    if (!result.success) {
      return { status: 400, body: { error: result.error } };
    }
    return { status: 200, body: result };
  }
}
```

### 2. **ts-rest Contract as Single Source of Truth**

**Problem**: Maintaining type consistency between frontend and backend is error-prone.

**Solution**: Define the entire API contract in `packages/shared/src/contract.ts` using ts-rest and Zod schemas.

**Benefits**:
- Full type safety from API request → backend handler → database → response → client
- TypeScript catches breaking changes at compile time
- Auto-complete for all API calls in the TUI
- Zod validation at runtime ensures data integrity
- Contract serves as API documentation

**Example**:
```typescript
// packages/shared/src/contract.ts
export const contract = c.router({
  auth: {
    login: {
      method: "POST",
      path: "/api/auth/login",
      body: z.object({ email: z.string().email(), password: z.string() }),
      responses: {
        200: z.object({ token: z.string(), user: UserSchema }),
        401: z.object({ error: z.string() })
      }
    }
  }
});

// tui/src/components/LoginScreen.tsx - Fully typed!
const result = await client.auth.login({ body: { email, password } });
//    ^? result is { status: 200, body: { token: string, user: User } } | { status: 401, body: { error: string } }
```

### 3. **Keybinding System**

**Problem**: Keybinding logic scattered across components makes it hard to maintain consistent UX.

**Solution**: Centralized `useKeyBindings` hook with context-aware behavior.

**Benefits**:
- Single place to define all keybindings
- Context-aware (auth screen vs dashboard have different bindings)
- Vim-like command mode (`:q`, `:logout`) works globally
- Easy to add new keybindings without touching UI components

**Architecture**:
```typescript
// hooks/useKeyBindings.ts
export function useKeyBindings(
  context: "auth" | "dashboard" | "menu",
  onAction: (action: KeyBindingAction) => void
) {
  // Global command mode (:q, :logout)
  // Context-specific bindings (j/k for navigation, c for collect)
  // Returns { commandMode, command } for UI display
}

// Components just handle actions
useKeyBindings("dashboard", (action) => {
  if (action.type === "collect") collectMutation.mutate();
});
```

### 4. **State Management Strategy**

**Client State** (Zustand):
- Auth state (user, token, isAuthenticated)
- UI state (which screen is active, command mode)

**Server State** (TanStack Query):
- Bank data (fetched from API)
- Mutations (collect, updateRates, etc.)
- Automatic refetching and caching

**Why this split?**
- Zustand: Lightweight, simple, perfect for client-only state
- TanStack Query: Built for server state, handles caching/refetching automatically
- Clear separation prevents state management confusion

## Data Flow

### Authentication Flow

```
1. User enters credentials in LoginScreen
   ↓
2. LoginScreen calls client.auth.login() (ts-rest client)
   ↓
3. Request → backend/routes/api.ts → logic/auth.ts → authenticateUser()
   ↓
4. Database query, password verification, JWT generation
   ↓
5. Response with { token, refreshToken, user }
   ↓
6. TUI stores in Zustand and sets Authorization header
   ↓
7. App re-renders, shows Dashboard
```

### Collection Flow

```
1. User presses 'c' in Dashboard
   ↓
2. useKeyBindings detects action, triggers collectMutation.mutate()
   ↓
3. TanStack Query mutation → tsRestClient.bank.collect.mutation()
   ↓
4. Backend: routes/api.ts → logic/bank.ts → collectBank()
   ↓
5. Engine runs simulation, updates database in transaction
   ↓
6. Response with collection report
   ↓
7. TanStack Query invalidates ["bank"] query, triggers refetch
   ↓
8. Dashboard re-renders with new bank data
```

## Type Safety Chain

The complete type safety chain looks like this:

```
Zod Schema (contract.ts)
  ↓
ts-rest Contract Definition
  ↓
Backend Handler (knows expected request/response types)
  ↓
Business Logic (uses typed parameters)
  ↓
Prisma Database Operations (typed ORM)
  ↓
Return typed response
  ↓
ts-rest validates response against schema
  ↓
TUI receives fully typed response
  ↓
TypeScript autocomplete in components
```

**At every step, TypeScript and Zod ensure correctness.**

## Testing Strategy (Future)

### Backend
- **Unit tests**: Test `logic/` functions in isolation
- **Integration tests**: Test API routes with test database
- **Contract tests**: Verify responses match ts-rest contract

### TUI
- **Component tests**: Test Ink components with ink-testing-library
- **Keybinding tests**: Verify keybinding actions trigger correct behavior
- **E2E tests**: Test full auth → dashboard → collect flow

## Future Architectural Considerations

### Adding New Screens

1. Create component in `tui/src/components/`
2. Add keybindings context to `useKeyBindings`
3. Add screen to App.tsx router
4. If new API calls needed, add to `packages/shared/src/contract.ts` first
5. Implement backend logic in `backend/src/logic/`
6. Add thin handler in `backend/src/routes/api.ts`

### Adding New API Endpoints

1. **Start with contract**: Define in `packages/shared/src/contract.ts`
2. **Implement logic**: Add to appropriate `backend/src/logic/` file
3. **Wire up handler**: Add to `backend/src/routes/api.ts`
4. **Use in TUI**: Import from `tsRestClient` with full type safety

### Performance Optimization

- **TanStack Query caching**: Already in place, adjust `staleTime` as needed
- **Debounce keybindings**: For rapid j/k navigation in lists
- **Virtualization**: For long lists (transactions, leaderboard)
- **Request deduplication**: TanStack Query handles this automatically

## Dependencies

### Backend
- `@ts-rest/fastify` - ts-rest Fastify plugin
- `@ts-rest/core` - Core ts-rest functionality

### TUI
- `ink` - React for CLIs
- `ink-text-input`, `ink-spinner`, `ink-select-input` - UI components
- `@ts-rest/react-query` - TanStack Query integration for ts-rest
- `@tanstack/react-query` - Server state management
- `zustand` - Client state management

### Shared
- `@ts-rest/core` - Contract definition
- `zod` - Schema validation

## Key Files to Understand

If you're working on this codebase, start by reading these files in order:

1. **`packages/shared/src/contract.ts`** - API contract (single source of truth)
2. **`backend/src/logic/auth.ts`** - Auth business logic patterns
3. **`backend/src/routes/api.ts`** - How logic connects to HTTP
4. **`tui/src/hooks/useKeyBindings.ts`** - Keybinding system
5. **`tui/src/lib/api.ts`** - ts-rest client setup
6. **`tui/src/App.tsx`** - Main TUI router
7. **`tui/src/components/Dashboard.tsx`** - Complex component example

## Common Patterns

### Adding a New Mutation

```typescript
// 1. Add to contract
export const contract = c.router({
  bank: {
    updateRates: {
      method: "PUT",
      path: "/api/bank/rates",
      body: UpdateRatesSchema,
      responses: { 200: SuccessSchema, 400: ErrorSchema }
    }
  }
});

// 2. Add logic
export async function updateBankRates(bankId: string, rates: Record<string, number>) {
  // ... implementation
  return { success: true, rates };
}

// 3. Wire up handler
bank: {
  updateRates: async ({ body, request }) => {
    const result = await bankLogic.updateBankRates(request.bank!.id, body.rates);
    return { status: 200, body: result };
  }
}

// 4. Use in TUI
const mutation = useMutation({
  mutationFn: async (rates) => {
    const result = await tsRestClient.bank.updateRates.mutation({ body: { rates } });
    if (result.status === 200) return result.body;
    throw new Error("Failed");
  }
});
```

### Adding a New Keybinding

```typescript
// In useKeyBindings.ts
function handleDashboardKeys(input: string, key: any, onAction) {
  if (input === "r") {
    onAction({ type: "editRates" });
  }
}

// In component
useKeyBindings("dashboard", (action) => {
  if (action.type === "editRates") {
    setScreen("rates");
  }
});
```

## Debugging Tips

### Backend
- Check `backend/src/routes/api.ts` for HTTP status codes
- Add console.logs in `backend/src/logic/` functions
- Use Prisma Studio to inspect database state

### TUI
- Use React DevTools (not available in terminal, but you can debug logic separately)
- Add `console.error()` in catch blocks
- Check TanStack Query DevTools integration (future enhancement)
- Test keybindings by adding logs in `useKeyBindings` hook

### Type Errors
- If backend/TUI types don't match, check `packages/shared/src/contract.ts`
- Rebuild shared package: `pnpm --filter @bank-game/shared build`
- Check for Zod schema version mismatches
