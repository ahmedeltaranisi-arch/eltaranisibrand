/** Eltaranisi Brand wordmark, shared by all page headers. */
export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span
        className="text-[22px] leading-none font-normal tracking-[0.22em] text-ink uppercase"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Eltaranisi
      </span>
      <span className="eyebrow text-mist">Brand</span>
    </span>
  );
}
