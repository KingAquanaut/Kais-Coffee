"use client";
import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { admin as adminApi } from "@/lib/api";
import { getToken } from "@/contexts/AuthContext";

// ── Default fallback values (shown before content loads) ──────────────────
const DEFAULTS = {
  hero_heading: "More than a cup of coffee.",
  hero_subtext: "We believe every visit should feel like a small, quiet pleasure — crafted just for you.",
  hero_image_url: "",
  story_heading: "Where it all began.",
  story_body: "Kai's Coffee started with a single pour-over and a small corner table. What began as a passion project grew into a neighbourhood ritual — a place where regulars are greeted by name and every espresso is pulled with intention.\n\nOur goal has always been simple: make something worth coming back for, every single day.",
  coffee_heading: "Sourced with care, made with precision.",
  coffee_card_1_title: "Espresso",
  coffee_card_1_body: "Single-origin beans, dialled in daily. Dark chocolate and hazelnut notes with a clean, bright finish.",
  coffee_card_2_title: "Cold Brew",
  coffee_card_2_body: "18-hour cold steep. Nitrogen on tap. Smooth, never bitter — perfect for warm afternoons.",
  coffee_card_3_title: "Seasonal Drinks",
  coffee_card_3_body: "Rotating specials that follow what's fresh: honey lavender lattes, spiced autumn blends, and more.",
  team_heading: "The people behind your cup.",
  team_subtext: "Our baristas are trained extensively — not just in technique, but in hospitality.",
  team_member_1_name: "Kai",
  team_member_1_role: "Founder & Head Barista",
  team_member_1_photo_url: "",
  team_member_2_name: "",
  team_member_2_role: "",
  team_member_2_photo_url: "",
  team_member_3_name: "",
  team_member_3_role: "",
  team_member_3_photo_url: "",
  visit_heading: "Where to find us.",
  location_address: "123 Roastery Lane\nYour City, ST 00000",
  location_hours_weekday: "7 am – 6 pm",
  location_hours_saturday: "8 am – 5 pm",
  location_hours_sunday: "9 am – 3 pm",
  location_map_embed: "",
  // Spanish overrides — shown when language = Español
  hero_heading_es: "",
  hero_subtext_es: "",
  story_heading_es: "",
  story_body_es: "",
  coffee_heading_es: "",
  coffee_card_1_title_es: "",
  coffee_card_1_body_es: "",
  coffee_card_2_title_es: "",
  coffee_card_2_body_es: "",
  coffee_card_3_title_es: "",
  coffee_card_3_body_es: "",
  team_heading_es: "",
  team_subtext_es: "",
  visit_heading_es: "",
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

function EsField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ borderLeft: "3px solid #e8a838", paddingLeft: "0.75rem" }}>
      <label className="kc-label" style={{ color: "#b8962e" }}>
        🇪🇸 {label} <span style={{ fontWeight: 400, opacity: 0.7 }}>(Español)</span>
      </label>
      {children}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function AdminAboutPage() {
  const token = getToken();
  const [form, setForm] = useState<Form>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Hero image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [removeImageFlag, setRemoveImageFlag] = useState(false);
  const [imageMsg, setImageMsg] = useState<string | null>(null);
  const [imageErr, setImageErr] = useState<string | null>(null);
  const [savingImage, setSavingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Team photo state (one entry per member slot)
  type TeamPhotoState = { file: File | null; previewUrl: string | null; removing: boolean; saving: boolean; msg: string | null; err: string | null; };
  const [teamPhotos, setTeamPhotos] = useState<Record<number, TeamPhotoState>>({
    1: { file: null, previewUrl: null, removing: false, saving: false, msg: null, err: null },
    2: { file: null, previewUrl: null, removing: false, saving: false, msg: null, err: null },
    3: { file: null, previewUrl: null, removing: false, saving: false, msg: null, err: null },
  });
  const teamPhotoRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // Load content on mount
  useEffect(() => {
    if (!token) return;
    adminApi.pageContent.get(token, "about")
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

  // Object URL for hero image preview
  useEffect(() => {
    if (!imageFile) { setImagePreviewUrl(null); return; }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Object URLs for team photo previews
  useEffect(() => {
    const revokes: (() => void)[] = [];
    ([1, 2, 3] as const).forEach(n => {
      const file = teamPhotos[n].file;
      if (!file) return;
      const url = URL.createObjectURL(file);
      setTeamPhotos(prev => ({ ...prev, [n]: { ...prev[n], previewUrl: url } }));
      revokes.push(() => URL.revokeObjectURL(url));
    });
    return () => revokes.forEach(r => r());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamPhotos[1].file, teamPhotos[2].file, teamPhotos[3].file]);

  const setTP = (n: number, patch: Partial<TeamPhotoState>) =>
    setTeamPhotos(prev => ({ ...prev, [n]: { ...prev[n], ...patch } }));

  const handleTeamPhotoChange = (n: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setTP(n, { file, removing: false, msg: null, err: null });
    if (teamPhotoRefs[n - 1].current) teamPhotoRefs[n - 1].current!.value = "";
  };

  const handleSaveTeamPhoto = async (n: number) => {
    if (!token) return;
    const tp = teamPhotos[n];
    setTP(n, { saving: true, msg: null, err: null });
    try {
      const imageKey = `team_member_${n}_photo`;
      if (tp.removing) {
        const updated = await adminApi.pageContent.removeImageByKey(token, "about", imageKey);
        setForm(f => ({ ...f, [`team_member_${n}_photo_url`]: updated[`team_member_${n}_photo_url`] ?? "" }));
        setTP(n, { removing: false, file: null, previewUrl: null, msg: "Photo removed.", saving: false, err: null });
      } else if (tp.file) {
        const updated = await adminApi.pageContent.uploadImageByKey(token, "about", imageKey, tp.file);
        setForm(f => ({ ...f, [`team_member_${n}_photo_url`]: updated[`team_member_${n}_photo_url`] ?? "" }));
        setTP(n, { file: null, previewUrl: null, msg: "Photo saved.", saving: false, err: null });
        if (teamPhotoRefs[n - 1].current) teamPhotoRefs[n - 1].current!.value = "";
      }
    } catch (e: unknown) {
      setTP(n, { saving: false, err: e instanceof Error ? e.message : "Could not save photo." });
    }
  };

  const set = (key: keyof Form, value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  // ── Save text content ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      // Send all fields except hero_image_url (managed separately)
      const { hero_image_url, ...textFields } = form;
      void hero_image_url; // not sent — managed by uploadImage
      await adminApi.pageContent.update(token, "about", textFields);
      setMsg("About page content saved.");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  // ── Save hero image ───────────────────────────────────────────────────
  const handleSaveImage = async () => {
    if (!token) return;
    setSavingImage(true);
    setImageErr(null);
    setImageMsg(null);
    try {
      if (removeImageFlag) {
        const updated = await adminApi.pageContent.removeImage(token, "about");
        setForm(f => ({ ...f, hero_image_url: updated.hero_image_url ?? "" }));
        setRemoveImageFlag(false);
        setImageMsg("Hero image removed.");
      } else if (imageFile) {
        const updated = await adminApi.pageContent.uploadImage(token, "about", imageFile);
        setForm(f => ({ ...f, hero_image_url: updated.hero_image_url ?? "" }));
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setImageMsg("Hero image updated.");
      }
    } catch (e: unknown) {
      setImageErr(e instanceof Error ? e.message : "Could not save image.");
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

  // Current image to preview: local preview > existing DB URL
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
          About Page
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
      <SectionCard title="Hero Image">
        <div className="flex items-center gap-4">
          {/* Preview */}
          <div
            style={{
              width: 96, height: 96, borderRadius: "0.75rem", overflow: "hidden", flexShrink: 0,
              background: "linear-gradient(145deg, #bcd8ed 0%, #d6e8f5 100%)",
              border: "1.5px solid var(--kc-border)",
            }}
          >
            {currentImageUrl
              ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentImageUrl} alt="Hero preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--kc-muted)", textAlign: "center", padding: "0 8px" }}>No image</span>
                </div>
              )
            }
          </div>

          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
              id="hero-image-upload"
            />
            <label
              htmlFor="hero-image-upload"
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
          JPEG, PNG, WebP or GIF · max 20 MB. Displayed as the hero background on the About page.
        </p>

        {imageMsg && (
          <p className="text-xs" style={{ color: "var(--kc-success)" }}>{imageMsg}</p>
        )}
        {imageErr && (
          <p className="text-xs" style={{ color: "var(--kc-error)" }}>{imageErr}</p>
        )}

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
      <SectionCard title="Hero">
        <Field label="Heading">
          <input
            type="text"
            value={form.hero_heading}
            onChange={e => set("hero_heading", e.target.value)}
            className="kc-input"
          />
        </Field>
        <EsField label="Encabezado">
          <input
            type="text"
            value={form.hero_heading_es}
            onChange={e => set("hero_heading_es", e.target.value)}
            className="kc-input"
            placeholder="Spanish heading (leave blank to use English)"
          />
        </EsField>
        <Field label="Subtext">
          <textarea
            value={form.hero_subtext}
            onChange={e => set("hero_subtext", e.target.value)}
            className="kc-input"
            style={{ height: "4rem", resize: "vertical" }}
          />
        </Field>
        <EsField label="Subtexto">
          <textarea
            value={form.hero_subtext_es}
            onChange={e => set("hero_subtext_es", e.target.value)}
            className="kc-input"
            style={{ height: "4rem", resize: "vertical" }}
            placeholder="Spanish subtext (leave blank to use English)"
          />
        </EsField>
      </SectionCard>

      {/* ── Our Story ───────────────────────────────────────────────────── */}
      <SectionCard title="Our Story">
        <Field label="Section Heading">
          <input
            type="text"
            value={form.story_heading}
            onChange={e => set("story_heading", e.target.value)}
            className="kc-input"
          />
        </Field>
        <EsField label="Encabezado de Sección">
          <input
            type="text"
            value={form.story_heading_es}
            onChange={e => set("story_heading_es", e.target.value)}
            className="kc-input"
            placeholder="Spanish heading (leave blank to use English)"
          />
        </EsField>
        <Field label="Body (separate paragraphs with a blank line)">
          <textarea
            value={form.story_body}
            onChange={e => set("story_body", e.target.value)}
            className="kc-input"
            style={{ height: "8rem", resize: "vertical" }}
          />
        </Field>
        <EsField label="Cuerpo">
          <textarea
            value={form.story_body_es}
            onChange={e => set("story_body_es", e.target.value)}
            className="kc-input"
            style={{ height: "8rem", resize: "vertical" }}
            placeholder="Spanish body (leave blank to use English)"
          />
        </EsField>
      </SectionCard>

      {/* ── Our Coffee ──────────────────────────────────────────────────── */}
      <SectionCard title="Our Coffee">
        <Field label="Section Heading">
          <input
            type="text"
            value={form.coffee_heading}
            onChange={e => set("coffee_heading", e.target.value)}
            className="kc-input"
          />
        </Field>
        <EsField label="Encabezado de Sección">
          <input
            type="text"
            value={form.coffee_heading_es}
            onChange={e => set("coffee_heading_es", e.target.value)}
            className="kc-input"
            placeholder="Spanish heading (leave blank to use English)"
          />
        </EsField>
        {([1, 2, 3] as const).map(n => (
          <div key={n} style={{ paddingTop: "0.5rem", borderTop: "1px solid var(--kc-cream-dark)" }}>
            <p className="text-xs font-bold mb-3" style={{ color: "var(--kc-muted)" }}>Card {n}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Title">
                <input
                  type="text"
                  value={form[`coffee_card_${n}_title`]}
                  onChange={e => set(`coffee_card_${n}_title`, e.target.value)}
                  className="kc-input"
                />
              </Field>
              <Field label="Body">
                <textarea
                  value={form[`coffee_card_${n}_body`]}
                  onChange={e => set(`coffee_card_${n}_body`, e.target.value)}
                  className="kc-input"
                  style={{ height: "4.5rem", resize: "vertical" }}
                />
              </Field>
              <EsField label="Título">
                <input
                  type="text"
                  value={form[`coffee_card_${n}_title_es`]}
                  onChange={e => set(`coffee_card_${n}_title_es`, e.target.value)}
                  className="kc-input"
                  placeholder="Spanish title"
                />
              </EsField>
              <EsField label="Cuerpo">
                <textarea
                  value={form[`coffee_card_${n}_body_es`]}
                  onChange={e => set(`coffee_card_${n}_body_es`, e.target.value)}
                  className="kc-input"
                  style={{ height: "4.5rem", resize: "vertical" }}
                  placeholder="Spanish body"
                />
              </EsField>
            </div>
          </div>
        ))}
      </SectionCard>

      {/* ── Meet the Team ───────────────────────────────────────────────── */}
      <SectionCard title="Meet the Team">
        <Field label="Section Heading">
          <input
            type="text"
            value={form.team_heading}
            onChange={e => set("team_heading", e.target.value)}
            className="kc-input"
          />
        </Field>
        <EsField label="Encabezado de Sección">
          <input
            type="text"
            value={form.team_heading_es}
            onChange={e => set("team_heading_es", e.target.value)}
            className="kc-input"
            placeholder="Spanish heading (leave blank to use English)"
          />
        </EsField>
        <Field label="Subtext">
          <textarea
            value={form.team_subtext}
            onChange={e => set("team_subtext", e.target.value)}
            className="kc-input"
            style={{ height: "4rem", resize: "vertical" }}
          />
        </Field>
        <EsField label="Subtexto">
          <textarea
            value={form.team_subtext_es}
            onChange={e => set("team_subtext_es", e.target.value)}
            className="kc-input"
            style={{ height: "4rem", resize: "vertical" }}
            placeholder="Spanish subtext (leave blank to use English)"
          />
        </EsField>
        {([1, 2, 3] as const).map(n => {
          const tp = teamPhotos[n];
          const existingPhotoUrl = form[`team_member_${n}_photo_url`];
          const currentPhotoUrl = tp.removing ? null : (tp.previewUrl ?? (existingPhotoUrl || null));
          return (
            <div key={n} style={{ paddingTop: "0.75rem", borderTop: "1px solid var(--kc-cream-dark)" }}>
              <p className="text-xs font-bold mb-3" style={{ color: "var(--kc-muted)" }}>Team Member {n}</p>

              {/* Name + Role */}
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <Field label="Name">
                  <input
                    type="text"
                    value={form[`team_member_${n}_name`]}
                    onChange={e => set(`team_member_${n}_name`, e.target.value)}
                    className="kc-input"
                    placeholder="Leave blank to hide"
                  />
                </Field>
                <Field label="Role">
                  <input
                    type="text"
                    value={form[`team_member_${n}_role`]}
                    onChange={e => set(`team_member_${n}_role`, e.target.value)}
                    className="kc-input"
                    placeholder="e.g. Barista"
                  />
                </Field>
              </div>

              {/* Photo upload */}
              <div className="flex items-center gap-4">
                {/* Photo preview circle */}
                <div
                  style={{
                    width: 72, height: 72, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
                    background: "linear-gradient(145deg, #e8f2fa 0%, #bcd8ed 100%)",
                    border: "1.5px solid var(--kc-border)",
                  }}
                >
                  {currentPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentPhotoUrl} alt="Photo preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="28" height="28" viewBox="0 0 40 40" fill="none" aria-hidden="true" style={{ opacity: 0.4 }}>
                        <circle cx="20" cy="14" r="7" stroke="#3a7ca5" strokeWidth="2" fill="rgba(58,124,165,0.12)" />
                        <path d="M5 36c0-8.284 6.716-15 15-15s15 6.716 15 15" stroke="#3a7ca5" strokeWidth="2" strokeLinecap="round" fill="none" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <input
                    ref={teamPhotoRefs[n - 1]}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={e => handleTeamPhotoChange(n, e)}
                    id={`team-photo-${n}`}
                  />
                  <label
                    htmlFor={`team-photo-${n}`}
                    className="kc-btn kc-btn-outline kc-btn-sm text-center cursor-pointer"
                    style={{ display: "block" }}
                  >
                    {tp.file ? "Change file…" : "Upload photo"}
                  </label>
                  {tp.file && (
                    <p className="text-xs truncate" style={{ color: "var(--kc-muted)" }}>{tp.file.name}</p>
                  )}
                  {(existingPhotoUrl || tp.file) && !tp.removing && (
                    <button
                      type="button"
                      onClick={() => setTP(n, { removing: true, file: null, previewUrl: null })}
                      className="kc-btn kc-btn-sm"
                      style={{ background: "transparent", border: "1.5px solid var(--kc-error)", color: "var(--kc-error)" }}
                    >
                      Remove photo
                    </button>
                  )}
                  {tp.removing && (
                    <p className="text-xs" style={{ color: "var(--kc-error)" }}>
                      Photo will be removed on save.{" "}
                      <button
                        type="button"
                        onClick={() => setTP(n, { removing: false })}
                        style={{ textDecoration: "underline", background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: "inherit", padding: 0 }}
                      >
                        Undo
                      </button>
                    </p>
                  )}
                  {tp.msg && <p className="text-xs" style={{ color: "var(--kc-success)" }}>{tp.msg}</p>}
                  {tp.err && <p className="text-xs" style={{ color: "var(--kc-error)" }}>{tp.err}</p>}
                  <button
                    onClick={() => handleSaveTeamPhoto(n)}
                    disabled={tp.saving || (!tp.file && !tp.removing)}
                    className="kc-btn kc-btn-sm kc-btn-outline"
                    style={{ alignSelf: "flex-start" }}
                  >
                    {tp.saving ? "Saving…" : "Save Photo"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </SectionCard>

      {/* ── Where to Find Us ────────────────────────────────────────────── */}
      <SectionCard title="Where to Find Us">
        <Field label="Section Heading">
          <input
            type="text"
            value={form.visit_heading}
            onChange={e => set("visit_heading", e.target.value)}
            className="kc-input"
          />
        </Field>
        <EsField label="Encabezado de Sección">
          <input
            type="text"
            value={form.visit_heading_es}
            onChange={e => set("visit_heading_es", e.target.value)}
            className="kc-input"
            placeholder="Spanish heading (leave blank to use English)"
          />
        </EsField>
        <Field label="Address (use line breaks for formatting)">
          <textarea
            value={form.location_address}
            onChange={e => set("location_address", e.target.value)}
            className="kc-input"
            style={{ height: "4rem", resize: "vertical" }}
          />
        </Field>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Mon – Fri hours">
            <input
              type="text"
              value={form.location_hours_weekday}
              onChange={e => set("location_hours_weekday", e.target.value)}
              className="kc-input"
              placeholder="7 am – 6 pm"
            />
          </Field>
          <Field label="Saturday hours">
            <input
              type="text"
              value={form.location_hours_saturday}
              onChange={e => set("location_hours_saturday", e.target.value)}
              className="kc-input"
              placeholder="8 am – 5 pm"
            />
          </Field>
          <Field label="Sunday hours">
            <input
              type="text"
              value={form.location_hours_sunday}
              onChange={e => set("location_hours_sunday", e.target.value)}
              className="kc-input"
              placeholder="9 am – 3 pm"
            />
          </Field>
        </div>
        <Field label="Map embed URL (must be a Google Maps embed URL)">
          <textarea
            value={form.location_map_embed}
            onChange={e => set("location_map_embed", e.target.value)}
            className="kc-input"
            style={{ height: "3.5rem", resize: "vertical" }}
            placeholder="https://www.google.com/maps/embed?pb=..."
          />
          {form.location_map_embed && !form.location_map_embed.includes("/maps/embed") && (
            <p className="text-xs mt-1" style={{ color: "var(--kc-error)" }}>
              ⚠ This doesn&apos;t look like an embed URL. In Google Maps: Share → Embed a map → copy the <code>src=</code> value (it must contain <code>/maps/embed</code>).
            </p>
          )}
        </Field>
      </SectionCard>

      {/* Sticky bottom save bar */}
      <div
        className="sticky bottom-0 flex items-center justify-between gap-4 px-4 py-3 rounded-xl"
        style={{ background: "var(--kc-cream)", border: "1.5px solid var(--kc-border)", marginTop: "0.5rem" }}
      >
        <p className="text-xs" style={{ color: "var(--kc-muted)" }}>
          Changes apply to the public About page immediately after saving.
        </p>
        <button onClick={handleSave} disabled={saving} className="kc-btn">
          {saving ? "Saving…" : "Save All"}
        </button>
      </div>

    </AdminLayout>
  );
}
