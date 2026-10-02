# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# better-sqlite3 may need to compile a native addon on Alpine.
RUN apk add --no-cache python3 make g++

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config for React Router (handles client-side routing)
COPY nginx.conf /etc/nginx/budgetelite.conf.template

# Compose uses port 80/api; Railway supplies PORT and API_HOST at runtime.
ENV PORT=80
ENV API_HOST=api
ENV API_PORT=3001

EXPOSE 80

CMD ["sh", "-c", "DNS_RESOLVER=$(awk '$1 == \"nameserver\" { print $2; exit }' /etc/resolv.conf); case \"$DNS_RESOLVER\" in *:*) DNS_RESOLVER=\"[$DNS_RESOLVER]\" ;; esac; if [ -z \"$DNS_RESOLVER\" ]; then echo 'No DNS resolver found in /etc/resolv.conf' >&2; exit 1; fi; envsubst '$PORT $API_HOST $API_PORT $DNS_RESOLVER' < /etc/nginx/budgetelite.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
