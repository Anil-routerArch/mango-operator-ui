# Multi-stage build for mango-operator-ui
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci

# Copy full application source code
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Nginx Runtime
FROM nginx:1.24-alpine

# Install openssl for fallback self-signed SSL certificate generation
RUN apk add --no-cache openssl

# Remove default static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built bundle from builder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx SSL and routing configuration
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy runtime entrypoint scripts
COPY docker-entrypoint.d/30-generate-certs.sh /docker-entrypoint.d/30-generate-certs.sh
COPY docker-entrypoint.d/40-generate-config.sh /docker-entrypoint.d/40-generate-config.sh
RUN chmod +x /docker-entrypoint.d/30-generate-certs.sh /docker-entrypoint.d/40-generate-config.sh

EXPOSE 8445

CMD ["nginx", "-g", "daemon off;"]
