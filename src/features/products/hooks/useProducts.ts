// src/features/products/hooks/useProducts.ts
import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types/Product';
import { getProducts } from '../services/productService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../features/auth/context/AuthContext';

export function useProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [nameFilter, setNameFilter] = useState('');
  const [barcodeFilter, setBarcodeFilter] = useState('');
  const [pharmaceuticalFilter, setPharmaceuticalFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedProducts = await getProducts(user?.ubicacion);
      setProducts(fetchedProducts);
    } catch (error) {
      toast.error('Error al cargar los productos');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filtrar productos
  const filteredProducts = products.filter((product) => {
    const matchesName = product.name
      ?.toLowerCase()
      .includes(nameFilter.toLowerCase());
    const matchesBarcode = (product.barcode || '')
      .toLowerCase()
      .includes(barcodeFilter.toLowerCase());
    const matchesPharmaceutical = pharmaceuticalFilter === '' ||
      (product.pharmaceuticalCompany || '').toLowerCase()
        .includes(pharmaceuticalFilter.toLowerCase());
    const matchesCategory = categoryFilter === '' ||
      (product.category || '').toLowerCase() === categoryFilter.toLowerCase();

    return matchesName && matchesBarcode && matchesPharmaceutical && matchesCategory;
  });

  // Calcular paginación
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Asegurar que la página actual es válida cuando cambian los filtros
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handlePharmaceuticalFilterChange = (value: string) => {
    setPharmaceuticalFilter(value);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const refreshProducts = () => {
    fetchProducts();
  };

  return {
    products: currentProducts,
    loading,
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
    handlePharmaceuticalFilterChange,
    handleCategoryFilterChange,
    handlePageChange,
    handleItemsPerPageChange,
    refreshProducts,
  };
}
