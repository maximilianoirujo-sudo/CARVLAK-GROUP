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
      <div className="min-h-screen bg-negro text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 rounded-xl bg-panel border border-borde text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-xl bg-rojo/10 text-rojo flex items-center justify-center mx-auto text-2xl border border-rojo/30">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-title font-bold text-white">Informe no encontrado</h2>
          <p className="text-xs text-gris-texto leading-relaxed">
            El enlace solicitado no corresponde a un informe técnico activo o el token ingresado es inválido. Verifique el enlace recibido por WhatsApp o contacte a CARVLAK.
          </p>
          <Button
            variant="secondary"
            onClick={() => { window.location.href = '/'; }}
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-negro text-white pb-16">
      {/* HEADER PÚBLICO CON LOGO OFICIAL */}
      <header className="sticky top-0 z-40 bg-negro border-b border-borde px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-carvlak-white.png"
              alt="CARVLAK Group"
              className="h-7 w-auto object-contain"
            />
            <div className="hidden sm:block border-l border-borde pl-3">
              <span className="text-[10px] font-title font-bold uppercase tracking-wider text-gris-texto block">
                Departamento Pericial
              </span>
              <h1 className="text-xs font-semibold text-white leading-tight">
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
      <footer className="max-w-5xl mx-auto px-4 mt-8 pt-6 border-t border-borde text-center text-xs text-gris-texto space-y-1">
        <p>CARVLAK Group • Shangrilá, Ciudad de la Costa, Canelones, Uruguay.</p>
        <p className="text-[11px]">Automotora CARVLAK • DetailVlak Taller • Inspección Vehicular</p>
      </footer>
    </div>
  );
};
