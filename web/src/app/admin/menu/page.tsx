"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import Button from "@/components/admin/Button";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import LoadingState from "@/components/admin/LoadingState";
import FormDrawer from "@/components/admin/FormDrawer";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import Toast from "@/components/admin/Toast";
import ItemImage from "@/components/ui/ItemImage";
import {
  IconPlus, IconEdit, IconTrash, IconCoffee, IconEye, IconEyeOff,
} from "@/components/admin/Icon";
import { admin as adminApi, revalidate, type MenuCategory, type MenuItem } from "@/lib/api";
import { getToken } from "@/contexts/AuthContext";

type ItemForm = {
  name: string;
  name_es: string;
  description: string;
  description_es: string;
  price: string;
  is_featured: boolean;
  is_seasonal: boolean;
  is_active: boolean;
};

const emptyItemForm = (): ItemForm => ({
  name: "", name_es: "", description: "", description_es: "", price: "",
  is_featured: false, is_seasonal: false, is_active: true,
});

type CatForm = { name: string; name_es: string; description: string; description_es: string };

type VariantRow = {
  id?: number;
  size_label: string;
  price: string;
  sort_order: number;
  is_active: boolean;
};

const buildVariantPayload = (rows: VariantRow[]) =>
  rows
    .filter(r => r.size_label.trim() && r.price !== "")
    .map((r, i) => ({
      id: r.id,
      size_label: r.size_label.trim(),
      price: parseFloat(r.price),
      sort_order: i,
      is_active: r.is_active,
    }));

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items,      setItems]      = useState<MenuItem[]>([]);
  const [activeCat,  setActiveCat]  = useState<number | "all">("all");
  const [loading,    setLoading]    = useState(true);
  const [toast,      setToast]      = useState<{ kind: "success" | "error"; message: string } | null>(null);

  // Drawers / dialogs
  const [itemDrawer, setItemDrawer] = useState<{ mode: "create" | "edit"; item?: MenuItem } | null>(null);
  const [catDrawer,  setCatDrawer]  = useState<MenuCategory | null>(null);
  const [deleteItem, setDeleteItem] = useState<MenuItem | null>(null);

  // Home-page spotlight (single featured drink + label override)
  const [featuredDrinkId, setFeaturedDrinkId] = useState<number | null>(null);
  const [featuredLabel, setFeaturedLabel] = useState<string>("");
  const [savingFeatured, setSavingFeatured] = useState(false);

  const token = getToken();

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      adminApi.menu.categories(token),
      adminApi.menu.items(token),
      adminApi.menu.getFeaturedDrink(token).catch(() => ({ menu_item_id: null, item: null, label: null })),
    ])
      .then(([cats, its, featured]) => {
        setCategories(cats);
        setItems(its);
        setFeaturedDrinkId(featured.menu_item_id ?? null);
        setFeaturedLabel(featured.label ?? "");
      })
      .catch(() => setToast({ kind: "error", message: "Could not load menu data." }))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    const t = setTimeout(() => load(), 0);
    return () => clearTimeout(t);
  }, [load]);

  const filteredItems = activeCat === "all" ? items : items.filter(i => i.menu_category_id === activeCat);

  const showMsg = (kind: "success" | "error", message: string) => setToast({ kind, message });

  const toggleVisibility = async (item: MenuItem) => {
    if (!token) return;
    const next = !item.is_active;
    setItems(list => list.map(i => i.id === item.id ? { ...i, is_active: next } : i));
    try {
      await adminApi.menu.updateItem(token, item.id, { is_active: next });
      showMsg("success", next ? `“${item.name}” is now visible` : `“${item.name}” is hidden`);
      revalidate(["/menu", "/"]);
    } catch {
      setItems(list => list.map(i => i.id === item.id ? { ...i, is_active: !next } : i));
      showMsg("error", "Failed to toggle visibility");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem || !token) return;
    try {
      await adminApi.menu.deleteItem(token, deleteItem.id);
      setItems(list => list.filter(i => i.id !== deleteItem.id));
      showMsg("success", "Item deleted");
      revalidate(["/menu", "/"]);
      setDeleteItem(null);
    } catch {
      showMsg("error", "Failed to delete item");
    }
  };

  const handleItemSaved = (item: MenuItem, isNew: boolean) => {
    if (isNew) setItems(list => [...list, item]);
    else       setItems(list => list.map(i => i.id === item.id ? item : i));
    setItemDrawer(null);
    showMsg("success", isNew ? "Item created" : "Item updated");
    revalidate(["/menu", "/"]);
  };

  // Silent update — used by auto-save in the drawer. Doesn't close, doesn't toast.
  // Public pages will be revalidated when the drawer closes.
  const handleItemAutoSaved = (item: MenuItem) => {
    setItems(list => list.map(i => i.id === item.id ? item : i));
  };

  const handleFeaturedChange = async (nextId: number | null) => {
    if (!token) return;
    setSavingFeatured(true);
    const prev = featuredDrinkId;
    setFeaturedDrinkId(nextId);  // optimistic
    try {
      await adminApi.menu.setFeaturedDrink(token, nextId);
      showMsg("success", nextId ? "Spotlight drink updated" : "Spotlight cleared");
      revalidate(["/"]);
    } catch (e) {
      setFeaturedDrinkId(prev);
      showMsg("error", e instanceof Error ? e.message : "Couldn’t update spotlight");
    } finally {
      setSavingFeatured(false);
    }
  };

  // Persists the spotlight label override. Empty/blank string clears the
  // setting on the server, which makes the public site fall back to the
  // localized default ("Drink of the Moment"). Called on blur from the
  // FeaturedDrinkCard's input — keystroke-level saves would be wasteful.
  const handleFeaturedLabelChange = async (nextLabel: string) => {
    if (!token) return;
    const trimmed = nextLabel.trim();
    // Skip the round-trip when nothing actually changed.
    if (trimmed === (featuredLabel ?? "").trim()) return;
    setSavingFeatured(true);
    const prev = featuredLabel;
    setFeaturedLabel(trimmed);  // optimistic
    try {
      await adminApi.menu.setFeaturedDrinkLabel(token, trimmed === "" ? null : trimmed);
      showMsg("success", trimmed === "" ? "Spotlight label cleared" : "Spotlight label updated");
      revalidate(["/"]);
    } catch (e) {
      setFeaturedLabel(prev);
      showMsg("error", e instanceof Error ? e.message : "Couldn’t update label");
    } finally {
      setSavingFeatured(false);
    }
  };

  const handleCatSaved = (cat: MenuCategory) => {
    setCategories(list => list.map(c => c.id === cat.id ? cat : c));
    setCatDrawer(null);
    showMsg("success", "Category updated");
    revalidate(["/menu", "/"]);
  };

  const itemsPerCat = (catId: number) => items.filter(i => i.menu_category_id === catId).length;
  const activeItems = items.filter(i => i.is_active).length;

  return (
    <AdminLayout>
      <PageHeader
        eyebrow="Menu"
        title="Menu Management"
        description={`${items.length} items · ${activeItems} visible · ${categories.length} categories`}
        actions={
          <Button
            variant="primary"
            leftIcon={<IconPlus size={16} />}
            onClick={() => setItemDrawer({ mode: "create" })}
            disabled={categories.length === 0}
          >
            Add Item
          </Button>
        }
      />

      {/* Home-page spotlight drink */}
      <FeaturedDrinkCard
        items={items}
        featuredDrinkId={featuredDrinkId}
        featuredLabel={featuredLabel}
        saving={savingFeatured}
        onChange={handleFeaturedChange}
        onLabelChange={handleFeaturedLabelChange}
      />

      {/* Categories */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider"
              style={{ color: "var(--admin-ink-muted)" }}>
            Categories
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map(cat => (
            <Card key={cat.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "var(--admin-ink)" }}>
                    {cat.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--admin-ink-muted)" }}>
                    {itemsPerCat(cat.id)} item{itemsPerCat(cat.id) !== 1 ? "s" : ""}
                  </p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {cat.name_es
                      ? <StatusBadge tone="gold" size="sm">EN · ES</StatusBadge>
                      : <StatusBadge tone="warning" size="sm">EN only</StatusBadge>}
                  </div>
                </div>
                <button
                  onClick={() => setCatDrawer(cat)}
                  className="p-2 rounded-md shrink-0"
                  style={{ color: "var(--admin-ink-muted)" }}
                  aria-label={`Edit ${cat.name}`}
                  title="Edit category"
                >
                  <IconEdit size={16} />
                </button>
              </div>
            </Card>
          ))}
          {categories.length === 0 && (
            <Card><p className="text-sm" style={{ color: "var(--admin-ink-muted)" }}>No categories.</p></Card>
          )}
        </div>
      </section>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-5">
        <button
          onClick={() => setActiveCat("all")}
          className="px-3.5 h-9 rounded-lg text-sm font-semibold transition-colors"
          style={{
            background: activeCat === "all" ? "var(--admin-ink)" : "transparent",
            color:      activeCat === "all" ? "#fff"           : "var(--admin-ink-muted)",
            border:     `1px solid ${activeCat === "all" ? "var(--admin-ink)" : "var(--admin-border)"}`,
          }}
        >
          All ({items.length})
        </button>
        {categories.map(cat => {
          const active = activeCat === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className="px-3.5 h-9 rounded-lg text-sm font-semibold transition-colors"
              style={{
                background: active ? "var(--admin-ink)" : "transparent",
                color:      active ? "#fff"           : "var(--admin-ink-muted)",
                border:     `1px solid ${active ? "var(--admin-ink)" : "var(--admin-border)"}`,
              }}
            >
              {cat.name} ({itemsPerCat(cat.id)})
            </button>
          );
        })}
      </div>

      {/* Items grid */}
      {loading ? (
        <LoadingState text="Loading menu…" />
      ) : filteredItems.length === 0 ? (
        <Card>
          <EmptyState
            icon={<IconCoffee />}
            title="No items in this category"
            description="Add a drink to get started."
            action={
              <Button
                variant="primary"
                leftIcon={<IconPlus size={16} />}
                onClick={() => setItemDrawer({ mode: "create" })}
                disabled={categories.length === 0}
              >
                Add Item
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map(item => {
            const completeES = !!item.name_es;
            return (
              <Card key={item.id} padding="none">
                {/* Top — image + title + price */}
                <div
                  className="flex items-center gap-3 p-4"
                  style={{ borderBottom: "1px solid var(--admin-border)" }}
                >
                  <ItemImage name={item.name} imageUrl={item.image_url} size={56} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "var(--admin-ink)" }}>
                      {item.name}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--admin-ink-muted)" }}>
                      {item.category?.name ?? categories.find(c => c.id === item.menu_category_id)?.name ?? ""}
                    </p>
                  </div>
                  <p className="text-sm font-bold tabular-nums shrink-0" style={{ color: "var(--admin-ink)" }}>
                    ${parseFloat(item.price).toFixed(2)}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 flex-wrap px-4 pt-3">
                  <StatusBadge tone={item.is_active ? "success" : "neutral"} size="sm" dot>
                    {item.is_active ? "Visible" : "Hidden"}
                  </StatusBadge>
                  {item.is_featured && <StatusBadge tone="gold" size="sm">Featured</StatusBadge>}
                  {item.is_seasonal && <StatusBadge tone="info" size="sm">Seasonal</StatusBadge>}
                  <StatusBadge tone={completeES ? "success" : "warning"} size="sm">
                    {completeES ? "EN · ES" : "Missing ES"}
                  </StatusBadge>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 p-3">
                  <button
                    onClick={() => toggleVisibility(item)}
                    className="p-2 rounded-md"
                    style={{ color: "var(--admin-ink-muted)" }}
                    title={item.is_active ? "Hide from menu" : "Show on menu"}
                    aria-label={item.is_active ? "Hide from menu" : "Show on menu"}
                  >
                    {item.is_active ? <IconEye size={16} /> : <IconEyeOff size={16} />}
                  </button>
                  <Button
                    variant="secondary" size="sm"
                    leftIcon={<IconEdit size={14} />}
                    onClick={() => setItemDrawer({ mode: "edit", item })}
                    className="ml-auto"
                  >
                    Edit
                  </Button>
                  <button
                    onClick={() => setDeleteItem(item)}
                    className="p-2 rounded-md"
                    style={{ color: "var(--admin-danger)" }}
                    title="Delete item"
                    aria-label="Delete item"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Item drawer */}
      {itemDrawer && (
        <ItemDrawer
          mode={itemDrawer.mode}
          item={itemDrawer.item}
          categories={categories}
          items={items}
          defaultCategoryId={activeCat === "all" ? categories[0]?.id ?? 0 : activeCat}
          onClose={() => setItemDrawer(null)}
          onSaved={handleItemSaved}
          onAutoSaved={handleItemAutoSaved}
          onError={msg => showMsg("error", msg)}
        />
      )}

      {/* Category drawer */}
      {catDrawer && (
        <CategoryDrawer
          category={catDrawer}
          onClose={() => setCatDrawer(null)}
          onSaved={handleCatSaved}
          onError={msg => showMsg("error", msg)}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteItem}
        onCancel={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title={`Delete ${deleteItem?.name ?? "item"}?`}
        description="This can't be undone. The item will be removed from your menu permanently."
        confirmLabel="Delete"
        tone="danger"
      />

      {toast && <Toast kind={toast.kind} message={toast.message} onDismiss={() => setToast(null)} />}
    </AdminLayout>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Item Drawer                                                             */
/* ──────────────────────────────────────────────────────────────────────── */

type AutoSaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

function ItemDrawer({
  mode, item, categories, items, defaultCategoryId,
  onClose, onSaved, onAutoSaved, onError,
}: {
  mode: "create" | "edit";
  item?: MenuItem;
  categories: MenuCategory[];
  items: MenuItem[];
  defaultCategoryId: number;
  onClose: () => void;
  onSaved: (item: MenuItem, isNew: boolean) => void;
  onAutoSaved: (item: MenuItem) => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState<ItemForm>(
    item ? {
      name: item.name,
      name_es: item.name_es ?? "",
      description: item.description ?? "",
      description_es: item.description_es ?? "",
      price: item.price,
      is_featured: item.is_featured,
      is_seasonal: item.is_seasonal,
      is_active: item.is_active,
    } : emptyItemForm()
  );
  const [categoryId, setCategoryId] = useState<number>(item?.menu_category_id ?? defaultCategoryId);

  // Local form state for size variants. Empty array means "no sizes — drink uses single price".
  const [variants, setVariants] = useState<VariantRow[]>(
    () => (item?.variants ?? []).map(v => ({
      id: v.id,
      size_label: v.size_label,
      price: String(v.price),
      sort_order: v.sort_order ?? 0,
      is_active: v.is_active ?? true,
    }))
  );

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Auto-save state (edit mode only) ─────────────────────────────────────
  const isEditing = !!item;
  const [autoStatus, setAutoStatus] = useState<AutoSaveStatus>("idle");
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null);
  const savedSnapshotRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<boolean>(false);

  // Snapshot of fields that participate in auto-save (image is handled separately).
  // Variants are serialized WITHOUT ids — id hydration after a save shouldn't
  // be seen as a user-meaningful change (otherwise we'd auto-save in a loop).
  const buildSnapshot = useCallback(
    () => JSON.stringify({
      ...form,
      categoryId,
      variants: variants.map(v => ({
        size_label: v.size_label.trim(),
        price: v.price,
        is_active: v.is_active,
      })),
    }),
    [form, categoryId, variants],
  );

  useEffect(() => {
    if (!imageFile) { setImagePreviewUrl(null); return; }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Initialize the saved snapshot once on mount for edit mode.
  useEffect(() => {
    if (!isEditing) return;
    savedSnapshotRef.current = buildSnapshot();
    setAutoStatus("saved");
    setAutoSavedAt(new Date());
    // run-once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Schedule debounced auto-save when form/categoryId/variants change (edit mode only).
  useEffect(() => {
    if (!isEditing || !item) return;
    if (savedSnapshotRef.current === null) return;
    const next = buildSnapshot();
    if (next === savedSnapshotRef.current) return;

    setAutoStatus("unsaved");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { void runAutoSave(); }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, categoryId, variants]);

  // Warn on unload if there are unsaved changes (text or image).
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      const hasUnsavedImage = !!imageFile || removeImage;
      if (autoStatus === "unsaved" || autoStatus === "saving" || hasUnsavedImage) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [autoStatus, imageFile, removeImage]);

  const runAutoSave = useCallback(async (): Promise<boolean> => {
    const token = getToken();
    if (!token || !item) return false;
    if (inFlightRef.current) return false;

    // Skip if validation would fail — surface inline so user can see why.
    if (!form.name.trim() || !form.price) {
      setAutoStatus("error");
      setErr("Name and price are required.");
      return false;
    }

    inFlightRef.current = true;
    setAutoStatus("saving");
    setErr(null);
    try {
      const payload = {
        menu_category_id: categoryId,
        name: form.name.trim(),
        name_es: form.name_es.trim() || null,
        description: form.description,
        description_es: form.description_es || null,
        price: parseFloat(form.price) as unknown as never,
        is_featured: form.is_featured,
        is_seasonal: form.is_seasonal,
        is_active: form.is_active,
        variants: buildVariantPayload(variants) as unknown as never,
      };
      // 10-second hard ceiling so a stalled network never leaves the pill spinning.
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Save timed out — check your connection and retry.")), 10_000),
      );
      const saved = await Promise.race([
        adminApi.menu.updateItem(token, item.id, payload),
        timeout,
      ]);
      // Re-hydrate local variant rows with server-assigned ids so the next sync
      // updates rather than re-creating.
      if (saved.variants) {
        setVariants(saved.variants.map(v => ({
          id: v.id,
          size_label: v.size_label,
          price: String(v.price),
          sort_order: v.sort_order ?? 0,
          is_active: v.is_active ?? true,
        })));
      }
      savedSnapshotRef.current = buildSnapshot();
      setAutoStatus("saved");
      setAutoSavedAt(new Date());
      everSavedRef.current = true;
      onAutoSaved(saved);
      return true;
    } catch (e) {
      setAutoStatus("error");
      setErr(e instanceof Error ? e.message : "Could not save");
      return false;
    } finally {
      inFlightRef.current = false;
    }
  }, [item, form, categoryId, variants, buildSnapshot, onAutoSaved]);

  // Flush any pending auto-save before closing, then revalidate public pages
  // once (instead of revalidating on every keystroke).
  // everSavedRef flips true only on an actual save event (not on mount).
  const everSavedRef = useRef<boolean>(false);

  const handleClose = useCallback(async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (isEditing && autoStatus === "unsaved") {
      const ok = await runAutoSave();
      if (!ok) {
        const force = confirm(
          "Could not auto-save your changes. Close anyway and lose unsaved edits?",
        );
        if (!force) return;
      }
    }
    if (isEditing && everSavedRef.current) {
      void revalidate(["/menu", "/"]);
    }
    onClose();
  }, [autoStatus, isEditing, runAutoSave, onClose]);

  const otherSeasonalCount = items.filter(i => i.is_seasonal && i.id !== item?.id).length;
  const seasonalAtLimit = otherSeasonalCount >= 2 && !form.is_seasonal;

  const previewUrl = removeImage ? null : (imagePreviewUrl ?? item?.image_url ?? null);

  const handleSave = async () => {
    const token = getToken();
    if (!token) return;
    if (!form.name.trim() || !form.price) { setErr("Name and price are required."); return; }
    setErr(null);
    setSaving(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    try {
      const payload = {
        menu_category_id: categoryId,
        name: form.name.trim(),
        name_es: form.name_es.trim() || null,
        description: form.description,
        description_es: form.description_es || null,
        price: parseFloat(form.price) as unknown as never,
        is_featured: form.is_featured,
        is_seasonal: form.is_seasonal,
        is_active: form.is_active,
        variants: buildVariantPayload(variants) as unknown as never,
      };

      let saved: MenuItem;
      if (item) {
        const updateData = removeImage ? { ...payload, image_url: null as unknown as never } : payload;
        saved = await adminApi.menu.updateItem(token, item.id, updateData);
        if (saved.variants) {
          setVariants(saved.variants.map(v => ({
            id: v.id,
            size_label: v.size_label,
            price: String(v.price),
            sort_order: v.sort_order ?? 0,
            is_active: v.is_active ?? true,
          })));
        }
        savedSnapshotRef.current = buildSnapshot();
        setAutoStatus("saved");
        setAutoSavedAt(new Date());
      } else {
        saved = await adminApi.menu.createItem(token, payload);
      }

      if (imageFile && saved.id) {
        saved = await adminApi.menu.uploadItemImage(token, saved.id, imageFile);
      }

      onSaved(saved, !item);
    } catch (e) {
      setAutoStatus("error");
      onError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDrawer
      open
      onClose={handleClose}
      title={mode === "create" ? "New menu item" : "Edit menu item"}
      description={item?.name}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            {isEditing ? "Close" : "Cancel"}
          </Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>
            {isEditing ? (imageFile || removeImage ? "Save image & close" : "Save & close") : "Save"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {err && (
          <div
            className="px-3 py-2 rounded-md text-xs"
            style={{ background: "var(--admin-danger-bg)", color: "var(--admin-danger)" }}
          >
            {err}
          </div>
        )}

        {isEditing && (
          <AutoSaveStatusPill
            status={autoStatus}
            savedAt={autoSavedAt}
            onRetry={() => { void runAutoSave(); }}
          />
        )}

        {/* Image */}
        <div>
          <label className="admin-label">Drink image</label>
          <div className="flex items-center gap-4">
            <ItemImage name={form.name || "Item"} imageUrl={previewUrl} size={72} />
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0] ?? null;
                  setImageFile(f);
                  if (f) setRemoveImage(false);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                id="item-image"
              />
              <label htmlFor="item-image" className="cursor-pointer">
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
              {imageFile && (
                <p className="text-xs truncate" style={{ color: "var(--admin-ink-muted)" }}>
                  {imageFile.name}
                </p>
              )}
              {(item?.image_url || imageFile) && !removeImage && (
                <button
                  type="button"
                  onClick={() => { setRemoveImage(true); setImageFile(null); }}
                  className="text-xs font-semibold self-start"
                  style={{ color: "var(--admin-danger)" }}
                >
                  Remove image
                </button>
              )}
              {removeImage && (
                <p className="text-xs" style={{ color: "var(--admin-danger)" }}>
                  Image will be cleared on save.{" "}
                  <button
                    type="button"
                    onClick={() => setRemoveImage(false)}
                    className="underline"
                  >
                    Undo
                  </button>
                </p>
              )}
            </div>
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--admin-ink-muted)" }}>
            JPEG, PNG, WebP, or GIF · max 20 MB · square aspect preferred
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="admin-label">Category</label>
          <select
            className="admin-select"
            value={categoryId}
            onChange={e => setCategoryId(Number(e.target.value))}
          >
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Name (EN + ES) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="admin-label">Name (English)</label>
            <input
              className="admin-input"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="admin-label" style={{ color: "var(--admin-gold)" }}>
              Name (Español)
            </label>
            <input
              className="admin-input"
              value={form.name_es}
              onChange={e => setForm(f => ({ ...f, name_es: e.target.value }))}
              placeholder="Leave blank to fall back to English"
            />
          </div>
        </div>

        {/* Description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="admin-label">Description</label>
            <textarea
              className="admin-textarea"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
            />
          </div>
          <div>
            <label className="admin-label" style={{ color: "var(--admin-gold)" }}>
              Descripción
            </label>
            <textarea
              className="admin-textarea"
              value={form.description_es}
              onChange={e => setForm(f => ({ ...f, description_es: e.target.value }))}
              rows={3}
              placeholder="Leave blank to fall back to English"
            />
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="admin-label">
            Price ($){variants.length > 0 ? <span className="ml-2 font-normal" style={{ color: "var(--admin-ink-muted)" }}>· default size — sizes below override on the menu</span> : null}
          </label>
          <input
            className="admin-input"
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
          />
        </div>

        {/* Sizes / variants */}
        <VariantEditor
          rows={variants}
          onChange={setVariants}
          defaultPrice={form.price}
        />

        {/* Toggles */}
        <div
          className="p-4 rounded-lg flex flex-col gap-3"
          style={{ background: "var(--admin-surface-alt)", border: "1px solid var(--admin-border)" }}
        >
          <Toggle
            label="Visible on menu"
            description="Show this item to customers"
            checked={form.is_active}
            onChange={v => setForm(f => ({ ...f, is_active: v }))}
          />
          <Toggle
            label="Featured"
            description="Highlight on the menu page"
            checked={form.is_featured}
            onChange={v => setForm(f => ({ ...f, is_featured: v }))}
          />
          <Toggle
            label="Seasonal promotion"
            description={seasonalAtLimit
              ? "Max 2 seasonal items — remove one first."
              : "Promotes this drink on the home page (max 2)."}
            checked={form.is_seasonal}
            onChange={v => setForm(f => ({ ...f, is_seasonal: v }))}
            disabled={seasonalAtLimit}
          />
        </div>
      </div>
    </FormDrawer>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Category Drawer                                                         */
/* ──────────────────────────────────────────────────────────────────────── */

function CategoryDrawer({
  category, onClose, onSaved, onError,
}: {
  category: MenuCategory;
  onClose: () => void;
  onSaved: (cat: MenuCategory) => void;
  onError: (msg: string) => void;
}) {
  const [form, setForm] = useState<CatForm>({
    name: category.name,
    name_es: category.name_es ?? "",
    description: category.description ?? "",
    description_es: category.description_es ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSave = async () => {
    const token = getToken();
    if (!token) return;
    if (!form.name.trim()) { setErr("Name is required."); return; }
    setErr(null);
    setSaving(true);
    try {
      const updated = await adminApi.menu.updateCategory(token, category.id, {
        name: form.name.trim(),
        name_es: form.name_es.trim() || null,
        description: form.description || null,
        description_es: form.description_es || null,
      } as Partial<MenuCategory>);
      onSaved(updated);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDrawer
      open
      onClose={onClose}
      title="Edit category"
      description={category.name}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {err && (
          <div className="px-3 py-2 rounded-md text-xs"
               style={{ background: "var(--admin-danger-bg)", color: "var(--admin-danger)" }}>
            {err}
          </div>
        )}
        <div>
          <label className="admin-label">Name (English)</label>
          <input className="admin-input" value={form.name}
                 onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="admin-label" style={{ color: "var(--admin-gold)" }}>Name (Español)</label>
          <input className="admin-input" value={form.name_es}
                 onChange={e => setForm(f => ({ ...f, name_es: e.target.value }))}
                 placeholder="Leave blank to fall back to English" />
        </div>
        <div>
          <label className="admin-label">Description</label>
          <textarea className="admin-textarea" rows={3} value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div>
          <label className="admin-label" style={{ color: "var(--admin-gold)" }}>Descripción</label>
          <textarea className="admin-textarea" rows={3} value={form.description_es}
                    onChange={e => setForm(f => ({ ...f, description_es: e.target.value }))}
                    placeholder="Leave blank to fall back to English" />
        </div>
      </div>
    </FormDrawer>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Featured drink card (home-page spotlight)                               */
/* ──────────────────────────────────────────────────────────────────────── */

function FeaturedDrinkCard({
  items, featuredDrinkId, featuredLabel, saving, onChange, onLabelChange,
}: {
  items: MenuItem[];
  featuredDrinkId: number | null;
  featuredLabel: string;
  saving: boolean;
  onChange: (id: number | null) => void;
  onLabelChange: (label: string) => void;
}) {
  const activeItems = items.filter(i => i.is_active);
  const current = items.find(i => i.id === featuredDrinkId) ?? null;

  // Local input state so users can type freely without each keystroke firing a
  // network request — the parent's onLabelChange handler is invoked on blur.
  const [labelDraft, setLabelDraft] = useState<string>(featuredLabel);
  // Re-sync when the parent prop changes (e.g. initial load resolves).
  useEffect(() => { setLabelDraft(featuredLabel); }, [featuredLabel]);

  const commitLabel = () => onLabelChange(labelDraft);

  return (
    <Card padding="none">
      <div className="px-5 py-4 flex flex-col gap-4">
        {/* Row 1: drink picker + summary */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <ItemImage
              name={current?.name ?? "Spotlight"}
              imageUrl={current?.image_url ?? null}
              size={48}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--admin-ink)" }}>
                Home-page spotlight drink
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--admin-ink-muted)" }}>
                {current
                  ? <>Currently promoting <span style={{ color: "var(--admin-ink)" }}>{current.name}</span> on the public home page.</>
                  : "No drink selected — the home page falls back to the default hero."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select
              className="admin-select"
              value={featuredDrinkId ?? ""}
              disabled={saving || activeItems.length === 0}
              onChange={e => {
                const v = e.target.value;
                onChange(v === "" ? null : Number(v));
              }}
              style={{ minWidth: 220 }}
            >
              <option value="">— none —</option>
              {activeItems.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
            {featuredDrinkId !== null && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onChange(null)}
                disabled={saving}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: label override */}
        <div
          className="flex items-center gap-3 flex-wrap pt-3"
          style={{ borderTop: "1px solid var(--admin-border)" }}
        >
          <div className="flex-1 min-w-0">
            <label
              htmlFor="featured-drink-label"
              className="text-sm font-semibold block"
              style={{ color: "var(--admin-ink)" }}
            >
              Spotlight label
            </label>
            <p className="text-xs mt-0.5" style={{ color: "var(--admin-ink-muted)" }}>
              Shown above the drink name on the home page. Leave blank to use “Drink of the Moment”.
            </p>
          </div>
          <input
            id="featured-drink-label"
            type="text"
            className="admin-input"
            value={labelDraft}
            disabled={saving}
            maxLength={80}
            placeholder="Drink of the Moment"
            onChange={e => setLabelDraft(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitLabel();
              }
            }}
            style={{ minWidth: 220, maxWidth: 320 }}
          />
        </div>
      </div>
    </Card>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Variant (size & price) editor                                           */
/* ──────────────────────────────────────────────────────────────────────── */

function VariantEditor({
  rows, onChange, defaultPrice,
}: {
  rows: VariantRow[];
  onChange: (next: VariantRow[]) => void;
  defaultPrice: string;
}) {
  const update = (index: number, patch: Partial<VariantRow>) => {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const remove = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const add = () => {
    // Suggest a sensible default label and the existing default price
    const suggested =
      rows.length === 0 ? "12 oz"
      : rows.length === 1 ? "16 oz"
      : "";
    onChange([
      ...rows,
      {
        size_label: suggested,
        price: defaultPrice || "",
        sort_order: rows.length,
        is_active: true,
      },
    ]);
  };

  return (
    <div
      className="p-4 rounded-lg flex flex-col gap-3"
      style={{ background: "var(--admin-surface-alt)", border: "1px solid var(--admin-border)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--admin-ink)" }}>
            Sizes &amp; prices
          </p>
          <p className="text-xs" style={{ color: "var(--admin-ink-muted)" }}>
            {rows.length === 0
              ? "Optional — leave empty to use a single price."
              : "Customers will see one card per drink with these sizes as options."}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={add}>
          + Add size
        </Button>
      </div>

      {rows.length > 0 && (
        <div className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <div
              key={row.id ?? `new-${i}`}
              className="flex items-center gap-2 p-2 rounded-md"
              style={{ background: "var(--admin-surface)", border: "1px solid var(--admin-border)" }}
            >
              <input
                className="admin-input"
                style={{ flex: "1 1 0", minWidth: 0 }}
                value={row.size_label}
                placeholder="e.g. 12 oz"
                onChange={e => update(i, { size_label: e.target.value })}
                aria-label="Size label"
              />
              <div className="flex items-center gap-1" style={{ width: 110 }}>
                <span className="text-xs" style={{ color: "var(--admin-ink-muted)" }}>$</span>
                <input
                  className="admin-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.price}
                  placeholder="0.00"
                  onChange={e => update(i, { price: e.target.value })}
                  aria-label="Price"
                />
              </div>
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                className="p-1.5 rounded-md disabled:opacity-30"
                style={{ color: "var(--admin-ink-muted)" }}
                title="Move up"
                aria-label="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === rows.length - 1}
                className="p-1.5 rounded-md disabled:opacity-30"
                style={{ color: "var(--admin-ink-muted)" }}
                title="Move down"
                aria-label="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(i)}
                className="p-1.5 rounded-md"
                style={{ color: "var(--admin-danger)" }}
                title="Remove size"
                aria-label="Remove size"
              >
                <IconTrash size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Auto-save status pill                                                   */
/* ──────────────────────────────────────────────────────────────────────── */

function AutoSaveStatusPill({
  status, savedAt, onRetry,
}: {
  status: AutoSaveStatus;
  savedAt: Date | null;
  onRetry: () => void;
}) {
  const timeStr = savedAt
    ? savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const tone = (() => {
    switch (status) {
      case "saving":   return { bg: "var(--admin-surface-alt)", fg: "var(--admin-ink-muted)" };
      case "saved":    return { bg: "var(--admin-success-bg)",  fg: "var(--admin-success)"   };
      case "unsaved":  return { bg: "var(--admin-surface-alt)", fg: "var(--admin-ink-muted)" };
      case "error":    return { bg: "var(--admin-danger-bg)",   fg: "var(--admin-danger)"    };
      default:         return { bg: "var(--admin-surface-alt)", fg: "var(--admin-ink-muted)" };
    }
  })();

  const label = (() => {
    switch (status) {
      case "saving":  return "Saving…";
      case "saved":   return timeStr ? `Saved · ${timeStr}` : "Saved";
      case "unsaved": return "Unsaved changes";
      case "error":   return "Couldn’t save — retry";
      default:        return "Ready";
    }
  })();

  return (
    <div
      className="px-3 py-2 rounded-md text-xs flex items-center justify-between gap-2"
      style={{ background: tone.bg, color: tone.fg }}
      role="status"
      aria-live="polite"
    >
      <span className="flex items-center gap-2">
        <span
          className="inline-block rounded-full"
          style={{
            width: 8, height: 8,
            background: status === "saved" ? "currentColor"
                      : status === "saving" ? "currentColor"
                      : status === "error" ? "currentColor"
                      : "transparent",
            border: status === "unsaved" ? "1.5px solid currentColor" : "none",
            opacity: status === "saving" ? 0.7 : 1,
          }}
          aria-hidden
        />
        {label}
      </span>
      {status === "error" && (
        <button
          type="button"
          onClick={onRetry}
          className="text-xs font-semibold underline"
          style={{ color: "currentColor" }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Toggle switch                                                           */
/* ──────────────────────────────────────────────────────────────────────── */

function Toggle({
  label, description, checked, onChange, disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-start gap-3 ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className="relative shrink-0 transition-colors"
        style={{
          width: 36, height: 20, borderRadius: 9999,
          background: checked ? "var(--admin-accent)" : "var(--admin-border-strong)",
        }}
      >
        <span
          className="absolute top-0.5 left-0.5 transition-transform"
          style={{
            width: 16, height: 16, borderRadius: "50%",
            background: "#fff",
            transform: checked ? "translateX(16px)" : "translateX(0)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
          }}
        />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: "var(--admin-ink)" }}>{label}</p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: "var(--admin-ink-muted)" }}>{description}</p>
        )}
      </div>
    </label>
  );
}
