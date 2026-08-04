import { useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '../types/Product';
import { subscribeToProducts } from '../services/productService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../features/auth/context/AuthContext';

const normalize = (s?: string | null) =>
  (s ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export function useProducts(ubicacionOverride?: string | null, filterByNeedsReview?: boolean) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [nameFilter, setNameFilter] = useState('');
  const [barcodeFilter, setBarcodeFilter] = useState('');
  const [pharmaceuticalFilter, setPharmaceuticalFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const hasReceivedInitial = useRef(false);

  const ubicacion = ubicacionOverride !== undefined ? ubicacionOverride : user?.ubicacion;

  useEffect(() => {
    setLoading(true);
    hasReceivedInitial.current = false;

    const unsubscribe = subscribeToProducts(
      ubicacion ?? undefined,
      (fetchedProducts) => {
        setProducts(fetchedProducts);
        if (!hasReceivedInitial.current) {
          hasReceivedInitial.current = true;
          setLoading(false);
        }
      },
      () => {
        toast.error('Error al cargar los productos');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [ubicacion]);

  const normalizedNameFilter = normalize(nameFilter);
  const normalizedBarcodeFilter = normalize(barcodeFilter);
  const normalizedPharmaFilter = normalize(pharmaceuticalFilter);
  const normalizedCategoryFilter = normalize(categoryFilter);

  const filteredProducts = products.filter((product) => {
    const matchesName = normalize(product.name).includes(normalizedNameFilter);
    const matchesBarcode = normalize(product.barcode).includes(normalizedBarcodeFilter);
    const matchesPharmaceutical = normalizedPharmaFilter === '' ||
      normalize(product.pharmaceuticalCompany).includes(normalizedPharmaFilter);
    const matchesCategory = normalizedCategoryFilter === '' ||
      normalize(product.category).includes(normalizedCategoryFilter);
      
    const matchesNeedsReview = filterByNeedsReview === undefined ? true : 
                               filterByNeedsReview ? product.needsReview === true : product.needsReview !== true;

    return matchesName && matchesBarcode && matchesPharmaceutical && matchesCategory && matchesNeedsReview;
  });

  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

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
    refreshProducts: () => {},
  };
}
