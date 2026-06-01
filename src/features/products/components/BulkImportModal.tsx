import { useState, useRef, useCallback } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import React from 'react';
import { parseExcelFile, importProductsToFirestore, ParsedProduct, ImportResult } from '../services/bulkImportService';
import { ubicacionesAPI } from '../../../lib/api';
import { toast } from 'react-hot-toast';

interface BulkImportModalProps {
  onClose: () => void;
  onComplete: () => void;
}

interface Ubicacion {
  _id: string;
  nombre: string;
}

type Step = 'upload' | 'preview' | 'importing' | 'done';

export default function BulkImportModal({ onClose, onComplete }: BulkImportModalProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [importCatalogs, setImportCatalogs] = useState(true);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [updateExisting, setUpdateExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar ubicaciones al montar
  React.useEffect(() => {
    const fetchUbicaciones = async () => {
      try {
        const data = await ubicacionesAPI.getUbicaciones();
        setUbicaciones(data);
        // Auto-seleccionar PETAPA si existe
        const petapa = data.find((u: Ubicacion) => u.nombre.toUpperCase().includes('PETAPA'));
        if (petapa) {
          setSelectedLocation(petapa._id);
        }
      } catch (error) {
        console.error('Error cargando ubicaciones:', error);
      }
    };
    fetchUbicaciones();
  }, []);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    setFile(selectedFile);
    setParsing(true);

    try {
      const parsed = await parseExcelFile(selectedFile);
      setParsedProducts(parsed.products);
      setCategories(parsed.categories);
      setCompanies(parsed.companies);
      
      // Filtrar hojas que no sean catálogos
      const dataSheets = parsed.sheetNames.filter(name => {
        const lowerName = name.toLowerCase();
        return lowerName !== 'listas' && lowerName !== 'lista';
      });
      setSheetNames(parsed.sheetNames);
      
      // Por defecto seleccionar hojas que digan "base de datos"
      const defaultSelected = dataSheets.filter(name => 
        name.toLowerCase().includes('base de datos') || name.toLowerCase().includes('base_de_datos')
      );
      // Si no hay ninguna con "base de datos", seleccionar todas las de datos
      setSelectedSheets(defaultSelected.length > 0 ? defaultSelected : dataSheets);

      setStep('preview');
      toast.success(`Se leyeron los datos del archivo`);
    } catch (error) {
      console.error('Error parseando archivo:', error);
      toast.error('Error al leer el archivo Excel');
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const getProductsToImport = () => {
    return parsedProducts.filter(p => selectedSheets.includes(p.sheetName));
  };

  const handleImport = async () => {
    if (!selectedLocation) {
      toast.error('Selecciona una ubicación de destino');
      return;
    }

    const productsToImport = getProductsToImport();
    if (productsToImport.length === 0) {
      toast.error('No hay productos para importar en las hojas seleccionadas');
      return;
    }

    setStep('importing');
    setProgress({ current: 0, total: productsToImport.length });

    try {
      const importResult = await importProductsToFirestore(
        productsToImport,
        selectedLocation,
        categories,
        companies,
        importCatalogs,
        updateExisting,
        (current, total) => setProgress({ current, total }),
      );
      setResult(importResult);
      setStep('done');
      
      if (importResult.errors.length === 0) {
        toast.success(`¡${importResult.imported} productos importados exitosamente!`);
      } else {
        toast(`${importResult.imported} productos importados, ${importResult.errors.length} errores`, { icon: '⚠️' });
      }
    } catch (error) {
      console.error('Error importando:', error);
      toast.error('Error durante la importación');
      setStep('preview');
    }
  };

  const handleDone = () => {
    onComplete();
    onClose();
  };

  const progressPercent = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  const toggleSheet = (sheetName: string) => {
    setSelectedSheets(prev => 
      prev.includes(sheetName)
        ? prev.filter(s => s !== sheetName)
        : [...prev, sheetName]
    );
  };

  const productsToImport = getProductsToImport();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-6 w-6 text-white" />
            <h2 className="text-xl font-bold text-white">Carga Masiva de Productos</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            disabled={step === 'importing'}
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 border-b">
          {['Archivo', 'Vista Previa', 'Importando', 'Completado'].map((label, idx) => {
            const stepMap: Step[] = ['upload', 'preview', 'importing', 'done'];
            const isActive = stepMap.indexOf(step) >= idx;
            return (
              <React.Fragment key={label}>
                {idx > 0 && <div className={`h-0.5 w-8 ${isActive ? 'bg-blue-500' : 'bg-gray-300'}`} />}
                <div className={`flex items-center gap-1.5 text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'}`}>
                    {idx + 1}
                  </div>
                  <span className="hidden sm:inline">{label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <div
                className={`w-full max-w-md border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
                  ${dragOver ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
              >
                {parsing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                    <p className="text-gray-600 font-medium">Leyendo archivo...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium mb-2">
                      Arrastra tu archivo Excel aquí
                    </p>
                    <p className="text-gray-500 text-sm mb-4">o haz clic para seleccionar</p>
                    <span className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors">
                      Seleccionar Archivo
                    </span>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                }}
              />
              <p className="text-xs text-gray-400 mt-4">Formatos soportados: .xlsx, .xls</p>
            </div>
          )}

          {/* STEP 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-6">
              {/* File info */}
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">{file?.name}</p>
                  <p className="text-sm text-green-600">
                    {productsToImport.length} productos listos para importar
                  </p>
                </div>
              </div>

              {/* Sheet Selection */}
              <div className="p-4 bg-white rounded-xl border border-gray-200">
                <h3 className="font-medium text-gray-800 mb-3">Hojas a importar:</h3>
                <div className="flex flex-wrap gap-3">
                  {sheetNames
                    .filter(name => {
                      const lower = name.toLowerCase();
                      return lower !== 'listas' && lower !== 'lista';
                    })
                    .map(sheetName => {
                      const isSelected = selectedSheets.includes(sheetName);
                      const count = parsedProducts.filter(p => p.sheetName === sheetName).length;
                      return (
                        <label 
                          key={sheetName} 
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors
                            ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSheet(sheetName)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium ${isSelected ? 'text-blue-800' : 'text-gray-700'}`}>
                              {sheetName}
                            </span>
                            <span className={`text-xs ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>
                              {count} productos
                            </span>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>

              {/* Catalogs info */}
              {(categories.length > 0 || companies.length > 0) && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <label className="flex items-center gap-2 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={importCatalogs}
                      onChange={(e) => setImportCatalogs(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="font-medium text-blue-800">Importar catálogos de la hoja LISTAS</span>
                  </label>
                  <div className="text-sm text-blue-600 flex flex-wrap gap-4">
                    {categories.length > 0 && <span>📋 {categories.length} categorías</span>}
                    {companies.length > 0 && <span>🏢 {companies.length} casas farmacéuticas</span>}
                  </div>
                </div>
              )}

              {/* Opciones Adicionales */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-amber-900">
                      Actualizar productos existentes
                    </span>
                    <span className="text-sm text-amber-700">
                      Si se encuentra un producto con el mismo Nombre, Fecha de Ingreso y Fecha de Vencimiento, se actualizarán sus datos y se reemplazará su stock con el del Excel en lugar de duplicarlo.
                    </span>
                  </div>
                </label>
              </div>

              {/* Location selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ubicación de destino
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecciona una ubicación...</option>
                  {ubicaciones.map((ub) => (
                    <option key={ub._id} value={ub._id}>{ub.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Preview table */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Vista previa (primeros 20 productos)
                </h3>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">#</th>
                        <th className="px-3 py-2 text-left font-semibold">Hoja</th>
                        <th className="px-3 py-2 text-left font-semibold">Código</th>
                        <th className="px-3 py-2 text-left font-semibold">Nombre</th>
                        <th className="px-3 py-2 text-left font-semibold">Categoría</th>
                        <th className="px-3 py-2 text-left font-semibold">Venta</th>
                        <th className="px-3 py-2 text-left font-semibold">Empaquetado</th>
                        <th className="px-3 py-2 text-right font-semibold">P. Unidad</th>
                        <th className="px-3 py-2 text-right font-semibold">P. Caja</th>
                        <th className="px-3 py-2 text-right font-semibold">Stock</th>
                        <th className="px-3 py-2 text-left font-semibold">Vencimiento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {productsToImport.slice(0, 20).map((p, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                          <td className="px-3 py-2 text-blue-600 font-medium">{p.sheetName}</td>
                          <td className="px-3 py-2 font-mono">{p.barcode || '-'}</td>
                          <td className="px-3 py-2 max-w-[200px] truncate">{p.name}</td>
                          <td className="px-3 py-2">{p.category || '-'}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1">
                              {p.sellOptions.unit && <span className="px-1 py-0.5 bg-green-100 text-green-700 rounded text-[10px]">U</span>}
                              {p.sellOptions.blister && <span className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">B</span>}
                              {p.sellOptions.box && <span className="px-1 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px]">C</span>}
                            </div>
                          </td>
                          <td className="px-3 py-2 max-w-[150px] truncate">{p.packaging.description || '-'}</td>
                          <td className="px-3 py-2 text-right">{p.prices.unit ? `Q${p.prices.unit.toFixed(2)}` : '-'}</td>
                          <td className="px-3 py-2 text-right">{p.prices.box ? `Q${p.prices.box.toFixed(2)}` : '-'}</td>
                          <td className="px-3 py-2 text-right">{p.stock.units}</td>
                          <td className="px-3 py-2">{p.expirationDate || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {productsToImport.length > 20 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    ...y {productsToImport.length - 20} productos más
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Importing */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-6" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Importando productos...</h3>
              <p className="text-gray-500 mb-6">No cierres esta ventana</p>
              
              <div className="w-full max-w-md">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{progress.current} de {progress.total}</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Done */}
          {step === 'done' && result && (
            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-6" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">¡Importación completada!</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 w-full max-w-lg">
                <div className="p-4 bg-green-50 rounded-xl text-center border border-green-200">
                  <p className="text-3xl font-bold text-green-600">{result.imported}</p>
                  <p className="text-sm text-green-700">Nuevos</p>
                </div>
                {result.updated > 0 && (
                  <div className="p-4 bg-amber-50 rounded-xl text-center border border-amber-200">
                    <p className="text-3xl font-bold text-amber-600">{result.updated}</p>
                    <p className="text-sm text-amber-700">Actualizados</p>
                  </div>
                )}
                {result.skipped > 0 && (
                  <div className="p-4 bg-gray-50 rounded-xl text-center border border-gray-200">
                    <p className="text-3xl font-bold text-gray-600">{result.skipped}</p>
                    <p className="text-sm text-gray-700">Omitidos</p>
                  </div>
                )}
                <div className="p-4 bg-red-50 rounded-xl text-center border border-red-200">
                  <p className="text-3xl font-bold text-red-600">{result.errors.length}</p>
                  <p className="text-sm text-red-700">Errores</p>
                </div>
                {result.categoriesAdded > 0 && (
                  <div className="p-4 bg-blue-50 rounded-xl text-center border border-blue-200">
                    <p className="text-3xl font-bold text-blue-600">{result.categoriesAdded}</p>
                    <p className="text-sm text-blue-700">Categorías añadidas</p>
                  </div>
                )}
                {result.companiesAdded > 0 && (
                  <div className="p-4 bg-purple-50 rounded-xl text-center border border-purple-200">
                    <p className="text-3xl font-bold text-purple-600">{result.companiesAdded}</p>
                    <p className="text-sm text-purple-700">Casas farmacéuticas</p>
                  </div>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="mt-6 w-full max-w-md max-h-40 overflow-y-auto border rounded-lg">
                  <table className="min-w-full text-xs">
                    <thead className="bg-red-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left">Fila</th>
                        <th className="px-3 py-2 text-left">Producto</th>
                        <th className="px-3 py-2 text-left">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((err, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-3 py-1">{err.row}</td>
                          <td className="px-3 py-1">{err.name}</td>
                          <td className="px-3 py-1 text-red-600">{err.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
          {step === 'preview' && (
            <>
              <button
                onClick={() => { setStep('upload'); setFile(null); setParsedProducts([]); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
              >
                ← Cambiar archivo
              </button>
              <button
                onClick={handleImport}
                disabled={!selectedLocation || productsToImport.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Importar {productsToImport.length} productos
              </button>
            </>
          )}
          {step === 'done' && (
            <div className="w-full flex justify-center">
              <button
                onClick={handleDone}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Cerrar y actualizar lista
              </button>
            </div>
          )}
          {step === 'upload' && (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
