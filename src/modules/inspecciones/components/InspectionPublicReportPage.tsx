import React from 'react';
import { useData } from '../../../context/DataContext';
import { VehicleInspection } from '../../../types';
import { InspectionReportView } from './InspectionReportView';
import { ShieldCheck, AlertCircle, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface InspectionPublicReportPageProps {
  token: string;
}

export const InspectionPublicReportPage: React.FC<InspectionPublicReportPageProps> = ({
  token
}) => {
  const { getInspectionByToken } = useData();
  const inspection = getInspectionByToken(token);

  if (!inspection) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] text-[#161616] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 rounded-2xl bg-white border border-[#E5E5E3] text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-xl bg-[#FDF2F2] text-[#B80E14] flex items-center justify-center mx-auto text-2xl border border-[#D7141A]/30">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-title font-bold text-[#161616]">Informe no encontrado</h2>
          <p className="text-xs text-[#6B6B6B] leading-relaxed">
            El enlace solicitado no corresponde a un informe técnico activo o el token ingresado es inválido. Verifique el enlace recibido por WhatsApp o contacte a CARVLAK.
          </p>
          <Button
            variant="secondary"
            onClick={() => { window.location.href = '/'; }}
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al inicio</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#161616] pb-16">
      {/* HEADER PÚBLICO CON LOGO OFICIAL */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#E5E5E3] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-carvlak-black.svg"
              alt="CARVLAK Group"
              className="h-7 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).setAttribute('src', '/logo-carvlak-black.png');
              }}
            />
            <div className="hidden sm:block border-l border-[#E5E5E3] pl-3">
              <span className="text-[10px] font-title font-bold uppercase tracking-wider text-[#6B6B6B] block">
                Departamento pericial
              </span>
              <h1 className="text-xs font-semibold text-[#161616] leading-tight">
                Informe técnico pericial
              </h1>
            </div>
          </div>

          <Button
            variant="whatsapp"
            size="sm"
            onClick={() => window.open('https://wa.me/59899267964', '_blank')}
          >
            <span className="hidden sm:inline">Consultar por WhatsApp</span>
            <span className="sm:hidden">+598 99 267 964</span>
          </Button>
        </div>
      </header>

      {/* CONTENIDO DEL INFORME */}
      <main className="max-w-5xl mx-auto px-4 pt-6">
        <InspectionReportView inspection={inspection} />
      </main>

      {/* PIE DE PÁGINA */}
      <footer className="max-w-5xl mx-auto px-4 mt-8 pt-6 border-t border-[#E5E5E3] text-center text-xs text-[#6B6B6B] space-y-1">
        <p>CARVLAK Group • Shangrilá, Ciudad de la Costa, Canelones, Uruguay.</p>
        <p className="text-[11px]">Automotora CARVLAK • DetailVlak Taller • Inspección Vehicular</p>
      </footer>
    </div>
  );
};
