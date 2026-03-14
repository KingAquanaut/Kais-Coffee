#!/bin/sh
# Runs inside the container before supervisor starts nginx + php-fpm.
# Render injects all environment variables before this script executes.
set -e

echo "[entrypoint] Running database migrations..."
php artisan migrate --force

echo "[entrypoint] Caching configuration, routes, and views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "[entrypoint] Starting supervisor (nginx + php-fpm)..."
exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf
