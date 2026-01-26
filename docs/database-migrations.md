# Database Migrations Guide

## Overview

This project uses Prisma for database schema management and migrations. This guide covers how to create, apply, and manage database migrations safely.

---

## Quick Reference

```bash
# Development: Create and apply migration
pnpm prisma:migrate

# Production: Apply pending migrations
cd backend && pnpm prisma migrate deploy

# Generate Prisma Client after schema changes
pnpm prisma:generate

# View migration status
cd backend && npx prisma migrate status

# Reset database (DESTRUCTIVE - dev only)
cd backend && npx prisma migrate reset
```

---

## Development Workflow

### 1. Modify Schema

Edit `backend/prisma/schema.prisma`:

```prisma
model User {
  id    String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email String @unique
  // Add new field:
  displayName String? @db.VarChar(100)
}
```

### 2. Create Migration

```bash
cd backend
npx prisma migrate dev --name add_user_display_name
```

**What happens:**
1. Prisma generates SQL migration file
2. Migration applied to development database
3. Prisma Client regenerated

**Migration file created:**
```
prisma/migrations/20260124153000_add_user_display_name/migration.sql
```

### 3. Review Generated SQL

```bash
cat prisma/migrations/20260124153000_add_user_display_name/migration.sql
```

Example output:
```sql
-- AlterTable
ALTER TABLE "users" ADD COLUMN "display_name" VARCHAR(100);
```

**Review checklist:**
- [ ] SQL is correct and safe
- [ ] No unintended table drops
- [ ] Indexes created where needed
- [ ] Default values make sense

### 4. Test Migration

```bash
# Run tests to ensure migration didn't break anything
pnpm test
```

### 5. Commit Migration

```bash
git add prisma/migrations/20260124153000_add_user_display_name
git commit -m "Add display_name field to User model"
```

**Important:** Always commit migrations to version control.

---

## Production Deployment

### Before Deploying

1. **Backup database** (see [deployment.md](deployment.md#database-backups))

```bash
pg_dump "$DATABASE_URL" > backup_before_migration.sql
```

2. **Review pending migrations**

```bash
cd backend
npx prisma migrate status
```

Expected output:
```
Database schema is up to date!

Following migration(s) have not yet been applied:
20260124153000_add_user_display_name
```

3. **Test on staging environment** (if available)

### Apply Migrations

```bash
cd backend
npx prisma migrate deploy
```

**What `migrate deploy` does:**
- Applies all pending migrations in order
- Doesn't prompt for confirmation
- Safe for CI/CD pipelines
- Doesn't generate Prisma Client (run `prisma generate` separately)

### After Deployment

1. **Verify schema**

```bash
npx prisma migrate status
# Should show: "Database schema is up to date!"
```

2. **Restart application**

```bash
pm2 restart bank-game-api
# Or: docker-compose restart api
```

3. **Verify application health**

```bash
curl https://api.your-domain.com/health
```

---

## Common Migration Scenarios

### Adding a New Field

```prisma
model Bank {
  id   String @id
  name String
  // Add new field:
  description String? @db.VarChar(500)
}
```

```bash
npx prisma migrate dev --name add_bank_description
```

**Notes:**
- Use `?` for optional fields to avoid requiring defaults
- Specify `@db.VarChar(N)` for string length limits

---

### Adding an Index

```prisma
model Transaction {
  id        String   @id
  bankId    String
  timestamp DateTime

  @@index([bankId, timestamp])
}
```

```bash
npx prisma migrate dev --name add_transaction_index
```

**When to add indexes:**
- Fields used in WHERE clauses
- Foreign keys
- Fields used for sorting
- Frequently joined columns

---

### Making a Field Required

**Bad approach (will fail if existing data has nulls):**

```prisma
model User {
  displayName String  // Changed from String?
}
```

**Good approach (two-step migration):**

**Step 1:** Add field as optional, set defaults

```prisma
model User {
  displayName String? @default("Anonymous")
}
```

```bash
npx prisma migrate dev --name add_display_name_optional
```

**Step 2:** Backfill existing data

```bash
npx prisma studio
# Or write SQL migration:
# UPDATE users SET display_name = 'Anonymous' WHERE display_name IS NULL;
```

**Step 3:** Make field required

```prisma
model User {
  displayName String @default("Anonymous")
}
```

```bash
npx prisma migrate dev --name make_display_name_required
```

---

### Renaming a Field

Prisma can't detect renames automatically. Use `@map` to preserve data:

```prisma
model User {
  // Old: bankName String
  // New name, same column:
  institutionName String @map("bank_name")
}
```

```bash
npx prisma migrate dev --name rename_bank_name_to_institution_name
```

**Alternative: Manual SQL migration**

Create empty migration:

```bash
npx prisma migrate dev --create-only --name rename_bank_name
```

Edit the generated SQL:

```sql
ALTER TABLE "users" RENAME COLUMN "bank_name" TO "institution_name";
```

Apply:

```bash
npx prisma migrate dev
```

---

### Dropping a Field

```prisma
model User {
  id    String @id
  email String
  // Removed: oldField String
}
```

```bash
npx prisma migrate dev --name remove_old_field
```

**Warning:** Irreversible! Ensure data is backed up or migrated elsewhere.

---

### Adding a New Table

```prisma
model Notification {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @db.Uuid
  message   String   @db.Text
  read      Boolean  @default(false)
  createdAt DateTime @default(now()) @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("notifications")
}

model User {
  // ...
  notifications Notification[]
}
```

```bash
npx prisma migrate dev --name add_notifications_table
```

---

## Migration Best Practices

### DO:

✅ **Always backup before production migrations**

✅ **Review generated SQL before applying**

✅ **Test migrations on development/staging first**

✅ **Commit migrations to version control**

✅ **Add indexes for foreign keys and common queries**

✅ **Use descriptive migration names**
  - Good: `add_user_email_index`
  - Bad: `update_schema`

✅ **Use `?` for optional fields to avoid defaults**

✅ **Use `@db.*` annotations for precise types**
  - `@db.Uuid` for UUIDs
  - `@db.VarChar(N)` for variable-length strings
  - `@db.Text` for unlimited text
  - `@db.Timestamptz(6)` for timestamps with timezone

### DON'T:

❌ **Don't run `prisma migrate dev` in production**
  - Use `prisma migrate deploy` instead

❌ **Don't edit applied migrations**
  - Create new migrations to fix issues

❌ **Don't manually edit database schema**
  - Always use Prisma migrations

❌ **Don't skip migrations**
  - Migrations must be applied in order

❌ **Don't delete migration files**
  - Prisma tracks applied migrations

❌ **Don't use `prisma db push` in production**
  - Only for prototyping; doesn't create migration history

---

## Troubleshooting

### Migration Failed Partially Applied

**Symptoms:**
- Migration error mid-execution
- Database in inconsistent state

**Solution:**

```bash
# Mark migration as rolled back
npx prisma migrate resolve --rolled-back 20260124153000_migration_name

# Fix the issue (edit schema or create manual SQL)
# Re-run migration
npx prisma migrate dev
```

---

### Migrations Out of Sync

**Symptoms:**
- `prisma migrate status` shows unexpected state
- "Migration history mismatch" error

**Solution:**

**Option 1: Reset dev database** (DESTRUCTIVE)

```bash
npx prisma migrate reset
# Re-applies all migrations from scratch
```

**Option 2: Mark as applied** (if migration manually executed)

```bash
npx prisma migrate resolve --applied 20260124153000_migration_name
```

---

### Prisma Client Out of Date

**Symptoms:**
- TypeScript errors about missing fields
- Runtime errors: "Unknown field"

**Solution:**

```bash
npx prisma generate
```

**When to run:**
- After pulling new migrations from git
- After applying migrations in production
- After manually editing schema

---

### Migration Conflicts (Git)

**Symptoms:**
- Multiple developers created migrations
- Git conflict in migration files

**Solution:**

1. **Don't merge migration conflicts directly**

2. **Choose one approach:**

**Option A: Rename migrations**

```bash
# Both migrations exist:
# - 20260124150000_add_field_a
# - 20260124150000_add_field_b (same timestamp)

# Rename one:
mv 20260124150000_add_field_b 20260124150001_add_field_b
```

**Option B: Reset and reapply**

```bash
# Backup data first!
npx prisma migrate reset
# Re-applies all migrations
```

---

## Schema Conventions

Follow these conventions for consistency:

### Naming

```prisma
// Model names: PascalCase, singular
model User { }
model BankAllocation { }

// Field names: camelCase
model User {
  firstName String
  lastLoginAt DateTime
}

// Table names: snake_case, plural (via @@map)
model User {
  @@map("users")
}

// Column names: snake_case (via @map)
model User {
  firstName String @map("first_name")
}
```

### Types

```prisma
// IDs: UUID
id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid

// Strings: Specify length
name String @db.VarChar(100)
description String @db.Text

// Numbers: Use Decimal for money
amount Decimal @db.Decimal(18, 2)

// Booleans: Provide defaults
isActive Boolean @default(true)

// Timestamps: Always include timezone
createdAt DateTime @default(now()) @db.Timestamptz(6)
```

### Indexes

```prisma
// Single field index
@@index([userId])

// Composite index
@@index([bankId, createdAt(sort: Desc)])

// Unique index
@@unique([bankId, product])
```

---

## Testing Migrations

### Automated Testing

Create test that verifies schema:

```typescript
// src/__tests__/schema.test.ts
import prisma from '../lib/db';

test('User table exists with email field', async () => {
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      passwordHash: 'hash',
    },
  });
  expect(user.email).toBe('test@example.com');
});
```

### Manual Testing

```bash
# Open Prisma Studio to inspect data
npx prisma studio

# Or use psql
psql "$DATABASE_URL"
\dt  # List tables
\d users  # Describe users table
```

---

## Rollback Strategies

Prisma doesn't support automatic rollback. Options:

### 1. Restore from Backup

```bash
psql "$DATABASE_URL" < backup.sql
```

### 2. Create Reverse Migration

```bash
# Example: Undo add_field migration
npx prisma migrate dev --name remove_field
```

Edit `prisma/schema.prisma` to revert changes, then apply.

### 3. Manual SQL Rollback

```bash
# Identify migration to undo
cd prisma/migrations/20260124153000_add_field

# Write reverse SQL
cat > rollback.sql <<EOF
ALTER TABLE "users" DROP COLUMN "new_field";
EOF

# Apply manually
psql "$DATABASE_URL" < rollback.sql

# Mark migration as rolled back
npx prisma migrate resolve --rolled-back 20260124153000_add_field
```

---

## Advanced Topics

### Custom SQL in Migrations

Create migration without applying:

```bash
npx prisma migrate dev --create-only --name custom_function
```

Edit generated SQL:

```sql
-- Custom PostgreSQL function
CREATE OR REPLACE FUNCTION calculate_equity()
RETURNS TRIGGER AS $$
BEGIN
  -- Custom logic
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Apply:

```bash
npx prisma migrate dev
```

### Data Migrations

For complex data transformations:

```bash
# Create empty migration
npx prisma migrate dev --create-only --name migrate_legacy_data

# Add SQL
cat > prisma/migrations/20260124_migrate_legacy_data/migration.sql <<EOF
-- Migrate data from old to new schema
UPDATE banks
SET new_field = old_field * 100
WHERE old_field IS NOT NULL;
EOF

# Apply
npx prisma migrate dev
```

---

## Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
