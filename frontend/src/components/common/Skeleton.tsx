/**
 * Loading placeholders that mirror the shape of the content they stand in for, so a slow network
 * shows "a caregiver list is coming" rather than a bare "Loading…" that gives no sense of layout
 * or progress. Purely presentational — every one of these is swapped out for real content the
 * moment its query resolves; see components/common/QueryState.tsx for how they're wired in.
 */
function Bar({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} aria-hidden />;
}

/** A handful of pulsing text lines — the safe generic default for list-shaped content. */
export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="p-4 rounded-lg border bg-white flex items-center gap-4">
          <Bar className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2"><Bar className="h-4 w-2/3" /><Bar className="h-3 w-1/3" /></div>
        </div>
      ))}
    </div>
  );
}

/** A grid of card-shaped placeholders — for caregiver/doctor/meal/mentor style card grids. */
export function SkeletonCards({ count = 4, columns = 'md:grid-cols-2' }: { count?: number; columns?: string }) {
  return (
    <div className={`grid grid-cols-1 ${columns} gap-4`} role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="p-5 rounded-lg border bg-white space-y-3">
          <div className="flex gap-3 items-center"><Bar className="h-12 w-12 rounded-full" /><div className="flex-1 space-y-2"><Bar className="h-4 w-3/4" /><Bar className="h-3 w-1/2" /></div></div>
          <Bar className="h-3 w-full" /><Bar className="h-3 w-5/6" />
        </div>
      ))}
    </div>
  );
}

/** A pulsing table body — for admin-style data tables. */
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-lg border bg-white overflow-hidden" role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className={`flex gap-6 px-4 py-3 ${r > 0 ? 'border-t' : ''}`}>
          {Array.from({ length: columns }, (_, c) => <Bar key={c} className="h-4 flex-1" />)}
        </div>
      ))}
    </div>
  );
}

/** Small metric-card grid, sized for the Dashboard/Care360 vitals row. */
export function SkeletonMetrics({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" role="status" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="p-6 rounded-lg border bg-white space-y-3">
          <Bar className="h-10 w-10 rounded-lg" /><Bar className="h-3 w-1/2" /><Bar className="h-6 w-2/3" />
        </div>
      ))}
    </div>
  );
}

/** Full-page placeholder for a route-level Suspense boundary (module switch) or session bootstrap. */
export function SkeletonPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" role="status" aria-label="Loading">
      <div className="space-y-2"><Bar className="h-7 w-1/3" /><Bar className="h-4 w-1/2" /></div>
      <SkeletonMetrics count={3} />
      <SkeletonRows rows={3} />
    </div>
  );
}
