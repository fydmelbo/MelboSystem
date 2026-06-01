import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import React from 'react';
import { ubicacionesAPI } from '../../../lib/api';
import { useAuth } from '../../auth/context/AuthContext';
import { getCategories, getPharmaceuticalCompanies, Category, PharmaceuticalCompany } from '../services/catalogService';

interface CreateProductModalProps {
  onClose: () => void;
  onSubmit: (productData: any) => void;
}

interface Ubicacion {
  _id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
}

export default function CreateProductModal({ onClose, onSubmit }: CreateProductModalProps) {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pharmaCompanies, setPharmaCompanies] = useState<PharmaceuticalCompany[]>([]);
  const { user: currentUser } = useAuth();

  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: '',
    expirationDate: '',
    entryDate: '',
    pharmaceuticalCompany: '',
    paymentType: 'excento',
    invoice: '',
    profitMargin: '',
    prices: {
      unit: '',
      blister: '',
      box: ''
    },
    purchasePrices: {
      unit: '',
      blister: '',
      box: ''
    },
    stock: {
      units: '',
      blisters: '',
      boxes: '',
      initial: ''
    },
    packaging: {
      unitsPerBlister: '',
      blistersPerBox: '',
      description: ''
    },
    sellOptions: {
      unit: true,
      blister: false,
      box: false
    },
    location: ''
  });

  useEffect(() => {
    if (currentUser?.role !== 'admin' && currentUser?.ubicacion) {
      const uId = typeof currentUser.ubicacion === 'string'
        ? currentUser.ubicacion
        : (currentUser.ubicacion as any).id;
      setFormData(prev => ({ ...prev, location: uId }));
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ubicacionesData, categoriesData, companiesData] = await Promise.all([
          ubicacionesAPI.getUbicaciones(),
          getCategories(),
          getPharmaceuticalCompanies(),
        ]);
        setUbicaciones(ubicacionesData);
        setCategories(categoriesData);
        setPharmaCompanies(companiesData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const processedData = {
      ...formData,
      prices: {
        unit: formData.prices.unit ? Number(formData.prices.unit) : undefined,
        blister: formData.prices.blister ? Number(formData.prices.blister) : undefined,
        box: formData.prices.box ? Number(formData.prices.box) : undefined
      },
      purchasePrices: {
        unit: formData.purchasePrices.unit ? Number(formData.purchasePrices.unit) : 0,
        blister: formData.purchasePrices.blister ? Number(formData.purchasePrices.blister) : 0,
        box: formData.purchasePrices.box ? Number(formData.purchasePrices.box) : 0
      },
      stock: {
        units: Number(formData.stock.units) || 0,
        blisters: Number(formData.stock.blisters) || 0,
        boxes: Number(formData.stock.boxes) || 0,
        initial: Number(formData.stock.initial) || 0
      },
      packaging: {
        unitsPerBlister: Number(formData.packaging.unitsPerBlister) || 0,
        blistersPerBox: Number(formData.packaging.blistersPerBox) || 0,
        description: formData.packaging.description
      },
      profitMargin: formData.profitMargin ? Number(formData.profitMargin) : 0,
      totalSales: 0,
    };

    onSubmit(processedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Crear Nuevo Producto</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Código de Barras</label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Categoría y Casa Farmacéutica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Categoría</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Selecciona una categoría...</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Casa Farmacéutica</label>
              <select
                value={formData.pharmaceuticalCompany}
                onChange={(e) => setFormData({ ...formData, pharmaceuticalCompany: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Selecciona una casa farmacéutica...</option>
                {pharmaCompanies.map((comp) => (
                  <option key={comp._id} value={comp.name}>{comp.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Opciones de venta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Opciones de Venta</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.sellOptions.unit}
                  onChange={(e) => setFormData({
                    ...formData,
                    sellOptions: { ...formData.sellOptions, unit: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2">Unidad</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.sellOptions.blister}
                  onChange={(e) => setFormData({
                    ...formData,
                    sellOptions: { ...formData.sellOptions, blister: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2">Blister</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.sellOptions.box}
                  onChange={(e) => setFormData({
                    ...formData,
                    sellOptions: { ...formData.sellOptions, box: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <span className="ml-2">Caja</span>
              </label>
            </div>
          </div>

          {/* Distribución / Empaquetado */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Distribución / Empaquetado</label>
            <input
              type="text"
              value={formData.packaging.description}
              onChange={(e) => setFormData({
                ...formData,
                packaging: { ...formData.packaging, description: e.target.value }
              })}
              placeholder="Ej: Frasco x 100 mL, Blister x 10/Unidad"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Precios de venta */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Precios de Venta</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formData.sellOptions.unit && (
                <div>
                  <label className="block text-sm text-gray-600">Precio por Unidad</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.prices.unit}
                    onChange={(e) => setFormData({
                      ...formData,
                      prices: { ...formData.prices, unit: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
              {formData.sellOptions.blister && (
                <div>
                  <label className="block text-sm text-gray-600">Precio por Blister</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.prices.blister}
                    onChange={(e) => setFormData({
                      ...formData,
                      prices: { ...formData.prices, blister: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
              {formData.sellOptions.box && (
                <div>
                  <label className="block text-sm text-gray-600">Precio por Caja</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.prices.box}
                    onChange={(e) => setFormData({
                      ...formData,
                      prices: { ...formData.prices, box: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Precios de compra */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Precios de Compra (Costos)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600">Costo Unitario</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchasePrices.unit}
                  onChange={(e) => setFormData({
                    ...formData,
                    purchasePrices: { ...formData.purchasePrices, unit: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Costo por Blister</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchasePrices.blister}
                  onChange={(e) => setFormData({
                    ...formData,
                    purchasePrices: { ...formData.purchasePrices, blister: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Costo por Caja</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchasePrices.box}
                  onChange={(e) => setFormData({
                    ...formData,
                    purchasePrices: { ...formData.purchasePrices, box: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* % Ganancia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">% Ganancia</label>
              <input
                type="number"
                step="0.01"
                value={formData.profitMargin}
                onChange={(e) => setFormData({ ...formData, profitMargin: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">No. Factura</label>
              <input
                type="text"
                value={formData.invoice}
                onChange={(e) => setFormData({ ...formData, invoice: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Stock */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Stock</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-600">Stock Inicial</label>
                <input
                  type="number"
                  value={formData.stock.initial}
                  onChange={(e) => setFormData({
                    ...formData,
                    stock: { ...formData.stock, initial: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              {formData.sellOptions.unit && (
                <div>
                  <label className="block text-sm text-gray-600">Unidades</label>
                  <input
                    type="number"
                    value={formData.stock.units}
                    onChange={(e) => setFormData({
                      ...formData,
                      stock: { ...formData.stock, units: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
              {formData.sellOptions.blister && (
                <div>
                  <label className="block text-sm text-gray-600">Blisters</label>
                  <input
                    type="number"
                    value={formData.stock.blisters}
                    onChange={(e) => setFormData({
                      ...formData,
                      stock: { ...formData.stock, blisters: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
              {formData.sellOptions.box && (
                <div>
                  <label className="block text-sm text-gray-600">Cajas</label>
                  <input
                    type="number"
                    value={formData.stock.boxes}
                    onChange={(e) => setFormData({
                      ...formData,
                      stock: { ...formData.stock, boxes: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Empaquetado */}
          {(formData.sellOptions.blister || formData.sellOptions.box) && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Conversión de Empaquetado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.sellOptions.blister && (
                  <div>
                    <label className="block text-sm text-gray-600">Unidades por Blister</label>
                    <input
                      type="number"
                      value={formData.packaging.unitsPerBlister}
                      onChange={(e) => setFormData({
                        ...formData,
                        packaging: { ...formData.packaging, unitsPerBlister: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                )}
                {formData.sellOptions.box && (
                  <div>
                    <label className="block text-sm text-gray-600">Blisters por Caja</label>
                    <input
                      type="number"
                      value={formData.packaging.blistersPerBox}
                      onChange={(e) => setFormData({
                        ...formData,
                        packaging: { ...formData.packaging, blistersPerBox: e.target.value }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Ingreso</label>
              <input
                type="date"
                value={formData.entryDate}
                onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Vencimiento</label>
              <input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          </div>

          {/* Tipo de Pago (G/E) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Pago (G/E)</label>
              <select
                value={formData.paymentType}
                onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="excento">Excento</option>
                <option value="gravado">Gravado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ubicación</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                disabled={currentUser?.role !== 'admin'}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">Seleccione una ubicación...</option>
                {ubicaciones.map((ubicacion) => (
                  <option key={ubicacion._id} value={ubicacion._id}>
                    {ubicacion.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Crear Producto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
