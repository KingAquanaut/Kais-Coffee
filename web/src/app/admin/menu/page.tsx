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

  const token = getToken();

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([adminApi.menu.categories(token), adminApi.menu.items(token)])
      .then(([cats, its]) => {
        setCategories(cats);
        setItems(its);
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

function ItemDrawer({
  mode, item, categories, items, defaultCategoryId,
  onClose, onSaved, onError,
}: {
  mode: "create" | "edit";
  item?: MenuItem;
  categories: MenuCategory[];
  items: MenuItem[];
  defaultCategoryId: number;
  onClose: () => void;
  onSaved: (item: MenuItem, isNew: boolean) => void;
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!imageFile) { setImagePreviewUrl(null); return; }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const otherSeasonalCount = items.filter(i => i.is_seasonal && i.id !== item?.id).length;
  const seasonalAtLimit = otherSeasonalCount >= 2 && !form.is_seasonal;

  const previewUrl = removeImage ? null : (imagePreviewUrl ?? item?.image_url ?? null);

  const handleSave = async () => {
    const token = getToken();
    if (!token) return;
    if (!form.name.trim() || !form.price) { setErr("Name and price are required."); return; }
    setErr(null);
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        name_es: form.name_es.trim() || null,
        description: form.description,
        description_es: form.description_es || null,
        price: parseFloat(form.price) as unknown as never,
        is_featured: form.is_featured,
        is_seasonal: form.is_seasonal,
        is_active: form.is_active,
      };

      let saved: MenuItem;
      if (item) {
        const updateData = removeImage ? { ...payload, image_url: null as unknown as never } : payload;
        saved = await adminApi.menu.updateItem(token, item.id, updateData);
      } else {
        saved = await adminApi.menu.createItem(token, { menu_category_id: categoryId, ...payload });
      }

      if (imageFile && saved.id) {
        saved = await adminApi.menu.uploadItemImage(token, saved.id, imageFile);
      }

      onSaved(saved, !item);
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
      title={mode === "create" ? "New menu item" : "Edit menu item"}
      description={item?.name}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
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
            disabled={!!item}
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
          <label className="admin-label">Price ($)</label>
          <input
            className="admin-input"
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
          />
        </div>

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
