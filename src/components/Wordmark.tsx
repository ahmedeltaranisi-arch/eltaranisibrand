/**
 * Placeholder wordmark. Original lockup drawn for this build — swap
 * `src/components/Wordmark.tsx` for your own artwork before launch.
 */
export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 184 34"
      role="img"
      aria-label="MATE the label"
      className={className}
      fill="none"
    >
      <text
        x="0"
        y="24"
        fill="currentColor"
        style={{
          font: "500 26px/1 var(--font-inter), ui-sans-serif, system-ui, sans-serif",
          letterSpacing: "0.34em",
        }}
      >
        MATE
      </text>
      <text
        x="130"
        y="30"
        fill="currentColor"
        style={{
          font: "400 11px/1 var(--font-inter), ui-sans-serif, system-ui, sans-serif",
          letterSpacing: "0.16em",
        }}
      >
        THE
      </text>
      <text
        x="130"
        y="30"
        dx="26"
        fill="currentColor"
        style={{
          font: "400 11px/1 var(--font-inter), ui-sans-serif, system-ui, sans-serif",
          letterSpacing: "0.16em",
        }}
      >
        LABEL
      </text>
    </svg>
  );
}
