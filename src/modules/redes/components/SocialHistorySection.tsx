import React, { useState } from 'react';
import {
  History,
  CheckCircle2,
  Clock,
  Trash2,
  Copy,
  Download,
  Share2,
  Check,
  Search
} from 'lucide-react';
import { SocialMediaPostRecord, SocialMediaCategory } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';

export const SocialHistorySection: React.FC = () => {
  const { socialMediaPosts, updateSocialMediaPost, deleteSocialMediaPost } = useData();
  const { showToast } = useToast();

  const [categoryFilter, setCategoryFilter] = useState<'all' | SocialMediaCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtrado de publicaciones
  const filteredPosts = socialMediaPosts.filter((post) => {
    if (categoryFilter !== 'all' && post.category !== categoryFilter) return false;
    if (statusFilter === 'published' && !post.is_published) return false;
    if (statusFilter === 'pending' && post.is_published) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = post.item_title.toLowerCase().includes(q);
      const matchTemplate = post.template_title.toLowerCase().includes(q);
      const matchAuthor = post.created_by_name?.toLowerCase().includes(q);
      if (!matchTitle && !matchTemplate && !matchAuthor) return false;
    }
    return true;
  });

  const handleTogglePublished = (post: SocialMediaPostRecord) => {
    const nextStatus = !post.is_published;
    updateSocialMediaPost(post.id, {
      is_published: nextStatus,
      published_at: nextStatus ? new Date().toISOString() : undefined
    });
    showToast(
      nextStatus ? 'Marcado como publicado en Instagram' : 'Marcado como pendiente',
      'info'
    );
  };

  const handleCopyCaption = (post: SocialMediaPostRecord) => {
    navigator.clipboard.writeText(post.suggested_caption);
    setCopiedId(post.id);
    showToast('Texto copiado al portapapeles', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadThumbnail = (post: SocialMediaPostRecord) => {
    if (!post.thumbnail_data) return;
    const a = document.createElement('a');
    a.href = post.thumbnail_data;
    a.download = `carvlak-${post.item_title.replace(/[^a-zA-Z0-9]/g, '_')}-${post.format}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Miniatura descargada', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E5E3] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#9A9A9A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por vehículo, plantilla o autor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F5F5F4] border border-[#E5E5E3] rounded-xl pl-10 pr-4 py-2 text-xs text-[#161616] placeholder-[#9A9A9A] focus:border-[#D7141A] focus:bg-white focus:outline-none transition-colors"
          />
        </div>

        {/* Filtros de Categoría y Estado */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Categoría */}
          <div className="flex items-center bg-[#F5F5F4] p-1 rounded-xl border border-[#E5E5E3] text-xs">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-white text-[#161616] shadow-sm font-semibold'
                  : 'text-[#6B6B6B] hover:text-[#161616]'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('automotora')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                categoryFilter === 'automotora'
                  ? 'bg-white text-[#161616] shadow-sm font-semibold'
                  : 'text-[#6B6B6B] hover:text-[#161616]'
              }`}
            >
              Autos
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('detailing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                categoryFilter === 'detailing'
                  ? 'bg-white text-[#161616] shadow-sm font-semibold'
                  : 'text-[#6B6B6B] hover:text-[#161616]'
              }`}
            >
              Detailing
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('inspeccion')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                categoryFilter === 'inspeccion'
                  ? 'bg-white text-[#161616] shadow-sm font-semibold'
                  : 'text-[#6B6B6B] hover:text-[#161616]'
              }`}
            >
              Inspección
            </button>
          </div>

          {/* Estado de Publicación */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white border border-[#E5E5E3] rounded-xl px-3 py-2 text-xs text-[#161616] focus:border-[#D7141A] focus:outline-none cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="published">Publicados en Instagram</option>
            <option value="pending">Pendientes de publicación</option>
          </select>
        </div>
      </div>

      {/* Grid de Piezas Guardadas */}
      {filteredPosts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#E5E5E3] space-y-2">
          <History className="w-8 h-8 text-[#9A9A9A] mx-auto opacity-50" />
          <h3 className="text-sm font-semibold text-[#161616]">No hay publicaciones en este filtro</h3>
          <p className="text-xs text-[#6B6B6B]">
            Generá una nueva imagen desde la pestaña "Estudio creativo" para guardarla aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-[#E5E5E3] overflow-hidden flex flex-col justify-between hover:border-[#D0D0CD] transition-all shadow-sm group"
            >
              {/* Encabezado de la tarjeta */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3]">
                    {post.template_title}
                  </span>

                  <span className="text-[11px] text-[#6B6B6B] font-mono">
                    {post.format === 'story' ? 'Historia (9:16)' : 'Publicación (4:5)'}
                  </span>
                </div>

                <div className="font-semibold text-sm text-[#161616] line-clamp-1">
                  {post.item_title}
                </div>

                {/* Vista previa de miniatura */}
                <div className="relative aspect-[4/3] bg-[#F5F5F4] rounded-xl overflow-hidden border border-[#E5E5E3] flex items-center justify-center">
                  {post.thumbnail_data ? (
                    <img
                      src={post.thumbnail_data}
                      alt={post.item_title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-xs text-[#9A9A9A] flex items-center gap-1.5">
                      <Share2 className="w-4 h-4 text-[#D7141A]" />
                      <span>Sin miniatura</span>
                    </div>
                  )}

                  {/* Badge de Estado en Esquina */}
                  <button
                    type="button"
                    onClick={() => handleTogglePublished(post)}
                    className={`absolute bottom-3 left-3 px-3 py-1 rounded-xl text-[10px] font-semibold flex items-center gap-1.5 backdrop-blur-md border transition-all cursor-pointer ${
                      post.is_published
                        ? 'bg-[#EEF7F2] text-[#1E6B43] border-[#1E6B43]/30 shadow-xs'
                        : 'bg-white/95 text-[#945B0E] border-[#945B0E]/30 shadow-xs'
                    }`}
                  >
                    {post.is_published ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1E6B43]" />
                        <span>Publicado</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-[#945B0E]" />
                        <span>Pendiente</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Metadatos: Autor y Fecha */}
                <div className="flex items-center justify-between text-[11px] text-[#6B6B6B] pt-1">
                  <span>Por: {post.created_by_name || 'Admin'}</span>
                  <span>{new Date(post.created_at).toLocaleDateString('es-UY')}</span>
                </div>

                {/* Previsualización de Copy */}
                <p className="text-[11px] text-[#6B6B6B] line-clamp-2 italic bg-[#F5F5F4] p-2.5 rounded-xl border border-[#E5E5E3]">
                  "{post.suggested_caption}"
                </p>
              </div>

              {/* Botonera inferior */}
              <div className="p-3 bg-[#FAFAFA] border-t border-[#E5E5E3] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyCaption(post)}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    copiedId === post.id
                      ? 'bg-[#EEF7F2] text-[#1E6B43] border border-[#1E6B43]/30'
                      : 'bg-white hover:bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3]'
                  }`}
                >
                  {copiedId === post.id ? <Check className="w-3.5 h-3.5 text-[#1E6B43]" /> : <Copy className="w-3.5 h-3.5 text-[#D7141A]" />}
                  <span>{copiedId === post.id ? 'Copiado' : 'Copiar texto'}</span>
                </button>

                {post.thumbnail_data && (
                  <button
                    type="button"
                    onClick={() => handleDownloadThumbnail(post)}
                    title="Descargar miniatura"
                    className="p-2 rounded-xl bg-white hover:bg-[#F5F5F4] text-[#161616] border border-[#E5E5E3] cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#161616]" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => deleteSocialMediaPost(post.id)}
                  title="Eliminar registro"
                  className="p-2 rounded-xl bg-white hover:bg-[#FDF2F2] text-[#6B6B6B] hover:text-[#D7141A] border border-[#E5E5E3] hover:border-[#D7141A]/30 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
