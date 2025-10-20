# Use an official Node.js runtime as the base image
# Using multiple registry options in case Docker Hub is down
# Uncomment one of the alternatives if docker.io fails

# Primary: Docker Hub (default)
# FROM node:20-alpine AS base

# Alternative 1: GitHub Container Registry
# FROM ghcr.io/library/node:20-alpine AS base

# Alternative 2: Microsoft Container Registry (most reliable)
FROM mcr.microsoft.com/oss/nodejs/node:20-alpine AS base

# Alternative 3: Alibaba Cloud Mirror
# FROM registry.cn-hangzhou.aliyuncs.com/acs/node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for Docker build
ENV SKIP_LINT=true
ENV DISABLE_ESLINT=true

# Build the application with Docker-specific script
RUN npm run build:docker

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]