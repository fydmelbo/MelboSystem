import React, { useState, useEffect, useCallback } from 'react';
import { Package, Check, Edit, Loader2 } from 'lucide-react';
import BaseModal from '../../../components/ui/BaseModal';
import Button from '../../../components/ui/Button';
import CreateProductModal from '../../products/components/CreateProductModal';
import { getProducts } from '../../products/services/productService';
import { createProduct } from '../../products/services/productService';
import { PurchaseItem } from '../types/Purchase';
import { Product } from '../../products/types/Product';

interface StockIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PurchaseItem[];
  ubicacion: string;
  supplier: string;
  invoiceSerie: string;
  invoiceNumber: string;
  purchaseDate?: string;
}

interface ProductRow {
  item: PurchaseItem;
  existingProduct: Product | null;
  saved: boolean;
  saving: boolean;
}

export default function StockIngestModal({
  isOpen,
  onClose,
  items,
  ubicacion,
  supplier,
  invoiceSerie,
  invoiceNumber,
  purchaseDate,
}: StockIngestModalProps) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [allSaved, setAllSaved] = useState(false);

  useEffect(() => {
    if (!isOpen || !ubicacion) return;
    setLoading(true);
    getProducts(ubicacion)
      .then((existingProducts) => {
        const rows: ProductRow[] = items.map((item) => {
          let match: Product | null = null;
          if (item.productId) {
            match = existingProducts.find((p) => p._id === item.productId) || null;
          }
          if (!match) {
            match = existingProducts.find(
              (p) => p.name?.toLowerCase() === item.name.toLowerCase()
            ) || null;
          }
          return { item, existingProduct: match, saved: false, saving: false };
        });
        setProducts(rows);
        setAllSaved(rows.length === 0);
      })
      .catch(() => {
        const rows: ProductRow[] = items.map((item) => ({
          item,
          existingProduct: null,
          saved: false,
          saving: false,
        }));
        setProducts(rows);
      })
      .finally(() => setLoading(false));
  }, [isOpen, ubicacion, items]);

  useEffect(() => {
    if (products.length > 0) {
      setAllSaved(products.every((p) => p.saved));
    }
  }, [products]);

  const handleSaveProduct = useCallback(
    async (index: number, productData: any) => {
      setProducts((prev) =>
        prev.map((p, i) => (i === index ? { ...p, saving: true } : p))
      );
      try {
        await createProduct({ ...productData, location: { _id: ubicacion } });
        setProducts((prev) =>
          prev.map((p, i) =>
            i === index ? { ...p, saved: true, saving: false } : p
          )
        );
        setEditingIndex(null);
      } catch {
        setProducts((prev) =>
          prev.map((p, i) => (i === index ? { ...p, saving: false } : p))
        );
      }
    },
    [ubicacion]
  );

  const buildInitialData = (row: ProductRow): any => {
    const base: any = {
      name: row.item.name,
      purchasePrices: { unit: row.item.costPerUnit },
      stock: { units: row.item.quantity, blisters: 0, boxes: 0, initial: row.item.quantity },
      invoice: [invoiceSerie, invoiceNumber].filter(Boolean).join('-') || '',
      paymentType: 'excento',
      location: ubicacion,
      entryDate: purchaseDate || new Date().toISOString().split('T')[0],
      expirationDate: '',
      profitMargin: 0,
    };
    if (row.existingProduct) {
      const ep = row.existingProduct;
      base.category = ep.category || '';
      base.pharmaceuticalCompany = ep.pharmaceuticalCompany || '';
      base.packaging = {
        unitsPerBlister: ep.packaging?.unitsPerBlister || 0,
        blistersPerBox: ep.packaging?.blistersPerBox || 0,
        unitsPerBox: ep.packaging?.unitsPerBox || 0,
        description: ep.packaging?.description || '',
      };
      base.sellOptions = ep.sellOptions || { unit: true, blister: false, box: false };
      base.prices = ep.prices || {};
      base.barcode = ep.barcode || '';
      if (ep.expirationDate) base.expirationDate = ep.expirationDate;
    } else {
      base.sellOptions = { unit: true, blister: false, box: false };
      base.prices = {};
      base.packaging = { unitsPerBlister: 0, blistersPerBox: 0, unitsPerBox: 0, description: '' };
    }
    return base;
  };

  const savedCount = products.filter((p) => p.saved).length;
  const totalCount = products.length;

  const footer = (
    <div className="flex items-center justify-between w-full">
      <span className="text-sm text-gray-500">
        {savedCount}/{totalCount} productos ingresados
      </span>
      <Button
        type="button"
        variant={allSaved ? 'primary' : 'outline'}
        onClick={onClose}
      >
        {allSaved ? 'Cerrar' : 'Cerrar sin guardar todos'}
      </Button>
    </div>
  );

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Ingreso al Inventario"
        size="2xl"
        footer={footer}
      >
        <div className="py-2">
          <p className="text-sm text-gray-500 mb-4">
            Los productos de la compra deben ser ingresados al inventario.
            Puede editar los datos antes de guardar cada uno.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
              <span className="ml-2 text-sm text-gray-500">Cargando inventario...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((row, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    row.saved
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:border-teal-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        row.saved ? 'bg-green-100' : 'bg-teal-50'
                      }`}
                    >
                      {row.saved ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Package className="w-5 h-5 text-teal-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{row.item.name}</p>
                      <p className="text-sm text-gray-500">
                        Cant: {row.item.quantity} — Costo: Q{row.item.costPerUnit.toFixed(2)}
                        {row.existingProduct && (
                          <span className="ml-2 text-xs text-blue-600">(en inventario)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {row.saved ? (
                      <span className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                        Guardado ✓
                      </span>
                    ) : (
                      <button
                        onClick={() => setEditingIndex(index)}
                        disabled={row.saving}
                        className="px-3 py-1.5 text-sm font-medium text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {row.saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Edit className="w-4 h-4" />
                        )}
                        {row.saving ? 'Guardando...' : 'Editar'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </BaseModal>

      {editingIndex !== null && products[editingIndex] && (
        <CreateProductModal
          onClose={() => setEditingIndex(null)}
          onSubmit={(data) => handleSaveProduct(editingIndex, data)}
          initialData={buildInitialData(products[editingIndex])}
        />
      )}
    </>
  );
}
