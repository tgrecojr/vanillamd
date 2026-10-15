# syntax=docker/dockerfile:1@sha256:4edf897a3ffa55b89f906fc8cc78afdb3f1834cc9c7083565e611a8a7d5fe99e

# ---- Build stage: Chainguard node "dev" variant (npm + shell), paired to the
# runtime image so the Node major matches (avoids native-ABI skew). ----
FROM cgr.dev/chainguard/node:latest-dev@sha256:e7076475a5978df4626e4fcf99b368c4a8c2741b39249105f42a8fb4579bcb65 AS build
USER root
WORKDIR /app

# Install with the lockfile first for better layer caching.
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci

# Build both workspaces, then drop dev dependencies from node_modules.
COPY . .
RUN npm run build && npm prune --omit=dev

# Pre-create an empty data dir so the runtime can own it without a shell.
RUN mkdir -p /data-empty

# ---- Runtime stage: hardened, distroless, non-root (uid 65532) ----
FROM cgr.dev/chainguard/node:latest@sha256:f5b8ab65cbb411f9e1996f8c331c6d8df38291133f0c9b327a893646422237ad AS runtime
ENV NODE_ENV=production \
    DATA_DIR=/data \
    PORT=8080 \
    HOST=0.0.0.0
WORKDIR /app

# Copy only what the server needs at runtime, owned by the non-root user.
COPY --from=build --chown=65532:65532 /app/node_modules ./node_modules
COPY --from=build --chown=65532:65532 /app/server/package.json ./server/package.json
COPY --from=build --chown=65532:65532 /app/server/dist ./server/dist
COPY --from=build --chown=65532:65532 /app/client/dist ./client/dist
COPY --from=build --chown=65532:65532 /app/package.json ./package.json
COPY --from=build --chown=65532:65532 /data-empty /data

VOLUME ["/data"]
USER 65532
EXPOSE 8080

# Exec-form healthcheck driven by node's fetch (no package manager / curl here).
HEALTHCHECK --interval=30s --timeout=4s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

# The base image's ENTRYPOINT is /usr/bin/node; pass the server entry as its arg.
CMD ["server/dist/index.js"]
