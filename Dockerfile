# Tahap 1: build frontend (mode backend) dan backend.
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY skema/package.json skema/
COPY frontend/package.json frontend/
COPY backend/package.json backend/
RUN npm ci
COPY skema skema
COPY frontend frontend
COPY backend backend
COPY alat alat
RUN npm run periksa && npm run build

# Tahap 2: image kecil yang hanya berisi hasil build dan paket yang dibutuhkan backend saat berjalan.
FROM node:24-slim
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080 \
    FOLDER_DATA=/data \
    FOLDER_CADANGAN=/cadangan \
    FOLDER_TAMPILAN=/app/frontend/dist
WORKDIR /app
COPY package.json package-lock.json ./
COPY skema/package.json skema/
COPY frontend/package.json frontend/
COPY backend/package.json backend/
RUN npm ci --omit=dev -w backend && npm cache clean --force
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/frontend/dist frontend/dist
RUN mkdir -p /data /cadangan && chown node:node /data /cadangan
USER node
EXPOSE 8080
CMD ["node", "backend/dist/server.js"]
