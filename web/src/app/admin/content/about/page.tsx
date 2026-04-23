"use client";
import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/admin/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/admin/Card";
import Button from "@/components/admin/Button";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import LoadingState from "@/components/admin/LoadingState";
import FormDrawer from "@/components/admin/FormDrawer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Toast from "@/components/admin/Toast";
import { IconEdit, IconUsers, IconChevronLeft, IconChevronRight, IconTrash } from "@/components/admin/Icon";
import { admin as adminApi, revalidate } from "@/lib/api";
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
  team_member_1_bio: "",
  team_member_1_photo_url: "",
  team_member_2_name: "",
  team_member_2_role: "",
  team_member_2_bio: "",
  team_member_2_photo_url: "",
  team_member_3_name: "",
  team_member_3_role: "",
  team_member_3_bio: "",
  team_member_3_photo_url: "",
  visit_heading: "Where to find us.",
  location_address: "123 Roastery Lane\nYour City, ST 00000",
  location_hours_weekday: "7 am – 6 pm",
  location_hours_saturday: "8 am – 5 pm",
  location_hours_sunday: "9 am – 3 pm",
  location_map_embed: "",
  social_instagram: "",
  social_facebook: "",
  social_tiktok: "",
  social_twitter: "",
  social_email: "",
  social_phone: "",
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
type TeamSlot = 1 | 2 | 3;

// ── Page ──────────────────────────────────────────────────────────────────
export default function AdminAboutPage() {
  const token = getToken();
  const [form, setForm] = useState<Form>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  // Hero image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [removeHero, setRemoveHero] = useState(false);
  const [savingHero, setSavingHero] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Team drawer state
  const [teamSlot, setTeamSlot] = useState<TeamSlot | null>(null);
  const [clearSlot, setClearSlot] = useState<TeamSlot | null>(null);

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
  const showMsg = (kind: "success" | "error", message: string) => setToast({ kind, message });

  // ── Save text content ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const { hero_image_url: _h, ...textFields } = form;
      void _h;
      await adminApi.pageContent.update(token, "about", textFields);
      await revalidate(["/about"]);
      showMsg("success", "About page saved");
    } catch (e) {
      showMsg("error", e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  // ── Save hero image ───────────────────────────────────────────────────
  const handleSaveHero = async () => {
    if (!token) return;
    setSavingHero(true);
    try {
      if (removeHero) {
        const updated = await adminApi.pageContent.removeImage(token, "about");
        setForm(f => ({ ...f, hero_image_url: updated.hero_image_url ?? "" }));
        setRemoveHero(false);
        showMsg("success", "Hero image removed");
      } else if (imageFile) {
        const updated = await adminApi.pageContent.uploadImage(token, "about", imageFile);
        setForm(f => ({ ...f, hero_image_url: updated.hero_image_url ?? "" }));
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        showMsg("success", "Hero image updated");
      }
      await revalidate(["/about"]);
    } catch (e) {
      showMsg("error", e instanceof Error ? e.message : "Could not save image.");
    } finally {
      setSavingHero(false);
    }
  };

  const currentHeroUrl = removeHero ? null : (imagePreviewUrl ?? (form.hero_image_url || null));

  // ── Team helpers ──────────────────────────────────────────────────────
  const teamMember = (n: TeamSlot) => ({
    name:  form[`team_member_${n}_name`] as string,
    role:  form[`team_member_${n}_role`] as string,
    bio:   (form[`team_member_${n}_bio`] ?? "") as string,
    photo: form[`team_member_${n}_photo_url`] as string,
  });

  /** Swap two team slots (all fields) */
  const swapSlots = (a: TeamSlot, b: TeamSlot) => {
    setForm(f => {
      const next = { ...f };
      (["name", "role", "bio", "photo_url"] as const).forEach(k => {
        const keyA = `team_member_${a}_${k}` as keyof Form;
        const keyB = `team_member_${b}_${k}` as keyof Form;
        const tmp = next[keyA]; next[keyA] = next[keyB]; next[keyB] = tmp;
      });
      return next;
    });
  };

  const handleClearSlot = async () => {
    if (!clearSlot) return;
    const n = clearSlot;
    // Wipe text fields locally; if there's a photo, remove it on the server
    const hasPhoto = !!form[`team_member_${n}_photo_url`];
    setForm(f => ({
      ...f,
      [`team_member_${n}_name`]: "",
      [`team_member_${n}_role`]: "",
      [`team_member_${n}_bio`]: "",
      [`team_member_${n}_photo_url`]: "",
    }));
    setClearSlot(null);

    if (hasPhoto && token) {
      try {
        await adminApi.pageContent.removeImageByKey(token, "about", `team_member_${n}_photo`);
      } catch { /* image removal failed — UI already cleared, will retry on next save */ }
    }
    showMsg("success", "Team member cleared (remember to Save)");
  };

  // Populated slots (for display / reorder bounds)
  const populated: TeamSlot[] = ([1, 2, 3] as TeamSlot[]).filter(n => (teamMember(n).name || "").trim() !== "");

  if (loading) {
    return <AdminLayout><LoadingState text="Loading page content…" /></AdminLayout>;
  }

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Content"
        title="About Page"
        description="Edit the public About page — hero, story, team, and contact info."
        actions={
          <Button variant="primary" onClick={handleSave} loading={saving}>
            Save changes
          </Button>
        }
      />

      <div className="flex flex-col gap-6 pb-24">
        {/* ── Hero image ─────────────────────────────────────────────── */}
        <Card padding="none">
          <CardHeader><CardTitle>Hero Image</CardTitle></CardHeader>
          <div className="px-5 py-5">
            <div className="flex items-center gap-4">
              <div
                className="shrink-0 overflow-hidden"
                style={{
                  width: 120, height: 80, borderRadius: 10,
                  background: "linear-gradient(145deg, #f0e8dc 0%, #e8d7be 100%)",
                  border: "1px solid var(--admin-border)",
                }}
              >
                {currentHeroUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentHeroUrl} alt="Hero preview"
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
                  id="hero-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0] ?? null;
                    if (f && f.size > 20 * 1024 * 1024) {
                      showMsg("error", "File is too large — max 20 MB");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      return;
                    }
                    setImageFile(f);
                    if (f) setRemoveHero(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                />
                <div className="flex gap-2 flex-wrap">
                  <label htmlFor="hero-image" className="cursor-pointer">
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
                    <button
                      type="button"
                      onClick={() => { setRemoveHero(true); setImageFile(null); }}
                      className="text-xs font-semibold"
                      style={{ color: "var(--admin-danger)" }}
                    >
                      Remove image
                    </button>
                  )}
                  {removeHero && (
                    <button type="button" onClick={() => setRemoveHero(false)}
                            className="text-xs font-semibold underline"
                            style={{ color: "var(--admin-ink-muted)" }}>
                      Undo remove
                    </button>
                  )}
                </div>
                {imageFile && (
                  <p className="text-xs truncate" style={{ color: "var(--admin-ink-muted)" }}>
                    {imageFile.name}
                  </p>
                )}
                <p className="text-xs" style={{ color: "var(--admin-ink-muted)" }}>
                  JPEG, PNG, WebP, or GIF · max 20 MB · wide landscape (~3:2) works best
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
          </div>
        </Card>

        {/* ── Hero text ──────────────────────────────────────────────── */}
        <Section title="Hero Text">
          <BilingualField
            label="Heading"
            enValue={form.hero_heading}
            esValue={form.hero_heading_es}
            onEnChange={v => set("hero_heading", v)}
            onEsChange={v => set("hero_heading_es", v)}
          />
          <BilingualField
            label="Subtext" textarea
            enValue={form.hero_subtext}
            esValue={form.hero_subtext_es}
            onEnChange={v => set("hero_subtext", v)}
            onEsChange={v => set("hero_subtext_es", v)}
          />
        </Section>

        {/* ── Our Story ──────────────────────────────────────────────── */}
        <Section title="Our Story">
          <BilingualField
            label="Section heading"
            enValue={form.story_heading}
            esValue={form.story_heading_es}
            onEnChange={v => set("story_heading", v)}
            onEsChange={v => set("story_heading_es", v)}
          />
          <BilingualField
            label="Body (blank line = new paragraph)" textarea rows={6}
            enValue={form.story_body}
            esValue={form.story_body_es}
            onEnChange={v => set("story_body", v)}
            onEsChange={v => set("story_body_es", v)}
          />
        </Section>

        {/* ── Our Coffee ─────────────────────────────────────────────── */}
        <Section title="Our Coffee">
          <BilingualField
            label="Section heading"
            enValue={form.coffee_heading}
            esValue={form.coffee_heading_es}
            onEnChange={v => set("coffee_heading", v)}
            onEsChange={v => set("coffee_heading_es", v)}
          />
          {([1, 2, 3] as const).map(n => (
            <div key={n} className="pt-4 mt-2" style={{ borderTop: "1px solid var(--admin-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3"
                 style={{ color: "var(--admin-ink-muted)" }}>Card {n}</p>
              <div className="flex flex-col gap-4">
                <BilingualField
                  label="Title"
                  enValue={form[`coffee_card_${n}_title`]}
                  esValue={form[`coffee_card_${n}_title_es`]}
                  onEnChange={v => set(`coffee_card_${n}_title`, v)}
                  onEsChange={v => set(`coffee_card_${n}_title_es`, v)}
                />
                <BilingualField
                  label="Body" textarea
                  enValue={form[`coffee_card_${n}_body`]}
                  esValue={form[`coffee_card_${n}_body_es`]}
                  onEnChange={v => set(`coffee_card_${n}_body`, v)}
                  onEsChange={v => set(`coffee_card_${n}_body_es`, v)}
                />
              </div>
            </div>
          ))}
        </Section>

        {/* ── Meet the Team ──────────────────────────────────────────── */}
        <Card padding="none">
          <CardHeader>
            <CardTitle>Meet the Team</CardTitle>
            <p className="text-xs" style={{ color: "var(--admin-ink-muted)" }}>
              {populated.length} / 3 members
            </p>
          </CardHeader>
          <div className="px-5 py-5 flex flex-col gap-5">
            <div className="flex flex-col gap-4">
              <BilingualField
                label="Section heading"
                enValue={form.team_heading}
                esValue={form.team_heading_es}
                onEnChange={v => set("team_heading", v)}
                onEsChange={v => set("team_heading_es", v)}
              />
              <BilingualField
                label="Subtext" textarea
                enValue={form.team_subtext}
                esValue={form.team_subtext_es}
                onEnChange={v => set("team_subtext", v)}
                onEsChange={v => set("team_subtext_es", v)}
              />
            </div>

            {/* Team cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {([1, 2, 3] as TeamSlot[]).map(n => {
                const m = teamMember(n);
                const empty = !m.name.trim();
                return (
                  <div
                    key={n}
                    className="flex flex-col p-4 rounded-xl"
                    style={{
                      background: empty ? "var(--admin-surface-alt)" : "var(--admin-surface)",
                      border: `1px solid ${empty ? "var(--admin-border)" : "var(--admin-border-strong)"}`,
                      borderStyle: empty ? "dashed" : "solid",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="shrink-0 overflow-hidden"
                        style={{
                          width: 56, height: 56, borderRadius: "50%",
                          background: "linear-gradient(145deg, #f0e8dc 0%, #d8c5a8 100%)",
                          border: "1px solid var(--admin-border)",
                        }}
                      >
                        {m.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.photo} alt={m.name}
                               style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-base font-bold"
                               style={{ color: "var(--admin-ink-faint)", fontFamily: "var(--font-heading)" }}>
                            {m.name.charAt(0).toUpperCase() || "—"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate" style={{ color: "var(--admin-ink)" }}>
                          {m.name || <span style={{ color: "var(--admin-ink-faint)", fontWeight: 400 }}>Empty slot</span>}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--admin-ink-muted)" }}>
                          {m.role || "—"}
                        </p>
                      </div>
                    </div>

                    {m.bio && (
                      <p className="text-xs mt-3 line-clamp-3" style={{ color: "var(--admin-ink-muted)" }}>
                        {m.bio}
                      </p>
                    )}

                    <div className="flex items-center gap-1 mt-3 pt-3"
                         style={{ borderTop: "1px solid var(--admin-border)" }}>
                      {/* Reorder */}
                      <button
                        onClick={() => swapSlots(n, (n - 1) as TeamSlot)}
                        disabled={n === 1}
                        className="p-1.5 rounded-md disabled:opacity-30"
                        style={{ color: "var(--admin-ink-muted)" }}
                        title="Move up"
                        aria-label="Move up"
                      >
                        <IconChevronLeft size={14} />
                      </button>
                      <button
                        onClick={() => swapSlots(n, (n + 1) as TeamSlot)}
                        disabled={n === 3}
                        className="p-1.5 rounded-md disabled:opacity-30"
                        style={{ color: "var(--admin-ink-muted)" }}
                        title="Move down"
                        aria-label="Move down"
                      >
                        <IconChevronRight size={14} />
                      </button>
                      <span className="text-[10px] font-semibold tracking-wider uppercase ml-1"
                            style={{ color: "var(--admin-ink-faint)" }}>
                        Slot {n}
                      </span>

                      <div className="ml-auto flex items-center gap-1">
                        {!empty && (
                          <button
                            onClick={() => setClearSlot(n)}
                            className="p-1.5 rounded-md"
                            style={{ color: "var(--admin-danger)" }}
                            title="Clear member"
                            aria-label="Clear member"
                          >
                            <IconTrash size={14} />
                          </button>
                        )}
                        <Button
                          variant="secondary" size="sm"
                          leftIcon={<IconEdit size={14} />}
                          onClick={() => setTeamSlot(n)}
                        >
                          {empty ? "Add" : "Edit"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {populated.length === 0 && (
              <div className="pt-2">
                <EmptyState
                  icon={<IconUsers />}
                  title="No team members yet"
                  description="Add up to three team members with photo, name, role and bio."
                />
              </div>
            )}
          </div>
        </Card>

        {/* ── Where to Find Us ───────────────────────────────────────── */}
        <Section title="Where to Find Us">
          <BilingualField
            label="Section heading"
            enValue={form.visit_heading}
            esValue={form.visit_heading_es}
            onEnChange={v => set("visit_heading", v)}
            onEsChange={v => set("visit_heading_es", v)}
          />
          <div>
            <label className="admin-label">Address</label>
            <textarea
              className="admin-textarea"
              rows={3}
              value={form.location_address}
              onChange={e => set("location_address", e.target.value)}
            />
            <p className="text-xs mt-1" style={{ color: "var(--admin-ink-muted)" }}>
              Line breaks are preserved when rendered.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <TextField label="Mon – Fri hours" value={form.location_hours_weekday}
                       onChange={v => set("location_hours_weekday", v)} placeholder="7 am – 6 pm" />
            <TextField label="Saturday hours" value={form.location_hours_saturday}
                       onChange={v => set("location_hours_saturday", v)} placeholder="8 am – 5 pm" />
            <TextField label="Sunday hours" value={form.location_hours_sunday}
                       onChange={v => set("location_hours_sunday", v)} placeholder="9 am – 3 pm" />
          </div>
          <div>
            <label className="admin-label">Google Maps embed URL</label>
            <textarea
              className="admin-textarea" rows={2}
              value={form.location_map_embed}
              onChange={e => set("location_map_embed", e.target.value)}
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
            {form.location_map_embed && !form.location_map_embed.includes("/maps/embed") && (
              <p className="text-xs mt-1" style={{ color: "var(--admin-danger)" }}>
                This doesn&apos;t look like an embed URL. In Google Maps: Share → Embed a map → copy the <code>src=</code> value.
              </p>
            )}
          </div>
        </Section>

        {/* ── Contact ────────────────────────────────────────────────── */}
        <Section title="Contact & Social Media"
                 description="Shown in the Connect with us section. Leave blank to hide.">
          <div className="grid sm:grid-cols-2 gap-3">
            <TextField label="Instagram URL"  value={form.social_instagram}
                       onChange={v => set("social_instagram", v)} placeholder="https://instagram.com/kaiscoffee" />
            <TextField label="Facebook URL"   value={form.social_facebook}
                       onChange={v => set("social_facebook", v)} placeholder="https://facebook.com/kaiscoffee" />
            <TextField label="TikTok URL"     value={form.social_tiktok}
                       onChange={v => set("social_tiktok", v)} placeholder="https://tiktok.com/@kaiscoffee" />
            <TextField label="X / Twitter URL" value={form.social_twitter}
                       onChange={v => set("social_twitter", v)} placeholder="https://x.com/kaiscoffee" />
            <TextField label="Email"          value={form.social_email}
                       onChange={v => set("social_email", v)} placeholder="hello@kaiscoffee.com" />
            <TextField label="Phone"          value={form.social_phone}
                       onChange={v => set("social_phone", v)} placeholder="(817) 555-0123" />
          </div>
        </Section>
      </div>

      {/* Sticky save bar */}
      <div
        className="fixed bottom-0 left-0 right-0 md:left-auto md:right-6 md:bottom-6 z-30 md:max-w-md"
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 md:rounded-xl"
          style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            borderBottom: "1px solid var(--admin-border)",
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
          <Button variant="primary" onClick={handleSave} loading={saving}>
            Save All
          </Button>
        </div>
      </div>

      {/* Team drawer */}
      {teamSlot && (
        <TeamMemberDrawer
          slot={teamSlot}
          initial={teamMember(teamSlot)}
          onClose={() => setTeamSlot(null)}
          onSaveLocal={(name, role, bio) => {
            setForm(f => ({
              ...f,
              [`team_member_${teamSlot}_name`]: name,
              [`team_member_${teamSlot}_role`]: role,
              [`team_member_${teamSlot}_bio`]:  bio,
            }));
            setTeamSlot(null);
            showMsg("success", "Member updated (remember to Save)");
          }}
          onPhotoUploaded={url => {
            setForm(f => ({ ...f, [`team_member_${teamSlot}_photo_url`]: url }));
          }}
          onError={msg => showMsg("error", msg)}
        />
      )}

      {/* Clear slot confirm */}
      <ConfirmDialog
        open={clearSlot !== null}
        onCancel={() => setClearSlot(null)}
        onConfirm={handleClearSlot}
        title="Clear team member?"
        description="This removes the name, role, bio and photo from this slot. You'll still need to hit Save to publish the change."
        confirmLabel="Clear"
        tone="danger"
      />

      {toast && <Toast kind={toast.kind} message={toast.message} onDismiss={() => setToast(null)} />}
    </AdminLayout>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Section wrapper                                                         */
/* ──────────────────────────────────────────────────────────────────────── */

function Section({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card padding="none">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description && (
            <p className="text-xs mt-0.5" style={{ color: "var(--admin-ink-muted)" }}>
              {description}
            </p>
          )}
        </div>
      </CardHeader>
      <div className="px-5 py-5 flex flex-col gap-4">{children}</div>
    </Card>
  );
}

function TextField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="admin-label">{label}</label>
      <input
        className="admin-input"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function BilingualField({
  label, enValue, esValue, onEnChange, onEsChange, textarea, rows = 3,
}: {
  label: string;
  enValue: string;
  esValue: string;
  onEnChange: (v: string) => void;
  onEsChange: (v: string) => void;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <div>
        <label className="admin-label">{label} · EN</label>
        {textarea ? (
          <textarea className="admin-textarea" rows={rows}
                    value={enValue} onChange={e => onEnChange(e.target.value)} />
        ) : (
          <input className="admin-input" value={enValue} onChange={e => onEnChange(e.target.value)} />
        )}
      </div>
      <div>
        <label className="admin-label" style={{ color: "var(--admin-gold)" }}>
          {label} · ES
        </label>
        {textarea ? (
          <textarea className="admin-textarea" rows={rows} value={esValue}
                    onChange={e => onEsChange(e.target.value)}
                    placeholder="Leave blank to fall back to English" />
        ) : (
          <input className="admin-input" value={esValue}
                 onChange={e => onEsChange(e.target.value)}
                 placeholder="Leave blank to fall back to English" />
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Team member drawer (with photo upload + save)                           */
/* ──────────────────────────────────────────────────────────────────────── */

function TeamMemberDrawer({
  slot, initial, onClose, onSaveLocal, onPhotoUploaded, onError,
}: {
  slot: TeamSlot;
  initial: { name: string; role: string; bio: string; photo: string };
  onClose: () => void;
  onSaveLocal: (name: string, role: string, bio: string) => void;
  onPhotoUploaded: (url: string) => void;
  onError: (msg: string) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [role, setRole] = useState(initial.role);
  const [bio,  setBio]  = useState(initial.bio);

  // Photo state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!photoFile) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(photoFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const currentPhoto = removePhoto ? null : (previewUrl ?? (initial.photo || null));
  const hasStoredPhoto = !!initial.photo;

  const handleSavePhoto = async () => {
    const token = getToken();
    if (!token) return;
    setPhotoSaving(true);
    try {
      const key = `team_member_${slot}_photo`;
      if (removePhoto) {
        const updated = await adminApi.pageContent.removeImageByKey(token, "about", key);
        onPhotoUploaded(updated[`team_member_${slot}_photo_url`] ?? "");
        setRemovePhoto(false);
      } else if (photoFile) {
        const updated = await adminApi.pageContent.uploadImageByKey(token, "about", key, photoFile);
        onPhotoUploaded(updated[`team_member_${slot}_photo_url`] ?? "");
        setPhotoFile(null);
        if (fileRef.current) fileRef.current.value = "";
      }
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not save photo");
    } finally {
      setPhotoSaving(false);
    }
  };

  return (
    <FormDrawer
      open
      onClose={onClose}
      title={initial.name ? "Edit team member" : `Add team member (Slot ${slot})`}
      description={initial.name || undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSaveLocal(name.trim(), role.trim(), bio.trim())}>
            Apply
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Photo */}
        <div
          className="p-4 rounded-lg"
          style={{ background: "var(--admin-surface-alt)", border: "1px solid var(--admin-border)" }}
        >
          <label className="admin-label">Photo</label>
          <div className="flex items-center gap-4">
            <div
              className="shrink-0 overflow-hidden"
              style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "linear-gradient(145deg, #f0e8dc 0%, #d8c5a8 100%)",
                border: "1px solid var(--admin-border)",
              }}
            >
              {currentPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentPhoto} alt="Preview"
                     style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-bold"
                     style={{ color: "var(--admin-ink-faint)", fontFamily: "var(--font-heading)" }}>
                  {name.charAt(0).toUpperCase() || "—"}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <input
                ref={fileRef}
                id={`team-photo-${slot}`}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0] ?? null;
                  if (f && f.size > 20 * 1024 * 1024) {
                    onError("File is too large — max 20 MB");
                    if (fileRef.current) fileRef.current.value = "";
                    return;
                  }
                  setPhotoFile(f);
                  if (f) setRemovePhoto(false);
                }}
              />
              <div className="flex gap-2 flex-wrap">
                <label htmlFor={`team-photo-${slot}`} className="cursor-pointer">
                  <span
                    className="inline-flex items-center justify-center px-3 h-8 text-xs font-semibold rounded-lg"
                    style={{
                      border: "1px solid var(--admin-border-strong)",
                      background: "var(--admin-surface)",
                      color: "var(--admin-ink)",
                    }}
                  >
                    {photoFile ? "Change…" : "Upload"}
                  </span>
                </label>
                {(hasStoredPhoto || photoFile) && !removePhoto && (
                  <button type="button"
                          onClick={() => { setRemovePhoto(true); setPhotoFile(null); }}
                          className="text-xs font-semibold"
                          style={{ color: "var(--admin-danger)" }}>
                    Remove
                  </button>
                )}
                {removePhoto && (
                  <button type="button" onClick={() => setRemovePhoto(false)}
                          className="text-xs font-semibold underline"
                          style={{ color: "var(--admin-ink-muted)" }}>
                    Undo
                  </button>
                )}
                <Button
                  variant="secondary" size="sm"
                  onClick={handleSavePhoto}
                  loading={photoSaving}
                  disabled={!photoFile && !removePhoto}
                >
                  Save photo
                </Button>
              </div>
              <p className="text-xs" style={{ color: "var(--admin-ink-muted)" }}>
                Square crop recommended · max 20 MB
              </p>
            </div>
          </div>
          <p className="text-xs mt-3" style={{ color: "var(--admin-ink-muted)" }}>
            <StatusBadge tone="info" size="sm">Note</StatusBadge>{" "}
            <span className="ml-1">Photo saves immediately. Name, role and bio save with the main <strong>Save All</strong> button.</span>
          </p>
        </div>

        {/* Name / role / bio */}
        <div>
          <label className="admin-label">Name</label>
          <input className="admin-input" value={name}
                 onChange={e => setName(e.target.value)} placeholder="Full name" />
        </div>
        <div>
          <label className="admin-label">Role</label>
          <input className="admin-input" value={role}
                 onChange={e => setRole(e.target.value)} placeholder="e.g. Head Barista" />
        </div>
        <div>
          <label className="admin-label">Bio</label>
          <textarea className="admin-textarea" rows={4} value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="A short story about this person (optional)" />
        </div>
      </div>
    </FormDrawer>
  );
}
