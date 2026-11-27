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

/** Renders an embedded chat iframe when the platform supports it.
 * Twitch has a documented public chat embed. Kick's popout chat URL is
 * attempted in an iframe (it works in OBS browser docks) with a visible
 * fallback link in case Kick blocks third-party framing. Other platforms
 * show a fallback button that opens the native chat/stream in a new tab.
 *
 * The caller's className controls size and positioning of the outer box
 * (e.g. `absolute inset-0` in the docked column), so any extra positioning
 * context needed for overlays lives on an inner wrapper. */
export function ChatPanel({ stream, className }: ChatPanelProps) {
  if (stream.platform === 'twitch' && chatSupported('twitch')) {
    return (
      <div className={className}>
        <iframe
          title={`Twitch chat: ${stream.channelOrId}`}
          src={buildTwitchChatUrl(stream.channelOrId)}
          className="h-full w-full rounded-lg border-0 bg-surface-sunken"
          loading="lazy"
        />
      </div>
    )
  }

  if (stream.platform === 'kick') {
    return (
      <div className={className}>
        <div className="relative h-full w-full">
          <iframe
            key={stream.channelOrId}
            title={`Kick chat: ${stream.channelOrId}`}
            src={buildKickChatUrl(stream.channelOrId)}
            className="h-full w-full rounded-lg border-0 bg-surface-sunken"
            loading="lazy"
          />
          <a
            href={buildKickChatUrl(stream.channelOrId)}
            target="_blank"
            rel="noreferrer noopener"
            className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-md bg-surface-raised/90 px-2 py-1 text-xs font-medium text-text shadow-card backdrop-blur hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            Open chat in new tab
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
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
