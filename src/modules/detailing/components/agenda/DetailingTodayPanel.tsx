import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  CheckCircle, 
  X, 
  Droplets, 
  MessageCircle, 
  DollarSign, 
  Package, 
  Car,
  Bell,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DetailingAlert } from '../../services/detailingAlertsService';
import { Button } from '../../../../components/ui/Button';

interface DetailingTodayPanelProps {
  entriesTodayCount: number;
  inWorkshopNowCount: number;
  deliveriesTodayCount: number;
  availableBaysCount: number;
  alerts: DetailingAlert[];
  onActionClick: (alert: DetailingAlert) => void;
  onSnoozeAlert: (alertId: string) => void;
}

export const DetailingTodayPanel: React.FC<DetailingTodayPanelProps> = ({
  entriesTodayCount,
  inWorkshopNowCount,
  deliveriesTodayCount,
  availableBaysCount,
  alerts,
  onActionClick,
  onSnoozeAlert
}) => {
  const [isAlertsOpen, setIsAlertsOpen] = useState(true);

  const criticalCount = alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = alerts.filter((a) => a.severity === 'warning').length;

  return (
    <div className="space-y-4">
      {/* 4 KPIs de Hoy */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#6B6B6B] block">Entradas de hoy</span>
            <span className="text-2xl font-bold font-display text-[#161616] mt-0.5 block">
              {entriesTodayCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#F5F5F4] flex items-center justify-center text-[#161616]">
            <Clock className="w-5 h-5 text-[#6B6B6B]" />
          </div>
        </div>

        <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#6B6B6B] block">En taller ahora</span>
            <span className="text-2xl font-bold font-display text-[#161616] mt-0.5 block">
              {inWorkshopNowCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
            <Droplets className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#6B6B6B] block">Entregas de hoy</span>
            <span className="text-2xl font-bold font-display text-[#161616] mt-0.5 block">
              {deliveriesTodayCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#EEF7F2] flex items-center justify-center text-[#059669]">
            <CheckCircle className="w-5 h-5 text-[#059669]" />
          </div>
        </div>

        <div className="bg-white border border-[#E5E5E3] rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-[#6B6B6B] block">Puestos libres</span>
            <span className="text-2xl font-bold font-display text-[#161616] mt-0.5 block">
              {availableBaysCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#F5F5F4] flex items-center justify-center text-[#161616]">
            <Car className="w-5 h-5 text-[#6B6B6B]" />
          </div>
        </div>
      </div>

      {/* Centro de Alertas Interactivo */}
      {alerts.length > 0 && (
        <div className="bg-white border border-[#E5E5E3] rounded-xl overflow-hidden shadow-xs">
          <div 
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
            className="p-3.5 bg-[#FAFAFA] border-b border-[#E5E5E3] flex items-center justify-between cursor-pointer select-none transition-colors hover:bg-[#F5F5F4]"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Bell className="w-4 h-4 text-[#D7141A]" />
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#D7141A] animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#161616]">
                  Centro de alertas del taller
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FDF2F2] text-[#B80E14] border border-[#D7141A]/20">
                  {alerts.length} pendientes
                </span>
                {criticalCount > 0 && (
                  <span className="hidden sm:inline-block text-[10px] font-semibold text-[#DC2626]">
                    • {criticalCount} urgente{criticalCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[#6B6B6B]">
              <span className="text-[11px] hidden sm:inline">
                {isAlertsOpen ? 'Ocultar panel' : 'Ver alertas'}
              </span>
              {isAlertsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>

          {isAlertsOpen && (
            <div className="divide-y divide-[#E5E5E3] max-h-72 overflow-y-auto">
              {alerts.map((alert) => {
                const isCrit = alert.severity === 'critical';
                const isWarn = alert.severity === 'warning';

                return (
                  <div 
                    key={alert.id}
                    className="p-3 hover:bg-[#FAFAFA] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                        isCrit ? 'bg-[#FDF2F2] text-[#DC2626]' : isWarn ? 'bg-[#FFFBEB] text-[#D97706]' : 'bg-[#EFF6FF] text-[#2563EB]'
                      }`}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#161616] leading-snug">
                            {alert.title}
                          </span>
                          {alert.timeContext && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F5F5F4] text-[#6B6B6B] border border-[#E5E5E3]">
                              {alert.timeContext}
                            </span>
                          )}
                        </div>
                        <p className="text-[#6B6B6B] text-[11px] mt-0.5 leading-relaxed line-clamp-2">
                          {alert.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onActionClick(alert)}
                        className="text-[11px] py-1 px-2.5 h-7"
                      >
                        {alert.actionType === 'whatsapp' && <MessageCircle className="w-3 h-3 text-[#25D366] mr-1" />}
                        {alert.actionType === 'pay' && <DollarSign className="w-3 h-3 text-[#059669] mr-1" />}
                        {alert.actionType === 'checkin' && <Droplets className="w-3 h-3 text-[#2563EB] mr-1" />}
                        {alert.actionType === 'restock' && <Package className="w-3 h-3 text-[#D97706] mr-1" />}
                        <span>
                          {alert.actionType === 'whatsapp' ? 'Avisar WhatsApp' :
                           alert.actionType === 'pay' ? 'Registrar cobro' :
                           alert.actionType === 'checkin' ? 'Hacer Check-in' :
                           alert.actionType === 'confirm' ? 'Confirmar' :
                           alert.actionType === 'restock' ? 'Ver Stock' : 'Ver detalle'}
                        </span>
                      </Button>

                      <button
                        onClick={() => onSnoozeAlert(alert.id)}
                        title="Posponer alerta"
                        className="p-1 rounded text-[#9A9A9A] hover:text-[#161616] hover:bg-[#E5E5E3] transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
