FROM node:20-alpine AS base

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

FROM base AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN pnpm install --frozen-lockfile

COPY backend ./backend
COPY frontend ./frontend

WORKDIR /app/frontend
RUN pnpm install --frozen-lockfile && pnpm build

WORKDIR /app/backend
RUN pnpm install --frozen-lockfile && pnpm prisma generate && pnpm build

FROM base AS runner

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 oidc

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/public ./public
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/backend/src/prisma/generated ./src/prisma/generated
COPY --from=builder /app/backend/cert ./cert

USER oidc

EXPOSE 5555

ENV NODE_ENV=production
ENV PORT=5555

CMD ["node", "dist/index.js"]
