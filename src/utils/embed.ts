/**
 * Per-platform URL builders. Every platform gets an embed URL for the
 * player, a chat URL where supported, and a canonical "original" URL
 * for opening the stream in a new tab.
 *
 * Twitch and YouTube both document public iframe embeds. Kick documents
 * an embeddable player; its chat uses the popout chat URL, which may or
 * may not be allowed in a third-party iframe (fallback link is shown).
 */
import { Platform } from '@/types/stream'

/** Platforms that currently support a real embedded chat iframe. */
const CHAT_SUPPORTED: readonly Platform[] = ['twitch']

export function chatSupported(platform: Platform): boolean {
  return CHAT_SUPPORTED.includes(platform)
}

export function buildTwitchEmbedUrl({
  channel,
  muted,
  parent,
}: {
  channel: string
  muted: boolean
  parent?: string
}): string {
  const params = new URLSearchParams({
    channel,
    parent: parent ?? getTwitchParentHost(),
    autoplay: 'true',
    muted: String(muted),
  })
  return `https://player.twitch.tv/?${params.toString()}`
}

export function buildKickEmbedUrl({ channel, muted }: { channel: string; muted: boolean }): string {
  // Kick's player honors autoplay/muted as URL params; it does not support
  // postMessage-based control, so mute toggles require a reload.
  return `https://player.kick.com/${encodeURIComponent(channel)}?autoplay=true&muted=${muted}`
}

export function buildYouTubeEmbedUrl({
  videoId,
  muted,
  enableJsApi = false,
  origin,
}: {
  videoId: string
  muted: boolean
  enableJsApi?: boolean
  origin?: string
}): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: muted ? '1' : '0',
    rel: '0',
    modestbranding: '1',
  })
  if (enableJsApi) {
    params.set('enablejsapi', '1')
    if (origin) params.set('origin', origin)
  }
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`
}

/** Twitch chat embed URL. Twitch's embedded chat is light by default; the
 * `darkpopout` flag (a bare parameter with no value) switches it to dark.
 * It is not part of Twitch's official docs, so the chat simply falls back
 * to light if Twitch ever stops honouring it. */
export function buildTwitchChatUrl(channel: string, parent?: string, dark = false): string {
  const params = new URLSearchParams({ parent: parent ?? getTwitchParentHost() })
  const base = `https://www.twitch.tv/embed/${encodeURIComponent(channel)}/chat?${params.toString()}`
  return dark ? `${base}&darkpopout` : base
}

/** Kick's chat-only popout page. Kick documents this URL for OBS browser
 * docks; whether it renders inside a third-party website iframe depends on
 * Kick's frame headers, so the UI keeps an "open in new tab" fallback. */
export function buildKickChatUrl(channel: string): string {
  return `https://kick.com/popout/${encodeURIComponent(channel)}/chat`
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
