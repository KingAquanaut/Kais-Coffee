"use client";
export default function OfflinePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center text-center px-6"
         style={{ background: "transparent" }}>
      <div className="kc-img-placeholder mb-8" style={{ width: 80, height: 80, fontSize: "2rem" }}>☕</div>
      <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-heading)" }}>
        You&apos;re offline
      </h1>
      <p className="text-sm max-w-xs" style={{ color: "var(--kc-muted)", lineHeight: 1.7 }}>
        Please check your internet connection and try again. Your reward points are safe.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="kc-btn mt-8"
      >
        Try Again
      </button>
    </div>
  );
}
