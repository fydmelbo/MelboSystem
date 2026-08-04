import React, { useState, useEffect } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import HistoricoTable from '../components/HistoricoTable';
import HistoricoUsuariosTable from '../components/HistoricoUsuariosTable';
import HistoricoUbicacionesTable from '../components/HistoricoUbicacionesTable';
import Pagination from '../../../components/ui/Pagination';
import { useHistorico } from '../hooks/useHistorico';
import { 
  downloadHistoricoExcel, 
  getHistoricoUsuarios, 
  getHistoricoUbicaciones,
  restoreProducto,
  hardDeleteProducto,
  restoreUsuario,
  hardDeleteUsuario,
  restoreUbicacion,
  hardDeleteUbicacion
} from '../services/historicoService';
import { Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

type Tab = 'productos' | 'usuarios' | 'ubicaciones';

export default function HistoricoPage() {
  const [activeTab, setActiveTab] = useState<Tab>('productos');
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);

  const {
    historicos,
    loading: loadingProductos,
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
    refreshHistoricos
  } = useHistorico();

  const loadExtras = async () => {
    setLoadingExtras(true);
    try {
      if (activeTab === 'usuarios') {
        const data = await getHistoricoUsuarios();
        setUsuarios(data);
      } else if (activeTab === 'ubicaciones') {
        const data = await getHistoricoUbicaciones();
        setUbicaciones(data);
      }
    } catch (error) {
      toast.error(`Error al cargar histórico de ${activeTab}`);
    } finally {
      setLoadingExtras(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'productos') {
      loadExtras();
    }
  }, [activeTab]);

  const handleDownloadExcel = async () => {
    try {
      await downloadHistoricoExcel();
      toast.success('Excel generado exitosamente');
    } catch (error) {
      toast.error('Error al generar el Excel');
    }
  };

  const handleRestoreProducto = async (product: any) => {
    if (!product.ubicacionId) {
      toast.error('El producto no tiene una ubicación registrada, no se puede restaurar.');
      return;
    }
    try {
      await restoreProducto(product._id, product, product.ubicacionId);
      toast.success('Producto reactivado exitosamente');
      refreshHistoricos();
    } catch (error) {
      toast.error('Error al reactivar producto');
    }
  };

  const handleHardDeleteProducto = async (id: string) => {
    if (!window.confirm('¿Eliminar producto permanentemente?')) return;
    try {
      await hardDeleteProducto(id);
      toast.success('Producto eliminado permanentemente');
      refreshHistoricos();
    } catch (error) {
      toast.error('Error al eliminar producto');
    }
  };

  const handleRestoreUsuario = async (user: any) => {
    try {
      await restoreUsuario(user._id, user);
      toast.success('Usuario reactivado exitosamente');
      loadExtras();
    } catch (error) {
      toast.error('Error al reactivar usuario');
    }
  };

  const handleHardDeleteUsuario = async (id: string) => {
    if (!window.confirm('¿Eliminar usuario permanentemente?')) return;
    try {
      await hardDeleteUsuario(id);
      toast.success('Usuario eliminado permanentemente');
      loadExtras();
    } catch (error) {
      toast.error('Error al eliminar usuario');
    }
  };

  const handleRestoreUbicacion = async (ubicacion: any) => {
    try {
      await restoreUbicacion(ubicacion._id, ubicacion);
      toast.success('Ubicación reactivada exitosamente');
      loadExtras();
    } catch (error) {
      toast.error('Error al reactivar ubicación');
    }
  };

  const handleHardDeleteUbicacion = async (id: string) => {
    if (!window.confirm('¿Eliminar ubicación permanentemente?')) return;
    try {
      await hardDeleteUbicacion(id);
      toast.success('Ubicación eliminada permanentemente');
      loadExtras();
    } catch (error) {
      toast.error('Error al eliminar ubicación');
    }
  };

  return (
    <MainLayout>
      <div className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Histórico</h1>
          {activeTab === 'productos' && (
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Download size={20} />
              <span className="hidden sm:inline">Descargar Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>
          )}
        </div>

        <div className="mb-6 flex border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('productos')}
            className={`px-3 sm:px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'productos' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Productos
          </button>
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`px-3 sm:px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'usuarios' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Usuarios
          </button>
          <button
            onClick={() => setActiveTab('ubicaciones')}
            className={`px-3 sm:px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'ubicaciones' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Ubicaciones
          </button>
        </div>

        {activeTab === 'productos' && (
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
        )}

        {(loadingProductos && activeTab === 'productos') || (loadingExtras && activeTab !== 'productos') ? (
          <div className="text-center py-4">Cargando...</div>
        ) : (
          <>
            {activeTab === 'productos' && (
              <>
                <HistoricoTable 
                  historicos={historicos} 
                  onRestore={handleRestoreProducto}
                  onHardDelete={handleHardDeleteProducto}
                />
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
            {activeTab === 'usuarios' && (
              <HistoricoUsuariosTable 
                usuarios={usuarios} 
                onRestore={handleRestoreUsuario}
                onHardDelete={handleHardDeleteUsuario}
              />
            )}
            {activeTab === 'ubicaciones' && (
              <HistoricoUbicacionesTable 
                ubicaciones={ubicaciones} 
                onRestore={handleRestoreUbicacion}
                onHardDelete={handleHardDeleteUbicacion}
              />
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}