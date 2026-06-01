import { useState, useEffect } from 'react';
import { HistoricoProducto } from '../types/HistoricoProducto';
import { getHistoricoProductos } from '../services/historicoService';
import { toast } from 'react-hot-toast';

export function useHistorico() {
  const [historicos, setHistoricos] = useState<HistoricoProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [nameFilter, setNameFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const fetchHistoricos = async () => {
    try {
      setLoading(true);
      const data = await getHistoricoProductos(
        startDate,
        endDate,
        nameFilter,
        selectedTypes.join(',')
      );
      setHistoricos(data);
    } catch (error) {
      toast.error('Error al cargar el histórico de productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricos();
  }, [startDate, endDate, nameFilter, selectedTypes]);

  // Paginación
  const totalItems = historicos.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedHistoricos = historicos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return {
    historicos: paginatedHistoricos,
    loading,
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    nameFilter,
    startDate,
    endDate,
    selectedTypes,
    setNameFilter,
    setStartDate,
    setEndDate,
    setSelectedTypes,
    setCurrentPage,
    setItemsPerPage,
    refreshHistoricos: fetchHistoricos
  };
}