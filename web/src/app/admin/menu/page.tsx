"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import ItemImage from "@/components/ui/ItemImage";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { admin as adminApi, type MenuCategory, type MenuItem } from "@/lib/api";
import { getToken } from "@/contexts/AuthContext";

type ItemForm = {
  name: string;
  name_es: string;
  description: string;
  price: string;
  is_featured: boolean;
  is_active: boolean;
};

const emptyItemForm = (): ItemForm => ({
  name: "", name_es: "", description: "", price: "", is_featured: false, is_active: true,
});

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items,      setItems]      = useState<MenuItem[]>([]);
  const [activeCat,  setActiveCat]  = useState<number | null>(null);
  const [loading,    setLoading]    = useState(true);

  const [modal,   setModal]   = useState<{ open: boolean; item?: MenuItem }>({ open: false });
  const [form,    setForm]    = useState<ItemForm>(emptyItemForm());
  const [saving,  setSaving]  = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);
  const [msg,     setMsg]     = useState<string | null>(null);

  // Image upload state
  const [imageFile,        setImageFile]        = useState<File | null>(null);
  const [imagePreviewUrl,  setImagePreviewUrl]  = useState<string | null>(null);
  const [removeImageFlag,  setRemoveImageFlag]  = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = getToken();

  // `activeCatRef` lets `load` check whether a default category has been set
  // without adding `activeCat` to its useCallback deps (which would re-create
  // `load` on every tab click and trigger an unwanted extra fetch).
  const activeCatRef = useRef<number | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([adminApi.menu.categories(token), adminApi.menu.items(token)])
      .then(([cats, its]) => {
        setCategories(cats);
        setItems(its);
        if (cats.length > 0 && !activeCatRef.current) {
          activeCatRef.current = cats[0].id;
          setActiveCat(cats[0].id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Clean up object URL when imageFile changes or modal closes
  useEffect(() => {
    if (!imageFile) { setImagePreviewUrl(null); return; }
    const url = URL.createObjectURL(imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const openCreate = () => {
    setForm(emptyItemForm());
    setImageFile(null);
    setRemoveImageFlag(false);
    setModal({ open: true });
    setFormErr(null);
  };

  const openEdit = (item: MenuItem) => {
    setForm({
      name: item.name,
      name_es: item.name_es ?? "",
      description: item.description ?? "",
      price: item.price,
      is_featured: item.is_featured,
      is_active: item.is_active,
    });
    setImageFile(null);
    setRemoveImageFlag(false);
    setModal({ open: true, item });
    setFormErr(null);
  };

  const closeModal = () => {
    setModal({ open: false });
    setImageFile(null);
    setRemoveImageFlag(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) setRemoveImageFlag(false);
    // Reset input so re-selecting same file triggers onChange
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!token || !activeCat) return;
    if (!form.name.trim() || !form.price) { setFormErr("Name and price are required."); return; }
    setSaving(true);
    setFormErr(null);
    try {
      const itemData = {
        name: form.name,
        name_es: form.name_es || null,
        description: form.description,
        price: parseFloat(form.price) as unknown as never,
        is_featured: form.is_featured,
        is_active: form.is_active,
      };

      let savedId: number;
      if (modal.item) {
        // Clear image_url in DB if user requested removal
        const updateData = removeImageFlag
          ? { ...itemData, image_url: null as unknown as never }
          : itemData;
        await adminApi.menu.updateItem(token, modal.item.id, updateData);
        // Use the already-known item ID — don't rely on the response having it
        savedId = modal.item.id;
      } else {
        const created = await adminApi.menu.createItem(token, {
          menu_category_id: activeCat,
          ...itemData,
        });
        savedId = created.id;
        if (!savedId) throw new Error("Server did not return a valid item ID.");
      }

      // Upload new image if selected
      if (imageFile) {
        await adminApi.menu.uploadItemImage(token, savedId, imageFile);
      }

      closeModal();
      setMsg(modal.item ? "Item updated." : "Item created.");
      load();
    } catch (err: unknown) {
      setFormErr(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token || !confirm("Delete this item?")) return;
    await adminApi.menu.deleteItem(token, id).catch(() => {});
    setMsg("Item deleted.");
    load();
  };

  const filteredItems = activeCat ? items.filter(i => i.menu_category_id === activeCat) : items;

  // Determine the image to preview in the modal
  const modalPreviewUrl = removeImageFlag
    ? null
    : (imagePreviewUrl ?? modal.item?.image_url ?? null);

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Menu Management</h1>
        <button onClick={openCreate} className="kc-btn">Add Item</button>
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

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setActiveCat(null)}
          className="kc-btn kc-btn-sm"
          style={{
            background: !activeCat ? "var(--kc-black)" : "transparent",
            color: !activeCat ? "var(--kc-white)" : "var(--kc-black)",
            borderColor: "var(--kc-border)",
          }}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className="kc-btn kc-btn-sm"
            style={{
              background: activeCat === cat.id ? "var(--kc-black)" : "transparent",
              color: activeCat === cat.id ? "var(--kc-white)" : "var(--kc-black)",
              borderColor: "var(--kc-border)",
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div key={item.id} className="kc-card flex flex-col">
              <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid var(--kc-cream-dark)" }}>
                <ItemImage name={item.name} imageUrl={item.image_url} size={56} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ fontFamily: "var(--font-heading)" }}>{item.name}</p>
                  <p className="text-xs" style={{ color: "var(--kc-muted)" }}>{item.category?.name}</p>
                </div>
                <p className="font-bold text-sm">${parseFloat(item.price).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-3">
                <span className={`kc-badge ${item.is_active ? "kc-badge-success" : "kc-badge-muted"}`}>
                  {item.is_active ? "Active" : "Hidden"}
                </span>
                {item.is_featured && <span className="kc-badge kc-badge-gold">Featured</span>}
                <div className="ml-auto flex gap-2">
                  <button onClick={() => openEdit(item)} className="kc-btn kc-btn-sm kc-btn-outline">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="kc-btn kc-btn-sm kc-btn-danger">Del</button>
                </div>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="col-span-full kc-card p-10 text-center" style={{ color: "var(--kc-muted)" }}>
              No items. Add one with the button above.
            </div>
          )}
        </div>
      )}

      {/* ── Item modal ─────────────────────────────────────────────────────────── */}
      {modal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(26,26,26,0.5)" }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="kc-card w-full max-w-md flex flex-col" style={{ maxHeight: "90svh" }}>
            <div className="p-6 pb-3">
              <h2 className="text-xl font-bold mb-5" style={{ fontFamily: "var(--font-heading)" }}>
                {modal.item ? "Edit Item" : "New Item"}
              </h2>
            </div>

            <div className="px-6 pb-2 overflow-y-auto flex-1">
            {formErr && <p className="text-xs mb-3" style={{ color: "var(--kc-error)" }}>{formErr}</p>}

            <div className="flex flex-col gap-4">

              {/* ── Image upload ─────────────────────────────────────────────── */}
              <div>
                <label className="kc-label">Drink Image</label>
                <div className="flex items-center gap-4 mt-1.5">
                  {/* Live preview */}
                  <ItemImage
                    name={form.name || modal.item?.name || "Item"}
                    imageUrl={modalPreviewUrl}
                    size={72}
                  />

                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    {/* Hidden file input, triggered by the label-button */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleFileChange}
                      id="item-image-upload"
                    />
                    <label
                      htmlFor="item-image-upload"
                      className="kc-btn kc-btn-outline kc-btn-sm text-center cursor-pointer"
                      style={{ display: "block" }}
                    >
                      {imageFile ? "Change file…" : "Upload image"}
                    </label>

                    {imageFile && (
                      <p className="text-xs truncate" style={{ color: "var(--kc-muted)" }}>
                        {imageFile.name}
                      </p>
                    )}

                    {/* Remove button — only if there is a current image and no remove flag */}
                    {(modal.item?.image_url || imageFile) && !removeImageFlag && (
                      <button
                        type="button"
                        onClick={() => { setRemoveImageFlag(true); setImageFile(null); }}
                        className="kc-btn kc-btn-sm"
                        style={{
                          background: "transparent",
                          border: "1.5px solid var(--kc-error)",
                          color: "var(--kc-error)",
                        }}
                      >
                        Remove image
                      </button>
                    )}

                    {removeImageFlag && (
                      <p className="text-xs" style={{ color: "var(--kc-error)" }}>
                        Image will be cleared on save.{" "}
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
                <p className="text-xs mt-2" style={{ color: "var(--kc-muted)" }}>
                  JPEG, PNG, WebP or GIF · max 5 MB
                </p>
              </div>

              {/* ── Category ─────────────────────────────────────────────────── */}
              <div>
                <label className="kc-label">Category</label>
                <select
                  value={activeCat ?? ""}
                  onChange={e => setActiveCat(Number(e.target.value))}
                  className="kc-input"
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* ── Name ─────────────────────────────────────────────────────── */}
              <div>
                <label className="kc-label">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="kc-input"
                  required
                />
              </div>

              {/* ── Spanish Name ──────────────────────────────────────────────── */}
              <div style={{ borderLeft: "3px solid #e8a838", paddingLeft: "0.75rem" }}>
                <label className="kc-label" style={{ color: "#b8962e" }}>
                  Nombre en Español <span style={{ fontWeight: 400, opacity: 0.7 }}>(Spanish Name)</span>
                </label>
                <input
                  type="text"
                  value={form.name_es}
                  onChange={e => setForm(f => ({ ...f, name_es: e.target.value }))}
                  className="kc-input"
                  placeholder="Leave blank to use English name"
                />
              </div>

              {/* ── Description ──────────────────────────────────────────────── */}
              <div>
                <label className="kc-label">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="kc-input"
                  style={{ height: "4.5rem", resize: "vertical" }}
                />
              </div>

              {/* ── Price ────────────────────────────────────────────────────── */}
              <div>
                <label className="kc-label">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="kc-input"
                  required
                />
              </div>

              {/* ── Toggles ──────────────────────────────────────────────────── */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                  />
                  Featured
                </label>
              </div>
            </div>

            </div>

            <div className="flex gap-3 p-6 pt-4" style={{ borderTop: "1px solid var(--kc-cream-dark)" }}>
              <button onClick={closeModal} className="kc-btn kc-btn-outline flex-1">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="kc-btn flex-1">
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
