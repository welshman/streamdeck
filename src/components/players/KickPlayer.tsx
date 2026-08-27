import { buildKickEmbedUrl } from '@/utils/embed'
import { PlayerFrame } from './PlayerFrame'

interface KickPlayerProps {
  channel: string
  muted: boolean
}

export function KickPlayer({ channel, muted }: KickPlayerProps) {
  const src = buildKickEmbedUrl({ channel, muted })
  return <PlayerFrame title={`Kick stream: ${channel}`} src={src} />
}
