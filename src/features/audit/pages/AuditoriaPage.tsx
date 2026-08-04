import React, { useState, useEffect } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import { getAuditLogs, AuditLog } from '../services/auditService';
import { toast } from 'react-hot-toast';
import { FileText } from 'lucide-react';
import Pagination from '../../../components/ui/Pagination';

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs();
      setLogs(data);
    } catch (error) {
      toast.error('Error al cargar la auditoría');
    } finally {
      setLoading(false);
    }
  };

  const totalItems = logs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREAR': return 'bg-green-100 text-green-800';
      case 'ACTUALIZAR': return 'bg-blue-100 text-blue-800';
      case 'ELIMINAR': return 'bg-red-100 text-red-800';
      case 'REACTIVAR': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-6 h-6 text-blue-700" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Registro de Auditoría</h1>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando registros...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entidad</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                          No hay registros de auditoría disponibles.
                        </td>
                      </tr>
                    ) : (
                      currentLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{log.userName || log.userEmail}</div>
                            {log.userName && <div className="text-sm text-gray-500">{log.userEmail}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.entity}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                            {log.details}
                          </td>
                          <td className="px-6 py-4 text-sm text-red-600 font-medium">
                            {log.reason || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                totalItems={totalItems}
              />
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
