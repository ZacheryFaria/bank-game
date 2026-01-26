FROM node:24-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

# Set working directory
WORKDIR /app

# Copy workspace config and package files
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json backend/
COPY web/package.json web/
COPY packages/shared/package.json packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY backend backend/
COPY web web/
COPY packages packages/
COPY docs docs/

# Generate Prisma client
RUN cd backend && pnpm prisma:generate

# Build shared package first (other packages depend on it)
RUN cd packages/shared && pnpm build

# Default command (can be overridden)
CMD ["sh", "-c", "echo 'Container ready'"]
