"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
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

  // Clean up camera on unmount
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

    // Detect stamp vs redeem by prefix
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
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1,
        },
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
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
          Scan QR Code
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--kc-muted)" }}>
          Scan a customer&apos;s QR code to add a stamp or redeem a reward.
        </p>

        {/* ── Success ──────────────────────────────────────────────────── */}
        {status.kind === "success" && (() => {
          const { result } = status;
          const d = result.data;
          const isStamp = result.type === "stamp";
          return (
            <div className="kc-card p-6 text-center">
              <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
                {isStamp ? "\u2615" : "\u2705"}
              </div>
              <h2 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)", color: "var(--kc-success)" }}>
                {d.message}
              </h2>
              <p className="text-sm" style={{ color: "var(--kc-muted)" }}>
                Customer: <strong>{d.customer.name}</strong>
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 rounded-lg" style={{ background: "var(--kc-bg)" }}>
                  <p className="text-lg font-bold" style={{ color: "var(--kc-gold)" }}>{d.points_balance}</p>
                  <p className="text-xs" style={{ color: "var(--kc-muted)" }}>Stamps remaining</p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: "var(--kc-bg)" }}>
                  <p className="text-lg font-bold" style={{ color: "var(--kc-blue-deep)" }}>{d.lifetime_points}</p>
                  <p className="text-xs" style={{ color: "var(--kc-muted)" }}>Lifetime stamps</p>
                </div>
              </div>
              <button onClick={reset} className="kc-btn w-full mt-5">
                Scan Another
              </button>
            </div>
          );
        })()}

        {/* ── Error ───────────────────────────────────────────────────── */}
        {status.kind === "error" && (
          <div className="kc-card p-6 text-center">
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
              &#10060;
            </div>
            <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-heading)", color: "var(--kc-error)" }}>
              Scan Failed
            </h2>
            <p className="text-sm mb-4" style={{ color: "var(--kc-muted)" }}>
              {status.message}
            </p>
            <button onClick={reset} className="kc-btn w-full">
              Try Again
            </button>
          </div>
        )}

        {/* ── Verifying ───────────────────────────────────────────────── */}
        {status.kind === "verifying" && (
          <div className="kc-card p-8 text-center">
            <div
              style={{
                width: 40, height: 40, margin: "0 auto 1rem",
                border: "3px solid var(--kc-cream-dark)",
                borderTopColor: "var(--kc-gold)",
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite",
              }}
            />
            <p className="text-sm font-semibold">Verifying code...</p>
          </div>
        )}

        {/* ── Idle / Scanning ─────────────────────────────────────────── */}
        {(status.kind === "idle" || status.kind === "scanning") && (
          <>
            {/* Camera scanner */}
            <div className="kc-card p-5 mb-4">
              <h2 className="text-sm font-bold mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                Camera Scanner
              </h2>

              {cameraError && (
                <p className="text-xs mb-3 p-3 rounded-lg" style={{ background: "#fee2e2", color: "var(--kc-error)" }}>
                  {cameraError}
                </p>
              )}

              <div
                ref={scannerRef}
                style={{
                  width: "100%",
                  minHeight: cameraActive ? 300 : 0,
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  background: cameraActive ? "#000" : "transparent",
                }}
              />

              {!cameraActive ? (
                <button onClick={startCamera} className="kc-btn w-full mt-2">
                  Start Camera
                </button>
              ) : (
                <button onClick={stopCamera} className="kc-btn kc-btn-outline w-full mt-2">
                  Stop Camera
                </button>
              )}
            </div>

            {/* Manual fallback */}
            <div className="kc-card p-5">
              <h2 className="text-sm font-bold mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                Manual Token Entry
              </h2>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  className="kc-input flex-1"
                  value={manualToken}
                  onChange={e => setManualToken(e.target.value)}
                  placeholder="Paste token (stamp:... or raw hex)"
                  style={{ fontFamily: "monospace", fontSize: "0.8125rem" }}
                />
                <button
                  type="submit"
                  disabled={!manualToken.trim()}
                  className="kc-btn kc-btn-gold shrink-0"
                >
                  Submit
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </AdminLayout>
  );
}
