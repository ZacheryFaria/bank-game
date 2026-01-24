# Testing & Validation Workflow

**Validate changes before committing:**

```bash
# Type checking (fast - always run first)
pnpm type-check              # Check all packages
cd backend && pnpm type-check
cd tui && pnpm type-check

# Run tests
cd tui && pnpm test          # Run TUI tests once
cd tui && pnpm test:watch    # Run in watch mode
cd tui && pnpm test:ui       # Open test UI in browser

# Linting & formatting
pnpm lint                    # Check linting
pnpm format                  # Auto-format code
```

**Quick validation workflow:**
```bash
# Before committing TUI changes
cd tui
pnpm type-check && pnpm test && pnpm lint

# Before committing backend changes
cd backend
pnpm type-check && pnpm lint
```

**Note:** `pnpm build` also type-checks but is slower. Use `pnpm type-check` for faster feedback during development.
