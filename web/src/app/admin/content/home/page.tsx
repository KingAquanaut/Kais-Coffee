"use client";
import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { admin as adminApi, ApiError } from "@/lib/api";
import { getToken } from "@/contexts/AuthContext";

// ── Defaults ──────────────────────────────────────────────────────────────
const DEFAULTS = {
  hero_heading:   "Every cup, a small pleasure.",
  hero_subtext:   "Single-origin espresso, slow-steeped cold brews, and house-baked pastries — crafted with care, for you.",
  hero_image_url: "",
};

type Form = typeof DEFAULTS;

// ── Small helpers ─────────────────────────────────────────────────────────
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="kc-card p-6 mb-5">
      <h2
        className="text-base font-bold mb-4 pb-3"
        style={{ fontFamily: "var(--font-heading)", borderBottom: "1px solid var(--kc-cream-dark)" }}
      >
        {title}
      </h2>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="kc-label">{label}</label>
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function AdminHomePage() {
  const token = getToken();
  const [form, setForm]       = useState<Form>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState<string | null>(null);
  const [err, setErr]         = useState<string | null>(null);

  // Hero image state
  const [imageFile, setImageFile]           = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [removeImageFlag, setRemoveImageFlag] = useState(false);
  const [imageMsg, setImageMsg]             = useState<string | null>(null);
  const [imageErr, setImageErr]             = useState<string | null>(null);
  const [savingImage, setSavingImage]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load content on mount
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
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  // Object URL for image preview
  useEffect(() => {
    if (!imageFile) { setImagePreviewUrl(null); return; }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const set = (key: keyof Form, value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  // ── Save text ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!token) return;
    setSaving(true); setErr(null); setMsg(null);
    try {
      const { hero_image_url, ...textFields } = form;
      void hero_image_url; // managed via uploadImage
      await adminApi.pageContent.update(token, "home", textFields);
      setMsg("Home page content saved.");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  // ── Save hero image ───────────────────────────────────────────────────
  const handleSaveImage = async () => {
    if (!token) return;
    setSavingImage(true); setImageErr(null); setImageMsg(null);
    try {
      if (removeImageFlag) {
        const updated = await adminApi.pageContent.removeImage(token, "home");
        setForm(f => ({ ...f, hero_image_url: updated.hero_image_url ?? "" }));
        setRemoveImageFlag(false);
        setImageMsg("Hero image removed.");
      } else if (imageFile) {
        const updated = await adminApi.pageContent.uploadImage(token, "home", imageFile);
        setForm(f => ({ ...f, hero_image_url: updated.hero_image_url ?? "" }));
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setImageMsg("Hero image updated.");
      }
    } catch (e: unknown) {
      if (e instanceof ApiError && e.errors?.image) {
        setImageErr(e.errors.image[0]);
      } else {
        setImageErr(e instanceof Error ? e.message : "Could not save image.");
      }
    } finally {
      setSavingImage(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 20 * 1024 * 1024) {
      setImageErr("File is too large — max 20 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setImageFile(file);
    if (file) { setRemoveImageFlag(false); setImageErr(null); }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const currentImageUrl = removeImageFlag ? null : (imagePreviewUrl ?? (form.hero_image_url || null));

  if (loading) return (
    <AdminLayout>
      <div className="flex justify-center py-20"><LoadingSpinner /></div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Home Page
        </h1>
        <button onClick={handleSave} disabled={saving} className="kc-btn">
          {saving ? "Saving…" : "Save All"}
        </button>
      </div>

      {msg && (
        <div
          className="mb-4 py-2.5 px-4 rounded-lg text-sm cursor-pointer"
          style={{ background: "#d1fae5", color: "var(--kc-success)" }}
          onClick={() => setMsg(null)}
        >
          {msg}
        </div>
      )}
      {err && (
        <div
          className="mb-4 py-2.5 px-4 rounded-lg text-sm cursor-pointer"
          style={{ background: "#fee2e2", color: "var(--kc-error)" }}
          onClick={() => setErr(null)}
        >
          {err}
        </div>
      )}

      {/* ── Hero Image ──────────────────────────────────────────────────── */}
      <SectionCard title="Hero Background Image">
        <div className="flex items-center gap-4">
          {/* Preview */}
          <div
            style={{
              width: 120, height: 72, borderRadius: "0.75rem", overflow: "hidden", flexShrink: 0,
              background: "linear-gradient(160deg, #c4d9ec 0%, #d6e8f5 100%)",
              border: "1.5px solid var(--kc-border)",
            }}
          >
            {currentImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentImageUrl} alt="Hero preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "0.65rem", color: "var(--kc-muted)", textAlign: "center", padding: "0 8px" }}>No image</span>
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
            <label
              htmlFor="home-hero-image"
              className="kc-btn kc-btn-outline kc-btn-sm text-center cursor-pointer"
              style={{ display: "block" }}
            >
              {imageFile ? "Change file…" : "Upload image"}
            </label>

            {imageFile && (
              <p className="text-xs truncate" style={{ color: "var(--kc-muted)" }}>{imageFile.name}</p>
            )}

            {(form.hero_image_url || imageFile) && !removeImageFlag && (
              <button
                type="button"
                onClick={() => { setRemoveImageFlag(true); setImageFile(null); }}
                className="kc-btn kc-btn-sm"
                style={{ background: "transparent", border: "1.5px solid var(--kc-error)", color: "var(--kc-error)" }}
              >
                Remove image
              </button>
            )}

            {removeImageFlag && (
              <p className="text-xs" style={{ color: "var(--kc-error)" }}>
                Image will be removed on save.{" "}
                <button
                  type="button"
                  onClick={() => setRemoveImageFlag(false)}
                  style={{ textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: "inherit", padding: 0 }}
                >
                  Undo
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-xs" style={{ color: "var(--kc-muted)" }}>
          JPEG, PNG, WebP or GIF · max 5 MB. Displayed as the full-bleed hero background on the home page. When no image is set, a soft blue gradient is shown instead.
        </p>

        {imageMsg && <p className="text-xs" style={{ color: "var(--kc-success)" }}>{imageMsg}</p>}
        {imageErr && <p className="text-xs" style={{ color: "var(--kc-error)" }}>{imageErr}</p>}

        <button
          onClick={handleSaveImage}
          disabled={savingImage || (!imageFile && !removeImageFlag)}
          className="kc-btn kc-btn-sm kc-btn-outline"
          style={{ alignSelf: "flex-start" }}
        >
          {savingImage ? "Saving…" : "Save Image"}
        </button>
      </SectionCard>

      {/* ── Hero Text ───────────────────────────────────────────────────── */}
      <SectionCard title="Hero Text">
        <Field label="Heading">
          <input
            type="text"
            value={form.hero_heading}
            onChange={e => set("hero_heading", e.target.value)}
            className="kc-input"
            placeholder="Every cup, a small pleasure."
          />
        </Field>
        <Field label="Subtext">
          <textarea
            value={form.hero_subtext}
            onChange={e => set("hero_subtext", e.target.value)}
            className="kc-input"
            style={{ height: "5rem", resize: "vertical" }}
            placeholder="Single-origin espresso, slow-steeped cold brews…"
          />
        </Field>
      </SectionCard>

      {/* Sticky bottom save bar */}
      <div
        className="sticky bottom-0 flex items-center justify-between gap-4 px-4 py-3 rounded-xl"
        style={{ background: "var(--kc-cream)", border: "1.5px solid var(--kc-border)", marginTop: "0.5rem" }}
      >
        <p className="text-xs" style={{ color: "var(--kc-muted)" }}>
          Changes apply to the public home page immediately after saving.
        </p>
        <button onClick={handleSave} disabled={saving} className="kc-btn">
          {saving ? "Saving…" : "Save All"}
        </button>
      </div>

    </AdminLayout>
  );
}
