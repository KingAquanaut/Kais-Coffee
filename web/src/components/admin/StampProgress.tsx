type Props = {
  value: number;
  threshold: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
};

/**
 * Segmented progress meter for the stamp card — one segment per stamp up to
 * the threshold. Once filled, the whole meter goes gold to signal "ready".
 */
export default function StampProgress({ value, threshold, size = "md", showLabel = false }: Props) {
  const filled = Math.min(value, threshold);
  const ready  = value >= threshold;
  const over   = Math.max(0, value - threshold);

  const segHeight = size === "sm" ? 6 : size === "lg" ? 12 : 8;
  const gap       = size === "sm" ? 2 : 3;

  return (
    <div className="w-full">
      <div className="flex w-full" style={{ gap }}>
        {Array.from({ length: threshold }).map((_, i) => (
          <div
            key={i}
            className="flex-1 rounded-full transition-colors"
            style={{
              height: segHeight,
              background: i < filled
                ? (ready ? "var(--admin-gold)" : "var(--admin-accent)")
                : "var(--admin-border)",
            }}
          />
        ))}
      </div>

      {showLabel && (
        <div className="mt-2 flex items-center justify-between text-xs">
          <span
            className="font-semibold tabular-nums"
            style={{ color: ready ? "var(--admin-gold)" : "var(--admin-ink)" }}
          >
            {value} / {threshold}
            {over > 0 && (
              <span className="ml-1" style={{ color: "var(--admin-ink-faint)" }}>
                (+{over})
              </span>
            )}
          </span>
          <span
            className="font-semibold"
            style={{ color: ready ? "var(--admin-gold)" : "var(--admin-ink-muted)" }}
          >
            {ready ? "Ready to redeem" : `${threshold - value} to go`}
          </span>
        </div>
      )}
    </div>
  );
}
