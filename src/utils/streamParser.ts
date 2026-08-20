/**
 * Platform detection and URL/identifier normalization for Twitch, Kick,
 * and YouTube. Pure functions with no side effects so they are easy to
 * unit test (see src/utils/__tests__/streamParser.test.ts).
 */
import { Platform, ParsedStreamInput, StreamParseError } from '@/types/stream'

const TWITCH_HOSTS = ['twitch.tv', 'www.twitch.tv', 'm.twitch.tv']
const KICK_HOSTS = ['kick.com', 'www.kick.com']
const YOUTUBE_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'music.youtube.com',
]

const CHANNEL_NAME_RE = /^[a-zA-Z0-9_]{2,25}$/
const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{10,12}$/

function tryParseUrl(input: string): URL | null {
  try {
    return new URL(input)
  } catch {
    try {
      return new URL(`https://${input}`)
    } catch {
      return null
    }
  }
}

function hostMatches(host: string, list: string[]): boolean {
  return list.includes(host.toLowerCase())
}

/** Extracts a YouTube video id from any supported URL shape, or null. */
export function extractYouTubeId(url: URL): string | null {
  const host = url.hostname.toLowerCase()

  if (host === 'youtu.be') {
    const id = url.pathname.replace(/^\//, '').split('/')[0]
    return id && YOUTUBE_ID_RE.test(id) ? id : null
  }

  if (hostMatches(host, YOUTUBE_HOSTS)) {
    const v = url.searchParams.get('v')
    if (v && YOUTUBE_ID_RE.test(v)) return v

    const pathParts = url.pathname.split('/').filter(Boolean)
    const liveIdx = pathParts.findIndex((p) =>
      ['live', 'embed', 'shorts'].includes(p),
    )
    if (liveIdx !== -1 && pathParts[liveIdx + 1]) {
      const candidate = pathParts[liveIdx + 1]
      if (YOUTUBE_ID_RE.test(candidate)) return candidate
    }
  }

  return null
}

function parseTwitch(url: URL): ParsedStreamInput | null {
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts.length === 0) return null
  const channel = parts[0].toLowerCase()
  if (['videos', 'directory', 'p', 'downloads', 'jobs', 'settings'].includes(channel)) {
    return null
  }
  if (!CHANNEL_NAME_RE.test(channel)) return null
  return {
    platform: 'twitch',
    channelOrId: channel,
    originalUrl: `https://www.twitch.tv/${channel}`,
    label: channel,
  }
}

function parseKick(url: URL): ParsedStreamInput | null {
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts.length === 0) return null
  const channel = parts[0].toLowerCase()
  if (['categories', 'browse', 'search'].includes(channel)) return null
  if (!CHANNEL_NAME_RE.test(channel)) return null
  return {
    platform: 'kick',
    channelOrId: channel,
    originalUrl: `https://kick.com/${channel}`,
    label: channel,
  }
}

function parseYouTube(url: URL): ParsedStreamInput | null {
  const id = extractYouTubeId(url)
  if (!id) return null
  return {
    platform: 'youtube',
    channelOrId: id,
    originalUrl: `https://www.youtube.com/watch?v=${id}`,
    label: id,
  }
}

/**
 * Attempts to parse arbitrary user input (a URL or a bare channel name/id)
 * into a normalized stream descriptor. Throws StreamParseError with a
 * human-readable message when the input cannot be resolved.
 */
export function parseStreamInput(raw: string): ParsedStreamInput {
  const trimmed = raw.trim()
  if (!trimmed) {
    throw new StreamParseError('Please enter a URL or channel name.')
  }

  const looksLikeUrl = /^(https?:\/\/)|(^[\w-]+\.[a-z]{2,})/i.test(trimmed) || trimmed.includes('/')
  const url = looksLikeUrl ? tryParseUrl(trimmed) : null

  if (url) {
    const host = url.hostname.toLowerCase()
    if (hostMatches(host, TWITCH_HOSTS)) {
      const result = parseTwitch(url)
      if (!result) {
        throw new StreamParseError(
          'This looks like a Twitch URL, but no channel name could be found in it.',
        )
      }
      return result
    }
    if (hostMatches(host, KICK_HOSTS)) {
      const result = parseKick(url)
      if (!result) {
        throw new StreamParseError(
          'This looks like a Kick URL, but no channel name could be found in it.',
        )
      }
      return result
    }
    if (hostMatches(host, YOUTUBE_HOSTS)) {
      const result = parseYouTube(url)
      if (!result) {
        throw new StreamParseError(
          'This looks like a YouTube URL, but no video ID could be found in it. Livestream and watch URLs are supported.',
        )
      }
      return result
    }
    throw new StreamParseError(
      `"${host}" is not a supported platform. Try a Twitch, Kick, or YouTube URL.`,
    )
  }

  if (YOUTUBE_ID_RE.test(trimmed) && trimmed.length === 11) {
    return {
      platform: 'youtube',
      channelOrId: trimmed,
      originalUrl: `https://www.youtube.com/watch?v=${trimmed}`,
      label: trimmed,
    }
  }

  if (CHANNEL_NAME_RE.test(trimmed)) {
    throw new StreamParseError(
      `"${trimmed}" could be a Twitch or Kick channel name. Please paste the full URL (e.g. twitch.tv/${trimmed} or kick.com/${trimmed}) so we can tell which platform you mean.`,
    )
  }

  throw new StreamParseError(
    `Could not recognize "${trimmed}" as a Twitch, Kick, or YouTube stream.`,
  )
}

/** Same as parseStreamInput but with an explicit platform hint for bare
 * channel names, used by the "Add stream" dialog's platform selector. */
export function parseStreamInputWithHint(
  raw: string,
  hint: Platform | null,
): ParsedStreamInput {
  const trimmed = raw.trim()
  if (hint && CHANNEL_NAME_RE.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    if (hint === 'twitch') {
      return {
        platform: 'twitch',
        channelOrId: trimmed.toLowerCase(),
        originalUrl: `https://www.twitch.tv/${trimmed.toLowerCase()}`,
        label: trimmed.toLowerCase(),
      }
    }
    if (hint === 'kick') {
      return {
        platform: 'kick',
        channelOrId: trimmed.toLowerCase(),
        originalUrl: `https://kick.com/${trimmed.toLowerCase()}`,
        label: trimmed.toLowerCase(),
      }
    }
  }
  return parseStreamInput(raw)
}

/** Splits a multi-line / comma / whitespace separated blob of pasted
 * text into individual candidate stream identifiers. */
export function splitMultipleInputs(blob: string): string[] {
  return blob
    .split(/[\n\r,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function platformLabel(platform: Platform): string {
  switch (platform) {
    case 'twitch':
      return 'Twitch'
    case 'kick':
      return 'Kick'
    case 'youtube':
      return 'YouTube'
  }
}
