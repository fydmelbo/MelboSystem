import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Filter, ChevronLeft, ChevronRight, Eye, Truck, Package, CheckCircle, XCircle, Clock } from 'lucide-react';
import { TransferRecord, TransferStatus } from '../types/Transfer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TransferHistoryTableProps {
  transfers: TransferRecord[];
  onViewDetails: (transfer: TransferRecord) => void;
  onRefresh: () => void;
}

const statusConfig: Record<TransferStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pendiente: {
    label: 'Pendiente',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    icon: <Clock className="w-3 h-3" />,
  },
  recibida: {
    label: 'Recibida',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  rechazada: {
    label: 'Rechazada',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    icon: <XCircle className="w-3 h-3" />,
  },
};

const ITEMS_PER_PAGE = 8;

export default function TransferHistoryTable({
  transfers,
  onViewDetails,
  onRefresh,
}: TransferHistoryTableProps) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<TransferStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = React.useState(1);

  const normalizeText = (text: string) =>
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filtered = React.useMemo(() => {
    return transfers.filter((t) => {
      const matchesSearch =
        !search ||
        normalizeText(t.ubicacionOrigenNombre).includes(normalizeText(search)) ||
        normalizeText(t.ubicacionDestinoNombre).includes(normalizeText(search)) ||
        normalizeText(t.userName || '').includes(normalizeText(search)) ||
        t.productos.some((p) => normalizeText(p.productName).includes(normalizeText(search)));

      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [transfers, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp?.toDate?.() || new Date(timestamp);
    return format(date, "dd MMM yyyy, HH:mm", { locale: es });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por ubicación, producto o usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none transition-all bg-white"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TransferStatus | 'all')}
            className="pl-10 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none transition-all bg-white appearance-none cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="pendiente">Pendientes</option>
            <option value="recibida">Recibidas</option>
            <option value="rechazada">Rechazadas</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Truck className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Sin resultados</h3>
          <p className="text-sm text-gray-400 max-w-xs">
            {search || statusFilter !== 'all'
              ? 'No hay transferencias que coincidan con los filtros aplicados.'
              : 'Aún no se han registrado transferencias.'}
          </p>
        </motion.div>
      ) : (
        <>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Origen</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Destino</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Productos</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unidades</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence>
                    {paginated.map((transfer, index) => {
                      const cfg = statusConfig[transfer.status];
                      return (
                        <motion.tr
                          key={transfer._id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                            {formatDate(transfer.createdAt)}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md">
                              {transfer.ubicacionOrigenNombre}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                              {transfer.ubicacionDestinoNombre}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                              <Package className="w-3.5 h-3.5 text-gray-400" />
                              {transfer.totalProductos}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center text-sm font-medium text-gray-800">
                            {transfer.totalUnidades}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${cfg.color} ${cfg.bg}`}>
                              {cfg.icon}
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <button
                              onClick={() => onViewDetails(transfer)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Ver
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
