import React, { useState, useEffect, useCallback } from 'react';
import { ubicacionesAPI, productsAPI } from '../../../lib/api';
import { createTransfer, executeTransfer } from '../services/transferService';
import {
  getTransferHistory,
  getIncomingTransfers,
  updateTransferStatus,
} from '../services/transferHistoryService';
import { TransferRecord } from '../types/Transfer';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  MapPin,
  Phone,
  Building2,
  Search,
  Plus,
  Minus,
  X,
  Send,
  Clock,
  CheckCircle,
  History,
  Package,
  ArrowRight,
  Inbox,
} from 'lucide-react';
import MainLayout from '../../../components/layout/MainLayout';
import Pagination from '../../../components/ui/Pagination';
import { useAuth } from '../../auth/context/AuthContext';
import TransferAnimation from './TransferAnimation';
import TransferConfirmModal from './TransferConfirmModal';
import IncomingTransfersTable from './IncomingTransfersTable';
import TransferHistoryTable from './TransferHistoryTable';
import TransferDetailsModal from './TransferDetailsModal';

interface Location {
  _id: string;
  direccion?: string;
  telefono?: string;
  nombre: string;
}

interface Product {
  _id: string;
  name: string;
  expirationDate: string;
  stock: {
    units: number;
    blisters: number;
    boxes: number;
  };
}

interface SelectedProduct {
  productId: string;
  name: string;
  quantity: number;
  saleType: 'unit' | 'blister' | 'box';
}

type Tab = 'new' | 'incoming' | 'history';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'new', label: 'Nueva Transferencia', icon: <Send className="w-4 h-4" /> },
  { id: 'incoming', label: 'Transferencias Entrantes', icon: <Inbox className="w-4 h-4" /> },
  { id: 'history', label: 'Historial', icon: <History className="w-4 h-4" /> },
];

const normalizeText = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const TransferView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // Tabs
  const [activeTab, setActiveTab] = useState<Tab>('new');

  // Locations & products
  const [locations, setLocations] = useState<Location[]>([]);
  const [sourceProducts, setSourceProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [sourceLocation, setSourceLocation] = useState<string>('');
  const [targetLocation, setTargetLocation] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Transfer flow
  const [isTransferring, setIsTransferring] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  // Incoming & history
  const [incomingTransfers, setIncomingTransfers] = useState<TransferRecord[]>([]);
  const [historyTransfers, setHistoryTransfers] = useState<TransferRecord[]>([]);
  const [isProcessingTransfer, setIsProcessingTransfer] = useState<string | null>(null);
  const [loadingIncoming, setLoadingIncoming] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Detail modal
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRecord | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filtered products by search
  const filteredProducts = React.useMemo(() => {
    if (!productSearch.trim()) return sourceProducts;
    return sourceProducts.filter((p) =>
      normalizeText(p.name).includes(normalizeText(productSearch))
    );
  }, [sourceProducts, productSearch]);

  // Pagination
  const indexOfLastProduct = currentPage * itemsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfLastProduct - itemsPerPage,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Load locations
  useEffect(() => {
    loadLocations();
  }, []);

  // Auto-select ubicacion for non-admin users
  useEffect(() => {
    if (currentUser?.role !== 'admin' && currentUser?.ubicacion) {
      const uId =
        typeof currentUser.ubicacion === 'string'
          ? currentUser.ubicacion
          : (currentUser.ubicacion as any).id;
      if (sourceLocation !== uId) {
        handleSourceLocationChange(uId);
      }
    }
  }, [currentUser]);

  // Load incoming transfers
  const loadIncoming = useCallback(async () => {
    setLoadingIncoming(true);
    try {
      if (isAdmin) {
        const data = await getIncomingTransfers();
        setIncomingTransfers(data);
      } else {
        const uId =
          typeof currentUser?.ubicacion === 'string'
            ? currentUser?.ubicacion
            : currentUser?.ubicacion
            ? (currentUser.ubicacion as any).id
            : null;
        if (!uId) return;
        const data = await getIncomingTransfers(uId);
        setIncomingTransfers(data);
      }
    } catch (error) {
      console.error('Error loading incoming transfers:', error);
    } finally {
      setLoadingIncoming(false);
    }
  }, [currentUser, isAdmin]);

  // Load history
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = isAdmin
        ? await getTransferHistory()
        : await getTransferHistory(
            typeof currentUser?.ubicacion === 'string'
              ? currentUser.ubicacion
              : currentUser?.ubicacion
              ? (currentUser.ubicacion as any).id
              : undefined
          );
      setHistoryTransfers(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [currentUser, isAdmin]);

  // Reload on tab change
  useEffect(() => {
    if (activeTab === 'incoming') loadIncoming();
    if (activeTab === 'history') loadHistory();
  }, [activeTab, loadIncoming, loadHistory]);

  const loadLocations = async () => {
    try {
      const data = await ubicacionesAPI.getUbicaciones();
      setLocations(data);
    } catch (error) {
      toast.error('Error al cargar ubicaciones');
    }
  };

  const handleSourceLocationChange = async (locationId: string) => {
    if (locationId === targetLocation) {
      toast.error('No puedes seleccionar la misma ubicación como origen y destino');
      return;
    }
    setSourceLocation(locationId);
    setProductSearch('');
    setCurrentPage(1);
    try {
      const products = await productsAPI.getProducts(locationId);
      setSourceProducts(products);
    } catch (error) {
      toast.error('Error al cargar productos de la ubicación');
    }
  };

  const handleTargetLocationChange = (locationId: string) => {
    if (locationId === sourceLocation) {
      toast.error('No puedes seleccionar la misma ubicación como origen y destino');
      return;
    }
    setTargetLocation(locationId);
  };

  const handleProductSelect = (product: Product) => {
    if (!selectedProducts.some((p) => p.productId === product._id)) {
      setSelectedProducts((prev) => [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          quantity: 1,
          saleType: 'unit',
        },
      ]);
    }
  };

  const handleQuantityChange = (productId: string, value: number) => {
    setSelectedProducts((products) =>
      products.map((p) => (p.productId === productId ? { ...p, quantity: Math.max(1, value) } : p))
    );
  };

  const handleSaleTypeChange = (productId: string, value: 'unit' | 'blister' | 'box') => {
    setSelectedProducts((products) =>
      products.map((p) => (p.productId === productId ? { ...p, saleType: value } : p))
    );
  };

  const removeSelectedProduct = (productId: string) => {
    setSelectedProducts((products) => products.filter((p) => p.productId !== productId));
  };

  const totalUnits = selectedProducts.reduce((sum, p) => {
    const product = sourceProducts.find((sp) => sp._id === p.productId);
    if (!product) return sum;
    const packaging = (product as any).packaging || {};
    if (p.saleType === 'blister') return sum + p.quantity * (packaging.unitsPerBlister || 1);
    if (p.saleType === 'box')
      return sum + p.quantity * (packaging.unitsPerBlister || 1) * (packaging.blistersPerBox || 1);
    return sum + p.quantity;
  }, 0);

  const handleTransferClick = () => {
    if (!sourceLocation || !targetLocation || selectedProducts.length === 0) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmTransfer = async () => {
    setShowConfirmModal(false);
    setIsTransferring(true);
    setShowAnimation(true);

    try {
      await createTransfer({
        ubicacionOrigenId: sourceLocation,
        ubicacionDestinoId: targetLocation,
        productos: selectedProducts.map((p) => ({
          productId: p.productId,
          quantity: p.quantity,
          saleType: p.saleType,
        })),
      });

      // Let animation play for a bit
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setShowAnimation(false);
      toast.success('Transferencia creada exitosamente. Queda pendiente de recepción.');
      setSelectedProducts([]);
      setProductSearch('');
      loadHistory();
    } catch (error) {
      setShowAnimation(false);
      toast.error('Error al crear la transferencia');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleAcceptTransfer = async (transfer: TransferRecord) => {
    if (!transfer._id) return;
    setIsProcessingTransfer(transfer._id);
    try {
      await executeTransfer(transfer._id);
      toast.success(`Transferencia de ${transfer.ubicacionOrigenNombre} recibida correctamente`);
      loadIncoming();
      loadHistory();
    } catch (error) {
      toast.error('Error al接收 la transferencia');
    } finally {
      setIsProcessingTransfer(null);
    }
  };

  const handleRejectTransfer = async (transfer: TransferRecord) => {
    if (!transfer._id) return;
    const reason = prompt('Motivo del rechazo (opcional):');
    setIsProcessingTransfer(transfer._id);
    try {
      await updateTransferStatus(transfer._id, 'rechazada', currentUser?.displayName || 'Sistema', reason || undefined);
      toast.success('Transferencia rechazada');
      loadIncoming();
      loadHistory();
    } catch (error) {
      toast.error('Error al rechazar la transferencia');
    } finally {
      setIsProcessingTransfer(null);
    }
  };

  const handleViewDetails = (transfer: TransferRecord) => {
    setSelectedTransfer(transfer);
    setShowDetailModal(true);
  };

  const getExpirationClass = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const monthsUntilExpiration =
      (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsUntilExpiration <= 0) return 'bg-red-50 border-l-2 border-red-400';
    if (monthsUntilExpiration <= 1) return 'bg-orange-50/50 border-l-2 border-orange-300';
    if (monthsUntilExpiration <= 6) return 'bg-amber-50/30 border-l-2 border-amber-200';
    return '';
  };

  const renderLocationCard = (locationId: string, type: 'source' | 'target') => {
    const location = locations.find((loc) => loc._id === locationId);
    if (!location) return null;
    const color = type === 'source' ? 'primary' : 'green';
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-2 p-3 rounded-xl bg-${color}-50/50 border border-${color}-100`}
      >
        <div className="flex items-center gap-2 text-sm">
          <Building2 size={14} className={`text-${color}-500`} />
          <span className={`font-semibold text-${color}-800`}>{location.nombre}</span>
        </div>
        {location.direccion && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 ml-5">
            <MapPin size={12} />
            <span>{location.direccion}</span>
          </div>
        )}
        {location.telefono && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 ml-5">
            <Phone size={12} />
            <span>{location.telefono}</span>
          </div>
        )}
      </motion.div>
    );
  };

  // Animation overlay
  if (showAnimation && sourceLocation && targetLocation) {
    const originName = locations.find((l) => l._id === sourceLocation)?.nombre || 'Origen';
    const destinyName = locations.find((l) => l._id === targetLocation)?.nombre || 'Destino';
    return (
      <MainLayout>
        <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-elevated p-8 w-full max-w-lg"
          >
            <TransferAnimation originName={originName} destinyName={destinyName} />
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 text-primary-600">
                <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                <span className="text-sm font-medium">Procesando transferencia...</span>
              </div>
            </div>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Transferencias</h1>
              <p className="text-sm text-gray-500">
                Gestiona el envío y recepción de productos entre ubicaciones
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const badge =
              tab.id === 'incoming' && incomingTransfers.length > 0
                ? incomingTransfers.length
                : null;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 flex-1 justify-center ${
                  isActive
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {badge !== null && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* NEW TRANSFER TAB */}
          {activeTab === 'new' && (
            <motion.div
              key="new"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-5"
            >
              {/* Location selection */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary-500" />
                  Seleccionar Ubicaciones
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Ubicación Origen
                    </label>
                    <select
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none transition-all bg-white disabled:bg-gray-50 disabled:text-gray-400"
                      onChange={(e) => handleSourceLocationChange(e.target.value)}
                      value={sourceLocation}
                      disabled={currentUser?.role !== 'admin'}
                    >
                      <option value="">Seleccionar origen...</option>
                      {locations.map((loc) => (
                        <option key={loc._id} value={loc._id}>
                          {loc.nombre}
                        </option>
                      ))}
                    </select>
                    {sourceLocation && renderLocationCard(sourceLocation, 'source')}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">
                      Ubicación Destino
                    </label>
                    <select
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none transition-all bg-white disabled:bg-gray-50 disabled:text-gray-400"
                      onChange={(e) => handleTargetLocationChange(e.target.value)}
                      value={targetLocation}
                      disabled={!sourceLocation}
                    >
                      <option value="">Seleccionar destino...</option>
                      {locations
                        .filter((loc) => loc._id !== sourceLocation)
                        .map((loc) => (
                          <option key={loc._id} value={loc._id}>
                            {loc.nombre}
                          </option>
                        ))}
                    </select>
                    {targetLocation && renderLocationCard(targetLocation, 'target')}
                  </div>
                </div>

                {/* Route visualization */}
                {sourceLocation && targetLocation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 flex items-center justify-center gap-3 py-3 bg-gray-50 rounded-xl"
                  >
                    <span className="text-sm font-semibold text-primary-700">
                      {locations.find((l) => l._id === sourceLocation)?.nombre}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-px w-8 bg-gray-300" />
                      <Truck className="w-4 h-4 text-primary-500" />
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                    </div>
                    <span className="text-sm font-semibold text-green-700">
                      {locations.find((l) => l._id === targetLocation)?.nombre}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Products table */}
              {sourceLocation && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary-500" />
                      Productos Disponibles
                      <span className="text-xs font-normal text-gray-400 normal-case">
                        ({filteredProducts.length})
                      </span>
                    </h2>

                    {/* Search */}
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none transition-all"
                      />
                      {productSearch && (
                        <button
                          onClick={() => {
                            setProductSearch('');
                            setCurrentPage(1);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-100">
                          <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Nombre
                          </th>
                          <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Stock
                          </th>
                          <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Vencimiento
                          </th>
                          <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Acción
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {currentProducts.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">
                              {productSearch
                                ? 'No se encontraron productos con ese nombre.'
                                : 'No hay productos en esta ubicación.'}
                            </td>
                          </tr>
                        ) : (
                          currentProducts.map((product) => {
                            const isSelected = selectedProducts.some(
                              (p) => p.productId === product._id
                            );
                            return (
                              <tr
                                key={product._id}
                                className={`hover:bg-gray-50/50 transition-colors ${getExpirationClass(product.expirationDate)}`}
                              >
                                <td className="px-4 py-3">
                                  <span className="text-sm font-medium text-gray-800">
                                    {product.name}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                                    <span className="bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded font-medium">
                                      {product.stock.units} u
                                    </span>
                                    <span className="text-gray-300">|</span>
                                    <span>{product.stock.blisters} bl</span>
                                    <span className="text-gray-300">|</span>
                                    <span>{product.stock.boxes} caj</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-xs text-gray-500">
                                    {new Date(product.expirationDate).toLocaleDateString('es-GT')}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => handleProductSelect(product)}
                                    disabled={isSelected}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Agregar
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {filteredProducts.length > itemsPerPage && (
                    <div className="mt-3">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredProducts.length}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={(n) => {
                          setItemsPerPage(n);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                  )}
                </motion.div>
              )}

              {/* Selected products */}
              <AnimatePresence>
                {selectedProducts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
                  >
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                      <Package className="w-4 h-4 text-green-500" />
                      Productos a Transferir
                      <span className="ml-auto text-xs font-normal text-gray-400 normal-case">
                        {selectedProducts.length} producto(s) · {totalUnits} unidades
                      </span>
                    </h2>

                    <div className="space-y-2">
                      {selectedProducts.map((product) => (
                        <motion.div
                          key={product.productId}
                          layout
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 12, scale: 0.95 }}
                          className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100"
                        >
                          <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                            {product.name}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  product.productId,
                                  product.quantity - 1
                                )
                              }
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={product.quantity}
                              onChange={(e) =>
                                handleQuantityChange(
                                  product.productId,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-14 text-center text-sm font-medium border border-gray-200 rounded-lg py-1.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none"
                            />
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  product.productId,
                                  product.quantity + 1
                                )
                              }
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <select
                            value={product.saleType}
                            onChange={(e) =>
                              handleSaleTypeChange(
                                product.productId,
                                e.target.value as any
                              )
                            }
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none bg-white"
                          >
                            <option value="unit">Unidades</option>
                            <option value="blister">Blisters</option>
                            <option value="box">Cajas</option>
                          </select>
                          <button
                            onClick={() => removeSelectedProduct(product.productId)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>

                    {/* Transfer button */}
                    <div className="mt-5">
                      <button
                        onClick={handleTransferClick}
                        disabled={
                          !sourceLocation ||
                          !targetLocation ||
                          selectedProducts.length === 0 ||
                          isTransferring
                        }
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                      >
                        <Send className="w-4 h-4" />
                        Enviar Transferencia
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* INCOMING TRANSFERS TAB */}
          {activeTab === 'incoming' && (
            <motion.div
              key="incoming"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              {loadingIncoming ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                  <p className="text-sm text-gray-500 mt-3">Cargando transferencias entrantes...</p>
                </div>
              ) : (
                <IncomingTransfersTable
                  transfers={incomingTransfers}
                  onAccept={handleAcceptTransfer}
                  onReject={handleRejectTransfer}
                  isProcessing={isProcessingTransfer}
                />
              )}
            </motion.div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
                  <p className="text-sm text-gray-500 mt-3">Cargando historial...</p>
                </div>
              ) : (
                <TransferHistoryTable
                  transfers={historyTransfers}
                  onViewDetails={handleViewDetails}
                  onRefresh={loadHistory}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirm modal */}
        <TransferConfirmModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmTransfer}
          originName={locations.find((l) => l._id === sourceLocation)?.nombre || ''}
          destinyName={locations.find((l) => l._id === targetLocation)?.nombre || ''}
          products={selectedProducts.map((p) => ({
            name: p.name,
            quantity: p.quantity,
            saleType: p.saleType,
          }))}
          totalUnits={totalUnits}
          isLoading={isTransferring}
        />

        {/* Detail modal */}
        <TransferDetailsModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          transfer={selectedTransfer}
        />
      </div>
    </MainLayout>
  );
};
