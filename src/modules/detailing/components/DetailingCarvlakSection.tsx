import React, { useMemo, useState } from 'react';
import { Car, Plus, Trash2, CheckCircle2, X } from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { DetailingQuote } from '../../../types';
import { formatCurrency, getLocalDateString } from '../../../lib/formatters';

// Autos de la automotora CARVLAK (se cobran a Jonathan).
// Es solo un registro: auto + fecha + precio. NO genera comisiones para nadie.

export const isCarvlakQuote = (q: any): boolean =>
  !!q && (q.is_carvlak_job === true || /^\s*carvlak\b/i.test(String(q.company_name || q.client_name || '')));

const monthKey = (d: string) => String(d || '').slice(0, 7);
const monthLabel = (k: string) => {
  const [y, m] = k.split('-').map(Number);
  if (!y || !m) return k;
  const names = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${names[m - 1]} ${y}`;
};
const fmtDate = (d: string) => {
  const p = String(d || '').slice(0, 10).split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
};
const paidOf = (q: any) =>
  (q.payments || []).filter((p: any) => !p.is_voided).reduce((s: number, p: any) => s + (Number(p.amount) || 0), 0);

export const DetailingCarvlakSection: React.FC<{ autoOpenForm?: boolean; onFormClosed?: () => void }> = ({ autoOpenForm, onFormClosed }) => {
  const { detailingQuotes, detailingCompanies, addDetailingCompany, addDetailingQuote, updateDetailingQuote, deleteDetailingQuotePermanent } = useData() as any;
  const { profile } = useAuth();
  const { showToast } = useToast();
  const isAdmin = profile?.roles?.includes('admin');

  const [showForm, setShowForm] = useState<boolean>(!!autoOpenForm);
  const [vehicle, setVehicle] = useState('');
  const [plate, setPlate] = useState('');
  const [date, setDate] = useState(getLocalDateString());
  const [price, setPrice] = useState<string>('');
  const [paid, setPaid] = useState(true);
  const [method, setMethod] = useState('Efectivo');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (autoOpenForm) setShowForm(true);
  }, [autoOpenForm]);

  const jobs: DetailingQuote[] = useMemo(
    () => (detailingQuotes || []).filter((q: any) => q && !q.deleted_at && !q.is_voided && isCarvlakQuote(q)),
    [detailingQuotes]
  );

  const months = useMemo(() => {
    const set = new Set<string>(jobs.map((q: any) => monthKey(q.work_date || q.created_at)));
    set.add(getLocalDateString().slice(0, 7));
    return Array.from(set).filter(Boolean).sort().reverse();
  }, [jobs]);
  const [month, setMonth] = useState<string>(getLocalDateString().slice(0, 7));

  const monthJobs = useMemo(
    () =>
      jobs
        .filter((q: any) => monthKey(q.work_date || q.created_at) === month)
        .sort((a: any, b: any) => String(b.work_date || '').localeCompare(String(a.work_date || ''))),
    [jobs, month]
  );
  const total = monthJobs.reduce((s, q: any) => s + (Number(q.total_amount) || 0), 0);
  const cobrado = monthJobs.reduce((s, q: any) => s + Math.min(paidOf(q), Number(q.total_amount) || 0), 0);
  const pendiente = Math.max(0, total - cobrado);

  const closeForm = () => {
    setShowForm(false);
    setVehicle('');
    setPlate('');
    setPrice('');
    setNotes('');
    setError('');
    setPaid(true);
    setDate(getLocalDateString());
    if (onFormClosed) onFormClosed();
  };

  const getCarvlakCompany = () => {
    let company = (detailingCompanies || []).find(
      (c: any) => c && !c.deleted_at && (c.is_carvlak_internal || /^\s*carvlak\b/i.test(c.name || ''))
    );
    if (!company) {
      company = addDetailingCompany({
        name: 'CARVLAK',
        contact_name: 'Jonathan',
        billing_mode: 'mensual',
        notes: 'Autos de la automotora CARVLAK. Se cobran a Jonathan.',
        is_active: true,
        is_carvlak_internal: true
      } as any);
    }
    return company;
  };

  const handleSave = () => {
    const amount = Math.max(0, Number(price) || 0);
    if (!vehicle.trim()) return setError('Escribí el auto (marca y modelo).');
    if (!date) return setError('Elegí la fecha.');
    if (amount <= 0) return setError('Escribí el precio que se le cobra.');
    setError('');
    const company: any = getCarvlakCompany();
    const nowIso = new Date().toISOString();
    const payments = paid
      ? [{ id: `pay-${crypto.randomUUID()}`, quote_id: '', amount, method, date, created_at: nowIso, updated_at: nowIso, is_voided: false }]
      : [];
    addDetailingQuote({
      customer_type: 'empresa',
      company_id: company?.id,
      company_name: 'CARVLAK',
      client_id: company?.id,
      client_name: 'CARVLAK',
      client_phone: '',
      vehicle_info: vehicle.trim(),
      vehicle_plate: plate.trim() ? plate.trim().toUpperCase() : undefined,
      vehicle_size: 1,
      vehicle_category: 'Mediano',
      work_date: date,
      selected_services: [{ serviceId: 'carvlak', serviceName: 'Trabajo auto CARVLAK', price: amount }],
      subtotal: amount,
      discount_type: 'none',
      discount_amount: 0,
      extreme_dirt_surcharge: 0,
      total_amount: amount,
      origin: 'CARVLAK',
      assigned_to: 'user-romina',
      commission_participants: [],
      is_carvlak_job: true,
      notes: notes.trim(),
      status: 'Trabajo Completado',
      payments
    } as any);
    showToast(`Auto CARVLAK registrado: ${vehicle.trim()} · ${formatCurrency(amount, 'UYU')}`, 'success');
    closeForm();
    setMonth(date.slice(0, 7));
  };

  const markPaid = (q: any) => {
    const due = Math.max(0, (Number(q.total_amount) || 0) - paidOf(q));
    if (due <= 0) return;
    const nowIso = new Date().toISOString();
    updateDetailingQuote(q.id, {
      payments: [
        ...(q.payments || []),
        { id: `pay-${crypto.randomUUID()}`, quote_id: q.id, amount: due, method: 'Efectivo', date: getLocalDateString(), created_at: nowIso, updated_at: nowIso, is_voided: false }
      ]
    } as any);
    showToast('Marcado como cobrado', 'success');
  };

  const remove = (q: any) => {
    if (!window.confirm(`¿Borrar el registro de ${q.vehicle_info}?`)) return;
    deleteDetailingQuotePermanent(q.id);
    showToast('Registro borrado', 'success');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#E5E5E3] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#161616] text-white flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#161616]">Autos hechos para CARVLAK</h2>
              <p className="text-xs text-[#6B6B6B]">Se cobran a Jonathan. Solo registro: no generan comisión.</p>
            </div>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="bg-[#161616] hover:bg-black text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Cargar auto
            </button>
          )}
        </div>

        {showForm && (
          <div className="border-2 border-[#161616] rounded-2xl p-4 space-y-3 bg-[#FAFAF9]">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#161616]">Nuevo auto CARVLAK</span>
              <button type="button" onClick={closeForm} className="p-1 text-[#6B6B6B] hover:text-[#161616]" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-bold text-[#6B6B6B] uppercase">Auto (marca y modelo) *</span>
                <input id="carvlak-vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Ej: Bestune Nat" className="border border-[#E5E5E3] rounded-xl px-3 py-3 text-base bg-white" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-[#6B6B6B] uppercase">Matrícula (opcional)</span>
                <input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="ABC 1234" className="border border-[#E5E5E3] rounded-xl px-3 py-3 text-base bg-white uppercase" />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-[#6B6B6B] uppercase">Fecha *</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-[#E5E5E3] rounded-xl px-3 py-3 text-base bg-white" />
              </label>
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-bold text-[#6B6B6B] uppercase">Precio que se le cobra ($U) *</span>
                <input id="carvlak-price" type="number" inputMode="numeric" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ej: 4000" className="border-2 border-[#161616] rounded-xl px-3 py-3 text-2xl font-bold bg-white" />
              </label>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-bold text-[#6B6B6B] uppercase">¿Ya se cobró?</span>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setPaid(true)} className={`py-3 rounded-xl font-bold border-2 ${paid ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white text-[#161616] border-[#E5E5E3]'}`}>Sí, cobrado</button>
                  <button type="button" onClick={() => setPaid(false)} className={`py-3 rounded-xl font-bold border-2 ${!paid ? 'bg-[#161616] text-white border-[#161616]' : 'bg-white text-[#161616] border-[#E5E5E3]'}`}>Pendiente</button>
                </div>
                {paid && (
                  <select value={method} onChange={(e) => setMethod(e.target.value)} className="mt-1 border border-[#E5E5E3] rounded-xl px-3 py-3 text-base bg-white">
                    <option>Efectivo</option>
                    <option>Transferencia</option>
                  </select>
                )}
              </div>
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-bold text-[#6B6B6B] uppercase">Nota (opcional)</span>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Qué se le hizo" className="border border-[#E5E5E3] rounded-xl px-3 py-3 text-base bg-white" />
              </label>
            </div>
            {error && <div className="text-sm font-bold text-[#D7141A]">{error}</div>}
            <button type="button" onClick={handleSave} className="w-full bg-[#161616] hover:bg-black text-white font-bold py-3.5 rounded-xl text-base">
              Guardar auto
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="border border-[#E5E5E3] rounded-xl px-3 py-2 text-sm font-bold bg-white">
            {months.map((m) => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#161616] text-white rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wider text-[#BDBDBD]">Autos</div>
            <div className="text-2xl sm:text-3xl font-bold">{monthJobs.length}</div>
          </div>
          <div className="bg-[#161616] text-white rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-wider text-[#BDBDBD]">Total</div>
            <div className="text-lg sm:text-3xl font-bold">{formatCurrency(total, 'UYU')}</div>
          </div>
          <div className={`rounded-xl p-3 border-2 ${pendiente > 0 ? 'border-[#D7141A] text-[#D7141A]' : 'border-[#E5E5E3] text-[#161616]'}`}>
            <div className="text-[10px] uppercase tracking-wider">Falta cobrar</div>
            <div className="text-lg sm:text-3xl font-bold">{formatCurrency(pendiente, 'UYU')}</div>
          </div>
        </div>

        <div className="divide-y divide-[#E5E5E3] border border-[#E5E5E3] rounded-xl">
          {monthJobs.length === 0 && <div className="p-4 text-sm text-[#6B6B6B]">No hay autos de CARVLAK cargados en {monthLabel(month)}.</div>}
          {monthJobs.map((q: any) => {
            const due = Math.max(0, (Number(q.total_amount) || 0) - paidOf(q));
            return (
              <div key={q.id} className="p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-[#161616] truncate">
                    {q.vehicle_info}
                    {q.vehicle_plate ? <span className="ml-2 text-xs font-mono border border-[#161616] rounded px-1.5 py-0.5">{q.vehicle_plate}</span> : null}
                  </div>
                  <div className="text-xs text-[#6B6B6B]">
                    {fmtDate(q.work_date)}
                    {q.notes ? ` · ${q.notes}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#161616]">{formatCurrency(q.total_amount, 'UYU')}</div>
                    {due > 0 ? (
                      <button type="button" onClick={() => markPaid(q)} className="text-[11px] font-bold text-[#D7141A] underline">Pendiente · marcar cobrado</button>
                    ) : (
                      <div className="text-[11px] font-bold text-green-700 flex items-center gap-1 justify-end"><CheckCircle2 className="w-3 h-3" /> Cobrado</div>
                    )}
                  </div>
                  {isAdmin && (
                    <button type="button" onClick={() => remove(q)} className="p-2 text-[#6B6B6B] hover:text-[#D7141A]" aria-label="Borrar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
