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
