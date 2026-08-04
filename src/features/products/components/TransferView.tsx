import React, { useState, useEffect } from 'react';
import { ubicacionesAPI, productsAPI } from '../../../lib/api';
import { transferProducts } from '../services/transferService';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, MapPin, Phone, Building2 } from 'lucide-react';
import MainLayout from '../../../components/layout/MainLayout'; 
import Pagination from '../../../components/ui/Pagination';
import { useAuth } from '../../auth/context/AuthContext';

interface Location {
  _id: string;
  direccion?: string;
  telefono?: string;
  products?: Product[];
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

export const TransferView: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [sourceProducts, setSourceProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  const [sourceLocation, setSourceLocation] = useState<string>('');
  const [targetLocation, setTargetLocation] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { user: currentUser } = useAuth();

  // Calcular productos paginados
  const indexOfLastProduct = currentPage * itemsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - itemsPerPage;
  const currentProducts = sourceProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(sourceProducts.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      const data = await ubicacionesAPI.getUbicaciones();
      setLocations(data);
    } catch (error) {
      toast.error('Error al cargar ubicaciones');
    }
  };

  useEffect(() => {
    if (currentUser?.role !== 'admin' && currentUser?.ubicacion) {
      const uId = typeof currentUser.ubicacion === 'string' 
        ? currentUser.ubicacion 
        : (currentUser.ubicacion as any).id;
      // Preseleccionar y cargar los productos de su ubicación
      if (sourceLocation !== uId) {
        handleSourceLocationChange(uId);
      }
    }
  }, [currentUser]);

  const handleSourceLocationChange = async (locationId: string) => {
    if (locationId === targetLocation) {
      toast.error('No puedes seleccionar la misma ubicación como origen y destino');
      return;
    }
    setSourceLocation(locationId);
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
    if (!selectedProducts.some(p => p.productId === product._id)) {
      const newProduct: SelectedProduct = {
        productId: product._id,
        name: product.name,
        quantity: 1,
        saleType: 'unit'
      };
      
      setSelectedProducts(prevProducts => {
        const updatedProducts = [...prevProducts, newProduct];
        return updatedProducts;
      });
    }
  };

  const handleQuantityChange = (productId: string, value: number) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.productId === productId ? { ...p, quantity: value } : p
    ));
  };

  const handleSaleTypeChange = (productId: string, value: 'unit' | 'blister' | 'box') => {
    setSelectedProducts(selectedProducts.map(p => 
      p.productId === productId ? { ...p, saleType: value } : p
    ));
  };

  const handleTransfer = async () => {
    if (!sourceLocation || !targetLocation || selectedProducts.length === 0) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      setIsTransferring(true);
      await transferProducts({
        ubicacionOrigenId: sourceLocation,
        ubicacionDestinoId: targetLocation,
        productos: selectedProducts.map(p => ({
          productId: p.productId,
          quantity: p.quantity,
          saleType: p.saleType
        }))
      });
      toast.success('Transferencia realizada con éxito');
      setSelectedProducts([]);
    } catch (error) {
      toast.error('Error al realizar la transferencia');
    } finally {
      setIsTransferring(false);
    }
  };

  const getExpirationClass = (expirationDate: string) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const monthsUntilExpiration = (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
    if (monthsUntilExpiration <= 0) return 'bg-red-100';
    if (monthsUntilExpiration <= 1) return 'bg-red-50';
    if (monthsUntilExpiration <= 6) return 'bg-yellow-50';
    return '';
  };

  const renderLocationInfo = (locationId: string) => {
    const location = locations.find(loc => loc._id === locationId);
    if (!location) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 p-3 bg-gray-50 rounded-md text-sm"
      >
        <div className="flex items-center gap-2 text-gray-600 mb-1">
          <Building2 size={16} />
          <span>{location.nombre}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 mb-1">
          <MapPin size={16} />
          <span>{location.direccion}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Phone size={16} />
          <span>{location.telefono}</span>
        </div>
      </motion.div>
    );
  };

  // Modificar la sección de productos disponibles para usar una tabla
  return (
    <MainLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Transferencia de Productos</h1>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Selección de Ubicaciones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  onChange={(e) => handleSourceLocationChange(e.target.value)}
                  value={sourceLocation}
                  disabled={currentUser?.role !== 'admin'}
                >
                  <option value="">Seleccione ubicación origen</option>
                  {locations.map(loc => (
                    <option key={loc._id} value={loc._id}>
                      {loc.nombre} - {loc.direccion}
                    </option>
                  ))}
                </select>
                {sourceLocation && renderLocationInfo(sourceLocation)}
              </div>
              
              <div>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => handleTargetLocationChange(e.target.value)}
                  value={targetLocation}
                  disabled={!sourceLocation}
                >
                  <option value="">Seleccione ubicación destino</option>
                  {locations
                    .filter(loc => loc._id !== sourceLocation)
                    .map(loc => (
                      <option key={loc._id} value={loc._id}>
                        {loc.nombre} - {loc.direccion}
                      </option>
                    ))}
                </select>
                {targetLocation && renderLocationInfo(targetLocation)}
              </div>
            </div>
          </div>

          {sourceLocation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow p-6"
            >
              <h2 className="text-xl font-semibold mb-4">Productos Disponibles</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentProducts.map(product => (
                      <tr key={product._id} className={getExpirationClass(product.expirationDate)}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            <div>{product.stock.units} unidades</div>
                            <div>{product.stock.blisters} blisters</div>
                            <div>{product.stock.boxes} cajas</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {new Date(product.expirationDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleProductSelect(product)}
                            disabled={selectedProducts.some(p => p.productId === product._id)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium shadow-sm"
                          >
                            Agregar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={sourceProducts.length}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                />
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {selectedProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <h2 className="text-xl font-semibold mb-4">Productos a Transferir</h2>
                <div className="space-y-4">
                  {selectedProducts.map(product => (
                    <motion.div
                      key={product.productId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <span className="flex-grow">{product.name}</span>
                      <input
                        type="number"
                        min="1"
                        value={product.quantity}
                        onChange={(e) => handleQuantityChange(product.productId, parseInt(e.target.value) || 0)}
                        className="w-24 p-2 border border-gray-300 rounded-md"
                      />
                      <select
                        value={product.saleType}
                        onChange={(e) => handleSaleTypeChange(product.productId, e.target.value as any)}
                        className="p-2 border border-gray-300 rounded-md"
                      >
                        <option value="unit">Unidades</option>
                        <option value="blister">Blisters</option>
                        <option value="box">Cajas</option>
                      </select>
                      <button
                        onClick={() => setSelectedProducts(products => products.filter(p => p.productId !== product.productId))}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isTransferring ? (
            <div className="flex justify-center items-center p-8">
              <motion.div
                animate={{
                  x: [-100, 100],
                  transition: {
                    repeat: Infinity,
                    duration: 2
                  }
                }}
                className="text-blue-600"
              >
                <Truck size={48} />
              </motion.div>
            </div>
          ) : (
            <button
              onClick={handleTransfer}
              disabled={!sourceLocation || !targetLocation || selectedProducts.length === 0 }
              className="w-full py-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-semibold text-lg shadow-md"
            >
              Realizar Transferencia
            </button>
          )}
        </div>
      </div>
    </MainLayout>
  );
};