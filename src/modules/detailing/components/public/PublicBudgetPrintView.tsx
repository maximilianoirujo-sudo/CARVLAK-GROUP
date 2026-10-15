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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex flex-col items-center p-2 sm:p-6 print:p-0 print:static print:bg-white print:backdrop-blur-none">
      {/* Botones de acción flotantes (ocultos al imprimir) */}
      <div className="print:hidden w-full max-w-3xl mb-4 flex items-center justify-between bg-white border border-neutral-200 p-3.5 rounded-2xl text-neutral-900 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0066FF] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold block">Presupuesto Estimado DetailVlak</span>
            <span className="text-[11px] text-neutral-500">Código #{request.code}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0055DD] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / Guardar PDF</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-700 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hoja de Presupuesto imprimible (A4 / Formato profesional DetailVlak) */}
      <div className="w-full max-w-3xl bg-white text-[#161616] p-8 sm:p-12 rounded-2xl print:rounded-none shadow-2xl print:shadow-none border border-neutral-200 print:border-none space-y-6 print:space-y-4">
        {/* Encabezado */}
        <div className="flex items-start justify-between border-b border-neutral-200 pb-6 print:pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0066FF] text-white flex items-center justify-center font-black text-xs shadow-xs">
                DV
              </div>
              <span className="font-extrabold text-neutral-900 text-lg tracking-tight font-display">
                DETAIL<span className="text-[#0066FF]">VLAK</span>
              </span>
            </div>
            <div className="text-xs font-bold tracking-wider text-neutral-800 uppercase pt-1">
              DetailVlak • Taller de Estética Automotriz
            </div>
            <p className="text-[11px] text-neutral-500 max-w-xs">
              Especialistas en corrección de pintura, sellados cerámicos y limpieza profunda de interiores.
            </p>
          </div>

          <div className="text-right space-y-1">
            <span className="inline-block px-3 py-1 bg-black text-white rounded-lg text-xs font-mono font-bold tracking-wider">
              {request.code}
            </span>
            <div className="text-xs text-neutral-500 pt-1">
              Fecha: <strong className="text-neutral-800">{formattedDate}</strong>
            </div>
            <div className="text-[11px] text-neutral-500">
              Validez: <strong>15 días</strong>
            </div>
          </div>
        </div>

        {/* Datos del Cliente y Vehículo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F8F8F7] p-5 rounded-xl border border-neutral-200 text-xs">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
              Datos del Cliente
            </span>
            <div className="font-bold text-sm text-neutral-900">{request.client_name}</div>
            <div className="text-neutral-600 flex items-center gap-1.5">
              <span>WhatsApp:</span>
              <strong className="text-neutral-800 font-mono">{request.client_phone}</strong>
            </div>
            {request.client_email && (
              <div className="text-neutral-600">
                Email: <span className="text-neutral-800">{request.client_email}</span>
              </div>
            )}
            {request.preferred_date && (
              <div className="text-neutral-600 pt-0.5">
                Fecha preferida: <strong className="text-neutral-800">{request.preferred_date}</strong>
              </div>
            )}
          </div>

          <div className="space-y-1.5 sm:border-l sm:border-neutral-200 sm:pl-5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
              Vehículo a Tratar
            </span>
            <div className="font-bold text-sm text-neutral-900">
              {request.vehicle_brand} {request.vehicle_model} {request.vehicle_year ? `(${request.vehicle_year})` : ''}
            </div>
            <div className="text-neutral-600">
              Tamaño / Categoría: <strong className="text-neutral-800">{request.vehicle_category}</strong>
            </div>
            {request.vehicle_plate && (
              <div className="text-neutral-600">
                Matrícula: <strong className="text-neutral-800 font-mono uppercase">{request.vehicle_plate}</strong>
              </div>
            )}
            {request.comments && (
              <div className="text-neutral-600 text-[11px] pt-1 italic">
                Notas: "{request.comments}"
              </div>
            )}
          </div>
        </div>

        {/* Tabla de Servicios Cotizados */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
            Detalle de Tratamientos Solicitados
          </h3>

          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161616] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 font-bold">Servicio / Tratamiento</th>
                  <th className="py-2.5 px-3 font-bold text-center">Duración est.</th>
                  <th className="py-2.5 px-4 font-bold text-right">Precio ($UYU)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {request.selected_services.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900">{item.serviceName}</div>
                      <div className="text-[11px] text-neutral-500">
                        Aplicado a categoría {request.vehicle_category}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-neutral-600 font-mono">
                      {item.durationHours ? `${item.durationHours} hs` : 'A coordinar'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900">
                      $ {item.price.toLocaleString('es-UY')}
                    </td>
                  </tr>
                ))}

                {request.selected_products && request.selected_products.length > 0 && (
                  <>
                    <tr className="bg-neutral-100/70 border-t border-neutral-300">
                      <td colSpan={3} className="py-2 px-4 font-bold text-[10px] uppercase text-neutral-700 tracking-wider">
                        Productos de Mantenimiento Sumados
                      </td>
                    </tr>
                    {request.selected_products.map((prod, idx) => (
                      <tr key={`prod-${idx}`} className="bg-white">
                        <td className="py-2.5 px-4 font-semibold text-neutral-900">
                          {prod.productName}
                        </td>
                        <td className="py-2.5 px-3 text-center text-neutral-500 text-[11px]">
                          Para cuidado en casa
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-neutral-800">
                          $ {prod.price.toLocaleString('es-UY')}
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
              <tfoot className="bg-[#F4F4F3] border-t-2 border-neutral-300">
                {request.applied_discount && request.applied_discount.discount_amount > 0 && (
                  <tr>
                    <td colSpan={2} className="py-2 px-4 font-semibold text-xs text-emerald-700 text-right">
                      {request.applied_discount.discount_name} {request.applied_discount.coupon_code ? `(${request.applied_discount.coupon_code})` : ''}:
                    </td>
                    <td className="py-2 px-4 font-mono font-bold text-xs text-emerald-700 text-right">
                      -$ {request.applied_discount.discount_amount.toLocaleString('es-UY')}
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={2} className="py-3 px-4 font-bold text-sm text-neutral-900 text-right">
                    TOTAL ESTIMADO:
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-base text-[#0066FF] text-right">
                    $ {request.total_amount.toLocaleString('es-UY')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {request.next_service_coupon_code && (
            <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0066FF]" />
                <div>
                  <span className="font-bold text-neutral-900 block">¡Cupón regalo para tu próximo servicio o para un amigo!</span>
                  <span className="text-[11px] text-neutral-600">Presentá este cupón en el taller para obtener un 10% de descuento.</span>
                </div>
              </div>
              <span className="font-mono font-black text-sm bg-white px-3 py-1 rounded-lg border border-blue-300 text-[#0066FF]">
                {request.next_service_coupon_code}
              </span>
            </div>
          )}
        </div>

        {/* Condiciones del Taller */}
        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2 text-[11px] text-neutral-600 leading-relaxed">
          <div className="font-bold text-neutral-800 flex items-center gap-1.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-[#0066FF]" />
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
        <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>Av. Giannattasio, Shangrilá, Canelones, Uruguay</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
            <span>WhatsApp: +598 99 267 964</span>
          </div>
        </div>
      </div>
    </div>
  );
};
