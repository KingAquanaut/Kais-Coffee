# Deployment Guide — Kai's Coffee

**Stack:** Next.js on Vercel · Laravel on Render (Docker) · PostgreSQL on Neon

```
GitHub (develop) ──► Render staging  ──► Neon staging DB
GitHub (main)    ──► Render prod     ──► Neon prod DB
                 ──► Vercel prod
```

---

## Local development

```bash
# API (from /api)
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan storage:link
php artisan serve               # http://localhost:8000

# Web (from /web, new terminal)
cp .env.local.example .env.local
npm install
npm run dev                     # http://localhost:3000
```

---

## One-time setup

Work through these steps before your first deploy.

### 1. Neon — create two databases

1. Sign up at neon.tech and create a project.
2. Inside the project create two **branches**:
   - `staging` — for the develop environment
   - `main` (the default) — for production
3. From each branch's Connection Details, copy the **Connection string**:
   ```
   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   You will paste these as `DATABASE_URL` in the Render dashboard.

Neon connection strings include `?sslmode=require` automatically. The API is
configured with `DB_SSLMODE=require` in `render.yaml` to match.

---

### 2. Render — import the Blueprint

1. render.com → **New** → **Blueprint**.
2. Connect your GitHub repo. Render detects `render.yaml` and shows two services:
   - `kais-coffee-api-staging`
   - `kais-coffee-api-production`
3. Click **Apply**. Render creates the services but does NOT auto-deploy yet
   (`autoDeploy: false` in `render.yaml` — GitHub Actions controls deploys).

#### Set secrets in the Render dashboard

For **each** service, open the **Environment** tab and add:

| Key | Value |
|---|---|
| `APP_KEY` | `php artisan key:generate --show` (run separately for each env) |
| `DATABASE_URL` | Neon connection string for that environment |
| `FRONTEND_URL` | `https://staging.kaiscoffee.com` or `https://kaiscoffee.com` |
| `SANCTUM_STATEFUL_DOMAINS` | `staging.kaiscoffee.com` or `kaiscoffee.com` |

For **production only**, also add S3 credentials:

| Key | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | IAM key with s3:PutObject, s3:DeleteObject |
| `AWS_SECRET_ACCESS_KEY` | Corresponding secret |
| `AWS_DEFAULT_REGION` | e.g. `us-east-1` |
| `AWS_BUCKET` | Bucket name (public read) |

#### Update APP_URL in render.yaml

After the first deploy, Render assigns hostnames like
`kais-coffee-api-staging.onrender.com`. Update the two `APP_URL` values in
`render.yaml` to match, then commit.

#### Copy the Deploy Hook URLs

Render Dashboard → each service → **Settings** → **Deploy Hook**.
Copy each URL — you will add them as GitHub Secrets in the next step.

---

### 3. GitHub Secrets

Settings → Secrets and Variables → Actions → New repository secret:

| Secret | Value |
|---|---|
| `RENDER_STAGING_DEPLOY_HOOK` | Deploy hook URL for `kais-coffee-api-staging` |
| `RENDER_PROD_DEPLOY_HOOK` | Deploy hook URL for `kais-coffee-api-production` |
| `VERCEL_TOKEN` | vercel.com → Settings → Tokens |
| `VERCEL_ORG_ID` | From `vercel link` output (see below) |
| `VERCEL_PROJECT_ID` | From `vercel link` output |

Get Vercel IDs:

```bash
cd web
npx vercel link          # follow prompts; creates .vercel/project.json
cat .vercel/project.json
# {"orgId":"team_xxx","projectId":"prj_xxx"}
```

---

### 4. GitHub Environments — approval gate

Settings → Environments:

- **`staging`** — no required reviewers; deploys automatically after tests pass.
- **`production`** — add yourself as a **Required reviewer**. Every production
  deploy pauses in the Actions tab until you approve.

---

### 5. Vercel — project setup

1. vercel.com → **New Project** → import this repo.
2. Set **Root Directory** to `web`.
3. Vercel auto-detects Next.js.
4. Auto-deploy is already disabled by `web/vercel.json`
   (`git.deploymentEnabled: false` for `main` and `develop`).

Set environment variables in **Settings → Environment Variables**:

| Variable | Environment | Value |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Production | `https://kais-coffee-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_API_URL` | Preview | `https://kais-coffee-api-staging.onrender.com/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | All | `Kai's Coffee` |

`NEXT_PUBLIC_*` variables are baked into the JS bundle at build time by Vercel.
You do not need to duplicate these in GitHub Secrets.

---

## CI / CD pipeline

| Workflow | Trigger | Jobs |
|---|---|---|
| `ci.yml` | Pull request | `test-api` + `build-web` (parallel) |
| `staging-deploy.yml` | Push to `develop` | tests → `deploy-api` + `deploy-web` |
| `production-deploy.yml` | Push to `main` | tests → approval → `deploy-api` + `deploy-web` |

### Branch strategy

```
feature/xyz  ──► PR (CI runs)  ──► develop  ──► staging auto-deploy
                                      │
                                     main  ──► production (manual approval)
```

### How staging deploys work

1. `test-api` and `build-web` run in parallel using a GitHub-hosted Postgres
   service (not Neon — keeps CI isolated and free).
2. Both must pass before `deploy-api` and `deploy-web` run.
3. `deploy-api` POSTs to the Render staging deploy hook.
4. Render builds a new Docker image from `develop` HEAD, runs `entrypoint.sh`
   (`php artisan migrate --force` against the Neon staging DB), then starts
   nginx + php-fpm via supervisor.
5. Render health-checks `/api/v1/health`. The old container stays live until
   the new one passes — zero-downtime swap.
6. The workflow polls the health endpoint and fails loudly if the new container
   doesn't become healthy within 5 minutes.
7. `deploy-web` triggers a Vercel preview deployment aliased to
   `staging.kaiscoffee.com`.

### How production deploys work

Same as staging, with two differences:

- Jobs reference `environment: production`, which triggers the GitHub approval
  gate before anything touches Render or Vercel.
- `deploy-web` passes `--prod` to Vercel, promoting the build to `kaiscoffee.com`.

---

## Docker image (Render)

The API runs as a Docker container built from `api/Dockerfile`. The image uses:

- **php:8.3-fpm-alpine** — minimal PHP runtime
- **nginx** — serves HTTP; forwards `.php` requests to php-fpm
- **supervisor** — keeps nginx and php-fpm running under a single PID 1
- **`api/docker/entrypoint.sh`** — runs before supervisor starts:
  1. `php artisan migrate --force`
  2. `php artisan config:cache && route:cache && view:cache`
  3. Hands off to supervisor

Support files:

| File | Purpose |
|---|---|
| `api/Dockerfile` | Multi-stage build (deps stage + runtime stage) |
| `api/docker/nginx.conf` | nginx server block; listens on `$PORT` (Render injects this) |
| `api/docker/supervisord.conf` | Manages nginx + php-fpm; optional queue worker (commented) |
| `api/docker/php.ini` | OPcache tuning, upload limits, error logging |
| `api/docker/entrypoint.sh` | Migration + cache warm-up on every deploy |
| `api/.dockerignore` | Keeps secrets and dev files out of the image |

---

## Health checks

| Endpoint | Returns | Use |
|---|---|---|
| `GET /up` | HTML 200 | Laravel bootstrap check |
| `GET /api/v1/health` | JSON `{status, db, env}` | Render health check; uptime monitor |

`/api/v1/health` returns **200** when the Neon database is reachable and **503**
otherwise. Configure your uptime monitor (Better Uptime, UptimeRobot, etc.) to
poll this endpoint.

---

## Environment variable reference

### API (Render dashboard)

| Variable | Staging | Production |
|---|---|---|
| `APP_ENV` | `staging` | `production` |
| `APP_DEBUG` | `false` | `false` |
| `APP_URL` | Render staging URL | Render prod URL |
| `APP_KEY` | generated | generated (different) |
| `LOG_LEVEL` | `warning` | `error` |
| `DATABASE_URL` | Neon staging conn string | Neon prod conn string |
| `DB_SSLMODE` | `require` | `require` |
| `FRONTEND_URL` | `https://staging.kaiscoffee.com` | `https://kaiscoffee.com` |
| `SANCTUM_STATEFUL_DOMAINS` | `staging.kaiscoffee.com` | `kaiscoffee.com` |
| `TRUSTED_PROXIES` | `*` | `*` |
| `UPLOAD_DISK` | `public` (ephemeral) | `s3` |
| `AWS_*` | not set | set in Render dashboard |

### Web (Vercel dashboard)

| Variable | Preview | Production |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Render staging URL + `/api/v1` | Render prod URL + `/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | `Kai's Coffee` | `Kai's Coffee` |

---

## File uploads in production

Render container filesystems are ephemeral — files are lost on redeploy.

- **Staging** — `UPLOAD_DISK=public` is fine; images persist until the next
  deploy, which is acceptable for testing.
- **Production** — Set `UPLOAD_DISK=s3` and provide `AWS_*` credentials.
  The `UploadService` class switches disks automatically; no code changes needed.
  S3-compatible services (Cloudflare R2, DigitalOcean Spaces) also work; see
  `api/.env.example` for `AWS_ENDPOINT` and `AWS_USE_PATH_STYLE_ENDPOINT`.

---

## Rollback

### API (Render)

Render Dashboard → `kais-coffee-api-production` → **Deploys** → find the last
good deploy → **Redeploy**.

If the failed deploy included a migration, run
`php artisan migrate:rollback` via Render's **Shell** tab before redeploying.

### Web (Vercel)

Vercel Dashboard → project → **Deployments** → find the last good deployment
→ **⋯** → **Promote to Production**.

---

## Staging vs production at a glance

| | Staging | Production |
|---|---|---|
| Branch | `develop` | `main` |
| `APP_ENV` | `staging` | `production` |
| `LOG_LEVEL` | `warning` | `error` |
| Neon branch | `staging` | `main` |
| Vercel environment | Preview | Production |
| `UPLOAD_DISK` | `public` (ephemeral) | `s3` |
| Render plan | free (sleeps 15 min idle) | starter+ (always on) |
| Deploy trigger | automatic | manual approval required |
