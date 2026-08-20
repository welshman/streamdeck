import { useState, useCallback, useRef } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'

interface PlayerFrameProps {
  title: string
  src: string
  allow?: string
}

/**
 * Shared iframe wrapper providing consistent loading skeleton and error
 * fallback UI across Twitch/Kick/YouTube embeds. Iframes cannot reliably
 * report *why* they failed (cross-origin), so we treat a slow/failed
 * load plus a timeout as a best-effort "may be unavailable" signal
 * rather than a guaranteed error state.
 */
export function PlayerFrame({ title, src, allow }: PlayerFrameProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'timeout'>('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const timeoutRef = useRef<number | null>(null)

  const startTimeout = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => {
      setStatus((s) => (s === 'loading' ? 'timeout' : s))
    }, 12000)
  }, [])

  const handleReload = useCallback(() => {
    setStatus('loading')
    setReloadKey((k) => k + 1)
    startTimeout()
  }, [startTimeout])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-black">
      {status === 'loading' && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-surface-sunken"
          aria-hidden="true"
        >
          <div className="h-full w-full animate-shimmer bg-gradient-to-r from-surface-sunken via-surface-raised to-surface-sunken bg-[length:800px_100%]" />
        </div>
      )}
      {status === 'timeout' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface-sunken px-4 text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-500" aria-hidden="true" />
          <p className="text-sm text-text-muted">
            This player is taking a while to load. It may be offline, region-restricted, or
            blocked by the platform.
          </p>
          <button
            type="button"
            onClick={handleReload}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-sm font-medium text-text hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reload player
          </button>
        </div>
      )}
      <iframe
        key={reloadKey}
        title={title}
        src={src}
        className="h-full w-full border-0"
        allow={allow ?? 'autoplay; fullscreen; picture-in-picture; encrypted-media'}
        allowFullScreen
        onLoad={() => setStatus('loaded')}
        onLoadStart={startTimeout}
        loading="lazy"
      />
    </div>
  )
}
