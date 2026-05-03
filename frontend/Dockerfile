FROM node:20-alpine AS base

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

FROM base AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY frontend/package.json ./frontend/

RUN pnpm install --frozen-lockfile

COPY frontend ./frontend

WORKDIR /app/frontend
RUN pnpm install --frozen-lockfile && pnpm build

FROM nginx:alpine

COPY --from=builder /app/backend/public /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
