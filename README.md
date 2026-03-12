# Kai's Coffee

> Artisan coffee shop PWA with loyalty rewards — built with Laravel + Next.js

## Monorepo Structure

```
kais-coffee/
├── api/                  Laravel 11 REST API (PHP 8.3+, PostgreSQL)
├── web/                  Next.js 15 PWA (TypeScript, Tailwind CSS)
├── docs/                 Project documentation
│   └── mvp-spec.md       MVP feature specification
└── .github/
    └── workflows/
        ├── api.yml       Laravel CI (tests + lint)
        ├── web.yml       Next.js CI (build + lint)
        └── deploy.yml    Production deploy workflow (placeholder)
```

## Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| API       | Laravel 11 + Sanctum    |
| Database  | PostgreSQL              |
| Frontend  | Next.js 15 (App Router) |
| Styling   | Tailwind CSS v4         |
| PWA       | next-pwa                |
| Auth      | Sanctum token-based     |

## Reward Rule

> **1 point per $1 spent · 50 points = free coffee**

## Quick Start

### Prerequisites
- PHP 8.3+, Composer 2
- Node 20+, npm
- PostgreSQL 15+

### API

```bash
cd api
cp .env.example .env
composer install
php artisan key:generate
# Configure DB_* vars in .env
php artisan migrate
php artisan serve          # http://localhost:8000
```

### Web

```bash
cd web
cp .env.local.example .env.local
npm install
npm run dev                # http://localhost:3000
```

### PWA Install

On a supported mobile browser, visit `http://localhost:3000`, tap
"Add to Home Screen" when prompted. The app runs offline-capable after
the service worker caches assets.

## QR Code (Public Menu)

Generate a QR code pointing to `https://your-domain.com/menu`.
Scanning it opens the public product menu — no login required.

## API Endpoints

| Method | Path                          | Auth     | Description              |
|--------|-------------------------------|----------|--------------------------|
| POST   | /api/v1/auth/register         | —        | Register                 |
| POST   | /api/v1/auth/login            | —        | Login → token            |
| POST   | /api/v1/auth/logout           | Bearer   | Logout                   |
| GET    | /api/v1/auth/me               | Bearer   | Current user             |
| GET    | /api/v1/menu                  | —        | Public product list      |
| GET    | /api/v1/orders                | Bearer   | Order history            |
| POST   | /api/v1/orders                | Bearer   | Create order             |
| GET    | /api/v1/rewards/balance       | Bearer   | Points balance           |
| POST   | /api/v1/rewards/redeem        | Bearer   | Redeem free coffee       |
| GET    | /api/v1/admin/dashboard       | Admin    | Dashboard stats          |

## Brand / Theme

- **Background:** Soft powder blue (`#d6e8f5`)
- **Headings:** Playfair Display (elegant serif)
- **Body:** Lato (light weight, airy feel)
- **Product photos:** Circular crop
- **Borders:** Refined black (`#1a1a1a`, 1.5 px)
- **Reward accent:** Gold (`#c9a84c`)

## Roadmap

See [docs/mvp-spec.md](docs/mvp-spec.md) for the full feature plan.

---

Made with care for great coffee.
