"use client";

/**
 * Root-level boundary: replaces the entire <html> when something throws in the
 * root layout. Kept deliberately dependency-free so it can always render.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          background: "#f9f8f2",
          color: "#000",
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
        }}
      >
        <div style={{ textAlign: "center", padding: 24 }}>
          <p
            style={{
              letterSpacing: ".14em",
              textTransform: "uppercase",
              fontSize: 11,
              color: "#6d7a82",
            }}
          >
            Something went wrong
          </p>
          <h1 style={{ fontWeight: 500, fontSize: 26 }}>
            The site just updated — reload to continue
          </h1>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              height: 48,
              padding: "0 28px",
              background: "#000",
              color: "#f9f8f2",
              border: 0,
              fontSize: 12,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          <p style={{ marginTop: 12, fontSize: 12, color: "#6d7a82" }}>
            {error.message || "Unknown error"}
          </p>
        </div>
      </body>
    </html>
  );
}
