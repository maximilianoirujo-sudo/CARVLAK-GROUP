import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Power,
  ChevronRight,
  Car,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  X
} from 'lucide-react';
import { DetailingCompany, CompanyBillingMode } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { formatCurrency, getLocalDateString, getDetailingPaidAmount, isActiveJob } from '../../../lib/formatters';
import { DetailingCompanyDetailView } from './DetailingCompanyDetailView';
import { DetailingCompanyJobModal } from './DetailingCompanyJobModal';

export const DetailingCompaniesSection: React.FC = () => {
  const {
    detailingCompanies,
    addDetailingCompany,
    updateDetailingCompany,
    toggleDetailingCompanyActive,
    deleteDetailingCompanyPermanent,
    detailingQuotes
  } = useData();
  const { profile } = useAuth();
  const { showToast } = useToast();

  const isAdmin = profile?.roles?.includes('admin');

  const currentMonthStr = useMemo(() => getLocalDateString().slice(0, 7), []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  // Vista de detalle de empresa
  const [activeCompanyForDetail, setActiveCompanyForDetail] = useState<DetailingCompany | null>(null);

  // Modal Crear / Editar Empresa
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<DetailingCompany | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    rut: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    billing_mode: 'mensual' as CompanyBillingMode,
    notes: ''
  });

  // Modal para Cargar Trabajo de Empresa
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [preselectedCompanyId, setPreselectedCompanyId] = useState<string>('');

  const handleOpenCreateModal = () => {
    setCompanyToEdit(null);
    setFormData({
      name: '',
      legal_name: '',
      rut: '',
      contact_name: '',
      phone: '',
      email: '',
      address: '',
      billing_mode: 'mensual',
      notes: ''
    });
    setIsCompanyModalOpen(true);
  };

  const handleOpenEditModal = (comp: DetailingCompany) => {
    setCompanyToEdit(comp);
    setFormData({
      name: comp.name || '',
      legal_name: comp.legal_name || '',
      rut: comp.rut || '',
      contact_name: comp.contact_name || '',
      phone: comp.phone || '',
      email: comp.email || '',
      address: comp.address || '',
      billing_mode: comp.billing_mode || 'mensual',
      notes: comp.notes || ''
    });
    setIsCompanyModalOpen(true);
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('El nombre de la empresa es obligatorio', 'error');
      return;
    }

    if (companyToEdit) {
      updateDetailingCompany(companyToEdit.id, {
        name: formData.name.trim(),
        legal_name: formData.legal_name.trim() || undefined,
        rut: formData.rut.trim() || undefined,
        contact_name: formData.contact_name.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        billing_mode: formData.billing_mode,
        notes: formData.notes.trim() || undefined
      });
      showToast(`Empresa "${formData.name.trim()}" actualizada`, 'success');
    } else {
      addDetailingCompany({
        name: formData.name.trim(),
        legal_name: formData.legal_name.trim() || undefined,
        rut: formData.rut.trim() || undefined,
        contact_name: formData.contact_name.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        billing_mode: formData.billing_mode,
        notes: formData.notes.trim() || undefined,
        is_active: true
      });
      showToast(`Empresa "${formData.name.trim()}" creada con éxito`, 'success');
    }

    setIsCompanyModalOpen(false);
  };

  const handleDeleteCompany = (comp: DetailingCompany) => {
    const res = deleteDetailingCompanyPermanent(comp.id);
    if (!res.success) {
      showToast(res.error || 'No se puede eliminar la empresa', 'error');
    } else {
      showToast(`Empresa "${comp.name}" eliminada definitivamente`, 'success');
      if (activeCompanyForDetail?.id === comp.id) {
        setActiveCompanyForDetail(null);
      }
    }
  };

  // Métricas por empresa para el mes actual
  const companyMetrics = useMemo(() => {
    const map: Record<string, { jobsCount: number; billed: number; collected: number; pending: number; allTimePending: number; totalJobsCount: number }> = {};

    detailingCompanies.forEach((c) => {
      const companyAllQuotes = detailingQuotes.filter((q) => q.company_id === c.id && isActiveJob(q));
      const companyMonthQuotes = companyAllQuotes.filter((q) => {
        const qDate = q.work_date || (q.created_at ? q.created_at.slice(0, 10) : '');
        return qDate.startsWith(currentMonthStr);
      });

      const monthBilled = companyMonthQuotes.reduce((acc, q) => acc + (q.total_amount || 0), 0);
      const monthCollected = companyMonthQuotes.reduce((acc, q) => acc + getDetailingPaidAmount(q), 0);

      const allBilled = companyAllQuotes.reduce((acc, q) => acc + (q.total_amount || 0), 0);
      const allCollected = companyAllQuotes.reduce((acc, q) => acc + getDetailingPaidAmount(q), 0);

      map[c.id] = {
        jobsCount: companyMonthQuotes.length,
        billed: monthBilled,
        collected: monthCollected,
        pending: Math.max(0, monthBilled - monthCollected),
        allTimePending: Math.max(0, allBilled - allCollected),
        totalJobsCount: companyAllQuotes.length
      };
    });

    return map;
  }, [detailingCompanies, detailingQuotes, currentMonthStr]);

  // Empresas filtradas
  const filteredCompanies = useMemo(() => {
    return detailingCompanies.filter((c) => {
      if (statusFilter === 'active' && !c.is_active) return false;
      if (statusFilter === 'inactive' && c.is_active) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const mName = c.name.toLowerCase().includes(term);
        const mRut = (c.rut || '').toLowerCase().includes(term);
        const mContact = (c.contact_name || '').toLowerCase().includes(term);
        const mPhone = (c.phone || '').includes(term);
        if (!mName && !mRut && !mContact && !mPhone) return false;
      }
      return true;
    });
  }, [detailingCompanies, statusFilter, searchTerm]);

  // Si hay una empresa seleccionada para ver su cuenta en detalle:
  if (activeCompanyForDetail) {
    const liveCompany = detailingCompanies.find((c) => c.id === activeCompanyForDetail.id) || activeCompanyForDetail;
    return (
      <DetailingCompanyDetailView
        company={liveCompany}
        onBack={() => setActiveCompanyForDetail(null)}
        onEditCompany={(comp) => handleOpenEditModal(comp)}
      />
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 1. Header con Búsqueda y Botón Nueva Empresa */}
      <div className="bg-white border border-[#E5E5E3] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E5E5E3]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-[#D7141A]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-display text-[#161616]">
                  Empresas & Automotoras
                </h2>
                <span className="text-[10px] bg-red-100 text-[#D7141A] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Preventa B2B
                </span>
              </div>
              <p className="text-xs text-[#6B6B6B]">
                Gestión de cuentas corrientes, tarifa por tamaño y trabajos preventa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPreselectedCompanyId('');
                setIsJobModalOpen(true);
              }}
              className="bg-white hover:bg-[#F5F5F4] border border-[#E5E5E3] text-[#161616] font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer min-h-[38px]"
            >
              <Car className="w-4 h-4 text-[#6B6B6B]" />
              <span>+ Trabajo de empresa</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="bg-[#D7141A] hover:bg-[#b01015] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer min-h-[38px]"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva empresa</span>
            </button>
          </div>
        </div>

        {/* Buscador y Filtro de Estado */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#6B6B6B]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, RUT, contacto o teléfono..."
              className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl pl-9 pr-3 py-2 text-xs text-[#161616] focus:bg-white focus:border-[#161616]"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#F5F5F4] p-1 rounded-xl text-xs border border-[#E5E5E3] w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer text-xs ${
                statusFilter === 'active' ? 'bg-white text-[#161616] shadow-2xs' : 'text-[#6B6B6B]'
              }`}
            >
              Activas ({detailingCompanies.filter((c) => c.is_active).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer text-xs ${
                statusFilter === 'inactive' ? 'bg-white text-[#161616] shadow-2xs' : 'text-[#6B6B6B]'
              }`}
            >
              Inactivas ({detailingCompanies.filter((c) => !c.is_active).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer text-xs ${
                statusFilter === 'all' ? 'bg-white text-[#161616] shadow-2xs' : 'text-[#6B6B6B]'
              }`}
            >
              Todas ({detailingCompanies.length})
            </button>
          </div>
        </div>
      </div>

      {/* 2. Grid de Tarjetas de Empresas */}
      {filteredCompanies.length === 0 ? (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-12 text-center text-xs text-[#6B6B6B] space-y-3 shadow-xs">
          <Building2 className="w-10 h-10 text-[#6B6B6B] mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-[#161616]">No se encontraron empresas</h3>
          <p>Podés registrar una nueva automotora o empresa haciendo clic en "+ Nueva empresa".</p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-2 bg-[#D7141A] text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nueva empresa</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCompanies.map((c) => {
            const m = companyMetrics[c.id] || { jobsCount: 0, billed: 0, collected: 0, pending: 0, allTimePending: 0, totalJobsCount: 0 };

            return (
              <div
                key={c.id}
                className={`bg-white border rounded-2xl p-4 shadow-xs transition-all hover:border-[#161616] flex flex-col justify-between ${
                  !c.is_active ? 'opacity-60 bg-gray-50 border-[#E5E5E3]' : 'border-[#E5E5E3]'
                }`}
              >
                <div>
                  {/* Top Bar de la Tarjeta */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#E5E5E3]">
                    <div>
                      <button
                        type="button"
                        onClick={() => setActiveCompanyForDetail(c)}
                        className="text-left group cursor-pointer"
                      >
                        <h3 className="font-bold font-display text-sm sm:text-base text-[#161616] group-hover:text-[#D7141A] transition-colors flex items-center gap-1.5">
                          <span>{c.name}</span>
                          <ChevronRight className="w-4 h-4 text-[#6B6B6B] group-hover:translate-x-0.5 transition-transform" />
                        </h3>
                      </button>
                      {c.legal_name && (
                        <p className="text-[10px] text-[#6B6B6B] truncate">{c.legal_name}</p>
                      )}
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-[#F5F5F4] text-[#161616] shrink-0">
                      {c.billing_mode === 'mensual' ? 'Mensual' : 'Por trabajo'}
                    </span>
                  </div>

                  {/* Contacto */}
                  <div className="py-2.5 space-y-1 text-xs text-[#6B6B6B]">
                    {c.contact_name && (
                      <div className="flex items-center gap-1.5 text-[#161616]">
                        <span className="font-semibold text-[11px]">Contacto:</span>
                        <span>{c.contact_name}</span>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#6B6B6B]" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                    {c.rut && (
                      <div className="text-[11px]">
                        <span>RUT: {c.rut}</span>
                      </div>
                    )}
                  </div>

                  {/* Métricas del Mes */}
                  <div className="bg-[#F5F5F4] rounded-xl p-2.5 grid grid-cols-3 gap-2 text-center my-2">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#6B6B6B] block">Autos (mes)</span>
                      <span className="font-mono font-bold text-xs text-[#161616]">{m.jobsCount}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#6B6B6B] block">Facturado</span>
                      <span className="font-mono font-bold text-xs text-[#161616]">{formatCurrency(m.billed)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#6B6B6B] block">Saldo</span>
                      <span className={`font-mono font-bold text-xs ${m.pending > 0 ? 'text-[#D7141A]' : 'text-emerald-700'}`}>
                        {formatCurrency(m.pending)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones de la Tarjeta */}
                <div className="pt-2 border-t border-[#E5E5E3] flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveCompanyForDetail(c)}
                    className="font-bold text-[#161616] hover:text-[#D7141A] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>Ver cuenta</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPreselectedCompanyId(c.id);
                        setIsJobModalOpen(true);
                      }}
                      title="Cargar trabajo para esta empresa"
                      className="p-1.5 text-[#D7141A] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(c)}
                      title="Editar empresa"
                      className="p-1.5 text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleDetailingCompanyActive(c.id)}
                      title={c.is_active ? 'Desactivar empresa' : 'Activar empresa'}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        c.is_active ? 'text-gray-400 hover:text-amber-600' : 'text-amber-600 hover:text-emerald-600'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCompany(c)}
                        disabled={m.totalJobsCount > 0}
                        title={
                          m.totalJobsCount > 0
                            ? 'No se puede eliminar porque tiene trabajos registrados (podés desactivarla)'
                            : 'Eliminar definitivamente'
                        }
                        className="p-1.5 text-gray-400 hover:text-rose-600 disabled:opacity-20 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Modal Nueva / Editar Empresa */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#E5E5E3] my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E3]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#D7141A]" />
                <h3 className="text-base font-bold font-display text-[#161616]">
                  {companyToEdit ? 'Editar Empresa' : 'Nueva Empresa'}
                </h3>
              </div>
              <button
                onClick={() => setIsCompanyModalOpen(false)}
                className="p-1.5 rounded-xl text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#161616] mb-1">
                  Nombre Comercial / Automotora <span className="text-[#D7141A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej. Automotora del Este"
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs font-bold text-[#161616] focus:bg-white focus:border-[#161616]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#161616] mb-1">
                    Razón Social (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.legal_name}
                    onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    placeholder="Ej. Automotora del Este S.A.S."
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] focus:bg-white focus:border-[#161616]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#161616] mb-1">
                    RUT (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.rut}
                    onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                    placeholder="Ej. 219999990018"
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs font-mono text-[#161616] focus:bg-white focus:border-[#161616]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#161616] mb-1">
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="Ej. Juan Pérez"
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] focus:bg-white focus:border-[#161616]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#161616] mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ej. 099 123 456"
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] focus:bg-white focus:border-[#161616]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#161616] mb-1">
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contacto@automotora.com"
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] focus:bg-white focus:border-[#161616]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#161616] mb-1">
                    Modalidad de Cobro
                  </label>
                  <select
                    value={formData.billing_mode}
                    onChange={(e) => setFormData({ ...formData, billing_mode: e.target.value as any })}
                    className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] focus:bg-white focus:border-[#161616]"
                  >
                    <option value="mensual">Cuenta mensual corriente (por defecto)</option>
                    <option value="por trabajo">Cobro por trabajo en el momento</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#161616] mb-1">
                  Dirección (opcional)
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Ej. Av. Italia 4500, Montevideo"
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] focus:bg-white focus:border-[#161616]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#161616] mb-1">
                  Notas / Observaciones
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas internas de la cuenta..."
                  className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] focus:bg-white focus:border-[#161616]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5E3]">
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#161616] hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#D7141A] hover:bg-[#b01015] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{companyToEdit ? 'Guardar Cambios' : 'Crear Empresa'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal Cargar Trabajo de Empresa */}
      {isJobModalOpen && (
        <DetailingCompanyJobModal
          isOpen={isJobModalOpen}
          onClose={() => setIsJobModalOpen(false)}
          preselectedCompanyId={preselectedCompanyId}
        />
      )}
    </div>
  );
};
