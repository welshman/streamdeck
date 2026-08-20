import { ExternalLink } from 'lucide-react'
import { StreamEntry } from '@/types/stream'
import { buildTwitchChatUrl, chatSupported, buildKickChannelUrl, originalStreamUrl } from '@/utils/embed'

interface ChatPanelProps {
  stream: StreamEntry
  className?: string
}

/** Renders an embedded chat iframe when the platform supports it
 * (currently only Twitch has a documented public chat embed), otherwise
 * shows a fallback button that opens the native chat/stream in a new tab. */
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

  const fallbackUrl =
    stream.platform === 'kick'
      ? buildKickChannelUrl(stream.channelOrId)
      : originalStreamUrl(stream.platform, stream.channelOrId)

  return (
    <div className={`${className ?? ''} flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-surface-sunken p-4 text-center`}>
      <p className="text-xs text-text-muted">
        {stream.platform === 'kick'
          ? 'Kick does not currently offer a documented public chat embed.'
          : 'Chat embedding is not available for this platform.'}
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
