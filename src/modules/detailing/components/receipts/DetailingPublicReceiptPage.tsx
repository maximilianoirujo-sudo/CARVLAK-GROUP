import React, { useState, useEffect } from 'react';
import { DetailingReceipt } from '../../../../types';
import { DetailingReceiptView } from './DetailingReceiptView';
import { FileText, AlertCircle, ArrowLeft, Loader2, Phone } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { supabase, isSupabaseConfigured } from '../../../../lib/supabase';

interface DetailingPublicReceiptPageProps {
  token: string;
}

export const DetailingPublicReceiptPage: React.FC<DetailingPublicReceiptPageProps> = ({
  token
}) => {
  const [receipt, setReceipt] = useState<DetailingReceipt | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPublicReceipt() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.rpc('get_public_detailing_receipt', { p_token: token });
          if (!error && data && isMounted) {
            setReceipt(data as DetailingReceipt);
            setLoading(false);
            return;
          }
          if (error) {
            console.warn('RPC get_public_detailing_receipt error:', error.message);
          }
        } catch (err) {
          console.warn('Error al consultar get_public_detailing_receipt:', err);
        }
      }

      // Fallback local desde localStorage
      try {
        const saved = localStorage.getItem('carvlak_detailing_receipts');
        if (saved) {
          const list: DetailingReceipt[] = JSON.parse(saved);
          const found = list.find((r) => r.token === token);
          if (found && isMounted) {
            setReceipt(found);
            setLoading(false);
            return;
          }
        }
      } catch (e) {}

      if (isMounted) {
        setErrorMsg('El comprobante solicitado no fue encontrado o el enlace es inválido.');
        setLoading(false);
      }
    }

    fetchPublicReceipt();
    return () => {
      isMounted = false;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-[#E5E5E3] shadow-sm text-center max-w-sm w-full space-y-4">
          <Loader2 className="w-8 h-8 text-[#D7141A] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#161616]">Cargando comprobante de servicio...</p>
          <p className="text-xs text-[#6B6B6B]">CARVLAK Group • DetailVlak</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !receipt) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-[#E5E5E3] shadow-sm text-center max-w-md w-full space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#D7141A] flex items-center justify-center mx-auto border border-red-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-[#161616]">Comprobante no disponible</h2>
          <p className="text-xs text-[#6B6B6B]">
            {errorMsg || 'No se encontró un comprobante oficial asociado a este enlace.'}
          </p>
          <div className="pt-2">
            <a
              href="https://api.whatsapp.com/send?phone=59899267964"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161616] hover:bg-black text-white text-xs font-semibold shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Contactar al taller CARVLAK</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4] py-8 px-3 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <DetailingReceiptView receipt={receipt} isPublicView={true} />
      </div>
    </div>
  );
};
