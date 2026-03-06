# Stage 1: Build the Expo web app
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY . .

# Build args for Expo public env vars (baked in at build time)
ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG EXPO_PUBLIC_API_URL

ENV EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL
ENV EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

# Fail fast if any required build arg is missing
RUN if [ -z "$EXPO_PUBLIC_SUPABASE_URL" ]; then echo "ERROR: EXPO_PUBLIC_SUPABASE_URL build arg is not set" && exit 1; fi && \
    if [ -z "$EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY" ]; then echo "ERROR: EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY build arg is not set" && exit 1; fi && \
    if [ -z "$EXPO_PUBLIC_API_URL" ]; then echo "ERROR: EXPO_PUBLIC_API_URL build arg is not set" && exit 1; fi

RUN npx expo export --platform web

# Stage 2: Serve with nginx
FROM nginx:alpine

# Remove default nginx config and replace with SPA-friendly one
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built web assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Cloud Run injects $PORT; nginx listens on it via envsubst at startup
ENV PORT=8080
EXPOSE 8080

# Replace $PORT in nginx config at container start, then launch nginx
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/conf.d/default.conf > /tmp/default.conf && cp /tmp/default.conf /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
