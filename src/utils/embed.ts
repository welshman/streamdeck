/**
 * Per-platform URL builders. Every platform gets an embed URL for the
 * player, a chat URL where supported, and a canonical "original" URL
 * for opening the stream in a new tab.
 *
 * Twitch and YouTube both document public iframe embeds. Kick documents
 * an embeddable player but (as of writing) not a chat embed, so its chat
 * falls back to the channel page / popout chat URL.
 */
import { Platform } from '@/types/stream'

/** Platforms that currently support a real embedded chat iframe. */
const CHAT_SUPPORTED: readonly Platform[] = ['twitch']

export function chatSupported(platform: Platform): boolean {
  return CHAT_SUPPORTED.includes(platform)
}

export function buildTwitchEmbedUrl({ channel, muted }: { channel: string; muted: boolean }): string {
  const parent = getTwitchParentHost()
  const params = new URLSearchParams({
    channel,
    parent,
    autoplay: 'false',
    muted: String(muted),
  })
  return `https://player.twitch.tv/?${params.toString()}`
}

export function buildKickEmbedUrl({ channel, muted }: { channel: string; muted: boolean }): string {
  // Kick's player honors autoplay/muted as URL params; it does not support
  // postMessage-based control, so mute toggles require a reload.
  const params = new URLSearchParams({
    muted: String(muted),
    autoplay: 'true',
  })
  return `https://player.kick.com/${encodeURIComponent(channel)}?${params.toString()}`
}

export function buildYouTubeEmbedUrl({ videoId, muted }: { videoId: string; muted: boolean }): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: muted ? '1' : '0',
    rel: '0',
    modestbranding: '1',
  })
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`
}

export function buildTwitchChatUrl(channel: string): string {
  const parent = getTwitchParentHost()
  const params = new URLSearchParams({ parent, popout: '' })
  return `https://www.twitch.tv/embed/${encodeURIComponent(channel)}/chat?${params.toString()}`
}

/** Kick's chat-only popout page. Kick documents this URL for OBS browser
 * docks; whether it renders inside a third-party website iframe depends on
 * Kick's frame headers, so the UI keeps an "open in new tab" fallback. */
export function buildKickChatUrl(channel: string): string {
  return `https://kick.com/popout/${encodeURIComponent(channel)}/chat`
}

export function buildYouTubeChatUrl(): string {
  // YouTube live chat cannot be embedded reliably without an API key,
  // so we always fall back to opening the stream page.
  return ''
}

export function originalStreamUrl(platform: Platform, channelOrId: string): string {
  switch (platform) {
    case 'twitch':
      return `https://www.twitch.tv/${encodeURIComponent(channelOrId)}`
    case 'kick':
      return `https://kick.com/${encodeURIComponent(channelOrId)}`
    case 'youtube':
      return `https://www.youtube.com/watch?v=${encodeURIComponent(channelOrId)}`
  }
}

/** Twitch requires the embedding page's hostname as `parent`. Reading it
 * at runtime means the same build works on localhost, GitHub Pages, and
 * any custom domain without configuration. */
export function getTwitchParentHost(): string {
  if (typeof window === 'undefined') return 'localhost'
  return window.location.hostname
}
