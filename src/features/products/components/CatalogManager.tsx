import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DeleteCatalogModal from './DeleteCatalogModal';

interface CatalogItem {
  _id: string;
  name: string;
}

interface CatalogManagerProps {
  title: string;
  entityLabel: string;
  items: CatalogItem[];
  loading: boolean;
  onAdd: (name: string) => Promise<void>;
  onUpdate: (id: string, name: string) => Promise<void>;
  onDelete: (id: string, reason: string) => Promise<void>;
  onRefresh: () => void;
}

export default function CatalogManager({
  title,
  entityLabel,
  items,
  loading,
  onAdd,
  onUpdate,
  onDelete,
  onRefresh,
}: CatalogManagerProps) {
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingItem, setDeletingItem] = useState<CatalogItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error('Ingresa un nombre');
      return;
    }
    setIsSubmitting(true);
    try {
      await onAdd(newName.trim());
      setNewName('');
      setIsAdding(false);
      toast.success(`${entityLabel} creada exitosamente`);
      onRefresh();
    } catch (error) {
      // Error ya manejado en el servicio
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: CatalogItem) => {
    setEditingId(item._id);
    setEditingName(item.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }
    setIsSubmitting(true);
    try {
      await onUpdate(id, editingName.trim());
      setEditingId(null);
      setEditingName('');
      toast.success(`${entityLabel} actualizada exitosamente`);
      onRefresh();
    } catch (error) {
      // Error ya manejado en el servicio
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async (reason: string) => {
    if (!deletingItem) return;
    setIsSubmitting(true);
    try {
      await onDelete(deletingItem._id, reason);
      setDeletingItem(null);
      toast.success(`${entityLabel} eliminada exitosamente`);
      onRefresh();
    } catch (error) {
      // Error ya manejado en el servicio
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>

      {isAdding && (
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') { setIsAdding(false); setNewName(''); }
            }}
            placeholder={`Nombre de la ${entityLabel.toLowerCase()}`}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            autoFocus
          />
          <button
            onClick={handleAdd}
            disabled={isSubmitting}
            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </button>
          <button
            onClick={() => { setIsAdding(false); setNewName(''); }}
            className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No hay registros disponibles</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    {editingId === item._id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(item._id);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        autoFocus
                      />
                    ) : (
                      <span className="text-gray-900 text-sm break-words">{item.name}</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right space-x-2">
                    {editingId === item._id ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(item._id)}
                          disabled={isSubmitting}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          <Check className="h-4 w-4 inline" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <X className="h-4 w-4 inline" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Pencil className="h-4 w-4 inline" />
                        </button>
                        <button
                          onClick={() => setDeletingItem(item)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4 inline" />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        Total: {items.length} registros
      </div>

      {deletingItem && (
        <DeleteCatalogModal
          itemName={deletingItem.name}
          entityLabel={entityLabel}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeletingItem(null)}
        />
      )}
    </div>
  );
}
