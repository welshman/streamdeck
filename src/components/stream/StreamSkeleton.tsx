export function StreamSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface-raised shadow-card" aria-hidden="true">
      <div className="aspect-video animate-shimmer bg-gradient-to-r from-surface-sunken via-surface to-surface-sunken bg-[length:800px_100%]" />
      <div className="flex items-center gap-2 border-t border-border px-3 py-2">
        <div className="h-5 w-14 animate-pulse rounded-full bg-surface-sunken" />
        <div className="h-4 flex-1 animate-pulse rounded bg-surface-sunken" />
      </div>
    </div>
  )
}
