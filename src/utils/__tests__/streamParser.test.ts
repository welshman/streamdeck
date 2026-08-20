import { describe, it, expect } from 'vitest'
import {
  parseStreamInput,
  parseStreamInputWithHint,
  extractYouTubeId,
  splitMultipleInputs,
  platformLabel,
} from '../streamParser'
import { StreamParseError } from '@/types/stream'

describe('parseStreamInput - Twitch', () => {
  it('parses a full https twitch URL', () => {
    const result = parseStreamInput('https://www.twitch.tv/shroud')
    expect(result).toEqual({
      platform: 'twitch',
      channelOrId: 'shroud',
      originalUrl: 'https://www.twitch.tv/shroud',
      label: 'shroud',
    })
  })

  it('parses a bare-host twitch URL without protocol', () => {
    const result = parseStreamInput('twitch.tv/pokimane')
    expect(result.platform).toBe('twitch')
    expect(result.channelOrId).toBe('pokimane')
  })

  it('parses a mobile twitch URL', () => {
    const result = parseStreamInput('https://m.twitch.tv/ninja')
    expect(result.channelOrId).toBe('ninja')
  })

  it('rejects a twitch directory URL', () => {
    expect(() => parseStreamInput('https://www.twitch.tv/directory')).toThrow(StreamParseError)
  })
})

describe('parseStreamInput - Kick', () => {
  it('parses a full kick URL', () => {
    const result = parseStreamInput('https://kick.com/xqc')
    expect(result).toEqual({
      platform: 'kick',
      channelOrId: 'xqc',
      originalUrl: 'https://kick.com/xqc',
      label: 'xqc',
    })
  })

  it('parses a bare-host kick URL', () => {
    const result = parseStreamInput('kick.com/adin')
    expect(result.platform).toBe('kick')
    expect(result.channelOrId).toBe('adin')
  })

  it('rejects a kick category browse URL', () => {
    expect(() => parseStreamInput('https://kick.com/categories/just-chatting')).toThrow(
      StreamParseError,
    )
  })
})

describe('parseStreamInput - YouTube', () => {
  it('extracts video id from watch URL', () => {
    const result = parseStreamInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    expect(result.platform).toBe('youtube')
    expect(result.channelOrId).toBe('dQw4w9WgXcQ')
  })

  it('extracts video id from youtu.be short URL', () => {
    const result = parseStreamInput('https://youtu.be/dQw4w9WgXcQ')
    expect(result.channelOrId).toBe('dQw4w9WgXcQ')
  })

  it('extracts video id from /live/ URL', () => {
    const result = parseStreamInput('https://www.youtube.com/live/dQw4w9WgXcQ')
    expect(result.channelOrId).toBe('dQw4w9WgXcQ')
  })

  it('extracts video id from /embed/ URL', () => {
    const result = parseStreamInput('https://www.youtube.com/embed/dQw4w9WgXcQ')
    expect(result.channelOrId).toBe('dQw4w9WgXcQ')
  })

  it('accepts a bare 11-character video id', () => {
    const result = parseStreamInput('dQw4w9WgXcQ')
    expect(result.platform).toBe('youtube')
    expect(result.channelOrId).toBe('dQw4w9WgXcQ')
  })

  it('rejects a youtube URL with no discoverable id', () => {
    expect(() => parseStreamInput('https://www.youtube.com/feed/trending')).toThrow(
      StreamParseError,
    )
  })
})

describe('parseStreamInput - error cases', () => {
  it('throws on empty input', () => {
    expect(() => parseStreamInput('')).toThrow(StreamParseError)
    expect(() => parseStreamInput('   ')).toThrow(StreamParseError)
  })

  it('throws on unsupported platform URL', () => {
    expect(() => parseStreamInput('https://vimeo.com/12345')).toThrow(StreamParseError)
  })

  it('throws a helpful ambiguity error for a bare channel name', () => {
    expect(() => parseStreamInput('somechannel')).toThrow(/Twitch or Kick/)
  })

  it('throws on gibberish input', () => {
    expect(() => parseStreamInput('!!!not a channel!!!')).toThrow(StreamParseError)
  })
})

describe('parseStreamInputWithHint', () => {
  it('resolves a bare channel name to twitch with a twitch hint', () => {
    const result = parseStreamInputWithHint('somechannel', 'twitch')
    expect(result.platform).toBe('twitch')
    expect(result.channelOrId).toBe('somechannel')
  })

  it('resolves a bare channel name to kick with a kick hint', () => {
    const result = parseStreamInputWithHint('somechannel', 'kick')
    expect(result.platform).toBe('kick')
  })

  it('still parses full URLs correctly even with a hint set', () => {
    const result = parseStreamInputWithHint('https://kick.com/xqc', 'twitch')
    expect(result.platform).toBe('kick')
  })
})

describe('extractYouTubeId', () => {
  it('returns null for a non-youtube-shaped URL', () => {
    const url = new URL('https://www.youtube.com/results?search_query=test')
    expect(extractYouTubeId(url)).toBeNull()
  })
})

describe('splitMultipleInputs', () => {
  it('splits on newlines and commas', () => {
    const result = splitMultipleInputs('twitch.tv/a\nkick.com/b,youtube.com/watch?v=dQw4w9WgXcQ')
    expect(result).toHaveLength(3)
  })

  it('trims whitespace and drops empty lines', () => {
    const result = splitMultipleInputs('  twitch.tv/a  \n\n  \nkick.com/b')
    expect(result).toEqual(['twitch.tv/a', 'kick.com/b'])
  })
})

describe('platformLabel', () => {
  it('returns human-readable labels', () => {
    expect(platformLabel('twitch')).toBe('Twitch')
    expect(platformLabel('kick')).toBe('Kick')
    expect(platformLabel('youtube')).toBe('YouTube')
  })
})
