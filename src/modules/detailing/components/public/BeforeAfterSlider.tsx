import React, { useState, useRef, useCallback } from 'react';

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  labelBefore?: string;
  labelAfter?: string;
  className?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeUrl,
  afterUrl,
  labelBefore = 'ANTES',
  labelAfter = 'DESPUÉS',
  className = ''
}) => {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPosition(percent);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) updatePosition(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) updatePosition(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden select-none cursor-ew-resize bg-black touch-none group shadow-lg ${className}`}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* 1. Imagen Base: ANTES */}
      <img
        src={beforeUrl}
        alt={labelBefore}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        draggable={false}
      />
      <div className="absolute top-3 left-3 z-10 bg-black/85 backdrop-blur-xs text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md border border-white/10">
        {labelBefore}
      </div>

      {/* 2. Imagen Superpuesta con Clip: DESPUÉS */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={afterUrl}
          alt={labelAfter}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute top-3 right-3 z-10 bg-[#E10600] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md">
          {labelAfter}
        </div>
      </div>

      {/* 3. Barra Divisoria con Handle estilo Instagram */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.8)] pointer-events-none z-20"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-[#111111] shadow-2xl flex items-center justify-center font-bold border-2 border-[#E10600] group-hover:scale-110 transition-transform">
          <svg className="w-4 h-4 text-[#E10600]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 9l-4 3 4 3m8-6l4 3-4 3" />
          </svg>
        </div>
      </div>

      {/* 4. Input Range oculto para accesibilidad */}
      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
        aria-label="Deslizador comparador antes y después"
      />

      {/* Indicador de arrastre táctil */}
      <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none z-10">
        <span className="bg-black/75 backdrop-blur-xs text-white/90 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest border border-white/10">
          ← Deslizá para comparar →
        </span>
      </div>
    </div>
  );
};
