import React, { useState, useEffect, useMemo } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import {
  Plus, Edit2, Trash2, Search, Filter, Gift, Percent, Tag,
  Calendar, Power, Hash, MapPin, Package, Sparkles,
  TrendingUp, AlertCircle, CheckCircle2, Clock, BarChart3,
} from 'lucide-react';
import {
  getPromotions, createPromotion, updatePromotion, deletePromotion,
} from '../services/promotionService';
import { Promotion } from '../types/Promotion';
import { Product } from '../../products/types/Product';
import { getProducts } from '../../products/services/productService';
import { ubicacionesAPI } from '../../../lib/api';
import { CreatePromotionModal } from '../components/CreatePromotionModal';
import { EditPromotionModal } from '../components/EditPromotionModal';
import { DeletePromotionModal } from '../components/DeletePromotionModal';
import Card, { CardContent } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

type StatusFilter = 'all' | 'active' | 'inactive' | 'vigente' | 'vencida' | 'proxima';

const formatDate = (val: Date | string | undefined | null): string => {
  if (!val) return '—';
  const d = typeof val === 'string' ? new Date(val) : val;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isVigente = (p: Promotion): boolean => {
  const now = new Date();
  const start = typeof p.startDate === 'string' ? new Date(p.startDate) : p.startDate;
  const end = typeof p.endDate === 'string' ? new Date(p.endDate) : p.endDate;
  if (!start || !end) return false;
  return start <= now && end >= now && !!p.isActive;
};

const getStatusInfo = (p: Promotion) => {
  const now = new Date();
  const start = typeof p.startDate === 'string' ? new Date(p.startDate) : p.startDate;
  const end = typeof p.endDate === 'string' ? new Date(p.endDate) : p.endDate;
  if (!p.isActive) {
    return { label: 'Inactiva', color: 'bg-gray-100 text-gray-600', icon: <Power className="w-3 h-3" /> };
  }
  if (start && start > now) {
    return { label: 'Próxima', color: 'bg-amber-100 text-amber-700', icon: <Clock className="w-3 h-3" /> };
  }
  if (end && end < now) {
    return { label: 'Vencida', color: 'bg-red-100 text-red-700', icon: <AlertCircle className="w-3 h-3" /> };
  }
  return { label: 'Vigente', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> };
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [ubicacionLabels, setUbicacionLabels] = useState<Record<string, string>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [deletingPromotion, setDeletingPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'NxM' | 'percentage' | 'fixed'>('all');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [promos, allProducts, ubicaciones] = await Promise.all([
        getPromotions(),
        getProducts().catch(() => [] as Product[]),
        ubicacionesAPI.getUbicaciones().catch(() => []),
      ]);
      setPromotions(promos);
      setProducts(allProducts);
      const labels: Record<string, string> = {};
      ubicaciones.forEach(u => { labels[u._id] = u.nombre; });
      setUbicacionLabels(labels);
    } catch (error) {
      console.error('Error al obtener promociones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreatePromotion = async (promotionData: Partial<Promotion>) => {
    try {
      await createPromotion(promotionData);
      setIsCreateModalOpen(false);
      fetchAll();
    } catch (error) {
      console.error('Error al crear promoción:', error);
    }
  };

  const handleUpdatePromotion = async (id: string, promotionData: Partial<Promotion>) => {
    try {
      await updatePromotion(id, promotionData);
      setEditingPromotion(null);
      fetchAll();
    } catch (error) {
      console.error('Error al actualizar promoción:', error);
    }
  };

  const handleDeletePromotion = async () => {
    if (!deletingPromotion) return;
    try {
      await deletePromotion(deletingPromotion._id);
      setDeletingPromotion(null);
      fetchAll();
    } catch (error) {
      console.error('Error al eliminar promoción:', error);
    }
  };

  // Construye un mapa rápido de productoId -> Product
  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    products.forEach(p => m.set(p._id, p));
    return m;
  }, [products]);

  // Stats
  const stats = useMemo(() => {
    const total = promotions.length;
    const vigentes = promotions.filter(isVigente).length;
    const inactivas = promotions.filter(p => !p.isActive).length;
    const nxm = promotions.filter(p => p.promotionType === 'NxM').length;
    return { total, vigentes, inactivas, nxm };
  }, [promotions]);

  // Filtrado
  const filtered = useMemo(() => {
    return promotions.filter(p => {
      // Búsqueda
      const term = search.trim().toLowerCase();
      if (term) {
        const haystack = [
          p.name,
          p.description,
          ...(p.products || []).map(pp => {
            const product = productMap.get(pp.productId);
            return product ? `${product.name} ${product.barcode} ${ubicacionLabels[product.location?._id] || ''}` : '';
          }),
        ].join(' ').toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      // Tipo
      if (typeFilter !== 'all' && p.promotionType !== typeFilter) return false;
      // Estado
      const now = new Date();
      const start = typeof p.startDate === 'string' ? new Date(p.startDate) : p.startDate;
      const end = typeof p.endDate === 'string' ? new Date(p.endDate) : p.endDate;
      switch (statusFilter) {
        case 'active': return p.isActive;
        case 'inactive': return !p.isActive;
        case 'vigente': return p.isActive && start && end && start <= now && end >= now;
        case 'vencida': return end && end < now;
        case 'proxima': return p.isActive && start && start > now;
        default: return true;
      }
    });
  }, [promotions, search, statusFilter, typeFilter, productMap, ubicacionLabels]);

  const getProductById = (id: string): Product | undefined => productMap.get(id);
  const getUbicacionLabel = (p: Product) => ubicacionLabels[p.location?._id] || 'Sin ubicación';

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* HEADER + STATS */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center shadow-soft">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Promociones</h1>
                  <p className="text-sm text-gray-500">Gestiona las promociones aplicadas a tus productos</p>
                </div>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Nueva Promoción
            </Button>
          </div>

          {/* Tarjetas de stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={<BarChart3 className="w-4 h-4" />}
              label="Total"
              value={stats.total}
              gradient="from-slate-500 to-slate-600"
            />
            <StatCard
              icon={<CheckCircle2 className="w-4 h-4" />}
              label="Vigentes"
              value={stats.vigentes}
              gradient="from-emerald-500 to-teal-600"
            />
            <StatCard
              icon={<Gift className="w-4 h-4" />}
              label="N x M"
              value={stats.nxm}
              gradient="from-violet-500 to-purple-600"
            />
            <StatCard
              icon={<Power className="w-4 h-4" />}
              label="Inactivas"
              value={stats.inactivas}
              gradient="from-gray-400 to-gray-500"
            />
          </div>
        </div>

        {/* FILTROS */}
        <Card>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, descripción o producto..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Tipo:</span>
                </div>
                <div className="inline-flex p-0.5 bg-gray-100 rounded-lg">
                  {[
                    { v: 'all', l: 'Todos' },
                    { v: 'NxM', l: 'N x M' },
                    { v: 'percentage', l: '%' },
                    { v: 'fixed', l: 'Q' },
                  ].map(opt => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setTypeFilter(opt.v as any)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                        typeFilter === opt.v
                          ? 'bg-white text-primary-700 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Estado:</span>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
                >
                  <option value="all">Todos</option>
                  <option value="vigente">Vigentes</option>
                  <option value="proxima">Próximas</option>
                  <option value="vencida">Vencidas</option>
                  <option value="active">Activas</option>
                  <option value="inactive">Inactivas</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LISTADO DE PROMOCIONES */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent>
              <div className="py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">
                  {search || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Sin resultados'
                    : 'Aún no hay promociones'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {search || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Intenta ajustar los filtros para encontrar lo que buscas.'
                    : 'Crea tu primera promoción y empieza a atraer más clientes.'}
                </p>
                {!search && statusFilter === 'all' && typeFilter === 'all' && (
                  <Button
                    variant="primary"
                    onClick={() => setIsCreateModalOpen(true)}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Crear Promoción
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {filtered.map((promotion, idx) => {
                const status = getStatusInfo(promotion);
                const typeBadge = getTypeBadge(promotion);
                return (
                  <motion.div
                    key={promotion._id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                  >
                    <Card hover className="h-full flex flex-col">
                      {/* Banda superior con color de tipo */}
                      <div className={`h-1.5 rounded-t-2xl bg-gradient-to-r ${typeBadge.color}`} />

                      <div className="p-5 flex-1 flex flex-col gap-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-gray-900 truncate" title={promotion.name}>
                              {promotion.name}
                            </h3>
                            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                              {promotion.description}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => setEditingPromotion(promotion)}
                              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingPromotion(promotion)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-gradient-to-r ${typeBadge.color} text-white`}>
                            {typeBadge.icon}
                            {typeBadge.label}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </div>

                        {/* Vigencia */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{formatDate(promotion.startDate)}</span>
                          <span className="text-gray-300">→</span>
                          <span>{formatDate(promotion.endDate)}</span>
                        </div>

                        {/* Productos */}
                        {promotion.products && promotion.products.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                              <Package className="w-3.5 h-3.5" />
                              {promotion.products.length} producto{promotion.products.length === 1 ? '' : 's'}
                            </div>
                            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                              {promotion.products.slice(0, 4).map(pp => {
                                const product = getProductById(pp.productId);
                                if (!product) {
                                  return (
                                    <div key={pp.productId} className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-md text-xs text-gray-500">
                                      <Package className="w-3 h-3 shrink-0" />
                                      <span className="italic">Producto no encontrado</span>
                                    </div>
                                  );
                                }
                                return (
                                  <div
                                    key={pp.productId}
                                    className="flex items-center justify-between gap-2 px-2 py-1.5 bg-gray-50 rounded-md"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <Package className="w-3 h-3 text-gray-400 shrink-0" />
                                      <span className="text-xs font-medium text-gray-800 truncate" title={product.name}>
                                        {product.name}
                                      </span>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary-700 bg-primary-50 border border-primary-100 px-1.5 py-0.5 rounded shrink-0">
                                      <MapPin className="w-2.5 h-2.5" />
                                      {getUbicacionLabel(product)}
                                    </span>
                                  </div>
                                );
                              })}
                              {promotion.products.length > 4 && (
                                <p className="text-xs text-gray-500 pl-2">
                                  + {promotion.products.length - 4} más
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Condiciones */}
                        {((promotion.conditions?.minimumPurchase ?? 0) > 0 || promotion.conditions?.maxUses) && (
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 pt-2 border-t border-gray-100">
                            {(promotion.conditions?.minimumPurchase ?? 0) > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-md">
                                <Hash className="w-3 h-3" />
                                Compra mín. <strong className="text-gray-900">Q{promotion.conditions.minimumPurchase}</strong>
                              </span>
                            )}
                            {promotion.conditions?.maxUses && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-md">
                                <TrendingUp className="w-3 h-3" />
                                <strong className="text-gray-900">{promotion.conditions.usedCount}</strong>
                                <span className="text-gray-400">/</span>
                                <strong className="text-gray-900">{promotion.conditions.maxUses}</strong> usos
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <CreatePromotionModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreatePromotion}
        />
      )}

      {editingPromotion && (
        <EditPromotionModal
          promotion={editingPromotion}
          onClose={() => setEditingPromotion(null)}
          onSubmit={handleUpdatePromotion}
        />
      )}

      {deletingPromotion && (
        <DeletePromotionModal
          promotionName={deletingPromotion.name}
          onClose={() => setDeletingPromotion(null)}
          onConfirm={handleDeletePromotion}
        />
      )}
    </MainLayout>
  );
}

// ============== HELPERS ==============
function StatCard({
  icon, label, value, gradient,
}: { icon: React.ReactNode; label: string; value: number; gradient: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
      </div>
    </div>
  );
}

function getTypeBadge(p: Promotion) {
  if (p.promotionType === 'NxM' && p.nxmConfig) {
    return {
      label: `${p.nxmConfig.buyQuantity}x${p.nxmConfig.getQuantity}`,
      color: 'from-violet-500 to-purple-600',
      icon: <Gift className="w-3 h-3" />,
    };
  }
  if (p.promotionType === 'percentage') {
    return {
      label: `${p.discountValue}% OFF`,
      color: 'from-emerald-500 to-teal-600',
      icon: <Percent className="w-3 h-3" />,
    };
  }
  return {
    label: `Q${p.discountValue} OFF`,
    color: 'from-amber-500 to-orange-600',
    icon: <Tag className="w-3 h-3" />,
  };
}
