import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ubicacionesAPI } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import MainLayout from '../../../components/layout/MainLayout';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import DeleteLocationModal from '../components/DeleteLocationModal';
import Pagination from '../components/Pagination';

interface Ubicacion {
  _id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  productosAsociados: Producto[];
}

interface Producto {
  _id: string;
  name: string;
  barcode: string;
  stock: {
    units: number;
    blisters: number;
    boxes: number;
  };
  prices: {
    unit: number;
    blister: number;
    box: number;
  };
}

export default function UbicacionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: ''
  });

  // Estados para la paginación de productos
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadUbicacion();
  }, [id]);

  const loadUbicacion = async () => {
    try {
      const data = await ubicacionesAPI.getUbicacionById(id!);
      setUbicacion(data);
      setFormData({
        nombre: data.nombre,
        direccion: data.direccion,
        telefono: data.telefono
      });
    } catch (error) {
      toast.error('Error al cargar la ubicación');
      navigate('/ubicaciones');
    }
  };
  console.log(ubicacion);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ubicacionesAPI.updateUbicacion(id!, formData);
      toast.success('Ubicación actualizada exitosamente');
      setIsEditing(false);
      loadUbicacion();
    } catch (error) {
      toast.error('Error al actualizar ubicación');
    }
  };

  const handleDelete = async () => {
    try {
      await ubicacionesAPI.deleteUbicacion(id!);
      toast.success('Ubicación eliminada exitosamente');
      navigate('/ubicaciones');
    } catch (error) {
      toast.error('Error al eliminar ubicación');
    }
  };

  // Calcular productos paginados
  const totalItems = ubicacion?.productosAsociados?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentProductos = ubicacion?.productosAsociados?.slice(startIndex, endIndex) || [];

  if (!ubicacion) return null;

  return (
    <MainLayout>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/ubicaciones')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Detalles de Ubicación</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Información General</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {isEditing ? (
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
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="text-lg font-medium">{ubicacion.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="text-lg font-medium">{ubicacion.direccion}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="text-lg font-medium">{ubicacion.telefono}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Estadísticas</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-500">Total de Productos</p>
                <p className="text-2xl font-bold text-blue-600">{totalItems}</p>
              </div>
              {/* Aquí puedes agregar más estadísticas */}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Productos en esta ubicación</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock (Unidades)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock (Blisters)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock (Cajas)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Blister</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Caja</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentProductos.map((producto) => (
                  <tr key={producto._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{producto.barcode}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{producto.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{producto.stock.units}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{producto.stock.blisters}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{producto.stock.boxes}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{producto.prices.unit ? `${producto.prices.unit} Q` : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{producto.prices.blister ? `${producto.prices.blister} Q` : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{producto.prices.box ? `${producto.prices.box} Q` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      </div>

      {showDeleteModal && (
        <DeleteLocationModal
          locationName={ubicacion.nombre}
          onConfirm={handleDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </MainLayout>
  );
}