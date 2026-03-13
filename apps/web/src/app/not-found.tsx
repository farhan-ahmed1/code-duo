import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-surface-elevated p-8 shadow-panel">
        <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
          404
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          This room or page does not exist.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Check the URL, create a new room, or return to the landing page to
          start a fresh collaboration session.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Go Home
          </Link>
          <Link
            href="/"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
          >
            Start New Session
          </Link>
        </div>
      </section>
    </main>
  );
}