import React from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import HistoricoTable from '../components/HistoricoTable';
import Pagination from '../components/Pagination';
import { useHistorico } from '../hooks/useHistorico';
import { downloadHistoricoExcel } from '../services/historicoService';
import { Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function HistoricoPage() {
  const {
    historicos,
    loading,
    currentPage,
    totalPages,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    nameFilter,
    setNameFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedTypes,
    setSelectedTypes
  } = useHistorico();

  const handleDownloadExcel = async () => {
    try {
      await downloadHistoricoExcel();
      toast.success('Excel generado exitosamente');
    } catch (error) {
      toast.error('Error al generar el Excel');
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Histórico de Productos</h1>
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Download size={20} />
            Descargar Excel
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4">Cargando...</div>
        ) : (
          <>
            <HistoricoTable historicos={historicos} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={historicos.length} 
            />
          </>
        )}
      </div>
    </MainLayout>
  );
}