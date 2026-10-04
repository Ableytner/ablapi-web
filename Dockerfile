# ---- Build ----
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# ---- Serve ----
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist/ablapi-web/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

ENV PORT=80
EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]
