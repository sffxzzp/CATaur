# Build stage
# ==========================================
# STAGE 1: Build Environment
# Purpose: Install all dependencies (including dev tools) 
# and compile the TypeScript source code into plain JavaScript.
# ==========================================
FROM node:22-alpine AS build

WORKDIR /app

# Copy dependency files first to leverage Docker layer caching
COPY package*.json ./
RUN npm install

# Copy the rest of the source code and compile the NestJS app
COPY . .
RUN npm run build

# Production stage
# ==========================================
# STAGE 2: Production Environment
# Purpose: Create a fresh, lightweight image containing ONLY 
# the compiled runtime code and production dependencies.
# ==========================================
FROM node:22-alpine AS production

WORKDIR /app

# Install ONLY production dependencies to minimize image size
COPY package*.json ./
RUN npm install --only=production

# Copy the compiled "dist" folder from the previous build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

# The command to start the NestJS backend API
CMD ["node", "dist/main"]
