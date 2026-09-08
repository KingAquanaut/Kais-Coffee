"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import Button from "./Button";
import type { CropRect } from "@/lib/cloudinary";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

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
  const overlayRef = useRef<HTMLDivElement>(null);
  // react-easy-crop reports the selected area both in pixels and percentages.
  // We keep the percentage form since Cloudinary's fractional c_crop wants 0..1.
  const [areaPct, setAreaPct] = useState<Area | null>(null);

  const onCropComplete = useCallback((areaPercentages: Area) => {
    setAreaPct(areaPercentages);
  }, []);

  // iOS Safari implements pinch as proprietary `gesture*` events on top of
  // touch events, and its default action zooms the whole page. react-easy-crop
  // only listens for touchmove, so without this a two-finger pinch scales the
  // admin UI instead of the image. `touch-action: none` alone does not stop it
  // — Safari needs the gesture events cancelled explicitly.
  //
  // Bound natively (not via React props) because these events are non-standard
  // and must be registered non-passive to be cancellable.
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const stop = (e: Event) => e.preventDefault();
    const opts = { passive: false } as const;
    el.addEventListener("gesturestart", stop, opts);
    el.addEventListener("gesturechange", stop, opts);
    el.addEventListener("gestureend", stop, opts);
    return () => {
      el.removeEventListener("gesturestart", stop);
      el.removeEventListener("gesturechange", stop);
      el.removeEventListener("gestureend", stop);
    };
  }, []);

  // Lock background scrolling while the fullscreen cropper is open, so a drag
  // that slips outside the stage doesn't scroll the admin page underneath.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  const nudgeZoom = (delta: number) =>
    setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((z + delta).toFixed(2)))));

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
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: "rgba(15,17,21,0.92)",
        // Hand all touch handling to the cropper: no page pan, no double-tap
        // zoom, and no rubber-band scroll leaking to the page behind.
        touchAction: "none",
        overscrollBehavior: "contain",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
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
          // Pinch (touch) and wheel/trackpad (desktop) both drive the same zoom
          // state as the slider, so every input path stays in sync.
          zoomWithScroll
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          zoomSpeed={0.25}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          initialCroppedAreaPercentages={initialAreaPct}
        />
      </div>

      {/* Controls */}
      <div className="shrink-0 px-5 py-4 flex flex-col gap-4" style={{ background: "rgba(15,17,21,0.85)" }}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => nudgeZoom(-0.25)}
            disabled={zoom <= MIN_ZOOM}
            className="shrink-0 w-8 h-8 rounded-full text-base leading-none disabled:opacity-30"
            style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
            aria-label="Zoom out"
          >
            −
          </button>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={e => setZoom(Number(e.target.value))}
            className="w-full"
            aria-label="Zoom"
          />
          <button
            type="button"
            onClick={() => nudgeZoom(0.25)}
            disabled={zoom >= MAX_ZOOM}
            className="shrink-0 w-8 h-8 rounded-full text-base leading-none disabled:opacity-30"
            style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
            aria-label="Zoom in"
          >
            +
          </button>
          <span
            className="text-xs shrink-0 tabular-nums text-right"
            style={{ color: "rgba(255,255,255,0.6)", width: "3.5ch" }}
          >
            {Math.round(zoom * 100)}%
          </span>
        </div>
        <p className="text-xs -mt-2" style={{ color: "rgba(255,255,255,0.45)" }}>
          Drag to reposition · pinch or scroll to zoom. The frame is fixed to the
          shape this image is displayed in.
        </p>
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
