import { StreamEntry } from '@/types/stream'
import { TwitchPlayer } from './TwitchPlayer'
import { KickPlayer } from './KickPlayer'
import { YouTubePlayer } from './YouTubePlayer'

interface StreamPlayerProps {
  stream: StreamEntry
}

/** Dispatches to the correct platform-specific player component. */
export function StreamPlayer({ stream }: StreamPlayerProps) {
  switch (stream.platform) {
    case 'twitch':
      return <TwitchPlayer channel={stream.channelOrId} muted={stream.isMuted} />
    case 'kick':
      return <KickPlayer channel={stream.channelOrId} muted={stream.isMuted} />
    case 'youtube':
      return <YouTubePlayer videoId={stream.channelOrId} muted={stream.isMuted} />
  }
}
