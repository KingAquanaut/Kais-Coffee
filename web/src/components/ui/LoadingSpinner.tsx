export default function LoadingSpinner({ text = "Loading…" }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div
        className="animate-spin rounded-full border-2"
        style={{
          width: 32, height: 32,
          borderColor: "var(--kc-bg-mid)",
          borderTopColor: "var(--kc-blue-deep)",
        }}
      />
      <p className="text-sm" style={{ color: "var(--kc-muted)" }}>{text}</p>
    </div>
  );
}
