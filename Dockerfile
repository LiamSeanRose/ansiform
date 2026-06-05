# syntax=docker/dockerfile:1

# --- Build stage: produce the static dist/ ---------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies from the lockfile only (reproducible, no implicit fetch).
COPY package.json package-lock.json ./
RUN npm ci

# Build the static SPA.
COPY . .
RUN npm run build

# --- Runtime stage: nginx:alpine serving the static build ------------------
FROM nginx:alpine AS runtime

# Custom config: listens on 8080, SPA fallback, zero-egress CSP header.
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Pre-create the writable scratch dirs nginx.conf points at, and hand the
# served content + scratch space to the unprivileged `nginx` user so the
# container can run non-root with a read-only root filesystem.
RUN mkdir -p /tmp/nginx-client /tmp/nginx-proxy /tmp/nginx-fastcgi \
      /tmp/nginx-uwsgi /tmp/nginx-scgi \
  && chown -R nginx:nginx /tmp/nginx-* /usr/share/nginx/html

USER nginx
EXPOSE 8080

# Run as non-root; bind to an unprivileged port.
# Example: docker run --rm -p 8080:8080 --read-only --tmpfs /tmp ansiform
CMD ["nginx", "-g", "daemon off;"]
