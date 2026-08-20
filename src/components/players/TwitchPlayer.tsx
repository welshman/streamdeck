import { buildTwitchEmbedUrl } from '@/utils/embed'
import { PlayerFrame } from './PlayerFrame'

interface TwitchPlayerProps {
  channel: string
  muted: boolean
}

export function TwitchPlayer({ channel, muted }: TwitchPlayerProps) {
  const src = buildTwitchEmbedUrl({ channel, muted })
  return <PlayerFrame title={`Twitch stream: ${channel}`} src={src} />
}
