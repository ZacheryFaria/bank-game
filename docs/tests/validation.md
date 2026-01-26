# Testing & Validation Workflow

**Validate changes before committing:**

```bash
# Type checking (fast - always run first)
pnpm type-check              # Check all packages
cd backend && pnpm type-check
cd web && pnpm type-check

# Linting & formatting
pnpm lint                    # Check linting
pnpm format                  # Auto-format code
```

**Quick validation workflow:**
```bash
# Before committing backend changes
cd backend
pnpm type-check && pnpm lint

# Before committing web changes
cd web
pnpm type-check && pnpm lint
```

**Note:** `pnpm build` also type-checks but is slower. Use `pnpm type-check` for faster feedback during development.
