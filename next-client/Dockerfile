# ==========================================
# ADVANCED MULTI-ARCHITECTURE BUILD
# Purpose: Drastically speeds up CI/CD builds by executing dependency installation and Next.js compilation natively on the runner's architecture ($BUILDPLATFORM), avoiding slow QEMU emulation.
# ==========================================
# syntax=docker/dockerfile:1

ARG NODE_IMAGE=node:22-alpine

# -------- Build stages run on BUILDPLATFORM (native on GitHub runner) --------
FROM --platform=$BUILDPLATFORM ${NODE_IMAGE} AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Check lockfile type and install dependencies accordingly
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi


FROM --platform=$BUILDPLATFORM ${NODE_IMAGE} AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ==========================================
# BUILD-TIME ENVIRONMENT VARIABLES
# Purpose: Injects Firebase and API credentials into the Next.js static build/prerender process.
# ==========================================
# Build-time env (needed because next build/prerender reads them)
ARG NEXT_PUBLIC_API_BASE
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID

ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID

# Build the Next.js app (Next.js will generate a standalone output folder)
RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# ==========================================
# RUNTIME ENVIRONMENT (TARGETPLATFORM)
# Purpose: Switches to the target production architecture (e.g., ARM64 for Oracle Cloud). NO "RUN" commands are executed here to bypass QEMU overhead. Only standalone artifacts are copied.
# ==========================================
# -------- Runtime stage uses TARGETPLATFORM, but NO RUN commands (avoid qemu) --------
FROM --platform=$TARGETPLATFORM ${NODE_IMAGE} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"

# Automatically leverage output traces (Standalone Mode) to reduce image size
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# official node image has "node" user
USER node

EXPOSE 3000
CMD ["node", "server.js"]
