# ---- Build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# ---- Serve ----
# The Angular SSR server (Express + CommonEngine) serves the built browser
# assets, renders pages, and exposes the /api/minecraft/scan endpoint.
FROM node:22-alpine
WORKDIR /app

# Production dependencies only. `minecraft-protocol` is externalized from the
# server bundle (see angular.json) and resolved from node_modules at runtime,
# so a production install is required for the scan endpoint to work.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Built application: server bundle + browser assets.
COPY --from=build --chown=node:node /app/dist/ablapi-web ./dist/ablapi-web

ENV PORT=8080
EXPOSE 8080

USER node

CMD ["node", "dist/ablapi-web/server/server.mjs"]
