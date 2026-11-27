interface StatusBarProps {
  visibleCount: number
  hiddenCount: number
  storageAvailable: boolean
  online: boolean
}

export function StatusBar({ visibleCount, hiddenCount, storageAvailable, online }: StatusBarProps) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface px-4 py-2 text-xs text-text-muted">
      <span>
        {visibleCount} active stream{visibleCount === 1 ? '' : 's'} · {hiddenCount} hidden
        {!online && ' · offline'}
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            !online ? 'bg-red-500' : storageAvailable ? 'bg-green-500' : 'bg-red-500'
          }`}
          aria-hidden="true"
        />
        {!online
          ? 'Offline — streams will reload when the connection returns'
          : storageAvailable
            ? 'Saved locally in this browser'
            : 'Local storage unavailable — changes will not persist'}
      </span>
    </footer>
  )
}
