/**
 * Kai's Coffee — API client
 */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ── Types ──────────────────────────────────────────────────────────────────
export type User = {
  id: number; name: string; email: string; phone: string | null; language_preference: string | null;
  is_admin: boolean; reward_account?: RewardAccount; created_at?: string; updated_at?: string;
};
export type RewardAccount = {
  id: number; user_id: number; points_balance: number; lifetime_points: number;
  updated_at?: string;
};
export type MenuCategory = {
  id: number; name: string; name_es: string | null; slug: string; description: string | null; description_es: string | null; image_url: string | null;
  sort_order: number; is_active: boolean; active_items?: MenuItem[];
};
export type MenuItem = {
  id: number; menu_category_id: number; name: string; name_es: string | null; slug: string; description: string | null; description_es: string | null;
  price: string; image_url: string | null; is_active: boolean; is_featured: boolean; is_seasonal: boolean; sort_order: number;
  category?: { id: number; name: string; slug: string };
};
export type PurchaseItem = { id: number; menu_item_id: number | null; name: string; unit_price: string; quantity: number; subtotal: string; };
export type Purchase = {
  id: number; user_id: number; staff_id: number | null; subtotal: string; discount: string; total: string;
  points_earned: number; points_redeemed: number; notes: string | null; status: "completed" | "voided" | "pending";
  created_at: string; items?: PurchaseItem[]; user?: Partial<User>;
};
export type DashboardData = {
  user: User; points_balance: number; lifetime_points: number; points_threshold: number;
  points_to_next: number; can_redeem: boolean; recent_purchases: Purchase[];
  purchases_enabled?: boolean;
};
export type AdminRewardActivity = {
  id: number;
  type: string;
  points: number;
  description: string;
  created_at: string;
  user_name: string | null;
  user_id: number | null;
};
export type AdminStats = {
  stats: {
    total_users: number;
    total_purchases?: number;
    month_revenue?: string;
    active_items: number;
    reward_ready?: number;
    redemptions_mo?: number;
    reward_threshold?: number;
  };
  recent_purchases: Purchase[];
  top_items: { name: string; qty_sold: number }[];
  recent_rewards?: AdminRewardActivity[];
  purchases_enabled?: boolean;
};
export type Paginated<T> = { data: T[]; current_page: number; last_page: number; per_page: number; total: number; };
export type RewardSummary = { points_balance: number; lifetime_points: number; threshold: number; can_redeem: boolean; };
export type UserDetail = { user: User & { purchases?: Purchase[] }; reward_summary: RewardSummary; purchases_enabled?: boolean; };
export type QrTokenResponse = { token: string; expires_at: string; ttl: number; };
export type ScanRedeemResponse = { message: string; customer: { id: number; name: string }; points_balance: number; lifetime_points: number; can_redeem: boolean; };
export type ScanStampResponse = { message: string; customer: { id: number; name: string }; points_balance: number; lifetime_points: number; can_redeem: boolean; };
export type RewardTx = { id: number; type: string; points: number; description: string; created_at: string; };
export type PageContent = Record<string, string | null>;

// ── Core fetch ─────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(public status: number, message: string, public errors?: Record<string, string[]>) { super(message); }
}

async function req<T>(path: string, opts: { method?: string; body?: unknown; token?: string | null } = {}): Promise<T> {
  const { method = "GET", body, token } = opts;
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body != null ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, data.message ?? "Request failed", data.errors);
  }
  return res.json() as Promise<T>;
}

// ── ISR revalidation (called after admin saves) ──────────────────────────
export async function revalidate(paths: string[]): Promise<void> {
  try {
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paths }),
    });
  } catch { /* best-effort — page will revalidate naturally within 5 min */ }
}

// ── File upload (multipart/form-data) ──────────────────────────────────────
async function upload<T>(path: string, formData: FormData, token: string): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json", Authorization: `Bearer ${token}` };
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, data.message ?? "Upload failed", data.errors);
  }
  return res.json() as Promise<T>;
}

// ── Auth ───────────────────────────────────────────────────────────────────
export const auth = {
  register: (body: { name: string; email: string; password: string; password_confirmation: string; phone?: string }) =>
    req<{ user: User; token: string }>("/auth/register", { method: "POST", body }),
  login: (body: { email: string; password: string }) =>
    req<{ user: User; token: string }>("/auth/login", { method: "POST", body }),
  logout: (token: string) => req("/auth/logout", { method: "POST", token }),
  me: (token: string) => req<User>("/auth/me", { token }),
  updateProfile: (token: string, body: { name?: string; phone?: string | null }) =>
    req<User>("/auth/me", { method: "PUT", body, token }),
  forgotPassword: (body: { email: string }) =>
    req<{ message: string }>("/auth/forgot-password", { method: "POST", body }),
  resetPassword: (body: { token: string; email: string; password: string; password_confirmation: string }) =>
    req<{ message: string }>("/auth/reset-password", { method: "POST", body }),
};

// ── Public Page Content ────────────────────────────────────────────────────
export const pageContent = {
  get: (page: string) => req<PageContent>(`/page-contents/${page}`),
};

// ── Public Menu ────────────────────────────────────────────────────────────
export const menu = {
  categories: () => req<MenuCategory[]>("/menu/categories"),
  items: ()    => req<MenuItem[]>("/menu/items"),
  featured: () => req<MenuItem[]>("/menu/featured"),
  seasonal: () => req<MenuItem[]>("/menu/seasonal"),
};

// ── Account ────────────────────────────────────────────────────────────────
export const account = {
  dashboard: (token: string) => req<DashboardData>("/account/dashboard", { token }),
  purchases: (token: string, page = 1) => req<Paginated<Purchase>>(`/account/purchases?page=${page}`, { token }),
  rewardsBalance: (token: string) =>
    req<{ points_balance: number; lifetime_points: number; points_threshold: number; points_to_next: number; can_redeem: boolean }>("/account/rewards/balance", { token }),
  rewardsHistory: (token: string, page = 1) =>
    req<Paginated<RewardTx>>(`/account/rewards/history?page=${page}`, { token }),
  redeem: (token: string) =>
    req<{ message: string; points_balance: number }>("/account/rewards/redeem", { method: "POST", token }),
  generateQrToken: (token: string) =>
    req<QrTokenResponse>("/account/rewards/qr-token", { method: "POST", token }),
  generateStampQrToken: (token: string) =>
    req<QrTokenResponse>("/account/rewards/stamp-qr-token", { method: "POST", token }),
};

// ── Admin ──────────────────────────────────────────────────────────────────
export const admin = {
  dashboard: (token: string) => req<AdminStats>("/admin/dashboard", { token }),
  users: {
    list: (token: string, search = "", page = 1) =>
      req<Paginated<User & { reward_account?: RewardAccount }>>(`/admin/users?search=${encodeURIComponent(search)}&page=${page}`, { token }),
    get: (token: string, id: number) =>
      req<UserDetail>(`/admin/users/${id}`, { token }),
    update: (token: string, id: number, body: { name?: string; email?: string; phone?: string | null; language_preference?: string | null }) =>
      req<User>(`/admin/users/${id}`, { method: "PUT", body, token }),
    adjustStamps: (token: string, id: number, body: { amount: number; reason: string }) =>
      req<{ message: string; points_balance: number; lifetime_points: number; can_redeem: boolean }>(`/admin/users/${id}/adjust-stamps`, { method: "POST", body, token }),
    redeemReward: (token: string, id: number) =>
      req<{ message: string; points_balance: number; lifetime_points: number; can_redeem: boolean }>(`/admin/users/${id}/redeem-reward`, { method: "POST", token }),
    scanRedeem: (token: string, qrToken: string) =>
      req<ScanRedeemResponse>("/admin/scan-redeem", { method: "POST", body: { token: qrToken }, token }),
    scanStamp: (token: string, qrToken: string) =>
      req<ScanStampResponse>("/admin/scan-stamp", { method: "POST", body: { token: qrToken }, token }),
  },
  menu: {
    categories: (token: string) => req<MenuCategory[]>("/admin/menu/categories", { token }),
    createCategory: (token: string, body: Partial<MenuCategory>) =>
      req<MenuCategory>("/admin/menu/categories", { method: "POST", body, token }),
    updateCategory: (token: string, id: number, body: Partial<MenuCategory>) =>
      req<MenuCategory>(`/admin/menu/categories/${id}`, { method: "PUT", body, token }),
    deleteCategory: (token: string, id: number) => req(`/admin/menu/categories/${id}`, { method: "DELETE", token }),
    items: (token: string, categoryId?: number) =>
      req<MenuItem[]>(`/admin/menu/items${categoryId ? `?category_id=${categoryId}` : ""}`, { token }),
    createItem: (token: string, body: Partial<MenuItem & { menu_category_id: number; price: number; name_es?: string | null }>) =>
      req<MenuItem>("/admin/menu/items", { method: "POST", body, token }),
    updateItem: (token: string, id: number, body: Partial<MenuItem & { price: number; name_es?: string | null }>) =>
      req<MenuItem>(`/admin/menu/items/${id}`, { method: "PUT", body, token }),
    deleteItem: (token: string, id: number) => req(`/admin/menu/items/${id}`, { method: "DELETE", token }),
    uploadItemImage: (token: string, id: number, file: File) => {
      const fd = new FormData();
      fd.append("image", file);
      return upload<MenuItem>(`/admin/menu/items/${id}/image`, fd, token);
    },
  },
  purchases: {
    list: (token: string, page = 1) => req<Paginated<Purchase>>(`/admin/purchases?page=${page}`, { token }),
    create: (token: string, body: { user_id: number; items: { menu_item_id: number; quantity: number }[]; redeem_reward?: boolean; notes?: string }) =>
      req<Purchase>("/admin/purchases", { method: "POST", body, token }),
    void: (token: string, id: number) => req(`/admin/purchases/${id}/void`, { method: "PATCH", token }),
  },
  pageContent: {
    get: (token: string, page: string) =>
      req<PageContent>(`/admin/page-contents/${page}`, { token }),
    update: (token: string, page: string, data: Record<string, string | null>) =>
      req<PageContent>(`/admin/page-contents/${page}`, { method: "PUT", body: data, token }),
    uploadImage: (token: string, page: string, file: File) => {
      const fd = new FormData();
      fd.append("image", file);
      return upload<PageContent>(`/admin/page-contents/${page}/image`, fd, token);
    },
    removeImage: (token: string, page: string) =>
      req<PageContent>(`/admin/page-contents/${page}/image`, { method: "DELETE", token }),
    uploadImageByKey: (token: string, page: string, imageKey: string, file: File) => {
      const fd = new FormData();
      fd.append("image", file);
      return upload<PageContent>(`/admin/page-contents/${page}/images/${imageKey}`, fd, token);
    },
    removeImageByKey: (token: string, page: string, imageKey: string) =>
      req<PageContent>(`/admin/page-contents/${page}/images/${imageKey}`, { method: "DELETE", token }),
  },
};
