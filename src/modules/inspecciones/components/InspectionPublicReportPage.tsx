import React from 'react';
import { useData } from '../../../context/DataContext';
import { VehicleInspection } from '../../../types';
import { InspectionReportView } from './InspectionReportView';
import { ShieldCheck, AlertCircle, ArrowLeft, Phone } from 'lucide-react';

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
      <div className="min-h-screen bg-[#080B11] text-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 rounded-3xl bg-[#0F1420] border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto text-2xl">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Informe no encontrado</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            El enlace solicitado no corresponde a un informe técnico activo o el token ingresado es inválido. Verifique el enlace recibido por WhatsApp o contacte a CARVLAK.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Inicio</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F2] dark:bg-[#000000] text-black dark:text-white pb-16">
      {/* HEADER PÚBLICO CON LOGO OFICIAL */}
      <header className="sticky top-0 z-40 bg-[#000000] border-b border-[#222222] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-carvlak-white.png"
              alt="CARVLAK Group"
              className="h-7 w-auto object-contain"
            />
            <div className="hidden sm:block border-l border-[#222222] pl-3">
              <span className="text-[10px] font-title font-bold uppercase tracking-wider text-[#6B6B6B] block">
                Departamento Pericial
              </span>
              <h1 className="text-xs font-semibold text-white leading-tight">
                Informe técnico pericial
              </h1>
            </div>
          </div>

          <a
            href="https://wa.me/59899267964"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-md bg-[#111111] hover:bg-[#222222] border border-[#2A2A2A] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors min-h-[38px]"
          >
            <Phone className="w-3.5 h-3.5 text-[#D7141A]" />
            <span className="hidden sm:inline">Consultar por WhatsApp</span>
            <span className="sm:hidden">+598 99 267 964</span>
          </a>
        </div>
      </header>

      {/* CONTENIDO DEL INFORME */}
      <main className="max-w-5xl mx-auto px-4 pt-6">
        <InspectionReportView inspection={inspection} />
      </main>

      {/* PIE DE PÁGINA */}
      <footer className="max-w-5xl mx-auto px-4 mt-8 pt-6 border-t border-slate-800/60 text-center text-xs text-slate-500 space-y-1">
        <p>CARVLAK Group • Shangrilá, Ciudad de la Costa, Canelones, Uruguay.</p>
        <p className="text-[11px]">Automotora CARVLAK • DetailVlak Taller • Inspección Vehicular</p>
      </footer>
    </div>
  );
};
