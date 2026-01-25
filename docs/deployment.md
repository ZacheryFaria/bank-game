# Deployment Guide

## Overview

This guide covers deploying the Bank Game backend to production environments.

---

## Prerequisites

- PostgreSQL 14+ database
- Node.js 24+ runtime
- Domain name with SSL certificate (recommended)
- Reverse proxy (nginx, Caddy, etc.) for HTTPS

---

## Environment Configuration

### Required Environment Variables

Create a `.env` file or configure environment variables:

```bash
# Server Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bank_game

# JWT Secrets (CRITICAL: Use strong, unique values)
JWT_SECRET=<generate-strong-secret>
REFRESH_TOKEN_SECRET=<generate-different-secret>

# CORS (comma-separated allowed origins)
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com
```

### Generating Secrets

Use a cryptographically secure random generator:

```bash
# Generate JWT secrets
openssl rand -base64 64
```

**Security Notes:**
- **Never** commit secrets to version control
- Use different secrets for `JWT_SECRET` and `REFRESH_TOKEN_SECRET`
- Rotate secrets periodically (requires re-authentication of all users)

---

## Database Setup

### 1. Create Database

```sql
CREATE DATABASE bank_game;
CREATE USER bank_game_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE bank_game TO bank_game_user;
```

### 2. Run Migrations

```bash
cd backend
pnpm prisma:migrate deploy
```

**Migration Notes:**
- `prisma migrate deploy` applies migrations without prompts (safe for CI/CD)
- Never run `prisma migrate dev` in production
- Always backup database before running migrations

### 3. Verify Schema

```bash
pnpm prisma:generate
```

---

## Build Process

### 1. Install Dependencies

```bash
cd backend
pnpm install --frozen-lockfile
```

**Notes:**
- `--frozen-lockfile` ensures exact dependency versions from `pnpm-lock.yaml`
- Fails if `package.json` and lockfile are out of sync

### 2. Build TypeScript

```bash
pnpm build
```

**Output:**
- Compiled JavaScript files in `dist/` directory
- Type declarations generated

### 3. Verify Build

```bash
ls -la dist/
# Should contain: server.js, routes/, logic/, engine/, lib/
```

---

## Running in Production

### Option 1: Direct Node Execution

```bash
NODE_ENV=production node dist/server.js
```

### Option 2: PM2 Process Manager

Install PM2:

```bash
npm install -g pm2
```

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'bank-game-api',
    script: './dist/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
  }]
};
```

Start with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Enable auto-start on boot
```

**PM2 Commands:**
```bash
pm2 list              # List running processes
pm2 logs bank-game-api  # View logs
pm2 restart bank-game-api  # Restart
pm2 stop bank-game-api     # Stop
pm2 delete bank-game-api   # Remove
```

### Option 3: Docker

Build image:

```bash
docker build -t bank-game-backend:latest .
```

Run container:

```bash
docker run -d \
  --name bank-game-api \
  -p 3001:3001 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e REFRESH_TOKEN_SECRET="..." \
  -e ALLOWED_ORIGINS="https://your-domain.com" \
  --restart unless-stopped \
  bank-game-backend:latest
```

**Docker Compose Example:**

```yaml
version: '3.8'

services:
  api:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://bank_game_user:password@db:5432/bank_game
      JWT_SECRET: ${JWT_SECRET}
      REFRESH_TOKEN_SECRET: ${REFRESH_TOKEN_SECRET}
      ALLOWED_ORIGINS: https://your-domain.com
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: bank_game
      POSTGRES_USER: bank_game_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    restart: unless-stopped

volumes:
  postgres_data:
```

Run with:

```bash
docker-compose up -d
```

---

## Reverse Proxy Configuration

### nginx

```nginx
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

Test and reload:

```bash
nginx -t
systemctl reload nginx
```

### Caddy

`Caddyfile`:

```
api.your-domain.com {
    reverse_proxy localhost:3001
}
```

Caddy automatically handles HTTPS with Let's Encrypt.

---

## Health Monitoring

### Health Check Endpoint

```bash
curl https://api.your-domain.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-24T15:30:00.000Z"
}
```

### Monitoring Setup

**PM2 Monitoring:**

```bash
pm2 install pm2-logrotate  # Auto-rotate logs
```

**External Monitoring:**

Use services like:
- UptimeRobot
- Pingdom
- Better Uptime

Configure to ping `/health` endpoint every 1-5 minutes.

---

## Database Backups

### Automated Backups with cron

Create backup script `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/bank-game"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATABASE_URL="postgresql://user:password@localhost:5432/bank_game"

mkdir -p "$BACKUP_DIR"
pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/backup_$TIMESTAMP.sql.gz"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete
```

Add to crontab:

```bash
0 2 * * * /path/to/backup.sh  # Daily at 2 AM
```

### Manual Backup

```bash
pg_dump postgresql://user:password@localhost:5432/bank_game > backup.sql
```

### Restore from Backup

```bash
psql postgresql://user:password@localhost:5432/bank_game < backup.sql
```

---

## Logging

### Log Locations

**PM2:**
- Error logs: `~/.pm2/logs/bank-game-api-error.log`
- Output logs: `~/.pm2/logs/bank-game-api-out.log`

**Docker:**
```bash
docker logs bank-game-api
```

### Log Rotation

**PM2 Log Rotation:**

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## Security Checklist

- [ ] Strong JWT secrets generated and configured
- [ ] HTTPS enabled (never HTTP in production)
- [ ] CORS configured with specific allowed origins (not `*`)
- [ ] Database credentials secured
- [ ] Environment variables not committed to git
- [ ] Database backups automated
- [ ] Security headers configured in reverse proxy
- [ ] Rate limiting enabled (already configured in app)
- [ ] Database user has minimal required privileges
- [ ] Firewall configured (only ports 80, 443, 22 open)

---

## Performance Optimization

### Database Connection Pooling

Configure in `DATABASE_URL`:

```
postgresql://user:password@localhost:5432/bank_game?connection_limit=10
```

Or set Prisma pool size:

```typescript
// src/lib/db.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
```

**Recommended pool size:**
- Single instance: 10-20 connections
- Multiple instances: `totalConnections / instances`

### Database Indexes

Ensure migrations created indexes (added in schema):
- `users.email` (unique)
- `users.createdAt`
- `banks.userId` (unique)
- `banks.lastCollectedAt`
- `banks.currentEquity`
- `banks.currentLoans`
- `transactions.collectedAt`
- Various bucket indexes

---

## Troubleshooting

### Server Won't Start

1. Check environment variables:
   ```bash
   echo $DATABASE_URL
   echo $JWT_SECRET
   ```

2. Verify database connectivity:
   ```bash
   psql "$DATABASE_URL" -c "SELECT 1;"
   ```

3. Check port availability:
   ```bash
   lsof -i :3001
   ```

### Database Connection Errors

- Verify PostgreSQL is running
- Check firewall rules
- Verify connection string format
- Ensure database user has correct privileges

### High Memory Usage

- Reduce Prisma connection pool size
- Check for memory leaks in PM2 logs
- Consider horizontal scaling (multiple instances)

### Slow Queries

- Enable Prisma query logging:
  ```typescript
  const prisma = new PrismaClient({ log: ['query'] });
  ```
- Check `EXPLAIN ANALYZE` on slow queries
- Verify indexes exist
- Consider database vacuuming

---

## Scaling

### Horizontal Scaling

Run multiple instances behind load balancer:

**PM2 Cluster Mode:**
```javascript
{
  instances: 'max',  // One per CPU core
  exec_mode: 'cluster'
}
```

**Docker Swarm / Kubernetes:**

Deploy multiple replicas with shared PostgreSQL database.

### Vertical Scaling

- Increase PostgreSQL memory/CPU
- Optimize database queries
- Add Redis caching layer (future enhancement)

---

## Deployment Checklist

- [ ] Build application (`pnpm build`)
- [ ] Run database migrations (`pnpm prisma:migrate deploy`)
- [ ] Set environment variables
- [ ] Configure reverse proxy
- [ ] Enable HTTPS
- [ ] Set up process manager (PM2/Docker)
- [ ] Configure automated backups
- [ ] Set up monitoring
- [ ] Test health endpoint
- [ ] Test API endpoints
- [ ] Configure log rotation
- [ ] Review security checklist

---

## Rollback Procedure

### Application Rollback

**PM2:**
```bash
pm2 stop bank-game-api
# Restore previous dist/ files or git checkout
pm2 start bank-game-api
```

**Docker:**
```bash
docker stop bank-game-api
docker run ... bank-game-backend:previous-tag
```

### Database Rollback

```bash
# Restore from backup
psql "$DATABASE_URL" < backup_YYYYMMDD_HHMMSS.sql
```

**Prisma Migration Rollback:**

Prisma doesn't support automatic rollback. Manually revert:

1. Identify migration to revert
2. Create new migration reversing changes
3. Apply with `prisma migrate deploy`

---

## Support

For deployment issues:
- Check logs first
- Review troubleshooting section
- Open issue at: https://github.com/your-repo/bank-game/issues
