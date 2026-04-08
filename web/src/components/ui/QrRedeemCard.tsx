"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { account as accountApi, type QrTokenResponse } from "@/lib/api";
import { getToken } from "@/contexts/AuthContext";

type Props = { canRedeem: boolean };

export default function QrRedeemCard({ canRedeem }: Props) {
  const [qr, setQr] = useState<QrTokenResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const generate = useCallback(async () => {
    const authToken = getToken();
    if (!authToken) return;
    setLoading(true);
    setError(null);
    clearTimer();
    try {
      const res = await accountApi.generateQrToken(authToken);
      setQr(res);
      const expiresAt = new Date(res.expires_at).getTime();
      const updateCountdown = () => {
        const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
        setSecondsLeft(remaining);
        if (remaining <= 0) clearTimer();
      };
      updateCountdown();
      timerRef.current = setInterval(updateCountdown, 1000);
    } catch {
      setError("Could not generate QR code. Please try again.");
      setQr(null);
    } finally {
      setLoading(false);
    }
  }, [clearTimer]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  if (!canRedeem) return null;

  const expired = qr && secondsLeft <= 0;

  return (
    <div className="kc-card p-5">
      <h2
        className="text-lg font-bold mb-1"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Redeem with QR
      </h2>
      <p className="text-xs mb-4" style={{ color: "var(--kc-muted)" }}>
        Show this code to the barista to claim your free coffee.
      </p>

      {/* No QR generated yet */}
      {!qr && !loading && (
        <button onClick={generate} className="kc-btn kc-btn-gold w-full">
          Show QR Code
        </button>
      )}

      {loading && (
        <div className="flex justify-center py-6">
          <div
            className="kc-spinner"
            style={{
              width: 32,
              height: 32,
              border: "3px solid var(--kc-cream-dark)",
              borderTopColor: "var(--kc-gold)",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
            }}
          />
        </div>
      )}

      {error && (
        <div className="text-sm py-3 text-center" style={{ color: "var(--kc-error)" }}>
          {error}
          <button onClick={generate} className="kc-btn kc-btn-outline kc-btn-sm mt-3 w-full">
            Try Again
          </button>
        </div>
      )}

      {/* QR display */}
      {qr && !loading && (
        <div className="flex flex-col items-center gap-3">
          <div
            style={{
              padding: 16,
              background: "#fff",
              borderRadius: "1rem",
              border: "1.5px solid var(--kc-border)",
              opacity: expired ? 0.35 : 1,
              transition: "opacity 0.3s",
            }}
          >
            <QRCodeSVG
              value={qr.token}
              size={200}
              level="M"
              bgColor="#ffffff"
              fgColor="#1a1a1a"
            />
          </div>

          {/* Countdown */}
          {!expired ? (
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: "var(--kc-blue-deep)" }}>
                Expires in {secondsLeft}s
              </p>
              <div
                className="mt-2 h-1.5 rounded-full overflow-hidden"
                style={{ width: 200, background: "var(--kc-cream-dark)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round((secondsLeft / (qr.ttl || 60)) * 100)}%`,
                    background: secondsLeft <= 10 ? "var(--kc-error)" : "var(--kc-gold)",
                    transition: "width 1s linear, background 0.3s",
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: "var(--kc-error)" }}>
                Code expired
              </p>
              <button onClick={generate} className="kc-btn kc-btn-gold kc-btn-sm mt-2">
                Generate New Code
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
