# Kai's Coffee — MVP Specification

**Version:** 0.1 — Scaffold
**Date:** March 2026
**Status:** In Progress

---

## 1. Overview

Kai's Coffee is a mobile-first Progressive Web App for a premium artisan coffee shop.
Customers scan a QR code to browse the menu, create an account, track purchases,
and earn loyalty points toward a free coffee.

### Core Value Proposition

| For the customer | For the owner |
|---|---|
| Instant menu access (no app install) | Direct customer loyalty channel |
| Earn 1 pt / $1 — 50 pts = free coffee | Purchase analytics & repeat visits |
| Offline-capable PWA | No third-party loyalty fee |

---

## 2. Reward Rule

```
1 point earned per $1 spent (rounded down)
50 points = 1 free coffee (any regular size)
Points do NOT expire (MVP — reconsider at v1.0)
```

---

## 3. User Roles

| Role | Capabilities |
|---|---|
| **Guest** | View public menu (QR code entry) |
| **Customer** | Register, login, view orders, view/redeem points |
| **Admin** | All customer capabilities + dashboard, product CRUD, user management |

---

## 4. Feature Scope

### 4.1 Public Menu (QR Code)

- Route: `GET /menu`
- Lists all active products grouped by category
- Circular product photos, price, short description
- No auth required
- Static or ISR-rendered for performance

### 4.2 Authentication

- Email + password registration
- Login → Sanctum bearer token stored in httpOnly cookie via Route Handler
- Logout clears token
- `/auth/me` for client-side user hydration

### 4.3 Purchase Tracking

- Admin/staff creates orders via API or admin dashboard
- Each order records: items, quantities, total, points earned/redeemed
- Points auto-calculated: `floor(total_amount)` → points_earned
- Order status: `pending | completed | cancelled`

### 4.4 Reward Points

- Balance visible on user dashboard
- Progress bar: current pts / 50
- Redeem endpoint deducts 50 pts and records redemption
- Lifetime points tracked separately (never decremented)

### 4.5 Admin Dashboard

- Summary stats: users, products, orders, revenue
- Product CRUD (name, price, category, image, active toggle)
- Order list with filters (status, date, user)
- User list (view points balance, order count)

### 4.6 PWA Features

- `manifest.json` with icons and theme color
- Service worker via `next-pwa` (Workbox)
- Offline fallback page
- "Add to Home Screen" prompt
- Theme color: powder blue `#d6e8f5`

---

## 5. Database Schema

```
users
  id, name, email, password
  reward_points       -- current redeemable balance
  lifetime_points     -- all-time earned (never decremented)
  is_admin
  email_verified_at, created_at, updated_at

products
  id, name, description, price
  image_url, category
  is_active, sort_order
  created_at, updated_at

orders
  id, user_id
  total_amount
  points_earned, points_redeemed
  status (pending|completed|cancelled)
  notes
  created_at, updated_at

order_items
  id, order_id, product_id
  quantity, unit_price, subtotal
  created_at, updated_at

personal_access_tokens  (Sanctum)
```

---

## 6. API Contract (v1)

All endpoints prefixed `/api/v1`. JSON request/response.
Auth: `Authorization: Bearer <token>`.

### Auth
```
POST /auth/register    { name, email, password, password_confirmation }
POST /auth/login       { email, password }
POST /auth/logout      (auth)
GET  /auth/me          (auth)
```

### Menu
```
GET  /menu             → Product[]
GET  /menu/:id         → Product
```

### Orders
```
GET  /orders           (auth) → paginated Order[]
POST /orders           (auth) { items: [{product_id, quantity}], notes? }
GET  /orders/:id       (auth) → Order with items
```

### Rewards
```
GET  /rewards/balance  (auth) → { reward_points, lifetime_points, points_to_free_coffee, free_coffee_available }
POST /rewards/redeem   (auth) → deduct 50 pts, return new balance
```

### Admin
```
GET  /admin/dashboard  (admin) → { users, products, orders, revenue }
POST /admin/products   (admin)
PUT  /admin/products/:id (admin)
DELETE /admin/products/:id (admin)
```

---

## 7. Front-End Routes

| Path | Page | Auth |
|---|---|---|
| `/` | Home / landing | — |
| `/menu` | Public menu (QR entry) | — |
| `/auth/login` | Login form | — |
| `/auth/register` | Registration form | — |
| `/dashboard` | User dashboard | Customer |
| `/admin` | Admin dashboard | Admin |

---

## 8. Non-Functional Requirements

- **Performance:** Menu page LCP < 2s (ISR or static)
- **PWA score:** Lighthouse PWA ≥ 90
- **Mobile-first:** Designed for 390 px viewport (iPhone 14 Pro)
- **Accessibility:** WCAG 2.1 AA for form elements and color contrast
- **Security:** Sanctum tokens, password hashing (bcrypt), input validation

---

## 9. Out of Scope (MVP)

- Online payment / Stripe integration
- Push notifications
- Multi-location support
- Loyalty tiers
- Physical POS integration

---

## 10. Sprint Plan (suggested)

| Sprint | Deliverables |
|---|---|
| 0 (current) | Scaffold: monorepo, Laravel skeleton, Next.js PWA shell |
| 1 | DB migrations, product seeder, public menu page (data-driven) |
| 2 | Auth (register/login), token management, `/dashboard` UI |
| 3 | Order creation, point awarding logic, redemption endpoint |
| 4 | Admin dashboard UI, product CRUD |
| 5 | QR code generation, PWA polish, offline page |
| 6 | CI/CD to production, lighthouse audit, beta launch |
