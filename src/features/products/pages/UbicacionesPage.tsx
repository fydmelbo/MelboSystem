import React, { useState, useEffect } from 'react';
import { ubicacionesAPI } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import MainLayout from '../../../components/layout/MainLayout';
import { Eye, Plus } from 'lucide-react';
import DeleteLocationModal from '../components/DeleteLocationModal';
import { useNavigate } from 'react-router-dom';
import Pagination from '../components/Pagination';

interface Ubicacion {
  _id: string;
  nombre: string;
  direccion: string;
  telefono: string;
}

export default function UbicacionesPage() {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUbicacion, setEditingUbicacion] = useState<Ubicacion | null>(null);
  const [deletingUbicacion, setDeletingUbicacion] = useState<Ubicacion | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadUbicaciones();
  }, []);

  const loadUbicaciones = async () => {
    try {
      const data = await ubicacionesAPI.getUbicaciones();
      setUbicaciones(data);
    } catch (error) {
      toast.error('Error al cargar ubicaciones');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await ubicacionesAPI.createUbicacion(formData);
        toast.success('Ubicación creada exitosamente');
      setModalOpen(false);
      setEditingUbicacion(null);
      setFormData({ nombre: '', direccion: '', telefono: '' });
      loadUbicaciones();
    } catch (error) {
      toast.error('Error al guardar ubicación');
    }
  };

  const handleDelete = async (id: string) => {
    const ubicacionToDelete = ubicaciones.find(u => u._id === id);
    if (ubicacionToDelete) {
      setDeletingUbicacion(ubicacionToDelete);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUbicacion) return;
    
    try {
      await ubicacionesAPI.deleteUbicacion(deletingUbicacion._id);
      toast.success('Ubicación eliminada exitosamente');
      loadUbicaciones();
      setDeletingUbicacion(null);
    } catch (error) {
      toast.error('Error al eliminar ubicación');
    }
  };

  // Nuevos estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Calcular la paginación
  const totalItems = ubicaciones.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentUbicaciones = ubicaciones.slice(startIndex, endIndex);

  // Manejadores de paginación
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return (
    <MainLayout>
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Ubicaciones</h1>
          <button
            onClick={() => {
              setModalOpen(true);
              setEditingUbicacion(null);
              setFormData({ nombre: '', direccion: '', telefono: '' });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Agregar Ubicación
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUbicaciones.map((ubicacion) => (
                <tr key={ubicacion._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{ubicacion.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{ubicacion.direccion}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{ubicacion.telefono}</td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button
                      onClick={() => navigate(`/ubicaciones/${ubicacion._id}`)}
                      className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Ver detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Componente de paginación */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              { 'Agregar'} Ubicación
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre:</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección:</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono:</label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {editingUbicacion ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de eliminación */}
      {deletingUbicacion && (
        <DeleteLocationModal
          locationName={deletingUbicacion.nombre}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingUbicacion(null)}
        />
      )}

      {/* Modal de edición/creación existente */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingUbicacion ? 'Editar' : 'Agregar'} Ubicación
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre:</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección:</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono:</label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  {editingUbicacion ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}