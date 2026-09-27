import React from 'react';
import { normalizePlate } from '../../lib/formatters';

export interface UruguayanPlateProps {
  plate?: string | null;
  vin?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fallbackText?: string;
}

export const UruguayanPlate: React.FC<UruguayanPlateProps> = ({
  plate,
  vin,
  size = 'md',
  className = '',
  fallbackText = 'Sin matrícula'
}) => {
  const formattedPlate = plate ? normalizePlate(plate) : null;

  if (!formattedPlate) {
    if (vin) {
      return (
        <div
          className={`inline-flex items-center px-2 py-1 rounded-md bg-[#F5F5F4] border border-[#E5E5E3] text-[#6B6B6B] font-mono text-xs tracking-wider select-none ${className}`}
        >
          <span>VIN: {vin.length > 8 ? `...${vin.slice(-8)}` : vin}</span>
        </div>
      );
    }
    return (
      <div
        className={`inline-flex items-center px-2 py-0.5 rounded-md bg-[#F5F5F4] border border-[#E5E5E3] text-[#9A9A9A] text-xs font-medium select-none ${className}`}
      >
        <span>{fallbackText}</span>
      </div>
    );
  }

  // Size variations
  const sizeConfig = {
    sm: {
      container: 'w-20',
      band: 'h-3 px-1 text-[5px]',
      title: 'text-[6px] tracking-widest',
      plateText: 'text-[12px] py-0.5 tracking-wider'
    },
    md: {
      container: 'w-24',
      band: 'h-3.5 px-1 text-[6px]',
      title: 'text-[7px] tracking-widest',
      plateText: 'text-[15px] py-0.5 tracking-widest'
    },
    lg: {
      container: 'w-32',
      band: 'h-4 px-1.5 text-[7px]',
      title: 'text-[8px] tracking-widest',
      plateText: 'text-[18px] py-1 tracking-[0.14em]'
    }
  }[size];

  return (
    <div
      className={`shrink-0 inline-flex flex-col items-center bg-white border border-[#D0D0CD] rounded-md shadow-xs overflow-hidden select-none ${sizeConfig.container} ${className}`}
    >
      {/* Header Band: Official Mercosur Uruguayan Blue (#002B7A) */}
      <div
        className={`w-full bg-[#002B7A] text-white flex items-center justify-between font-bold leading-none ${sizeConfig.band}`}
      >
        <span className="opacity-90 font-sans">MERCOSUR</span>
        <span className={`font-bold font-sans ${sizeConfig.title}`}>URUGUAY</span>
        <span className="opacity-90 font-sans">UY</span>
      </div>

      {/* Plate Number */}
      <span
        className={`font-plate font-bold text-[#161616] leading-none ${sizeConfig.plateText}`}
      >
        {formattedPlate}
      </span>
    </div>
  );
};
