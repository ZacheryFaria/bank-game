#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
CONTAINER_NAME="bankgame-postgres"

# --- .env file ---
if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo "→ Creating backend/.env from .env.example"
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
else
  echo "✓ backend/.env exists"
fi

# --- Docker / PostgreSQL ---
# Check by container name directly (works regardless of which directory compose was run from)
container_status=$(docker inspect --format '{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "not_found")

if [ "$container_status" = "running" ]; then
  echo "✓ PostgreSQL container is running"
elif [ "$container_status" = "exited" ] || [ "$container_status" = "created" ]; then
  echo "→ Starting existing PostgreSQL container"
  docker start "$CONTAINER_NAME"
else
  echo "→ Creating and starting PostgreSQL container"
  cd "$ROOT_DIR"
  docker compose up -d
fi

# Wait for Postgres to accept connections
echo "→ Waiting for PostgreSQL to be ready..."
retries=0
until docker exec "$CONTAINER_NAME" pg_isready -U postgres -q 2>/dev/null; do
  retries=$((retries + 1))
  if [ "$retries" -ge 30 ]; then
    echo "✗ PostgreSQL did not become ready in time"
    exit 1
  fi
  sleep 1
done
echo "✓ PostgreSQL is ready"

# --- Prisma ---
cd "$BACKEND_DIR"

echo "→ Generating Prisma client"
pnpm prisma generate --no-hints

echo "→ Applying pending migrations"
pnpm prisma migrate deploy

echo ""
echo "✓ Dev environment is ready"
