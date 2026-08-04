import React, { useState, useEffect } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import ProductsTable from '../components/ProductsTable';
import Pagination from '../../../components/ui/Pagination';
import EditProductModal from '../components/EditProductModal';
import { useProducts } from '../hooks/useProducts';
import { updateProduct } from '../services/productService';
import { toast } from 'react-hot-toast';
import { Product } from '../types/Product';
import { useAuth } from '../../auth/context/AuthContext';
import { ubicacionesAPI } from '../../../lib/api';

export default function ReviewProductsPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>('');
  const [ubicaciones, setUbicaciones] = useState<Array<{ _id: string; nombre: string }>>([]);

  const ubicacionFilter = isAdmin ? (selectedUbicacion || null) : undefined;
  
  // Use the hook with the filterByNeedsReview set to true
  const {
    products,
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange,
    refreshProducts,
  } = useProducts(ubicacionFilter, true);

  useEffect(() => {
    if (isAdmin) {
      ubicacionesAPI.getUbicaciones().then(setUbicaciones).catch(() => {});
    }
  }, [isAdmin]);

  const handleEditProduct = async (productId: string, productData: any) => {
    try {
      await updateProduct(productId, productData);
      toast.success('Producto actualizado y revisado exitosamente');
      setEditingProduct(null);
      refreshProducts();
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      toast.error('Error al actualizar producto');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
  };

  return (
    <MainLayout>
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Revisión de Importación</h1>
            <p className="text-gray-500 text-sm mt-1">Productos importados que requieren configuración adicional (código de barras, empaquetado, opciones de venta).</p>
          </div>
        </div>

        {isAdmin && ubicaciones.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por ubicación</label>
            <select
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all bg-white min-w-[200px]"
              value={selectedUbicacion}
              onChange={(e) => {
                setSelectedUbicacion(e.target.value);
                handlePageChange(1);
              }}
            >
              <option value="">Todas las ubicaciones</option>
              {ubicaciones.map((ub) => (
                <option key={ub._id} value={ub._id}>{ub.nombre}</option>
              ))}
            </select>
          </div>
        )}

        <div className="overflow-hidden mt-4">
          <ProductsTable
            products={products}
            onEdit={handleEdit}
            onDelete={() => {}} // No deletion allowed from this view
            ubicaciones={ubicaciones}
            isAdmin={isAdmin}
          />
        </div>

        {products.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">¡Todo al día!</p>
            <p className="text-sm">No hay productos pendientes de revisión.</p>
          </div>
        )}

        {products.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSubmit={handleEditProduct}
        />
      )}
    </MainLayout>
  );
}
