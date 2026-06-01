import { useState, useMemo } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import ProductsTable from '../components/ProductsTable';
import ProductSearch from '../components/ProductSearch';
import Pagination from '../components/Pagination';
import CreateProductModal from '../components/CreateProductModal';
import EditProductModal from '../components/EditProductModal';
import DeleteProductModal from '../components/DeleteProductModal';
import BulkImportModal from '../components/BulkImportModal';
import { useProducts } from '../hooks/useProducts';
import { Plus, FileSpreadsheet } from 'lucide-react';
import { createProduct, updateProduct, deleteProduct } from '../services/productService';
import { toast } from 'react-hot-toast';
import { Product } from '../types/Product';
import React from 'react';
import ProductTableFilters from '../components/ProductTableFilters';

export default function ProductsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [sortOption, setSortOption] = useState('');
  const [pharmaceuticalCompany, setPharmaceuticalCompany] = useState('');

  const {
    products,
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    nameFilter,
    barcodeFilter,
    categoryFilter,
    setNameFilter,
    setBarcodeFilter,
    handlePageChange,
    handleItemsPerPageChange,
    handlePharmaceuticalFilterChange,
    handleCategoryFilterChange,
    refreshProducts,
  } = useProducts();

  const hasActiveFilters = sortOption !== '' ||
    pharmaceuticalCompany !== '' ||
    categoryFilter !== '';

  const handleClearFilters = () => {
    setSortOption('');
    setPharmaceuticalCompany('');
    handleCategoryFilterChange('');
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filtrar por casa farmacéutica
    if (pharmaceuticalCompany) {
      result = result.filter(product =>
        (product.pharmaceuticalCompany || '').toLowerCase().includes(pharmaceuticalCompany.toLowerCase())
      );
    }

    // Ordenar según la opción seleccionada
    switch (sortOption) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
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
  }, [products, sortOption, pharmaceuticalCompany]);

  const handleCreateProduct = async (productData: any) => {
    try {
      await createProduct(productData);
      toast.success('Producto creado exitosamente');
      setIsCreateModalOpen(false);
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
      refreshProducts();
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      toast.error('Error al actualizar el producto');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;

    try {
      await deleteProduct(deletingProduct._id);
      toast.success('Producto eliminado exitosamente');
      setDeletingProduct(null);
      refreshProducts();
    } catch (error) {
      console.error('Error al eliminar producto:', error);
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

  return (
    <MainLayout>
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsBulkImportOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <FileSpreadsheet className="h-5 w-5" />
              <span className="hidden sm:inline">Carga Masiva</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Nuevo Producto</span>
            </button>
          </div>
        </div>

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
    </MainLayout>
  );
}
