import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image } from 'lucide-react';

interface InvoiceUploaderProps {
  onFileSelect: (file: File | null) => void;
  currentUrl?: string | null;
}

export default function InvoiceUploader({ onFileSelect, currentUrl }: InvoiceUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)|application\/pdf/)) {
      alert('Solo se permiten imágenes (JPG, PNG, WebP) o PDF');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo no puede exceder 10MB');
      return;
    }

    setFileName(file.name);
    onFileSelect(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setFileName('');
    onFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isPdf = fileName.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Factura (imagen o PDF)</label>

      {preview || fileName ? (
        <div className="relative rounded-xl border border-gray-200 overflow-hidden">
          {preview && !isPdf ? (
            <img src={preview} alt="Vista previa" className="w-full h-48 object-contain bg-gray-50" />
          ) : (
            <div className="flex items-center gap-3 p-4 bg-gray-50">
              <FileText className="h-8 w-8 text-red-500" />
              <span className="text-sm text-gray-700 truncate">{fileName}</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            isDragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }`}
        >
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600">Arrastra un archivo o haz clic para seleccionar</p>
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP o PDF (max 10MB)</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
        className="hidden"
      />
    </div>
  );
}
