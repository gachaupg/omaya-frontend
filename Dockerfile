# Use an official Node.js runtime as the base image
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
# Use npm install to automatically resolve platform-specific packages
# This will install the correct Linux SWC package instead of Windows one
RUN npm install --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for Docker build
ENV NODE_ENV=production
ENV SKIP_LINT=true
ENV DISABLE_ESLINT=true

# OAuth and API configuration - Build Args with defaults
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=""
ARG NEXT_PUBLIC_GOOGLE_REDIRECT_URI=""
ARG NEXT_PUBLIC_API_URL="https://dev.backend.omaya.io"
ARG NEXT_PUBLIC_APP_URL="https://dev.omaya.io"
ARG NEXT_PUBLIC_FACEBOOK_APP_ID=""
ARG NEXT_PUBLIC_FACEBOOK_REDIRECT_URI=""

# Set environment variables for build
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
ENV NEXT_PUBLIC_GOOGLE_REDIRECT_URI=${NEXT_PUBLIC_GOOGLE_REDIRECT_URI}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_FACEBOOK_APP_ID=${NEXT_PUBLIC_FACEBOOK_APP_ID}
ENV NEXT_PUBLIC_FACEBOOK_REDIRECT_URI=${NEXT_PUBLIC_FACEBOOK_REDIRECT_URI}

# Build the application
RUN npm run build:docker

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install runtime dependencies (wget required for healthcheck)
RUN apk add --no-cache wget

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the built application
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set environment variables for runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

USER nextjs

# Expose the port the app runs on
EXPOSE 3000

CMD ["node", "server.js"]
