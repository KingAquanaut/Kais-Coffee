"use client";
import { useEffect, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { auth as authApi, ApiError } from "@/lib/api";
import { getToken } from "@/contexts/AuthContext";

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();

  const [name,  setName]  = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [msg,   setMsg]   = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (user) { setName(user.name); setPhone(user.phone ?? ""); }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setMsg(null);
    try {
      await authApi.updateProfile(token, { name, phone: phone || null });
      await refreshUser();
      setMsg({ text: "Profile updated.", ok: true });
    } catch (err) {
      const m = err instanceof ApiError ? err.message : "Could not save.";
      setMsg({ text: m, ok: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <h1 className="text-3xl font-bold mb-6" style={{ fontFamily: "var(--font-heading)" }}>Profile</h1>

      <div className="kc-card p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="kc-img-placeholder"
            style={{ width: 64, height: 64, fontSize: "1.5rem", flexShrink: 0 }}
          >
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-lg" style={{ fontFamily: "var(--font-heading)" }}>{user?.name}</p>
            <p className="text-sm" style={{ color: "var(--kc-muted)" }}>{user?.email}</p>
          </div>
        </div>

        {msg && (
          <div className="mb-4 py-2.5 px-4 rounded-lg text-xs"
               style={{ background: msg.ok ? "#d1fae5" : "#fee2e2", color: msg.ok ? "var(--kc-success)" : "var(--kc-error)" }}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="kc-label" htmlFor="name">Name</label>
            <input id="name" type="text" value={name} onChange={e => setName(e.target.value)}
              className="kc-input" required />
          </div>
          <div>
            <label className="kc-label" htmlFor="email">Email <span style={{ color: "var(--kc-muted)", fontWeight: 400 }}>(read-only)</span></label>
            <input id="email" type="email" value={user?.email ?? ""} className="kc-input" disabled
              style={{ opacity: 0.6, cursor: "not-allowed" }} />
          </div>
          <div>
            <label className="kc-label" htmlFor="phone">Phone</label>
            <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              className="kc-input" placeholder="(555) 000-0000" />
          </div>
          <button type="submit" disabled={saving} className="kc-btn">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>

      <div className="kc-card p-6 flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm" style={{ fontFamily: "var(--font-heading)" }}>Sign out of this device</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--kc-muted)" }}>You can sign back in at any time.</p>
        </div>
        <button onClick={() => logout()} className="kc-btn kc-btn-outline">Sign Out</button>
      </div>
    </AppLayout>
  );
}
