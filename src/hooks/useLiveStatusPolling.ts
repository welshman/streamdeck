import { useEffect, useRef } from 'react'
import { StreamEntry } from '@/types/stream'

/**
 * Periodically checks whether each stream is currently live and reports
 * the result back via `onStatus`. Designed for a static, no-backend app:
 * every check uses a public, key-free, CORS-friendly endpoint, and any
 * failure (network error, CORS block, rate limit) reports `undefined`
 * rather than `false`, so a flaky check can never make a stream look
 * offline when we simply don't know.
 *
 * - Twitch has no public no-auth "is live" endpoint, so Twitch streams
 *   are skipped here (isLive stays undefined) unless a Client-ID/token
 *   is wired in separately.
 * - Kick exposes an unauthenticated channel API
 *   (https://kick.com/api/v2/channels/<channel>) that includes a
 *   `livestream` field.
 * - YouTube's oEmbed endpoint doesn't report live status either, so
 *   YouTube entries are also skipped here for the same reason as Twitch.
 *
 * This means today this hook only actively determines status for Kick
 * channels; Twitch/YouTube slots are left in place so a future addition
 * of an API key/token can plug into the same `checkOne` switch without
 * touching the polling/interval logic.
 */
export function useLiveStatusPolling(
  streams: StreamEntry[],
  onStatus: (id: string, isLive: boolean | undefined) => void,
  intervalMs = 90_000,
) {
  const streamsRef = useRef(streams)
  streamsRef.current = streams

  useEffect(() => {
    let cancelled = false

    async function checkOne(stream: StreamEntry) {
      try {
        if (stream.platform === 'kick') {
          const res = await fetch(
            `https://kick.com/api/v2/channels/${encodeURIComponent(stream.channelOrId)}`,
            { headers: { Accept: 'application/json' } },
          )
          if (!res.ok) {
            onStatus(stream.id, undefined)
            return
          }
          const data = await res.json()
          onStatus(stream.id, Boolean(data?.livestream))
          return
        }
        // Twitch and YouTube require an API key/OAuth token to check
        // live status reliably; without one, leave status unknown
        // rather than guessing.
        onStatus(stream.id, undefined)
      } catch {
        onStatus(stream.id, undefined)
      }
    }

    async function checkAll() {
      const current = streamsRef.current.filter((s) => !s.isHidden)
      for (const stream of current) {
        if (cancelled) return
        await checkOne(stream)
      }
    }

    checkAll()
    const timer = window.setInterval(checkAll, intervalMs)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [intervalMs, onStatus])
}
