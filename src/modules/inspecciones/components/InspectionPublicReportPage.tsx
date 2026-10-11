import React, { useState, useEffect } from 'react';
import { VehicleInspection, GeneralConfig } from '../../../types';
import { InspectionReportView } from './InspectionReportView';
import { ShieldCheck, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { INITIAL_INSPECTIONS, INITIAL_GENERAL_CONFIG } from '../../../lib/mockData';

interface InspectionPublicReportPageProps {
  token: string;
}

export const InspectionPublicReportPage: React.FC<InspectionPublicReportPageProps> = ({
  token
}) => {
  const [inspection, setInspection] = useState<VehicleInspection | null>(null);
  const [generalConfig, setGeneralConfig] = useState<GeneralConfig>(INITIAL_GENERAL_CONFIG);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchReport() {
      if (isSupabaseConfigured && supabase) {
        try {
          const [reportRes, configRes] = await Promise.all([
            supabase.rpc('get_inspection_report', { p_token: token }),
            supabase.rpc('get_public_config')
          ]);
          if (configRes.data && isMounted) {
            setGeneralConfig(prev => ({ ...prev, ...(configRes.data as Partial<GeneralConfig>) }));
          }
          if (!reportRes.error && reportRes.data && isMounted) {
            setInspection(reportRes.data as VehicleInspection);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Error al consultar get_inspection_report:', err);
        }
      }

      // Fallback para modo local / DEV
      if (import.meta.env.DEV) {
        const found = INITIAL_INSPECTIONS.find((i) => i.token === token && i.status === 'Completada');
        if (found && isMounted) {
          setInspection(found);
        }
      }

      if (isMounted) setLoading(false);
    }

    fetchReport();
    return () => {
      isMounted = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] text-[#161616] flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 rounded-2xl bg-white border border-[#E5E5E3] text-center space-y-4 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#D7141A]" />
          <h2 className="text-base font-bold text-[#161616]">Cargando informe pericial...</h2>
        </div>
      </div>
    );
  }

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
              src="/carvlak-logo-negro.png"
              alt="CARVLAK"
              className="h-7 w-auto object-contain"
            />
            <div className="hidden sm:block border-l border-[#E5E5E3] pl-3">
              <span className="text-[10px] font-title font-bold uppercase tracking-wider text-[#6B6B6B] block">
                Carbusters • Peritaje Precompra
              </span>
              <h1 className="text-xs font-semibold text-[#161616] leading-tight">
                Informe pericial precompra
              </h1>
            </div>
          </div>

          <Button
            variant="whatsapp"
            size="sm"
            onClick={() => window.open(`https://wa.me/${generalConfig?.company_phone || '59899267964'}`, '_blank')}
          >
            <span className="hidden sm:inline">Consultar por WhatsApp</span>
            <span className="sm:hidden">{generalConfig?.company_phone_formatted || '+598 99 267 964'}</span>
          </Button>
        </div>
      </header>

      {/* CONTENIDO DEL INFORME */}
      <main className="max-w-5xl mx-auto px-4 pt-6">
        <InspectionReportView inspection={inspection} />
      </main>

      {/* PIE DE PÁGINA */}
      <footer className="max-w-5xl mx-auto px-4 mt-8 pt-6 border-t border-[#E5E5E3] text-center text-xs text-[#6B6B6B] space-y-1">
        <p>{generalConfig?.company_name || 'CARVLAK Group'} • {generalConfig?.address || 'Shangrilá, Ciudad de la Costa, Canelones, Uruguay'}.</p>
        <p className="text-[11px]">Automotora CARVLAK • DetailVlak Taller • Carbusters Peritajes</p>
      </footer>
    </div>
  );
};
