#!/bin/sh
set -e

mkdir -p /app/data/uploads

# Custom command (e.g. `docker compose run --rm temannakes sh`) skips the server.
if [ "$#" -gt 0 ]; then
  exec "$@"
fi

# Idempotent: creates missing tables/columns, upserts the admin account
# (existing password is never overwritten) and missing activity templates.
npx prisma db push --skip-generate
npx tsx prisma/seed.ts

exec npx next start -H "$HOSTNAME" -p "$PORT"
