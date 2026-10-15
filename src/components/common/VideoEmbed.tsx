import React from 'react';
import { Play, AlertCircle } from 'lucide-react';

interface VideoEmbedProps {
  url?: string;
  title?: string;
  className?: string;
  aspectRatio?: 'video' | 'vertical' | 'square';
  autoPlay?: boolean;
}

export interface ParsedVideoInfo {
  type: 'youtube' | 'instagram' | 'direct' | 'unknown';
  embedUrl?: string;
  directUrl?: string;
  videoId?: string;
}

export function parseVideoUrl(url?: string): ParsedVideoInfo {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { type: 'unknown' };
  }

  const cleanUrl = url.trim();

  // 1. YouTube (Watch, Shorts, youtu.be, embed)
  const ytMatch = cleanUrl.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      videoId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`
    };
  }

  // 2. Instagram Reels o Posts
  const igMatch = cleanUrl.match(/instagram\.com\/(?:reel|p|tv)\/([a-zA-Z0-9_-]+)/i);
  if (igMatch && igMatch[1]) {
    const code = igMatch[1];
    return {
      type: 'instagram',
      videoId: code,
      embedUrl: `https://www.instagram.com/reel/${code}/embed/`
    };
  }

  // 3. Video directo (mp4, webm, ogv o URLs directas)
  if (
    cleanUrl.match(/\.(mp4|webm|ogv)(\?.*)?$/i) ||
    cleanUrl.startsWith('blob:') ||
    cleanUrl.startsWith('data:video/')
  ) {
    return {
      type: 'direct',
      directUrl: cleanUrl
    };
  }

  return { type: 'unknown' };
}

export const VideoEmbed: React.FC<VideoEmbedProps> = ({
  url,
  title = 'Video de demostración',
  className = '',
  aspectRatio = 'video',
  autoPlay = false
}) => {
  const parsed = parseVideoUrl(url);

  const aspectClass =
    aspectRatio === 'vertical'
      ? 'aspect-[9/16]'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : 'aspect-video';

  if (!url || parsed.type === 'unknown') {
    return (
      <div
        className={`w-full ${aspectClass} bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col items-center justify-center p-4 text-center text-neutral-400 ${className}`}
      >
        <div className="w-10 h-10 rounded-full bg-neutral-800/80 flex items-center justify-center mb-2">
          {url ? <AlertCircle className="w-5 h-5 text-amber-400" /> : <Play className="w-5 h-5 text-neutral-500" />}
        </div>
        <p className="text-xs font-medium text-neutral-300">
          {url ? 'Enlace de video no reconocido' : 'Sin video time-lapse'}
        </p>
        <p className="text-[11px] text-neutral-500 mt-0.5 max-w-xs">
          {url
            ? 'Ingresá un link válido de YouTube, YouTube Shorts, Instagram Reel o archivo MP4.'
            : 'Agregá un link de YouTube o Instagram para mostrar el proceso del servicio.'}
        </p>
      </div>
    );
  }

  if (parsed.type === 'youtube' && parsed.embedUrl) {
    const fullEmbed = autoPlay ? `${parsed.embedUrl}&autoplay=1&mute=1` : parsed.embedUrl;
    return (
      <div
        className={`relative w-full ${aspectClass} overflow-hidden rounded-xl bg-black border border-neutral-800 shadow-md ${className}`}
      >
        <iframe
          src={fullEmbed}
          title={title}
          className="w-full h-full border-0 absolute inset-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  if (parsed.type === 'instagram' && parsed.embedUrl) {
    return (
      <div
        className={`relative w-full ${aspectClass} overflow-hidden rounded-xl bg-neutral-950 border border-neutral-800 shadow-md flex items-center justify-center ${className}`}
      >
        <iframe
          src={parsed.embedUrl}
          title={title}
          className="w-full h-full border-0 absolute inset-0"
          allowFullScreen
          scrolling="no"
          loading="lazy"
        />
      </div>
    );
  }

  if (parsed.type === 'direct' && parsed.directUrl) {
    return (
      <div
        className={`relative w-full ${aspectClass} overflow-hidden rounded-xl bg-black border border-neutral-800 shadow-md ${className}`}
      >
        <video
          src={parsed.directUrl}
          controls
          playsInline
          autoPlay={autoPlay}
          muted={autoPlay}
          className="w-full h-full object-cover"
        >
          Tu navegador no soporta la reproducción de video HTML5.
        </video>
      </div>
    );
  }

  return null;
};
