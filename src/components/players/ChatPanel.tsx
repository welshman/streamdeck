import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { StreamEntry } from '@/types/stream'
import {
  buildTwitchChatUrl,
  buildKickChatUrl,
  chatSupported,
  originalStreamUrl,
} from '@/utils/embed'

interface ChatPanelProps {
  stream: StreamEntry
  className?: string
}

/** True while the app's dark theme is active. The theme hook toggles a
 * `dark` class on <html>, so we watch that class and re-render when it
 * changes (this also covers the "match system" setting). */
function useIsDark(): boolean {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const root = document.documentElement
    const update = () => setDark(root.classList.contains('dark'))
    update()
    const observer = new MutationObserver(update)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return dark
}

/** Renders an embedded chat iframe when the platform supports it.
 * Twitch has a documented public chat embed (dark or light to match the
 * app theme). Kick's popout chat page loads inside an iframe. Other
 * platforms (YouTube) show a button that opens the stream in a new tab.
 *
 * The caller's className controls size and positioning of the outer box
 * (e.g. `absolute inset-0` in the docked column). */
export function ChatPanel({ stream, className }: ChatPanelProps) {
  const dark = useIsDark()

  if (stream.platform === 'twitch' && chatSupported('twitch')) {
    return (
      <div className={className}>
        <iframe
          title={`Twitch chat: ${stream.channelOrId}`}
          src={buildTwitchChatUrl(stream.channelOrId, undefined, dark)}
          className="h-full w-full rounded-lg border-0 bg-surface-sunken"
          loading="lazy"
        />
      </div>
    )
  }

  if (stream.platform === 'kick') {
    return (
      <div className={className}>
        <iframe
          key={stream.channelOrId}
          title={`Kick chat: ${stream.channelOrId}`}
          src={buildKickChatUrl(stream.channelOrId)}
          className="h-full w-full rounded-lg border-0 bg-surface-sunken"
          loading="lazy"
        />
      </div>
    )
  }

  const fallbackUrl = originalStreamUrl(stream.platform, stream.channelOrId)

  return (
    <div className={`${className ?? ''} flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-sunken p-4 text-center`}>
      <p className="text-xs text-text-muted">
        Chat embedding is not available for this platform.
      </p>
      <a
        href={fallbackUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-white hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        Open chat in new tab
        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </div>
  )
}
