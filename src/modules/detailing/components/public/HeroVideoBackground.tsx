// ==============================================================================
// DETAILVLAK - HERO VIDEO BACKGROUND COMPONENT
// Soporta reproducción en bucle de hasta 3 clips con fundido cruzado (0.4s),
// imagen poster WebP, ahorro de datos, reducción de movimiento y carga diferida.
// ==============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { DetailingWebHeroClip } from '../../../../types';

interface HeroVideoBackgroundProps {
  mediaType?: 'image' | 'video';
  imageUrl?: string;
  posterUrl?: string;
  clips?: DetailingWebHeroClip[];
  overlayClassName?: string;
  children?: React.ReactNode;
}

const DEFAULT_POSTER = '/videos/portada-poster.webp';
const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1600&auto=format&fit=crop&q=85';

const DEFAULT_CLIPS: DetailingWebHeroClip[] = [
  {
    id: 'clip-bmw',
    url: '/videos/portada-bmw.mp4',
    label: '0) BMW terminada: brillo y reflejos',
    order: 0
  },
  {
    id: 'clip-1',
    url: '/videos/portada-interior.mp4',
    label: '1) Limpieza de interior con pincel',
    order: 1
  },
  {
    id: 'clip-2',
    url: '/videos/portada-pulido.mp4',
    label: '2) Pulido con máquina',
    order: 2
  }
];

export const HeroVideoBackground: React.FC<HeroVideoBackgroundProps> = ({
  mediaType = 'video',
  imageUrl,
  posterUrl = DEFAULT_POSTER,
  clips,
  overlayClassName,
  children
}) => {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isSaveData, setIsSaveData] = useState(false);
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const isTransitioningRef = useRef(false);

  // Ordenar los clips activos según su campo order
  const validClips = (clips && clips.length > 0 ? clips : DEFAULT_CLIPS)
    .filter((c) => !!c.url)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // 1. Detectar ahorro de datos y preferencia de reducir movimiento
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setIsReducedMotion(mediaQuery.matches);

        const handleChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
        mediaQuery.addEventListener?.('change', handleChange);

        // Ahorro de datos del navegador
        const nav = navigator as any;
        if (nav.connection?.saveData) {
          setIsSaveData(true);
        }

        return () => {
          mediaQuery.removeEventListener?.('change', handleChange);
        };
      }
    } catch {}
  }, []);

  // 2. Carga diferida: el video empieza a cargar tras mostrar el contenido inicial
  useEffect(() => {
    if (mediaType !== 'video' || isReducedMotion || isSaveData) return;

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        const idleId = (window as any).requestIdleCallback(
          () => setShouldLoadVideo(true),
          { timeout: 800 }
        );
        return () => (window as any).cancelIdleCallback(idleId);
      } else {
        const timer = setTimeout(() => setShouldLoadVideo(true), 150);
        return () => clearTimeout(timer);
      }
    }
  }, [mediaType, isReducedMotion, isSaveData]);

  // 3. Iniciar reproducción del video activo cuando shouldLoadVideo esté listo
  useEffect(() => {
    if (!shouldLoadVideo || validClips.length === 0) return;

    const currentVid = videoRefs.current[activeClipIndex];
    if (currentVid) {
      currentVid.play().catch(() => {});
    }
  }, [shouldLoadVideo, activeClipIndex, validClips.length]);

  // 4. Manejador de transición continua con fundido de 0.4s
  const handleTimeUpdate = (index: number) => {
    if (index !== activeClipIndex) return;
    const vid = videoRefs.current[index];
    if (!vid || !vid.duration || validClips.length <= 1) return;

    // Iniciar el cambio 0.45s antes del final del clip para el fundido cruzado (0.4s)
    const remainingTime = vid.duration - vid.currentTime;
    if (remainingTime <= 0.45 && !isTransitioningRef.current) {
      isTransitioningRef.current = true;
      const nextIndex = (activeClipIndex + 1) % validClips.length;
      const nextVid = videoRefs.current[nextIndex];

      if (nextVid) {
        nextVid.currentTime = 0;
        nextVid.play().catch(() => {});
      }

      setActiveClipIndex(nextIndex);

      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 500);
    }
  };

  const handleEnded = (index: number) => {
    if (validClips.length <= 1) return;
    if (index === activeClipIndex) {
      const nextIndex = (activeClipIndex + 1) % validClips.length;
      const nextVid = videoRefs.current[nextIndex];
      if (nextVid) {
        nextVid.currentTime = 0;
        nextVid.play().catch(() => {});
      }
      setActiveClipIndex(nextIndex);
    }
  };

  const showStaticImageOnly =
    mediaType === 'image' || isReducedMotion || isSaveData || validClips.length === 0;

  const currentPoster = posterUrl || DEFAULT_POSTER;
  const currentImage = imageUrl || DEFAULT_FALLBACK_IMAGE;

  return (
    <div className="relative rounded-[16px] overflow-hidden bg-[#0B0B0C] min-h-[300px] sm:min-h-[380px] flex flex-col justify-end p-5 sm:p-10 border border-[#E6E8EB] shadow-xs">
      {/* CAPA 1: Imagen fija o Poster mientras carga o por ahorro de datos / accesibilidad */}
      <img
        src={showStaticImageOnly ? currentImage : currentPoster}
        alt="DetailVlak Taller"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out pointer-events-none ${
          videoLoaded && !showStaticImageOnly ? 'opacity-0' : 'opacity-100'
        }`}
        loading="eager"
      />

      {/* CAPA 2: Clips de video en loop con fundido de 0.4s */}
      {!showStaticImageOnly && shouldLoadVideo && (
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          {validClips.map((clip, idx) => {
            const isActive = idx === activeClipIndex;
            return (
              <video
                key={clip.id || clip.url || idx}
                ref={(el) => {
                  videoRefs.current[idx] = el;
                }}
                src={clip.url}
                muted
                playsInline
                autoPlay={idx === 0}
                loop={validClips.length === 1}
                preload="auto"
                disablePictureInPicture
                onCanPlay={() => {
                  if (idx === 0) setVideoLoaded(true);
                }}
                onTimeUpdate={() => handleTimeUpdate(idx)}
                onEnded={() => handleEnded(idx)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-400 ease-in-out ${
                  isActive ? 'opacity-100' : 'opacity-0'
                }`}
              />
            );
          })}
        </div>
      )}

      {/* CAPA 3: Oscurecido encima: degradé de negro 85% abajo a 30% arriba */}
      <div
        className={
          overlayClassName ||
          'absolute inset-0 bg-gradient-to-t from-[#0B0B0C]/85 via-[#0B0B0C]/55 to-[#0B0B0C]/30 pointer-events-none'
        }
      />

      {/* CAPA 4: Contenido sobre el fondo (título, texto, botón, etc.) */}
      <div className="relative z-10 max-w-xl space-y-2">{children}</div>
    </div>
  );
};
