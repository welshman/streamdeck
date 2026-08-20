import { buildYouTubeEmbedUrl } from '@/utils/embed'
import { PlayerFrame } from './PlayerFrame'

interface YouTubePlayerProps {
  videoId: string
  muted: boolean
}

export function YouTubePlayer({ videoId, muted }: YouTubePlayerProps) {
  const src = buildYouTubeEmbedUrl({ videoId, muted, enableJsApi: true })
  return (
    <PlayerFrame
      title={`YouTube video: ${videoId}`}
      src={src}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
    />
  )
}
