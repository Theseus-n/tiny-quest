# Tahap 1: build frontend (mode backend) dan backend.
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY schema/package.json schema/
COPY frontend/package.json frontend/
COPY backend/package.json backend/
# --ignore-scripts: better-sqlite3 membawa binari siap pakai di prebuilds/, jadi tidak perlu compiler (node-gyp).
RUN npm ci --ignore-scripts
COPY schema schema
COPY frontend frontend
COPY backend backend
COPY tools tools
RUN npm run check && npm run build

# Tahap 2: image kecil yang hanya berisi hasil build dan paket yang dibutuhkan backend saat berjalan.
FROM node:24-slim
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    DATA_DIR=/data \
    BACKUP_DIR=/backups \
    UI_DIR=/app/frontend/dist
WORKDIR /app
COPY package.json package-lock.json ./
COPY schema/package.json schema/
COPY frontend/package.json frontend/
COPY backend/package.json backend/
RUN npm ci --ignore-scripts --omit=dev -w backend && npm cache clean --force
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/frontend/dist frontend/dist
RUN mkdir -p /data /backups && chown node:node /data /backups
USER node
EXPOSE 8080
CMD ["node", "backend/dist/server.js"]
