import React from 'react';
import { Printer, X, Sparkles, MapPin, Phone, Calendar, ShieldCheck, Check } from 'lucide-react';
import { DetailingWebRequest } from '../../../../types';

interface PublicBudgetPrintViewProps {
  request: DetailingWebRequest;
  onClose: () => void;
}

export const PublicBudgetPrintView: React.FC<PublicBudgetPrintViewProps> = ({
  request,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(request.created_at).toLocaleDateString('es-UY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex flex-col items-center p-2 sm:p-6 print:p-0 print:static print:bg-white print:backdrop-blur-none font-inter">
      {/* Botones de acción flotantes (ocultos al imprimir) */}
      <div className="print:hidden w-full max-w-3xl mb-4 flex items-center justify-between bg-white border border-[#E6E8EB] p-3.5 rounded-[14px] text-[#0B0B0C] shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-[#EEF3FF] text-[#1E5EFF] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[13px] font-semibold block text-[#0B0B0C]">Presupuesto Estimado DetailVlak</span>
            <span className="text-[12px] text-[#6B7079]">Código #{request.code}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-[10px] bg-[#1E5EFF] hover:bg-[#1747C7] text-white text-[13px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / Guardar PDF</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#6B7079] hover:text-[#0B0B0C] rounded-[8px] hover:bg-[#F5F6F7] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hoja de Presupuesto imprimible (A4 / Formato profesional DetailVlak) */}
      <div className="w-full max-w-3xl bg-white text-[#0B0B0C] p-8 sm:p-12 rounded-[14px] print:rounded-none shadow-xl print:shadow-none border border-[#E6E8EB] print:border-none space-y-6 print:space-y-4">
        {/* Encabezado */}
        <div className="flex items-start justify-between border-b border-[#E6E8EB] pb-6 print:pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <img
                src="/detailvlak-logo.png"
                alt="DetailVlak"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </div>
            <div className="text-xs font-bold tracking-wider text-neutral-800 uppercase pt-1">
              DetailVlak • Taller de Estética Automotriz
            </div>
            <p className="text-[11px] text-neutral-500 max-w-xs">
              Especialistas en corrección de pintura, sellados cerámicos y limpieza profunda de interiores.
            </p>
          </div>

          <div className="text-right space-y-1">
            <span className="inline-block px-3 py-1 bg-[#0B0B0C] text-white rounded-[8px] text-[12px] font-mono font-semibold tracking-wider">
              {request.code}
            </span>
            <div className="text-[12px] text-[#6B7079] pt-1">
              Fecha: <strong className="text-[#0B0B0C]">{formattedDate}</strong>
            </div>
            <div className="text-[11px] text-[#6B7079]">
              Validez: <strong>15 días</strong>
            </div>
          </div>
        </div>

        {/* Datos del Cliente y Vehículo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F5F6F7] p-5 rounded-[12px] border border-[#E6E8EB] text-[13px]">
          <div className="space-y-1.5">
            <span className="text-[11px] uppercase font-semibold text-[#6B7079] tracking-[0.06em] block">
              Datos del Cliente
            </span>
            <div className="font-semibold text-[15px] text-[#0B0B0C]">{request.client_name}</div>
            <div className="text-[#3A3D42] flex items-center gap-1.5">
              <span>WhatsApp:</span>
              <strong className="text-[#0B0B0C] font-mono">{request.client_phone}</strong>
            </div>
            {request.client_email && (
              <div className="text-[#3A3D42]">
                Email: <span className="text-[#0B0B0C]">{request.client_email}</span>
              </div>
            )}
            {request.preferred_date && (
              <div className="text-[#3A3D42] pt-0.5">
                Fecha preferida: <strong className="text-[#0B0B0C]">{request.preferred_date}</strong>
              </div>
            )}
          </div>

          <div className="space-y-1.5 sm:border-l sm:border-[#E6E8EB] sm:pl-5">
            <span className="text-[11px] uppercase font-semibold text-[#6B7079] tracking-[0.06em] block">
              Vehículo a Tratar
            </span>
            <div className="font-semibold text-[15px] text-[#0B0B0C]">
              {request.vehicle_brand} {request.vehicle_model} {request.vehicle_year ? `(${request.vehicle_year})` : ''}
            </div>
            <div className="text-[#3A3D42]">
              Tamaño / Categoría: <strong className="text-[#0B0B0C]">{request.vehicle_category}</strong>
            </div>
            {request.vehicle_plate && (
              <div className="text-[#3A3D42]">
                Matrícula: <strong className="text-[#0B0B0C] font-mono uppercase">{request.vehicle_plate}</strong>
              </div>
            )}
            {request.comments && (
              <div className="text-[#6B7079] text-[12px] pt-1 italic">
                Notas: "{request.comments}"
              </div>
            )}
          </div>
        </div>

        {/* Tabla de Servicios Cotizados */}
        <div className="space-y-2.5">
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#6B7079]">
            Detalle de Tratamientos Solicitados
          </h3>

          <div className="border border-[#E6E8EB] rounded-[12px] overflow-hidden">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#0B0B0C] text-white uppercase text-[11px] tracking-[0.06em]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Servicio / Tratamiento</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Duración est.</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Precio ($UYU)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E8EB]">
                {request.selected_services.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F6F7]/50'}>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#0B0B0C]">{item.serviceName}</div>
                      <div className="text-[12px] text-[#6B7079]">
                        Aplicado a categoría {request.vehicle_category}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-[#6B7079] font-mono">
                      {item.durationHours ? `${item.durationHours} hs` : 'A coordinar'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[#0B0B0C] tabular-nums">
                      $ {item.price.toLocaleString('es-UY')}
                    </td>
                  </tr>
                ))}

                {request.selected_products && request.selected_products.length > 0 && (
                  <>
                    <tr className="bg-[#F5F6F7] border-t border-[#E6E8EB]">
                      <td colSpan={3} className="py-2 px-4 font-semibold text-[11px] uppercase text-[#6B7079] tracking-[0.06em]">
                        Productos de Mantenimiento Sumados
                      </td>
                    </tr>
                    {request.selected_products.map((prod, idx) => (
                      <tr key={`prod-${idx}`} className="bg-white">
                        <td className="py-2.5 px-4 font-medium text-[#0B0B0C]">
                          {prod.productName}
                        </td>
                        <td className="py-2.5 px-3 text-center text-[#6B7079] text-[12px]">
                          Para cuidado en casa
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-medium text-[#3A3D42] tabular-nums">
                          $ {prod.price.toLocaleString('es-UY')}
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
              <tfoot className="bg-[#F5F6F7] border-t-2 border-[#E6E8EB]">
                {request.applied_discount && request.applied_discount.discount_amount > 0 && (
                  <tr>
                    <td colSpan={2} className="py-2 px-4 font-medium text-[13px] text-[#1E5EFF] text-right">
                      {request.applied_discount.discount_name} {request.applied_discount.coupon_code ? `(${request.applied_discount.coupon_code})` : ''}:
                    </td>
                    <td className="py-2 px-4 font-mono font-bold text-[13px] text-[#1E5EFF] text-right tabular-nums">
                      -$ {request.applied_discount.discount_amount.toLocaleString('es-UY')}
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={2} className="py-3 px-4 font-bold text-[15px] text-[#0B0B0C] text-right">
                    TOTAL ESTIMADO:
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[18px] text-[#1E5EFF] text-right tabular-nums">
                    $ {request.total_amount.toLocaleString('es-UY')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {request.next_service_coupon_code && (
            <div className="mt-3 p-3.5 rounded-[12px] bg-[#EEF3FF] border border-[#1E5EFF]/25 flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#1E5EFF]" />
                <div>
                  <span className="font-semibold text-[#0B0B0C] block">¡Cupón regalo para tu próximo servicio o para un amigo!</span>
                  <span className="text-[12px] text-[#6B7079]">Presentá este cupón en el taller para obtener un 10% de descuento.</span>
                </div>
              </div>
              <span className="font-mono font-bold text-[14px] bg-white px-3 py-1 rounded-[8px] border border-[#1E5EFF]/30 text-[#1E5EFF]">
                {request.next_service_coupon_code}
              </span>
            </div>
          )}
        </div>

        {/* Condiciones del Taller */}
        <div className="bg-[#F5F6F7] p-4 rounded-[12px] border border-[#E6E8EB] space-y-2 text-[12px] text-[#6B7079] leading-relaxed">
          <div className="font-semibold text-[#0B0B0C] flex items-center gap-1.5 text-[13px]">
            <ShieldCheck className="w-4 h-4 text-[#1E5EFF]" />
            <span>Condiciones y Reglas de DetailVlak</span>
          </div>
          <ul className="space-y-1 list-disc list-inside">
            <li>
              <strong>Presupuesto estimado:</strong> El importe final y los tiempos de ejecución se confirman una vez visto e inspeccionado el vehículo en nuestras instalaciones.
            </li>
            <li>
              <strong>Interiores:</strong> Solo realizamos limpieza integral profunda (incluye butacas, alfombras, baúl y cielo raso a vapor). No realizamos lavados sueltos ni superficiales de interior.
            </li>
            <li>
              <strong>Garantía y productos:</strong> Se utilizan insumos importados de grado profesional (Koch Chemie, Gyeon, Colourlock).
            </li>
          </ul>
        </div>

        {/* Pie de página con contacto y ubicación */}
        <div className="pt-4 border-t border-[#E6E8EB] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#6B7079]">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#6B7079] shrink-0" />
            <span>Av. Giannattasio, Shangrilá, Canelones, Uruguay</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#6B7079] shrink-0" />
            <span>WhatsApp: +598 99 267 964</span>
          </div>
        </div>
      </div>
    </div>
  );
};
