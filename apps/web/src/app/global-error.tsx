"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <main className="w-full max-w-xl rounded-2xl border border-border bg-surface-elevated p-8 shadow-panel">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Runtime Error
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            The session view failed to load.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The UI hit an unexpected error while rendering. Retry the current
            view or return to the landing page.
          </p>
          {error.digest ? (
            <p className="mt-4 rounded-lg border border-border bg-editor-panel px-3 py-2 font-mono text-xs text-muted-foreground">
              Error digest: {error.digest}
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={reset}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Retry
            </button>
            <Link
              href="/"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              Back Home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}