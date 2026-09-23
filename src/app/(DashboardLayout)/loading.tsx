/**
 * Route-level loading UI for the dashboard shell.
 *
 * Without this, navigating to a data-driven page shows a blank main area until
 * the page's client component mounts and its first request resolves. The
 * skeleton mirrors the shared page rhythm (title block → stat cards → content)
 * so the transition does not jump.
 */
export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 animate-pulse rounded-lg bg-outline-variant/30" />
          <div className="h-4 w-72 animate-pulse rounded-lg bg-outline-variant/20" />
        </div>
        <div className="h-9 w-28 animate-pulse rounded-lg bg-outline-variant/30" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-outline-variant bg-surface-container-lowest dark:bg-surface-container"
          />
        ))}
      </div>

      <div className="h-80 animate-pulse rounded-2xl border border-outline-variant bg-surface-container-lowest dark:bg-surface-container" />
    </div>
  );
}
