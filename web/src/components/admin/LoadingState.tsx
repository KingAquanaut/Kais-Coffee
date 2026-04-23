type Props = { text?: string; className?: string };

export default function LoadingState({ text = "Loading…", className = "" }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-14 ${className}`}>
      <span
        className="animate-spin rounded-full"
        style={{
          width: 28, height: 28,
          border: "2.5px solid var(--admin-border)",
          borderTopColor: "var(--admin-accent)",
        }}
      />
      <p className="text-sm" style={{ color: "var(--admin-ink-muted)" }}>{text}</p>
    </div>
  );
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div
      className="grid items-center px-4 py-3 gap-3"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, borderBottom: "1px solid var(--admin-border)" }}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded animate-pulse"
          style={{ background: "var(--admin-surface-hover)" }}
        />
      ))}
    </div>
  );
}
