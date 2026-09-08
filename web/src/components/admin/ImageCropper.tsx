"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { type Crop, type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Button from "./Button";
import type { CropRect } from "@/lib/cloudinary";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

type Props = {
  /** Image to crop. Pass the ORIGINAL (un-cropped) URL so the whole frame is editable. */
  src: string;
  /** Target aspect ratio (width / height). e.g. 1 = square, 16/9 = wide hero. */
  aspect: number;
  /** "round" shows a circular selection (menu drinks); "rect" for heroes/portraits. */
  cropShape?: "rect" | "round";
  /** Existing crop to restore when re-editing. */
  initialCrop?: CropRect | null;
  title?: string;
  description?: string;
  saving?: boolean;
  onCancel: () => void;
  onSave: (crop: CropRect) => void;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Largest centred rectangle of `aspect` that fits inside the image, in percent.
 *
 * Computed directly rather than via makeAspectCrop({ width: 100 }), which
 * derives height from the width and can overflow the image when the target
 * ratio is taller than the source — that would show a selection extending past
 * the photo and then get silently clamped on save.
 */
function centeredAspectPercent(imgW: number, imgH: number, aspect: number): PercentCrop {
  const imgAspect = imgW / imgH;
  // Source is wider than the target → height is the limiting dimension.
  const w = imgAspect > aspect ? (imgH * aspect) / imgW : 1;
  const h = imgAspect > aspect ? 1 : (imgW / aspect) / imgH;
  return {
    unit: "%",
    x: ((1 - w) / 2) * 100,
    y: ((1 - h) / 2) * 100,
    width: w * 100,
    height: h * 100,
  };
}

/**
 * Reusable crop / reposition editor.
 *
 * Built on react-image-crop, which gives a genuinely resizable selection —
 * corner and edge handles, drag-to-move, locked to the slot's aspect ratio.
 * (The previous react-easy-crop implementation could only pan/zoom the image
 * behind a fixed mask; it has no crop-box resize API at all.)
 *
 * Non-destructive: it emits a normalized { x, y, w, h } rectangle in 0..1
 * fractions of the image, which callers persist as metadata and apply at render
 * time via Cloudinary's c_crop. react-image-crop reports selections in percent
 * of the image, so that contract maps across directly — no pixel conversion,
 * and every previously saved crop stays valid.
 */
export default function ImageCropper({
  src, aspect, cropShape = "rect", initialCrop, title = "Reposition image",
  description, saving = false, onCancel, onSave,
}: Props) {
  const [crop, setCrop] = useState<Crop | undefined>();
  // Committed selection in percent — what actually gets saved.
  const [pct, setPct] = useState<PercentCrop | null>(null);
  const [zoom, setZoom] = useState(1);
  const overlayRef = useRef<HTMLDivElement>(null);

  // iOS Safari implements pinch as proprietary `gesture*` events whose default
  // action zooms the whole page. Cancelling them keeps a two-finger gesture
  // inside the editor instead of scaling the admin UI around it.
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

  // Lock background scrolling while the fullscreen editor is open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  /**
   * Seed the selection once the image has laid out. An existing crop is
   * restored as-is; otherwise we centre the largest rectangle of the required
   * ratio, which is the same framing the public page shows today.
   */
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    if (!width || !height) return;

    if (initialCrop && initialCrop.w > 0 && initialCrop.h > 0) {
      const restored: PercentCrop = {
        unit: "%",
        x: initialCrop.x * 100,
        y: initialCrop.y * 100,
        width: initialCrop.w * 100,
        height: initialCrop.h * 100,
      };
      setCrop(restored);
      setPct(restored);
      return;
    }

    const centred = centeredAspectPercent(width, height, aspect);
    setCrop(centred);
    setPct(centred);
  }, [aspect, initialCrop]);

  const handleSave = () => {
    if (!pct || pct.width <= 0 || pct.height <= 0) { onCancel(); return; }
    const x = clamp01(pct.x / 100);
    const y = clamp01(pct.y / 100);
    // Clamp the extent to the image so the rect always satisfies the backend's
    // x+w <= 1 / y+h <= 1 rule, even if a handle was dragged to the very edge.
    const w = clamp01(Math.min(pct.width / 100, 1 - x));
    const h = clamp01(Math.min(pct.height / 100, 1 - y));
    onSave({ x, y, w, h });
  };

  const nudgeZoom = (delta: number) =>
    setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((z + delta).toFixed(2)))));

  const reset = () => {
    setZoom(1);
    setCrop(undefined);
    setPct(null);
    // Re-seed from the image's current layout on the next paint.
    requestAnimationFrame(() => {
      const img = overlayRef.current?.querySelector("img");
      if (img?.width && img.height) {
        const centred = centeredAspectPercent(img.width, img.height, aspect);
        setCrop(centred);
        setPct(centred);
      }
    });
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: "rgba(15,17,21,0.92)",
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

      {/* Crop stage. Zoom enlarges the image's LAYOUT size (not a CSS
          transform) and the stage scrolls — that keeps react-image-crop's
          percentages an exact fraction of the image at any zoom level. */}
      <div
        className="flex-1 min-h-0 overflow-auto flex items-center justify-center px-4"
        style={{ overscrollBehavior: "contain" }}
      >
        <ReactCrop
          crop={crop}
          onChange={(_px, percent) => { setCrop(percent); setPct(percent); }}
          aspect={aspect}
          circularCrop={cropShape === "round"}
          keepSelection
          minWidth={8}
          minHeight={8}

          style={{ touchAction: "none" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            onLoad={onImageLoad}
            style={{
              width: `${zoom * 100}%`,
              maxWidth: "none",
              height: "auto",
              display: "block",
              // Keep the whole image visible at 1× so the default framing is
              // obvious; zooming past that is what the scroll container is for.
              maxHeight: zoom === 1 ? "70vh" : "none",
              objectFit: "contain",
            }}
          />
        </ReactCrop>
      </div>

      {/* Controls */}
      <div className="shrink-0 px-5 py-4 flex flex-col gap-3" style={{ background: "rgba(15,17,21,0.85)" }}>
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

        <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
          Drag the box to move it · drag a corner or edge to resize · the shape stays
          locked to this slot&apos;s ratio. Zoom in for finer control on large photos.
        </p>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={reset}
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
