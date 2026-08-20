import { describe, it, expect } from 'vitest'
import {
  buildTwitchEmbedUrl,
  buildTwitchChatUrl,
  buildKickEmbedUrl,
  buildYouTubeEmbedUrl,
  chatSupported,
  originalStreamUrl,
} from '../embed'

describe('buildTwitchEmbedUrl', () => {
  it('includes channel, parent, muted, and autoplay params', () => {
    const url = buildTwitchEmbedUrl({ channel: 'shroud', muted: true, parent: 'example.github.io' })
    expect(url).toContain('channel=shroud')
    expect(url).toContain('parent=example.github.io')
    expect(url).toContain('muted=true')
    expect(url).toContain('autoplay=true')
  })

  it('reflects unmuted state', () => {
    const url = buildTwitchEmbedUrl({ channel: 'shroud', muted: false, parent: 'localhost' })
    expect(url).toContain('muted=false')
  })
})

describe('buildTwitchChatUrl', () => {
  it('builds an embed/<channel>/chat URL with parent', () => {
    const url = buildTwitchChatUrl('shroud', 'example.github.io')
    expect(url).toBe('https://www.twitch.tv/embed/shroud/chat?parent=example.github.io')
  })
})

describe('buildKickEmbedUrl', () => {
  it('builds a player.kick.com URL with autoplay', () => {
    const url = buildKickEmbedUrl({ channel: 'xqc', muted: true })
    expect(url).toBe('https://player.kick.com/xqc?autoplay=true')
  })
})

describe('buildYouTubeEmbedUrl', () => {
  it('builds an embed URL with autoplay, mute, and enablejsapi', () => {
    const url = buildYouTubeEmbedUrl({ videoId: 'dQw4w9WgXcQ', muted: true, enableJsApi: true, origin: 'https://example.github.io' })
    expect(url).toContain('https://www.youtube.com/embed/dQw4w9WgXcQ?')
    expect(url).toContain('autoplay=1')
    expect(url).toContain('mute=1')
    expect(url).toContain('enablejsapi=1')
    expect(url).toContain('origin=https%3A%2F%2Fexample.github.io')
  })

  it('omits enablejsapi when not requested', () => {
    const url = buildYouTubeEmbedUrl({ videoId: 'dQw4w9WgXcQ', muted: false, enableJsApi: false })
    expect(url).not.toContain('enablejsapi')
  })
})

describe('chatSupported', () => {
  it('is true only for twitch', () => {
    expect(chatSupported('twitch')).toBe(true)
    expect(chatSupported('kick')).toBe(false)
    expect(chatSupported('youtube')).toBe(false)
  })
})

describe('originalStreamUrl', () => {
  it('builds correct canonical URLs per platform', () => {
    expect(originalStreamUrl('twitch', 'shroud')).toBe('https://www.twitch.tv/shroud')
    expect(originalStreamUrl('kick', 'xqc')).toBe('https://kick.com/xqc')
    expect(originalStreamUrl('youtube', 'dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    )
  })
})
