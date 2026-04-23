"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/admin/PageHeader";
import { Card, CardHeader, CardTitle } from "@/components/admin/Card";
import Button from "@/components/admin/Button";
import StatusBadge from "@/components/admin/StatusBadge";
import LoadingState from "@/components/admin/LoadingState";
import { IconQr, IconCheck, IconClose } from "@/components/admin/Icon";
import { admin as adminApi, type ScanRedeemResponse, type ScanStampResponse, type ApiError } from "@/lib/api";
import { getToken } from "@/contexts/AuthContext";

type SuccessData =
  | { type: "redeem"; data: ScanRedeemResponse }
  | { type: "stamp"; data: ScanStampResponse };

type Status =
  | { kind: "idle" }
  | { kind: "scanning" }
  | { kind: "verifying" }
  | { kind: "success"; result: SuccessData }
  | { kind: "error"; message: string };

export default function AdminScanPage() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [manualToken, setManualToken] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<unknown>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const scanner = html5QrRef.current as { stop?: () => Promise<void>; clear?: () => void } | null;
      if (scanner) {
        try { scanner.stop?.().catch(() => {}); } catch {}
        try { scanner.clear?.(); } catch {}
        html5QrRef.current = null;
      }
    };
  }, []);

  const stopCamera = useCallback(() => {
    const scanner = html5QrRef.current as { stop?: () => Promise<void>; clear?: () => void } | null;
    if (scanner) {
      try { scanner.stop?.().catch(() => {}); } catch {}
      try { scanner.clear?.(); } catch {}
      html5QrRef.current = null;
    }
    if (mountedRef.current) setCameraActive(false);
  }, []);

  const handleScan = useCallback(async (scannedToken: string) => {
    const authToken = getToken();
    if (!authToken) return;

    const trimmed = scannedToken.trim();
    const isStamp = trimmed.startsWith("stamp:");
    const rawToken = isStamp ? trimmed.slice(6) : trimmed;

    if (!/^[a-f0-9]{64}$/i.test(rawToken)) {
      setStatus({ kind: "error", message: "Invalid QR code format. Expected a valid token." });
      return;
    }

    setStatus({ kind: "verifying" });
    try {
      if (isStamp) {
        const res = await adminApi.users.scanStamp(authToken, rawToken);
        setStatus({ kind: "success", result: { type: "stamp", data: res } });
      } else {
        const res = await adminApi.users.scanRedeem(authToken, rawToken);
        setStatus({ kind: "success", result: { type: "redeem", data: res } });
      }
      stopCamera();
    } catch (err) {
      const apiErr = err as ApiError;
      setStatus({ kind: "error", message: apiErr.message || "Scan failed." });
    }
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setStatus({ kind: "scanning" });

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scannerId = "kc-qr-scanner";

      if (!scannerRef.current || !mountedRef.current) return;
      scannerRef.current.id = scannerId;

      const scanner = new Html5Qrcode(scannerId);
      html5QrRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
        (decodedText) => {
          scanner.stop().then(() => {
            try { scanner.clear(); } catch {}
            html5QrRef.current = null;
            if (mountedRef.current) {
              setCameraActive(false);
              handleScan(decodedText);
            }
          }).catch(() => {});
        },
        () => {},
      );

      if (mountedRef.current) setCameraActive(true);
    } catch {
      if (mountedRef.current) {
        setCameraError("Could not access camera. Please allow camera permissions or use manual entry.");
        setStatus({ kind: "idle" });
        setCameraActive(false);
      }
    }
  }, [handleScan]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    stopCamera();
    handleScan(manualToken);
  };

  const reset = () => {
    setStatus({ kind: "idle" });
    setManualToken("");
    setCameraError(null);
  };

  return (
    <AdminLayout>
      <div className="max-w-xl">
        <PageHeader
          eyebrow="Operations"
          title="Scan QR Code"
          description="Scan a customer's QR code to add a stamp or redeem their reward."
        />

        {/* ── Success ───────────────────────────────────────────── */}
        {status.kind === "success" && (() => {
          const { result } = status;
          const d = result.data;
          const isStamp = result.type === "stamp";
          return (
            <Card>
              <div className="flex flex-col items-center text-center py-4">
                <div
                  className="flex items-center justify-center mb-4"
                  style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: isStamp ? "var(--admin-accent-soft)" : "var(--admin-gold-bg)",
                    color: isStamp ? "var(--admin-accent)" : "var(--admin-gold)",
                  }}
                >
                  <IconCheck size={32} strokeWidth={2.5} />
                </div>
                <StatusBadge tone={isStamp ? "success" : "gold"} size="sm" dot>
                  {isStamp ? "Stamp added" : "Reward redeemed"}
                </StatusBadge>
                <h2 className="text-lg font-bold mt-3" style={{ color: "var(--admin-ink)" }}>
                  {d.message}
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--admin-ink-muted)" }}>
                  {d.customer.name}
                </p>

                <div className="grid grid-cols-2 gap-3 mt-5 w-full">
                  <div className="p-3 rounded-lg text-center"
                       style={{ background: "var(--admin-surface-alt)", border: "1px solid var(--admin-border)" }}>
                    <p className="text-2xl font-bold tabular-nums"
                       style={{ color: "var(--admin-gold)", fontFamily: "var(--font-heading)" }}>
                      {d.points_balance}
                    </p>
                    <p className="text-xs" style={{ color: "var(--admin-ink-muted)" }}>Stamps remaining</p>
                  </div>
                  <div className="p-3 rounded-lg text-center"
                       style={{ background: "var(--admin-surface-alt)", border: "1px solid var(--admin-border)" }}>
                    <p className="text-2xl font-bold tabular-nums"
                       style={{ color: "var(--admin-accent-deep)", fontFamily: "var(--font-heading)" }}>
                      {d.lifetime_points}
                    </p>
                    <p className="text-xs" style={{ color: "var(--admin-ink-muted)" }}>Lifetime stamps</p>
                  </div>
                </div>

                <Button variant="primary" fullWidth onClick={reset} className="mt-5">
                  Scan another
                </Button>
              </div>
            </Card>
          );
        })()}

        {/* ── Error ─────────────────────────────────────────────── */}
        {status.kind === "error" && (
          <Card>
            <div className="flex flex-col items-center text-center py-4">
              <div
                className="flex items-center justify-center mb-4"
                style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "var(--admin-danger-bg)",
                  color: "var(--admin-danger)",
                }}
              >
                <IconClose size={32} strokeWidth={2.5} />
              </div>
              <h2 className="text-lg font-bold" style={{ color: "var(--admin-ink)" }}>
                Scan failed
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--admin-ink-muted)" }}>
                {status.message}
              </p>
              <Button variant="primary" fullWidth onClick={reset} className="mt-5">
                Try again
              </Button>
            </div>
          </Card>
        )}

        {/* ── Verifying ─────────────────────────────────────────── */}
        {status.kind === "verifying" && (
          <Card>
            <LoadingState text="Verifying code…" />
          </Card>
        )}

        {/* ── Idle / Scanning ───────────────────────────────────── */}
        {(status.kind === "idle" || status.kind === "scanning") && (
          <div className="flex flex-col gap-4">
            {/* Camera */}
            <Card padding="none">
              <CardHeader>
                <CardTitle>Camera Scanner</CardTitle>
                <StatusBadge tone={cameraActive ? "success" : "neutral"} size="sm" dot>
                  {cameraActive ? "Live" : "Idle"}
                </StatusBadge>
              </CardHeader>
              <div className="p-5">
                {cameraError && (
                  <div
                    className="mb-3 px-3 py-2 rounded-md text-xs"
                    style={{ background: "var(--admin-danger-bg)", color: "var(--admin-danger)" }}
                  >
                    {cameraError}
                  </div>
                )}
                <div
                  ref={scannerRef}
                  style={{
                    width: "100%",
                    minHeight: cameraActive ? 300 : 0,
                    borderRadius: 10,
                    overflow: "hidden",
                    background: cameraActive ? "#000" : "transparent",
                  }}
                />
                {!cameraActive ? (
                  <Button variant="primary" fullWidth leftIcon={<IconQr size={16} />} onClick={startCamera} className="mt-3">
                    Start camera
                  </Button>
                ) : (
                  <Button variant="secondary" fullWidth onClick={stopCamera} className="mt-3">
                    Stop camera
                  </Button>
                )}
              </div>
            </Card>

            {/* Manual */}
            <Card padding="none">
              <CardHeader><CardTitle>Manual Token Entry</CardTitle></CardHeader>
              <div className="p-5">
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    className="admin-input flex-1"
                    value={manualToken}
                    onChange={e => setManualToken(e.target.value)}
                    placeholder="Paste token (stamp:… or raw hex)"
                    style={{ fontFamily: "monospace", fontSize: "0.8125rem" }}
                  />
                  <Button variant="gold" type="submit" disabled={!manualToken.trim()} className="shrink-0">
                    Submit
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
