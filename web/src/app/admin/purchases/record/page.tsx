"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import ItemImage from "@/components/ui/ItemImage";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { admin as adminApi, menu as menuApi, account as accountApi, type MenuItem, type MenuCategory, type User } from "@/lib/api";
import { getToken } from "@/contexts/AuthContext";

type CartItem = { menuItem: MenuItem; quantity: number };

// ── Quantity stepper ──────────────────────────────────────────────────────────

function Stepper({ value, onDec, onInc }: { value: number; onDec: () => void; onInc: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onDec}
        className="kc-btn kc-btn-sm kc-btn-outline"
        style={{ padding: "0.2rem 0.55rem", lineHeight: 1 }}
      >
        −
      </button>
      <span className="w-7 text-center text-sm font-bold tabular-nums">{value}</span>
      <button
        onClick={onInc}
        className="kc-btn kc-btn-sm"
        style={{ padding: "0.2rem 0.55rem", lineHeight: 1 }}
      >
        +
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RecordPurchasePage() {
  const router = useRouter();

  // Menu
  const [categories,   setCategories]   = useState<MenuCategory[]>([]);
  const [activeCat,    setActiveCat]    = useState<number | null>(null);
  const [menuLoading,  setMenuLoading]  = useState(true);

  // Customer search
  const [search,    setSearch]    = useState("");
  const [results,   setResults]   = useState<User[]>([]);
  const [customer,  setCustomer]  = useState<User | null>(null);
  const [searching, setSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reward threshold from API (falls back to 50)
  const [threshold, setThreshold] = useState(50);

  // Cart
  const [cart,         setCart]         = useState<CartItem[]>([]);
  const [redeemReward, setRedeemReward] = useState(false);
  const [notes,        setNotes]        = useState("");

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState<string | null>(null);

  // Load menu categories + reward threshold in parallel
  useEffect(() => {
    const token = getToken();
    Promise.all([
      menuApi.categories(),
      token ? accountApi.rewardsBalance(token).catch(() => null) : Promise.resolve(null),
    ]).then(([cats, bal]) => {
      setCategories(cats);
      if (cats.length > 0) setActiveCat(cats[0].id);
      if (bal?.points_threshold) setThreshold(bal.points_threshold);
    }).catch(() => {}).finally(() => setMenuLoading(false));
  }, []);

  // Close customer dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setResults([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced customer search
  const searchCustomers = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    const token = getToken();
    if (!token) return;
    setSearching(true);
    try {
      const data = await adminApi.users.list(token, q);
      setResults(data.data);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchCustomers(search), 350);
    return () => clearTimeout(t);
  }, [search, searchCustomers]);

  // Cart helpers
  const addItem = (menuItem: MenuItem) =>
    setCart(prev => {
      const hit = prev.find(c => c.menuItem.id === menuItem.id);
      if (hit) return prev.map(c => c.menuItem.id === menuItem.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItem, quantity: 1 }];
    });

  const removeItem = (id: number) => setCart(prev => prev.filter(c => c.menuItem.id !== id));

  const setQty = (id: number, qty: number) => {
    if (qty <= 0) { removeItem(id); return; }
    setCart(prev => prev.map(c => c.menuItem.id === id ? { ...c, quantity: qty } : c));
  };

  // Totals — use spread to avoid mutating state
  const subtotal = cart.reduce((s, c) => s + parseFloat(c.menuItem.price) * c.quantity, 0);
  const canRedeem = !!(customer?.reward_account && customer.reward_account.points_balance >= threshold);

  const cheapestPrice = cart.length > 0
    ? Math.min(...cart.map(c => parseFloat(c.menuItem.price)))
    : 0;
  const discount = redeemReward && canRedeem ? Math.min(cheapestPrice, subtotal) : 0;
  const total    = Math.max(0, subtotal - discount);
  const points   = Math.floor(total);

  const cartQty = (id: number) => cart.find(c => c.menuItem.id === id)?.quantity ?? 0;
  const activeCategory = categories.find(c => c.id === activeCat);

  const selectCustomer = (u: User) => {
    setCustomer(u);
    setSearch("");
    setResults([]);
    setRedeemReward(false);
  };

  const handleSubmit = async () => {
    if (!customer)       { setError("Please select a customer."); return; }
    if (cart.length === 0) { setError("Please add at least one item."); return; }
    const token = getToken();
    if (!token) return;

    setError(null);
    setSubmitting(true);
    try {
      await adminApi.purchases.create(token, {
        user_id:       customer.id,
        items:         cart.map(c => ({ menu_item_id: c.menuItem.id, quantity: c.quantity })),
        redeem_reward: redeemReward,
        notes:         notes || undefined,
      });
      setSuccess(`Purchase recorded. ${points} pts awarded to ${customer.name}.`);
      // Brief pause so the staff can read the confirmation, then navigate
      setTimeout(() => router.push("/admin/purchases"), 1800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save purchase.");
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Record Purchase
        </h1>
        <button onClick={() => router.back()} className="kc-btn kc-btn-outline kc-btn-sm">
          Cancel
        </button>
      </div>

      {/* Global success banner */}
      {success && (
        <div className="mb-5 py-3 px-4 rounded-xl text-sm font-semibold"
             style={{ background: "#d1fae5", color: "var(--kc-success)" }}>
          ✓ {success}
        </div>
      )}

      {/* Global error (e.g. no customer selected when cart is empty) */}
      {error && (
        <div className="mb-5 py-3 px-4 rounded-xl text-sm"
             style={{ background: "#fee2e2", color: "var(--kc-error)" }}
             onClick={() => setError(null)}>
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">

        {/* ── Left: Customer + Cart ────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {/* Customer search */}
          <div className="kc-card p-5">
            <h2 className="font-bold text-base mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              Customer
            </h2>

            {customer ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="kc-img-placeholder shrink-0"
                       style={{ width: 40, height: 40, fontSize: "1rem" }}>
                    {customer.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{customer.name}</p>
                    <p className="text-xs truncate" style={{ color: "var(--kc-muted)" }}>
                      {customer.email}
                    </p>
                    {customer.reward_account ? (
                      <p className="text-xs mt-0.5 font-semibold" style={{ color: "var(--kc-gold)" }}>
                        {customer.reward_account.points_balance} pts available
                      </p>
                    ) : (
                      <p className="text-xs mt-0.5" style={{ color: "var(--kc-muted)" }}>
                        No reward account
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => { setCustomer(null); setSearch(""); setRedeemReward(false); }}
                  className="kc-btn kc-btn-sm kc-btn-outline shrink-0"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or email…"
                  className="kc-input"
                  autoComplete="off"
                />
                {searching && (
                  <p className="text-xs mt-2" style={{ color: "var(--kc-muted)" }}>Searching…</p>
                )}
                {results.length > 0 && (
                  <div
                    className="absolute top-full left-0 right-0 z-30 mt-1 rounded-xl overflow-hidden"
                    style={{
                      background: "var(--kc-cream)",
                      border: "1.5px solid var(--kc-border)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    }}
                  >
                    {results.map(u => (
                      <button
                        key={u.id}
                        onClick={() => selectCustomer(u)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-(--kc-cream-dark) transition-colors"
                      >
                        <div className="kc-img-placeholder shrink-0"
                             style={{ width: 36, height: 36, fontSize: "0.875rem" }}>
                          {u.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{u.name}</p>
                          <p className="text-xs truncate" style={{ color: "var(--kc-muted)" }}>
                            {u.email} · {u.reward_account?.points_balance ?? 0} pts
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {search.trim() && !searching && results.length === 0 && (
                  <p className="text-xs mt-2" style={{ color: "var(--kc-muted)" }}>
                    No customers found.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="kc-card p-5">
            <h2 className="font-bold text-base mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              Cart{" "}
              {cart.length > 0 && (
                <span className="kc-badge kc-badge-blue ml-1">
                  {cart.reduce((n, c) => n + c.quantity, 0)}
                </span>
              )}
            </h2>

            {cart.length === 0 ? (
              <p className="text-sm py-6 text-center" style={{ color: "var(--kc-muted)" }}>
                Select items from the menu →
              </p>
            ) : (
              <>
                {/* Line items */}
                {cart.map(item => (
                  <div
                    key={item.menuItem.id}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderBottom: "1px solid var(--kc-cream-dark)" }}
                  >
                    <ItemImage name={item.menuItem.name} imageUrl={item.menuItem.image_url} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.menuItem.name}</p>
                      <p className="text-xs" style={{ color: "var(--kc-muted)" }}>
                        ${parseFloat(item.menuItem.price).toFixed(2)} each
                      </p>
                    </div>
                    <Stepper
                      value={item.quantity}
                      onDec={() => setQty(item.menuItem.id, item.quantity - 1)}
                      onInc={() => setQty(item.menuItem.id, item.quantity + 1)}
                    />
                    <span className="font-bold text-sm w-14 text-right tabular-nums">
                      ${(parseFloat(item.menuItem.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}

                {/* Totals */}
                <div className="mt-4 pt-3" style={{ borderTop: "1.5px solid var(--kc-border)" }}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: "var(--kc-muted)" }}>Subtotal</span>
                    <span className="tabular-nums">${subtotal.toFixed(2)}</span>
                  </div>

                  {/* Reward redemption toggle — only when customer has enough points */}
                  {canRedeem && (
                    <label className="flex items-center gap-2 mt-3 mb-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={redeemReward}
                        onChange={e => setRedeemReward(e.target.checked)}
                      />
                      <span className="text-sm font-bold" style={{ color: "var(--kc-gold)" }}>
                        Redeem {threshold} pts — free coffee
                      </span>
                    </label>
                  )}

                  {redeemReward && discount > 0 && (
                    <div className="flex justify-between text-sm mt-1" style={{ color: "var(--kc-gold)" }}>
                      <span>Reward discount</span>
                      <span className="tabular-nums">−${discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-base mt-2 pt-2"
                       style={{ borderTop: "1px solid var(--kc-cream-dark)" }}>
                    <span>Total</span>
                    <span className="tabular-nums">${total.toFixed(2)}</span>
                  </div>

                  {/* Points preview */}
                  <div className="mt-3 py-2.5 px-3 rounded-lg flex items-center justify-between"
                       style={{ background: "var(--kc-gold-lt)" }}>
                    <span className="text-xs font-semibold" style={{ color: "var(--kc-gold)" }}>
                      Points to award
                    </span>
                    <span className="text-sm font-bold" style={{ color: "var(--kc-gold)" }}>
                      +{points} pts
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-4">
                  <label className="kc-label" htmlFor="notes">Notes <span style={{ color: "var(--kc-muted)", fontWeight: 400 }}>(optional)</span></label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="kc-input"
                    style={{ height: "3.5rem", resize: "vertical" }}
                    placeholder="Special requests, allergy notes, etc."
                  />
                </div>
              </>
            )}

            {/* Confirm button — always visible once cart has items */}
            {cart.length > 0 && (
              <button
                onClick={handleSubmit}
                disabled={submitting || !!success}
                className="kc-btn w-full mt-4"
              >
                {submitting ? "Saving…" : "Confirm Purchase"}
              </button>
            )}
          </div>
        </div>

        {/* ── Right: Menu browser ──────────────────────────────────────────── */}
        <div className="kc-card overflow-hidden flex flex-col"
             style={{ maxHeight: "calc(100vh - 10rem)" }}>

          {/* Category tabs */}
          <div className="px-4 pt-4 pb-3 shrink-0"
               style={{ borderBottom: "1.5px solid var(--kc-border)" }}>
            <h2 className="font-bold text-base mb-3" style={{ fontFamily: "var(--font-heading)" }}>
              Menu
            </h2>
            {menuLoading ? (
              <div className="flex gap-2">
                {[1,2,3].map(i => (
                  <div key={i} className="h-8 w-20 rounded-full animate-pulse"
                       style={{ background: "var(--kc-cream-dark)" }} />
                ))}
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCat(cat.id)}
                    className="kc-btn kc-btn-sm shrink-0"
                    style={{
                      background:   activeCat === cat.id ? "var(--kc-black)"   : "transparent",
                      color:        activeCat === cat.id ? "var(--kc-white)"   : "var(--kc-black)",
                      borderColor:  "var(--kc-border)",
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Item list */}
          <div className="overflow-y-auto flex-1">
            {menuLoading ? (
              <LoadingSpinner text="Loading menu…" />
            ) : (
              (activeCategory?.active_items ?? []).map(item => {
                const qty = cartQty(item.id);
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-(--kc-cream-dark)"
                    style={{
                      borderBottom: "1px solid var(--kc-cream-dark)",
                      background: qty > 0 ? "var(--kc-gold-lt)" : undefined,
                    }}
                    onClick={() => addItem(item)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ItemImage name={item.name} imageUrl={item.image_url} size={44} />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{item.name}</p>
                        <p className="text-xs" style={{ color: "var(--kc-muted)" }}>
                          ${parseFloat(item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {qty > 0 ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="kc-badge kc-badge-gold">×{qty}</span>
                        <button
                          className="kc-btn kc-btn-sm"
                          style={{ padding: "0.25rem 0.75rem" }}
                          onClick={e => { e.stopPropagation(); addItem(item); }}
                        >
                          +1
                        </button>
                      </div>
                    ) : (
                      <button
                        className="kc-btn kc-btn-sm kc-btn-outline shrink-0"
                        style={{ padding: "0.25rem 0.75rem" }}
                        onClick={e => { e.stopPropagation(); addItem(item); }}
                      >
                        Add
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
