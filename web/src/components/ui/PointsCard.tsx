type Props = {
  points: number;
  threshold: number;
  canRedeem: boolean;
  onRedeem?: () => void;
  redeeming?: boolean;
};

/** Filled stamp circle */
function StampFilled() {
  return (
    <div
      style={{
        width: "100%", aspectRatio: "1", borderRadius: "50%",
        background: "var(--kc-gold-lt)",
        border: "2px solid var(--kc-gold)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "clamp(0.85rem, 2.5vw, 1.2rem)",
        transition: "all 0.25s ease",
      }}
      aria-label="Stamp earned"
    >
      ☕
    </div>
  );
}

/** Empty stamp circle */
function StampEmpty({ isFree }: { isFree?: boolean }) {
  return (
    <div
      style={{
        width: "100%", aspectRatio: "1", borderRadius: "50%",
        background: "var(--kc-bg)",
        border: "2px dashed var(--kc-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.25s ease",
      }}
      aria-label={isFree ? "Free coffee — final stamp" : "Empty stamp"}
    >
      {isFree && (
        <span
          style={{
            fontSize: "0.55rem", fontWeight: 900, letterSpacing: "0.04em",
            color: "var(--kc-muted)", textAlign: "center", lineHeight: 1.1,
            fontFamily: "var(--font-heading)",
          }}
        >
          FREE
        </span>
      )}
    </div>
  );
}

export default function PointsCard({ points, threshold, canRedeem, onRedeem, redeeming }: Props) {
  // Stamps collected in the current card cycle
  const stampsInCycle = canRedeem ? threshold : (points % threshold);
  const toFree = Math.max(0, threshold - stampsInCycle);

  return (
    <div className="kc-card p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="kc-badge kc-badge-gold">Digital Stamp Card</p>
        <p className="text-sm font-semibold" style={{ color: "var(--kc-muted)" }}>
          {stampsInCycle} / {threshold}
        </p>
      </div>

      {/* Stamp grid — 4 columns × 2 rows (matches the physical card) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0.65rem",
        }}
      >
        {Array.from({ length: threshold }).map((_, i) => {
          const filled  = i < stampsInCycle;
          const isFinal = i === threshold - 1;
          return (
            <div key={i}>
              {filled ? <StampFilled /> : <StampEmpty isFree={isFinal} />}
            </div>
          );
        })}
      </div>

      {/* Status text */}
      <p className="text-xs mt-4 text-center" style={{ color: "var(--kc-muted)" }}>
        {canRedeem
          ? "All 8 stamps collected — redeem your free coffee! ☕"
          : `${toFree} more stamp${toFree !== 1 ? "s" : ""} until your free coffee · earn a stamp with every $6+ purchase`
        }
      </p>

      {canRedeem && onRedeem && (
        <button
          onClick={onRedeem}
          disabled={redeeming}
          className="kc-btn kc-btn-gold w-full mt-4"
        >
          {redeeming ? "Redeeming…" : "Redeem Free Coffee"}
        </button>
      )}
    </div>
  );
}
