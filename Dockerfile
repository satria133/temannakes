FROM node:24-slim

# Prisma's query engine needs OpenSSL to detect the platform on Debian slim.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Schema must exist before `npm ci` because postinstall runs `prisma generate`.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .

# Build-time only; the real DB lives on the mounted volume (see docker-compose.yml).
ENV DATABASE_URL="file:/tmp/build.db" \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL="file:/app/data/temannakes.db" \
    UPLOAD_DIR="/app/data/uploads"

RUN chmod +x docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
