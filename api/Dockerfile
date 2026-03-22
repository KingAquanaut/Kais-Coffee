# ── Stage 1: Composer dependencies ───────────────────────────────────────────
# Install PHP deps in a throwaway image so vendor/ is built without
# carrying the full Composer toolchain into the runtime image.
FROM composer:2 AS deps

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --optimize-autoloader \
    --no-scripts \
    --no-interaction \
    --prefer-dist

# Copy source and run post-install scripts (e.g. package discovery)
COPY . .
RUN composer run-script post-autoload-dump 2>/dev/null || true


# ── Stage 2: Runtime image ────────────────────────────────────────────────────
# Slim php-fpm image + nginx + supervisor.
# Render exposes the PORT env var; entrypoint.sh renders nginx.conf from the
# template before starting supervisor.
FROM php:8.4-fpm-alpine

# ── System packages ───────────────────────────────────────────────────────────
RUN apk add --no-cache \
    nginx \
    supervisor \
    # envsubst — renders $PORT into nginx.conf at container startup
    gettext \
    # curl — used by the Docker HEALTHCHECK and useful for debugging
    curl \
    # Postgres client — needed by pdo_pgsql
    libpq-dev

# ── PHP extensions ────────────────────────────────────────────────────────────
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    opcache \
    pcntl

# ── PHP production config ─────────────────────────────────────────────────────
COPY docker/php.ini $PHP_INI_DIR/conf.d/99-app.ini

# ── nginx config (template — PORT is substituted by entrypoint.sh) ────────────
COPY docker/nginx.conf /etc/nginx/nginx.conf.template

# ── Supervisor config ─────────────────────────────────────────────────────────
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# ── Application source ────────────────────────────────────────────────────────
WORKDIR /var/www/html

# Copy vendor from the deps stage, then the rest of the source
COPY --from=deps --chown=www-data:www-data /app/vendor ./vendor
COPY --chown=www-data:www-data . .

# ── Storage & cache directories ───────────────────────────────────────────────
# Must exist and be writable before the app boots.
RUN mkdir -p \
    storage/logs \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# ── Entrypoint ────────────────────────────────────────────────────────────────
# Renders nginx.conf, runs migrations, caches config/routes/views,
# then hands control to supervisor (nginx + php-fpm).
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Render injects $PORT at runtime (default 10000 for Docker services).
# EXPOSE is documentation only — it does not bind the port.
EXPOSE 10000

# Docker-level health check — used by Railway, Fly.io, and local `docker ps`.
# Render configures its own health check in the dashboard (path: /api/v1/health).
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${PORT:-10000}/api/v1/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
