"use client";

import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import Button from "./Button";
import type { CropRect } from "@/lib/cloudinary";

type Props = {
  /** Image to crop. Pass the ORIGINAL (un-cropped) URL so the whole frame is editable. */
  src: string;
  /** Target aspect ratio (width / height). e.g. 1 = square, 16/9 = wide hero. */
  aspect: number;
  /** "round" shows a circular overlay (menu drinks, team avatars); "rect" for heroes. */
  cropShape?: "rect" | "round";
  /** Existing crop to restore when re-editing. */
  initialCrop?: CropRect | null;
  title?: string;
  description?: string;
  saving?: boolean;
  onCancel: () => void;
  onSave: (crop: CropRect) => void;
};

/**
 * Reusable zoom / drag / reposition cropper. Non-destructive: it emits a
 * normalized { x, y, w, h } crop rectangle (fractions of the original image)
 * that callers persist as metadata and apply at render time via Cloudinary's
 * c_crop transform. Supports mouse, touch and pinch-zoom for the mobile admin.
 */
export default function ImageCropper({
  src, aspect, cropShape = "round", initialCrop, title = "Reposition image",
  description, saving = false, onCancel, onSave,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  // react-easy-crop reports the selected area both in pixels and percentages.
  // We keep the percentage form since Cloudinary's fractional c_crop wants 0..1.
  const [areaPct, setAreaPct] = useState<Area | null>(null);

  const onCropComplete = useCallback((areaPercentages: Area) => {
    setAreaPct(areaPercentages);
  }, []);

  const handleSave = () => {
    if (!areaPct) { onCancel(); return; }
    onSave({
      x: areaPct.x / 100,
      y: areaPct.y / 100,
      w: areaPct.width / 100,
      h: areaPct.height / 100,
    });
  };

  const initialAreaPct = initialCrop
    ? { x: initialCrop.x * 100, y: initialCrop.y * 100, width: initialCrop.w * 100, height: initialCrop.h * 100 }
    : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: "rgba(15,17,21,0.92)" }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-5 py-4 shrink-0">
        <div className="min-w-0">
          <p className="font-semibold text-base" style={{ color: "#fff" }}>{title}</p>
          {description && (
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{description}</p>
          )}
        </div>
        <button
          onClick={onCancel}
          className="text-sm shrink-0"
          style={{ color: "rgba(255,255,255,0.7)" }}
          aria-label="Cancel"
        >
          ✕
        </button>
      </div>

      {/* Crop stage */}
      <div className="relative flex-1 min-h-0">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          cropShape={cropShape}
          showGrid={cropShape === "rect"}
          restrictPosition
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          initialCroppedAreaPercentages={initialAreaPct}
        />
      </div>

      {/* Controls */}
      <div className="shrink-0 px-5 py-4 flex flex-col gap-4" style={{ background: "rgba(15,17,21,0.85)" }}>
        <div className="flex items-center gap-3">
          <span className="text-xs shrink-0" style={{ color: "rgba(255,255,255,0.6)" }}>Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="w-full"
            aria-label="Zoom"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => { setCrop({ x: 0, y: 0 }); setZoom(1); }}
            className="text-xs"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            Reset
          </button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onCancel} disabled={saving}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>Apply crop</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
