#!/bin/sh
# Runs inside the container before supervisor starts nginx + php-fpm.
# Render (and Railway / Fly.io) inject all environment variables before
# this script executes.
set -e

# ── Render nginx port ─────────────────────────────────────────────────────────
# Render injects $PORT at runtime (default 10000).
# The fallback 80 is only used when running the container locally without -e PORT.
export PORT="${PORT:-80}"
echo "[entrypoint] Rendering nginx config for port ${PORT}..."
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# ── Database migrations ───────────────────────────────────────────────────────
# Retry up to 5 times with a 3-second pause between attempts.
# This handles transient cold-start delays from Neon / RDS / Cloud SQL.
echo "[entrypoint] Running database migrations..."
tries=0
until php artisan migrate --force; do
    tries=$((tries + 1))
    if [ "$tries" -ge 5 ]; then
        echo "[entrypoint] ERROR: migrations failed after ${tries} attempts." >&2
        exit 1
    fi
    echo "[entrypoint] Migration attempt ${tries} failed — retrying in 3s..."
    sleep 3
done

# ── Laravel caches ────────────────────────────────────────────────────────────
echo "[entrypoint] Caching configuration, routes, and views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# ── Start services ────────────────────────────────────────────────────────────
echo "[entrypoint] Starting supervisor (nginx + php-fpm)..."
exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf
