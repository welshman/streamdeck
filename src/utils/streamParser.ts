import { Stream, StreamPlatform, StreamStatus } from '../types/stream';

interface StreamData {
  id: string;
  platform: StreamPlatform;
  channel: string;
  title?: string;
  thumbnail?: string;
  viewers?: number;
  isLive?: boolean;
  url?: string;
}

interface ParseStreamResult {
  platform: StreamPlatform;
  channelOrId: string;
}

export class StreamParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StreamParseError';
  }
}

export function parseStreamUrl(url: string): { platform: StreamPlatform; channel: string } | null {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

    if (hostname.includes('twitch.tv')) {
      return { platform: 'twitch', channel: pathParts[0] || '' };
    }

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      if (hostname.includes('youtube.com') && pathParts[0] === 'live') {
        return { platform: 'youtube', channel: pathParts[1] || '' };
      }
      const videoId = parsedUrl.searchParams.get('v') || pathParts[pathParts.length - 1];
      return { platform: 'youtube', channel: videoId || '' };
    }

    if (hostname.includes('kick.com')) {
      return { platform: 'kick', channel: pathParts[0] || '' };
    }

    return null;
  } catch {
    return null;
  }
}

export function getStreamEmbedUrl(platform: StreamPlatform, channel: string): string {
  switch (platform) {
    case 'twitch':
      return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=false&muted=true`;
    case 'youtube':
      return `https://www.youtube.com/embed/${channel}?autoplay=0&mute=1`;
    case 'kick':
      return `https://player.kick.com/${channel}?autoplay=false&muted=true`;
    default:
      return '';
  }
}

export async function checkStreamStatus(
  platform: StreamPlatform,
  channel: string
): Promise<StreamStatus> {
  try {
    switch (platform) {
      case 'twitch': {
        const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${channel}`, {
          headers: {
            'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
          },
        });
        const data = await response.json();
        return data.data && data.data.length > 0 ? 'live' : 'offline';
      }
      case 'youtube': {
        // YouTube requires API key, so we'll assume live for now
        // In production, use YouTube Data API
        return 'live';
      }
      case 'kick': {
        const response = await fetch(`https://kick.com/api/v2/channels/${channel}`);
        const data = await response.json();
        return data && data.livestream ? 'live' : 'offline';
      }
      default:
        return 'offline';
    }
  } catch (error) {
    console.error(`Error checking ${platform} stream status:`, error);
    return 'offline';
  }
}

/**
 * Filter out offline streams from the stream list
 * @param streams Array of streams to filter
 * @returns Array of streams with only live streams
 */
export function filterOfflineStreams(streams: Stream[]): Stream[] {
  return streams.filter(stream => stream.status !== 'offline');
}

export function createStreamFromData(data: StreamData): Stream {
  return {
    id: data.id,
    platform: data.platform,
    channel: data.channel,
    title: data.title || '',
    thumbnail: data.thumbnail || '',
    viewers: data.viewers || 0,
    isLive: data.isLive ?? true,
    url: data.url || '',
    status: data.isLive ? 'live' : 'offline',
  };
}

/**
 * Parse a stream URL or channel name into a structured result
 */
export function parseStreamInput(input: string): ParseStreamResult {
  if (!input || input.trim() === '') {
    throw new StreamParseError('Input cannot be empty');
  }

  const trimmed = input.trim();
  
  // Try to parse as URL
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const hostname = url.hostname.toLowerCase();
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Twitch
    if (hostname.includes('twitch.tv')) {
      const channel = pathParts[0];
      if (!channel || channel === 'directory' || channel === 'video') {
        throw new StreamParseError('Invalid Twitch URL - must be a channel URL');
      }
      return { platform: 'twitch', channelOrId: channel };
    }

    // YouTube
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      const videoId = extractYouTubeId(url);
      if (!videoId) {
        throw new StreamParseError('Could not extract YouTube video ID from URL');
      }
      return { platform: 'youtube', channelOrId: videoId };
    }

    // Kick
    if (hostname.includes('kick.com')) {
      const channel = pathParts[0];
      if (!channel || channel === 'categories' || channel === 'browse') {
        throw new StreamParseError('Invalid Kick URL - must be a channel URL');
      }
      return { platform: 'kick', channelOrId: channel };
    }

    throw new StreamParseError(`Unsupported platform: ${hostname}`);
  } catch (e) {
    if (e instanceof StreamParseError) {
      throw e;
    }
    // Not a URL, check if it's a bare channel name or YouTube ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      // Likely a YouTube video ID
      return { platform: 'youtube', channelOrId: trimmed };
    }
    if (/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      // Ambiguous - could be Twitch or Kick
      throw new StreamParseError(`Ambiguous input "${trimmed}" - please specify Twitch or Kick`);
    }
    throw new StreamParseError(`Invalid input: "${trimmed}"`);
  }
}

/**
 * Parse input with a platform hint for ambiguous cases
 */
export function parseStreamInputWithHint(input: string, hint: StreamPlatform): ParseStreamResult {
  if (!input || input.trim() === '') {
    throw new StreamParseError('Input cannot be empty');
  }

  const trimmed = input.trim();
  
  // Try URL parsing first (ignores hint if full URL)
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const hostname = url.hostname.toLowerCase();
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Twitch
    if (hostname.includes('twitch.tv')) {
      const channel = pathParts[0];
      if (!channel || channel === 'directory' || channel === 'video') {
        throw new StreamParseError('Invalid Twitch URL - must be a channel URL');
      }
      return { platform: 'twitch', channelOrId: channel };
    }

    // YouTube
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      const videoId = extractYouTubeId(url);
      if (!videoId) {
        throw new StreamParseError('Could not extract YouTube video ID from URL');
      }
      return { platform: 'youtube', channelOrId: videoId };
    }

    // Kick
    if (hostname.includes('kick.com')) {
      const channel = pathParts[0];
      if (!channel || channel === 'categories' || channel === 'browse') {
        throw new StreamParseError('Invalid Kick URL - must be a channel URL');
      }
      return { platform: 'kick', channelOrId: channel };
    }

    // URL but unsupported platform
    throw new StreamParseError(`Unsupported platform: ${hostname}`);
  } catch (e) {
    if (e instanceof StreamParseError && e.message.includes('Unsupported platform')) {
      throw e;
    }
    // Not a URL, use hint
    if (/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return { platform: hint, channelOrId: trimmed };
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return { platform: 'youtube', channelOrId: trimmed };
    }
    throw new StreamParseError(`Invalid input: "${trimmed}"`);
  }
}

/**
 * Extract YouTube video ID from a URL object
 */
export function extractYouTubeId(url: URL): string | null {
  const hostname = url.hostname.toLowerCase();
  const pathParts = url.pathname.split('/').filter(Boolean);

  // youtu.be short URL
  if (hostname.includes('youtu.be')) {
    return pathParts[0] || null;
  }

  // youtube.com/watch?v=...
  const vParam = url.searchParams.get('v');
  if (vParam) {
    return vParam;
  }

  // youtube.com/live/...
  if (pathParts[0] === 'live' && pathParts[1]) {
    return pathParts[1];
  }

  // youtube.com/embed/...
  if (pathParts[0] === 'embed' && pathParts[1]) {
    return pathParts[1];
  }

  return null;
}

/**
 * Split multiple inputs (newline or comma separated)
 */
export function splitMultipleInputs(input: string): string[] {
  return input
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

/**
 * Get human-readable platform label
 */
export function platformLabel(platform: StreamPlatform): string {
  switch (platform) {
    case 'twitch':
      return 'Twitch';
    case 'youtube':
      return 'YouTube';
    case 'kick':
      return 'Kick';
    default:
      return platform;
  }
}
