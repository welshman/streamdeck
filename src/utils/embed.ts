/**
 * Utilities for building embed URLs / config for each platform, honoring
 * each platform's documented embedding requirements.
 */
import { Platform } from '@/types/stream'

/**
 * Twitch requires a `parent` query parameter listing the hostname(s) that
 * are allowed to embed the player. We derive it from the current
 * hostname at runtime so it works on GitHub Pages (username.github.io),
 * a custom domain, localhost, and Vite preview/deploy previews without
 * any manual configuration.
 */
export function getTwitchParentHost(): string {
  if (typeof window === 'undefined') return 'localhost'
  return window.location.hostname || 'localhost'
}

export interface TwitchEmbedOptions {
  channel: string
  muted: boolean
  parent?: string
}

export function buildTwitchEmbedUrl({ channel, muted, parent }: TwitchEmbedOptions): string {
  const parentHost = parent ?? getTwitchParentHost()
  const params = new URLSearchParams({
    channel,
    parent: parentHost,
    muted: String(muted),
    autoplay: 'true',
  })
  return `https://player.twitch.tv/?${params.toString()}`
}

export function buildTwitchChatUrl(channel: string, parent?: string): string {
  const parentHost = parent ?? getTwitchParentHost()
  const params = new URLSearchParams({ parent: parentHost })
  return `https://www.twitch.tv/embed/${channel}/chat?${params.toString()}`
}

/**
 * Kick's officially documented embed path is /<channel>/embed?autoplay=...
 * There is currently no officially documented chat-only iframe embed for
 * third-party sites, so we surface a "open chat" fallback instead of
 * assuming one exists.
 */
export interface KickEmbedOptions {
  channel: string
  muted: boolean
}

export function buildKickEmbedUrl({ channel }: KickEmbedOptions): string {
  const params = new URLSearchParams({ autoplay: 'true' })
  return `https://player.kick.com/${channel}?${params.toString()}`
}

export const KICK_CHAT_EMBED_SUPPORTED = false

export function buildKickChannelUrl(channel: string): string {
  return `https://kick.com/${channel}`
}

/**
 * YouTube IFrame embed. `enablejsapi=1` is only added when the caller
 * needs programmatic control (mute/unmute, play/pause) via the IFrame
 * Player API; otherwise we omit it to keep the embed minimal.
 */
export interface YouTubeEmbedOptions {
  videoId: string
  muted: boolean
  enableJsApi?: boolean
  origin?: string
}

export function buildYouTubeEmbedUrl({
  videoId,
  muted,
  enableJsApi = true,
  origin,
}: YouTubeEmbedOptions): string {
  const originHost =
    origin ?? (typeof window !== 'undefined' ? window.location.origin : undefined)
  const params = new URLSearchParams({
    autoplay: '1',
    mute: muted ? '1' : '0',
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
  })
  if (enableJsApi) params.set('enablejsapi', '1')
  if (originHost) params.set('origin', originHost)
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`
}

/** Minimum recommended iframe sizes per platform documentation, used to
 * enforce sane minimums in the grid/layout CSS. */
export const MIN_EMBED_SIZE: Record<Platform, { width: number; height: number }> = {
  twitch: { width: 260, height: 146 },
  kick: { width: 260, height: 146 },
  youtube: { width: 200, height: 113 },
}

export function chatSupported(platform: Platform): boolean {
  return platform === 'twitch'
}

export function originalStreamUrl(platform: Platform, channelOrId: string): string {
  switch (platform) {
    case 'twitch':
      return `https://www.twitch.tv/${channelOrId}`
    case 'kick':
      return `https://kick.com/${channelOrId}`
    case 'youtube':
      return `https://www.youtube.com/watch?v=${channelOrId}`
  }
}
