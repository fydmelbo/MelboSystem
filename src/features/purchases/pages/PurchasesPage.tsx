import React, { useState, useEffect } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import { useAuth } from '../../auth/context/AuthContext';
import { ubicacionesAPI } from '../../../lib/api';
import { Purchase, PurchaseItem } from '../types/Purchase';
import {
  createPurchaseService,
  getPurchasesService,
  revertPurchaseService,
} from '../services/purchaseService';
import PurchaseModal from '../components/PurchaseModal';
import PurchaseList from '../components/PurchaseList';
import PurchaseDetails from '../components/PurchaseDetails';
import RevertPurchaseModal from '../components/RevertPurchaseModal';
import StockIngestModal from '../components/StockIngestModal';
import { Plus, ShoppingCart } from 'lucide-react';

export default function PurchasesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>(user?.ubicacion || '');
  const [ubicaciones, setUbicaciones] = useState<Array<{ _id: string; nombre: string }>>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [revertPurchase, setRevertPurchase] = useState<Purchase | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showStockIngest, setShowStockIngest] = useState(false);
  const [stockIngestData, setStockIngestData] = useState<{
    items: PurchaseItem[];
    ubicacion: string;
    supplier: string;
    invoiceSerie: string;
    invoiceNumber: string;
    purchaseDate?: string;
  } | null>(null);

  useEffect(() => {
    if (isAdmin) {
      ubicacionesAPI.getUbicaciones().then(setUbicaciones).catch(() => {});
    }
  }, [isAdmin]);

  const ubicacion = isAdmin ? selectedUbicacion : (user?.ubicacion || '');

  const loadPurchases = async () => {
    if (!ubicacion) return;
    setLoading(true);
    try {
      const data = await getPurchasesService(ubicacion);
      setPurchases(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, [ubicacion]);

  const handleSubmit = async (data: {
    items: PurchaseItem[];
    invoiceFile: File | null;
    supplier: string;
    supplierNit: string;
    invoiceSerie: string;
    invoiceNumber: string;
    paymentMethod: 'contado' | 'credito';
    dueDate?: string;
    transport: string;
    purchaseDate: string;
  }) => {
    if (!ubicacion) return;
    setSubmitting(true);
    try {
      await createPurchaseService(data, ubicacion);
      setShowModal(false);
      loadPurchases();
      setStockIngestData({
        items: data.items,
        ubicacion,
        supplier: data.supplier,
        invoiceSerie: data.invoiceSerie,
        invoiceNumber: data.invoiceNumber,
        purchaseDate: data.purchaseDate,
      });
      setShowStockIngest(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevert = async (reason: string) => {
    if (!revertPurchase || !ubicacion) return;
    setSubmitting(true);
    try {
      await revertPurchaseService(
        revertPurchase._id!,
        { items: revertPurchase.items, total: revertPurchase.total },
        ubicacion,
        reason
      );
      setRevertPurchase(null);
      loadPurchases();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-teal-600" />
              Compras
            </h1>
            <p className="text-sm text-gray-500 mt-1">Registro de compras a proveedores</p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && ubicaciones.length > 0 && (
              <select
                value={selectedUbicacion}
                onChange={(e) => setSelectedUbicacion(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
              >
                <option value="">Seleccionar ubicacion</option>
                {ubicaciones.map((ub) => (
                  <option key={ub._id} value={ub._id}>{ub.nombre}</option>
                ))}
              </select>
            )}

            {ubicacion && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nueva Compra
              </button>
            )}
          </div>
        </div>

        {ubicacion && (
          <>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-gray-500 mt-3">Cargando compras...</p>
              </div>
            ) : (
              <PurchaseList
                purchases={purchases}
                onViewDetails={setSelectedPurchase}
                onRevert={setRevertPurchase}
                userRole={user?.role}
              />
            )}
          </>
        )}

        {!ubicacion && isAdmin && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Seleccione una ubicacion</p>
            <p className="text-sm text-gray-400 mt-1">Elija una ubicacion para ver las compras</p>
          </div>
        )}

        {showModal && ubicacion && (
          <PurchaseModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onSubmit={handleSubmit}
            loading={submitting}
            ubicacion={ubicacion}
            userRole={user?.role}
          />
        )}

        {selectedPurchase && (
          <PurchaseDetails
            purchase={selectedPurchase}
            onClose={() => setSelectedPurchase(null)}
            onRevert={() => {
              setSelectedPurchase(null);
              setRevertPurchase(selectedPurchase);
            }}
            userRole={user?.role}
          />
        )}

        {revertPurchase && (
          <RevertPurchaseModal
            purchase={revertPurchase}
            onConfirm={handleRevert}
            onCancel={() => setRevertPurchase(null)}
            loading={submitting}
          />
        )}

        {showStockIngest && stockIngestData && (
          <StockIngestModal
            isOpen={showStockIngest}
            onClose={() => {
              setShowStockIngest(false);
              setStockIngestData(null);
            }}
            items={stockIngestData.items}
            ubicacion={stockIngestData.ubicacion}
            supplier={stockIngestData.supplier}
            invoiceSerie={stockIngestData.invoiceSerie}
            invoiceNumber={stockIngestData.invoiceNumber}
            purchaseDate={stockIngestData.purchaseDate}
          />
        )}
      </div>
    </MainLayout>
  );
}
