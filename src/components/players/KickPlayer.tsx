import { useEffect, useRef } from 'react';

interface KickPlayerProps {
  channel: string;
  isFeatured: boolean;
  _volume?: number;
}

export function KickPlayer({ channel, isFeatured, _volume = 0.5 }: KickPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!iframeRef.current) return;

    // Kick embed URL with autoplay and mute based on featured state
    const embedUrl = `https://player.kick.com/${channel}?autoplay=${isFeatured}&muted=${!isFeatured}`;
    iframeRef.current.src = embedUrl;
  }, [channel, isFeatured]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full"
      src={`https://player.kick.com/${channel}?autoplay=${isFeatured}&muted=${!isFeatured}`}
      allow="autoplay; encrypted-media"
      allowFullScreen
      title={`Kick stream: ${channel}`}
    />
  );
}
