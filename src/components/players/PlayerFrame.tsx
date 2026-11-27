import { useState, useEffect, useRef } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'

interface PlayerFrameProps {
  title: string
  src: string
  allow?: string
}

const LOAD_TIMEOUT_MS = 15000
const MAX_AUTO_RETRIES = 1

/**
 * Shared iframe wrapper providing consistent loading skeleton and error
 * fallback UI across Twitch/Kick/YouTube embeds. Iframes cannot reliably
 * report *why* they failed (cross-origin), so we treat a slow/failed
 * load plus a timeout as a best-effort "may be unavailable" signal
 * rather than a guaranteed error state. A player that stalls is reloaded
 * once automatically before the warning is shown. The timer restarts
 * whenever the embed URL changes (e.g. a Kick mute/unmute reload) or on
 * manual reload.
 */
export function PlayerFrame({ title, src, allow }: PlayerFrameProps) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'timeout'>('loading')
  const [reloadKey, setReloadKey] = useState(0)
  const autoRetries = useRef(0)
  const loaded = useRef(false)

  useEffect(() => {
    autoRetries.current = 0
  }, [src])

  useEffect(() => {
    loaded.current = false
    setStatus('loading')
    const timer = window.setTimeout(() => {
      if (loaded.current) return
      if (autoRetries.current < MAX_AUTO_RETRIES) {
        autoRetries.current += 1
        setReloadKey((k) => k + 1)
      } else {
        setStatus('timeout')
      }
    }, LOAD_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [src, reloadKey])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-black">
      {status === 'loading' && (
        <div
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-surface-sunken"
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
            onClick={() => {
              autoRetries.current = 0
              setReloadKey((k) => k + 1)
            }}
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
        onLoad={() => {
          loaded.current = true
          setStatus('loaded')
        }}
      />
    </div>
  )
}
