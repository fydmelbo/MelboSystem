import { useState, useMemo, useEffect, useCallback } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import ProductsTable from '../components/ProductsTable';
import ProductSearch from '../components/ProductSearch';
import Pagination from '../../../components/ui/Pagination';
import CreateProductModal from '../components/CreateProductModal';
import EditProductModal from '../components/EditProductModal';
import DeleteProductModal from '../components/DeleteProductModal';
import BulkImportModal from '../components/BulkImportModal';
import { useProducts } from '../hooks/useProducts';
import { Plus, FileSpreadsheet, Trash2 } from 'lucide-react';
import { createProduct, updateProduct, deleteProduct } from '../services/productService';
import { deleteAllProducts } from '../services/bulkImportService';
import { toast } from 'react-hot-toast';
import { Product } from '../types/Product';
import React from 'react';
import ProductTableFilters from '../components/ProductTableFilters';
import { useAuth } from '../../auth/context/AuthContext';
import { ubicacionesAPI } from '../../../lib/api';

export default function ProductsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [sortOption, setSortOption] = useState('');
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>('');
  const [ubicaciones, setUbicaciones] = useState<Array<{ _id: string; nombre: string }>>([]);

  const ubicacionFilter = isAdmin ? (selectedUbicacion || null) : undefined;
  const {
    products,
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    nameFilter,
    barcodeFilter,
    pharmaceuticalFilter,
    categoryFilter,
    setNameFilter,
    setBarcodeFilter,
    handlePageChange,
    handleItemsPerPageChange,
    handlePharmaceuticalFilterChange,
    handleCategoryFilterChange,
    refreshProducts,
  } = useProducts(ubicacionFilter);

  useEffect(() => {
    if (isAdmin) {
      ubicacionesAPI.getUbicaciones().then(setUbicaciones).catch(() => {});
    }
  }, [isAdmin]);

  const hasActiveFilters = sortOption !== '' ||
    pharmaceuticalFilter !== '' ||
    categoryFilter !== '' ||
    nameFilter !== '' ||
    barcodeFilter !== '';

  const resetSearchFilters = useCallback(() => {
    setNameFilter('');
    setBarcodeFilter('');
    handlePharmaceuticalFilterChange('');
    handleCategoryFilterChange('');
    handlePageChange(1);
  }, [setNameFilter, setBarcodeFilter, handlePharmaceuticalFilterChange, handleCategoryFilterChange, handlePageChange]);

  const handleClearFilters = () => {
    setSortOption('');
    resetSearchFilters();
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    if (pharmaceuticalFilter) {
      const needle = pharmaceuticalFilter.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
      result = result.filter(product => {
        const haystack = (product.pharmaceuticalCompany || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
        return haystack.includes(needle);
      });
    }

    // Ordenar por defecto alfabéticamente (soporta ñ y ll gracias al locale 'es')
    result.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

    // Ordenar según la opción seleccionada (si es diferente a la por defecto)
    switch (sortOption) {
      case 'name-asc':
        // Ya está ordenado por defecto
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name, 'es', { sensitivity: 'base' }));
        break;
      case 'expired': {
        result = result.filter(product => {
          if (!product.expirationDate) return false;
          const expDate = (product.expirationDate as any)?.seconds
            ? new Date((product.expirationDate as any).seconds * 1000)
            : new Date(product.expirationDate);
          return !isNaN(expDate.getTime()) && expDate < new Date();
        });
        break;
      }
      case 'near-expiry': {
        const today = new Date();
        result = result.filter(product => {
          if (!product.expirationDate) return false;
          const expDate = (product.expirationDate as any)?.seconds
            ? new Date((product.expirationDate as any).seconds * 1000)
            : new Date(product.expirationDate);
          if (isNaN(expDate.getTime())) return false;
          const monthsUntilExpiration =
            (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);
          return monthsUntilExpiration > 0 && monthsUntilExpiration <= 6;
        });
        break;
      }
      case 'low-stock':
        result = result.filter(product => (product.stock?.units ?? 0) <= 10);
        break;
    }

    return result;
  }, [products, sortOption, pharmaceuticalFilter]);

  const handleCreateProduct = async (productData: any) => {
    try {
      await createProduct(productData);
      toast.success('Producto creado exitosamente');
      setIsCreateModalOpen(false);
      resetSearchFilters();
      refreshProducts();
    } catch (error) {
      console.error('Error al crear producto:', error);
      toast.error('Error al crear el producto');
    }
  };

  const handleEditProduct = async (productId: string, productData: any) => {
    try {
      await updateProduct(productId, productData);
      toast.success('Producto actualizado exitosamente');
      setEditingProduct(null);
      resetSearchFilters();
      refreshProducts();
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      toast.error('Error al actualizar producto');
    }
  };

  const handleDeleteProduct = async (reason: string) => {
    if (!deletingProduct) return;

    try {
      await deleteProduct(deletingProduct._id, reason);
      toast.success('Producto enviado al Histórico exitosamente');
      setDeletingProduct(null);
      refreshProducts();
    } catch (error) {
      console.error('Error al enviar producto al Histórico:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
  };

  const handleDelete = (productId: string) => {
    const productToDelete = products.find(p => p._id === productId);
    if (productToDelete) {
      setDeletingProduct(productToDelete);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const result = await deleteAllProducts();
      toast.success(`Se eliminaron ${result.deleted} productos`);
      setShowDeleteAllConfirm(false);
      refreshProducts();
    } catch (error) {
      console.error('Error al eliminar todos los productos:', error);
      toast.error('Error al eliminar los productos');
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <MainLayout>
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Productos</h1>
          <div className="flex gap-2 flex-wrap">
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setShowDeleteAllConfirm(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-5 w-5" />
                <span className="hidden sm:inline">Borrar Todo</span>
              </button>
            )}
            <button
              onClick={() => setIsBulkImportOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <FileSpreadsheet className="h-5 w-5" />
              <span className="hidden sm:inline">Carga Masiva</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Nuevo Producto</span>
            </button>
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

        <ProductTableFilters
          onSortChange={(value) => {
            setSortOption(value);
            handlePageChange(1);
          }}
          onPharmaceuticalCompanyChange={handlePharmaceuticalFilterChange}
          onCategoryChange={handleCategoryFilterChange}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
          sortOption={sortOption}
          selectedCategory={categoryFilter}
        />

        <ProductSearch
          nameFilter={nameFilter}
          barcodeFilter={barcodeFilter}
          onNameFilterChange={setNameFilter}
          onBarcodeFilterChange={setBarcodeFilter}
        />

        <div className="overflow-hidden">
          <ProductsTable
            products={filteredAndSortedProducts}
            onEdit={handleEdit}
            onDelete={handleDelete}
            ubicaciones={ubicaciones}
            isAdmin={isAdmin}
          />
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>

      {isCreateModalOpen && (
        <CreateProductModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateProduct}
        />
      )}

      {isBulkImportOpen && (
        <BulkImportModal
          onClose={() => setIsBulkImportOpen(false)}
          onComplete={refreshProducts}
        />
      )}

      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSubmit={handleEditProduct}
        />
      )}

      {deletingProduct && (
        <DeleteProductModal
          productName={deletingProduct.name}
          onClose={() => setDeletingProduct(null)}
          onConfirm={handleDeleteProduct}
        />
      )}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Eliminar TODOS los productos</h2>
            <p className="text-gray-700 mb-2">
              Esta acción eliminará <strong>todos los productos</strong> de <strong>todas las ubicaciones</strong>.
            </p>
            <p className="text-red-500 font-semibold mb-6">
              Esta acción NO se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                disabled={isDeletingAll}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={isDeletingAll}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingAll ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Eliminando...
                  </>
                ) : (
                  'Sí, eliminar todo'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
