"use client";
import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/admin/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/admin/Card";
import Button from "@/components/admin/Button";
import LoadingState from "@/components/admin/LoadingState";
import Toast from "@/components/admin/Toast";
import { admin as adminApi, ApiError, revalidate } from "@/lib/api";
import { getToken } from "@/contexts/AuthContext";

// ── Defaults ──────────────────────────────────────────────────────────────
const DEFAULTS = {
  hero_heading:   "Every cup, a small pleasure.",
  hero_subtext:   "Single-origin espresso, slow-steeped cold brews, and house-baked pastries — crafted with care, for you.",
  hero_image_url: "",
  pillar_1_title:    "Espresso Bar",
  pillar_1_body:     "Single-origin beans pulled at 9 bar. Notes of dark chocolate and hazelnut.",
  pillar_1_title_es: "",
  pillar_1_body_es:  "",
  pillar_2_title:    "Cold Brew",
  pillar_2_body:     "18-hour cold steep. Nitrogen on tap. Smooth, never bitter.",
  pillar_2_title_es: "",
  pillar_2_body_es:  "",
  pillar_3_title:    "House Pastries",
  pillar_3_body:     "Almond croissants, banana bread, seasonal scones. Baked fresh daily.",
  pillar_3_title_es: "",
  pillar_3_body_es:  "",
};

type Form = typeof DEFAULTS;

export default function AdminHomePage() {
  const token = getToken();
  const [form, setForm] = useState<Form>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [removeHero, setRemoveHero] = useState(false);
  const [savingHero, setSavingHero] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    adminApi.pageContent.get(token, "home")
      .then(data => {
        const merged: Form = { ...DEFAULTS };
        for (const k of Object.keys(DEFAULTS) as (keyof Form)[]) {
          if (data[k] !== null && data[k] !== undefined) merged[k] = data[k] ?? "";
        }
        setForm(merged);
      })
      .catch(() => setToast({ kind: "error", message: "Could not load page content." }))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!imageFile) { setImagePreviewUrl(null); return; }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const set = (key: keyof Form, value: string) => setForm(f => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const { hero_image_url: _h, ...textFields } = form;
      void _h;
      await adminApi.pageContent.update(token, "home", textFields);
      await revalidate(["/"]);
      setToast({ kind: "success", message: "Home page saved" });
    } catch (e) {
      setToast({ kind: "error", message: e instanceof Error ? e.message : "Could not save." });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHero = async () => {
    if (!token) return;
    setSavingHero(true);
    try {
      if (removeHero) {
        const updated = await adminApi.pageContent.removeImage(token, "home");
        setForm(f => ({ ...f, hero_image_url: updated.hero_image_url ?? "" }));
        setRemoveHero(false);
        setToast({ kind: "success", message: "Hero image removed" });
      } else if (imageFile) {
        const updated = await adminApi.pageContent.uploadImage(token, "home", imageFile);
        setForm(f => ({ ...f, hero_image_url: updated.hero_image_url ?? "" }));
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setToast({ kind: "success", message: "Hero image updated" });
      }
      await revalidate(["/"]);
    } catch (e) {
      const msg = e instanceof ApiError && e.errors?.image ? e.errors.image[0]
                : e instanceof Error ? e.message : "Could not save image.";
      setToast({ kind: "error", message: msg });
    } finally {
      setSavingHero(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 20 * 1024 * 1024) {
      setToast({ kind: "error", message: "File is too large — max 20 MB" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setImageFile(file);
    if (file) setRemoveHero(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const currentImageUrl = removeHero ? null : (imagePreviewUrl ?? (form.hero_image_url || null));

  if (loading) {
    return <AdminLayout><LoadingState text="Loading page content…" /></AdminLayout>;
  }

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Content"
        title="Home Page"
        description="Edit the public landing page — hero, and the three pillars below it."
        actions={
          <Button variant="primary" onClick={handleSave} loading={saving}>
            Save changes
          </Button>
        }
      />

      <div className="flex flex-col gap-6 pb-24">
        {/* Hero image */}
        <Card padding="none">
          <CardHeader><CardTitle>Hero Background Image</CardTitle></CardHeader>
          <div className="px-5 py-5 flex items-center gap-4">
            <div
              className="shrink-0 overflow-hidden"
              style={{
                width: 140, height: 80, borderRadius: 10,
                background: "linear-gradient(160deg, #d8c5a8 0%, #f0e8dc 100%)",
                border: "1px solid var(--admin-border)",
              }}
            >
              {currentImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentImageUrl} alt="Hero preview"
                     style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs"
                     style={{ color: "var(--admin-ink-faint)" }}>
                  No image
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileChange}
                id="home-hero-image"
              />
              <div className="flex gap-2 flex-wrap">
                <label htmlFor="home-hero-image" className="cursor-pointer">
                  <span
                    className="inline-flex items-center justify-center px-3 h-9 text-sm font-semibold rounded-lg"
                    style={{
                      border: "1px solid var(--admin-border-strong)",
                      background: "var(--admin-surface)",
                      color: "var(--admin-ink)",
                    }}
                  >
                    {imageFile ? "Change file…" : "Upload image"}
                  </span>
                </label>
                {(form.hero_image_url || imageFile) && !removeHero && (
                  <button type="button"
                          onClick={() => { setRemoveHero(true); setImageFile(null); }}
                          className="text-xs font-semibold"
                          style={{ color: "var(--admin-danger)" }}>
                    Remove image
                  </button>
                )}
                {removeHero && (
                  <button type="button" onClick={() => setRemoveHero(false)}
                          className="text-xs font-semibold underline"
                          style={{ color: "var(--admin-ink-muted)" }}>
                    Undo
                  </button>
                )}
              </div>
              {imageFile && (
                <p className="text-xs truncate" style={{ color: "var(--admin-ink-muted)" }}>
                  {imageFile.name}
                </p>
              )}
              <p className="text-xs" style={{ color: "var(--admin-ink-muted)" }}>
                JPEG, PNG, WebP, or GIF · max 20 MB · wide landscape works best
              </p>
            </div>
            <Button
              variant="secondary" size="sm"
              onClick={handleSaveHero}
              loading={savingHero}
              disabled={!imageFile && !removeHero}
            >
              Save image
            </Button>
          </div>
        </Card>

        {/* Hero text */}
        <Card padding="none">
          <CardHeader><CardTitle>Hero Text</CardTitle></CardHeader>
          <div className="px-5 py-5 flex flex-col gap-4">
            <div>
              <label className="admin-label">Heading</label>
              <input className="admin-input" value={form.hero_heading}
                     onChange={e => set("hero_heading", e.target.value)} />
            </div>
            <div>
              <label className="admin-label">Subtext</label>
              <textarea className="admin-textarea" rows={3} value={form.hero_subtext}
                        onChange={e => set("hero_subtext", e.target.value)} />
            </div>
          </div>
        </Card>

        {/* Pillars */}
        <Card padding="none">
          <CardHeader>
            <div>
              <CardTitle>Three Pillars</CardTitle>
              <p className="text-xs mt-0.5" style={{ color: "var(--admin-ink-muted)" }}>
                The three feature cards below the hero on the home page.
              </p>
            </div>
          </CardHeader>
          <div className="px-5 py-5 flex flex-col gap-5">
            {([1, 2, 3] as const).map(n => (
              <div key={n} className={n > 1 ? "pt-5" : ""}
                   style={n > 1 ? { borderTop: "1px solid var(--admin-border)" } : undefined}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3"
                   style={{ color: "var(--admin-ink-muted)" }}>Pillar {n}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="admin-label">Title · EN</label>
                    <input className="admin-input" value={form[`pillar_${n}_title`]}
                           onChange={e => set(`pillar_${n}_title`, e.target.value)} />
                  </div>
                  <div>
                    <label className="admin-label" style={{ color: "var(--admin-gold)" }}>Title · ES</label>
                    <input className="admin-input" value={form[`pillar_${n}_title_es`]}
                           onChange={e => set(`pillar_${n}_title_es`, e.target.value)}
                           placeholder="Leave blank to use English" />
                  </div>
                  <div>
                    <label className="admin-label">Body · EN</label>
                    <textarea className="admin-textarea" rows={3} value={form[`pillar_${n}_body`]}
                              onChange={e => set(`pillar_${n}_body`, e.target.value)} />
                  </div>
                  <div>
                    <label className="admin-label" style={{ color: "var(--admin-gold)" }}>Body · ES</label>
                    <textarea className="admin-textarea" rows={3} value={form[`pillar_${n}_body_es`]}
                              onChange={e => set(`pillar_${n}_body_es`, e.target.value)}
                              placeholder="Leave blank to use English" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-auto md:right-6 md:bottom-6 z-30 md:max-w-md">
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 md:rounded-xl"
          style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            boxShadow: "var(--admin-shadow-lg)",
          }}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--admin-ink)" }}>
              Ready to publish?
            </p>
            <p className="text-xs" style={{ color: "var(--admin-ink-muted)" }}>
              Changes go live within a few seconds.
            </p>
          </div>
          <Button variant="primary" onClick={handleSave} loading={saving}>Save All</Button>
        </div>
      </div>

      {toast && <Toast kind={toast.kind} message={toast.message} onDismiss={() => setToast(null)} />}
    </AdminLayout>
  );
}
