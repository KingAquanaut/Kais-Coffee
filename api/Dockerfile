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
# Render exposes the PORT env var; nginx listens on it (default 80 on Render).
FROM php:8.4-fpm-alpine

# ── System packages ───────────────────────────────────────────────────────────
RUN apk add --no-cache \
    nginx \
    supervisor \
    # Postgres client — needed by pdo_pgsql
    libpq-dev \
    # Image processing (future: intervention/image)
    # libjpeg-turbo-dev libpng-dev \
    && true

# ── PHP extensions ────────────────────────────────────────────────────────────
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    opcache \
    pcntl

# ── PHP production config ──────────────────────────────────────────────────────
COPY docker/php.ini $PHP_INI_DIR/conf.d/99-app.ini

# ── nginx config ──────────────────────────────────────────────────────────────
COPY docker/nginx.conf /etc/nginx/nginx.conf

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
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# ── Entrypoint ────────────────────────────────────────────────────────────────
# Runs migrations + config cache before handing control to supervisor.
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
