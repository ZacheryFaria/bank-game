# Web Frontend Patterns

Implementation patterns and conventions for the React web frontend.

---

## Tech Stack

- **React 19** - Latest React with concurrent features
- **TypeScript** - Full type safety
- **Vite** - Fast build tool and dev server
- **TanStack Query** (React Query) - Server state management
- **Zustand** - Client state management
- **React Router** - Client-side routing
- **shadcn/ui** - Bloomberg Terminal themed components
- **Tailwind CSS** - Utility-first styling
- **ts-rest** - Type-safe API client

---

## Project Structure

```text
web/
├── src/
│   ├── components/
│   │   ├── bloomberg/        # Custom Bloomberg-styled components
│   │   │   ├── BloombergLayout.tsx
│   │   │   ├── Panel.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── ...
│   │   ├── ui/               # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   └── layout/           # Layout components
│   │       └── ProtectedRoute.tsx
│   ├── pages/                # Page components
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── Dashboard.tsx
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts        # Authentication hook
│   │   ├── useBank.ts        # Bank data queries
│   │   └── use-toast.ts      # Toast notifications
│   ├── lib/
│   │   ├── api.ts            # ts-rest API client
│   │   ├── queryClient.ts    # React Query configuration
│   │   ├── store.ts          # Zustand stores
│   │   └── utils.ts          # Utility functions
│   ├── App.tsx               # Router + providers
│   ├── main.tsx              # Entry point
│   └── index.css             # Bloomberg theme CSS
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## API Integration

### ts-rest Client Setup

The API client is configured in `web/src/lib/api.ts`:

```typescript
import { initClient } from "@ts-rest/core";
import { contract } from "@bank-game/shared";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const apiClient = initClient(contract, {
  baseUrl: API_BASE_URL,
  baseHeaders: {},
  api: async (args) => {
    const token = localStorage.getItem("token");

    const headers: Record<string, string> = {
      ...args.headers,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Add Content-Type only if body exists
    let body: string | undefined;
    if (args.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(args.body);
    }

    const response = await fetch(args.path, {
      method: args.method,
      headers,
      body,
    });

    const isJson = response.headers
      .get("content-type")
      ?.includes("application/json");

    return {
      status: response.status,
      body: isJson ? await response.json() : await response.text(),
      headers: response.headers,
    };
  },
});
```

**Key Points:**
- Automatically adds JWT token from localStorage
- Only sets `Content-Type: application/json` when body exists
- Handles both JSON and text responses
- Full type safety from backend contract

---

## Authentication

### Auth State Management

Auth state is managed with Zustand in `web/src/lib/store.ts`:

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: (token, refreshToken, user) => {
        localStorage.setItem("token", token);
        localStorage.setItem("refreshToken", refreshToken);
        set({ token, refreshToken, user });
      },
      clearAuth: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        set({ token: null, refreshToken: null, user: null });
      },
      isAuthenticated: () => {
        const state = get();
        return state.token !== null && state.user !== null;
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
```

### useAuth Hook

Centralized authentication logic in `web/src/hooks/useAuth.ts`:

```typescript
export function useAuth() {
  const { setAuth, clearAuth, isAuthenticated, user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiClient.auth.login({ body: data });
      if (response.status !== 200) {
        throw new Error(/* handle error */);
      }
      return response.body;
    },
    onSuccess: (data) => {
      setAuth(data.token, data.refreshToken, data.user);
      toast.success("Login successful");
      navigate("/dashboard");
    },
  });

  const logout = () => {
    clearAuth();
    queryClient.clear();
    navigate("/login");
  };

  return {
    login: loginMutation.mutate,
    logout,
    isAuthenticated: isAuthenticated(),
    user,
  };
}
```

### Protected Routes

Protect routes with `ProtectedRoute` component:

```typescript
// web/src/components/layout/ProtectedRoute.tsx
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Usage in App.tsx
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

---

## Data Fetching with React Query

### Query Hooks Pattern

Create custom hooks for data fetching in `web/src/hooks/`:

```typescript
// web/src/hooks/useBank.ts
export function useBank() {
  const queryClient = useQueryClient();

  // Query for bank data
  const bankQuery = useQuery({
    queryKey: ["bank"],
    queryFn: async () => {
      const response = await apiClient.bank.get();
      if (response.status !== 200) {
        throw new Error(response.body.error);
      }
      return response.body;
    },
  });

  // Mutation for collection
  const collectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.bank.collect({ body: null });
      if (response.status !== 200) {
        throw new Error(response.body.error);
      }
      return response.body;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bank"] });
      toast.success(`Collected! Net Income: $${data.netIncome}`);
    },
  });

  return {
    bank: bankQuery.data,
    isLoading: bankQuery.isLoading,
    collect: collectMutation.mutate,
    isCollecting: collectMutation.isPending,
  };
}
```

### Usage in Components

```typescript
export function Dashboard() {
  const { bank, isLoading, collect, isCollecting } = useBank();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{bank.name}</h1>
      <p>Equity: ${bank.currentEquity}</p>
      <button onClick={() => collect()} disabled={isCollecting}>
        {isCollecting ? "Collecting..." : "Collect"}
      </button>
    </div>
  );
}
```

---

## Bloomberg UI Components

### Layout Components

```typescript
import {
  BloombergLayout,
  BloombergHeader,
  BloombergMain,
  BloombergFooter,
  Panel,
} from "@/components/bloomberg";

<BloombergLayout>
  <BloombergHeader>
    <div>Bank Name</div>
    <button>Collect</button>
  </BloombergHeader>

  <BloombergMain>
    <Panel title="Financial Position" headerColor="cyan">
      {/* Content */}
    </Panel>
  </BloombergMain>

  <BloombergFooter>
    <FunctionKeyBar keys={[...]} />
  </BloombergFooter>
</BloombergLayout>
```

### Data Display Components

```typescript
import { StatCard, StatRow, DataGrid } from "@/components/bloomberg";

// Stat card for metrics
<StatCard
  label="Total Assets"
  value={34500000}
  change={2.4}
  format="currency"
  prefix="$"
/>

// Stat row for inline values
<StatRow
  label="Net Interest Margin"
  value={3.1}
  format="percent"
  variant="positive"
/>

// Data grid for tables
<DataGrid>
  <DataGridHeader>
    <DataGridRow>
      <DataGridHead>Asset</DataGridHead>
      <DataGridHead>Value</DataGridHead>
    </DataGridRow>
  </DataGridHeader>
  <DataGridBody>
    <DataGridRow>
      <DataGridCell variant="highlight">Stocks</DataGridCell>
      <DataGridCell numeric variant="positive">$1.2M</DataGridCell>
    </DataGridRow>
  </DataGridBody>
</DataGrid>
```

### Color Variants

Bloomberg components support these color variants:
- **positive** - Green (for gains, increases)
- **negative** - Red (for losses, decreases)
- **highlight** - Blue (for emphasis)
- **muted** - Gray (for secondary info)

Header colors for panels:
- **cyan** - Default, general info
- **orange** - Important actions
- **blue** - Primary features
- **amber** - Warnings/analysis
- **green** - Success/positive

---

## Adding a New Page

### 1. Create Page Component

```typescript
// web/src/pages/Portfolio.tsx
import { useBank } from "@/hooks/useBank";
import { BloombergLayout, Panel } from "@/components/bloomberg";

export function Portfolio() {
  const { bank, isLoading } = useBank();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <BloombergLayout>
      <BloombergHeader>
        <h1>Portfolio</h1>
      </BloombergHeader>
      <BloombergMain>
        <Panel title="Loan Portfolio" headerColor="orange">
          {/* Content */}
        </Panel>
      </BloombergMain>
    </BloombergLayout>
  );
}
```

### 2. Add Route

```typescript
// web/src/App.tsx
import { Portfolio } from "@/pages/Portfolio";

<Routes>
  <Route path="/portfolio" element={
    <ProtectedRoute>
      <Portfolio />
    </ProtectedRoute>
  } />
</Routes>
```

### 3. Add Navigation

```typescript
// In your header or navigation
import { Link } from "react-router-dom";

<Link to="/portfolio">Portfolio</Link>
```

---

## Form Handling

Use React Hook Form with Zod validation:

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
  const { login } = useAuth();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    login(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register("email")} />
      {form.formState.errors.email && (
        <span>{form.formState.errors.email.message}</span>
      )}

      <Input type="password" {...form.register("password")} />
      {form.formState.errors.password && (
        <span>{form.formState.errors.password.message}</span>
      )}

      <Button type="submit">Sign In</Button>
    </form>
  );
}
```

---

## Styling

### Bloomberg Theme

The app uses a Bloomberg Terminal color scheme defined in `web/src/index.css`:

```css
:root {
  --bloomberg-black: 0 0% 0%;       /* Background */
  --bloomberg-amber: 35 100% 50%;   /* Primary text */
  --bloomberg-blue: 210 100% 50%;   /* Interactive */
  --bloomberg-cyan: 180 100% 45%;   /* Labels */
  --bloomberg-green: 145 100% 40%;  /* Positive */
  --bloomberg-red: 0 100% 50%;      /* Negative */
}
```

### Tailwind Utilities

```typescript
// Color classes
className="text-bloomberg-amber"
className="bg-bloomberg-blue"
className="text-bloomberg-green"

// Typography
className="font-mono tabular-nums"  // Monospace with aligned numbers
className="uppercase tracking-wide"  // Bloomberg-style headers

// Layout
className="bloomberg-panel"  // Panel with border
className="status-positive"  // Green status text
className="status-negative"  // Red status text
```

---

## Toast Notifications

Use Sonner for toast notifications:

```typescript
import { toast } from "sonner";

// Success
toast.success("Operation successful");

// Error
toast.error("Operation failed");

// Info
toast.info("Information message");

// Loading
toast.loading("Processing...");
```

---

## Environment Variables

Create `.env.local` for local configuration:

```bash
VITE_API_URL=http://localhost:3001
```

Access in code:

```typescript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
```

---

## Known Issues

### Collection Endpoint

The `/api/bank/collect` endpoint expects `body: null` but currently has validation issues. The API client correctly sends `null` but the backend validation needs adjustment.

**Current workaround:** Skip collection feature until backend fix is deployed.

---

## Best Practices

### 1. Type Safety

Always use TypeScript types from the ts-rest contract:

```typescript
import type { BankSchema } from "@bank-game/shared";
import { z } from "zod";

type Bank = z.infer<typeof BankSchema>;
```

### 2. Error Handling

Handle all error cases in mutations:

```typescript
const mutation = useMutation({
  mutationFn: async (data) => {
    const response = await apiClient.bank.updateRates({ body: data });

    if (response.status !== 200) {
      const errorBody = response.body as { error?: string };
      throw new Error(errorBody.error || "Update failed");
    }

    return response.body;
  },
  onError: (error: Error) => {
    toast.error(error.message);
  },
});
```

### 3. Loading States

Always show loading states:

```typescript
if (isLoading) return <LoadingSpinner />;
if (isError) return <ErrorMessage error={error} />;
if (!data) return null;
```

### 4. Cache Invalidation

Invalidate queries after mutations:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["bank"] });
}
```

### 5. Component Organization

- Keep pages in `pages/`
- Reusable components in `components/`
- Business logic in `hooks/`
- Pure utilities in `lib/utils.ts`

---

## Testing

(To be added - web frontend tests coming soon)

---

## Performance Tips

1. **Use React Query staleTime** for data that doesn't change often
2. **Lazy load routes** with React.lazy()
3. **Memoize expensive calculations** with useMemo
4. **Use React.memo** for pure presentational components
5. **Keep bundle small** by only importing what you need

---

## Debugging

### React Query Devtools

Add in development:

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### Zustand Devtools

```typescript
import { devtools } from 'zustand/middleware'

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(/* ... */),
    { name: 'auth-store' }
  )
)
```
