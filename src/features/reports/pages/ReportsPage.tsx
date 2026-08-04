import { useState, useEffect } from 'react';
import MainLayout from '../../../components/layout/MainLayout';
import ReportSummary from '../components/ReportSummary';
import { Report } from '../types/Report';
import { getCurrentReport, getReportByDate, generatePDF, generateExcel, getReportsByRange } from '../services/reportService';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'react-hot-toast';
import React from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { ubicacionesAPI } from '../../../lib/api';
import { getGuatemalaDate, isGuatemalaToday } from '../../../lib/timezone';

export default function ReportsPage() {

  const [currentReport, setCurrentReport] = useState<Report | null>(null);
  const [selectedDate, setSelectedDate] = useState(getGuatemalaDate());
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [startDate, setStartDate] = useState(getGuatemalaDate());
  const [endDate, setEndDate] = useState(getGuatemalaDate());
  const [reportsByRange, setReportsByRange] = useState<Report[]>([]);
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [ubicaciones, setUbicaciones] = useState<{ _id: string; nombre: string }[]>([]);
  const [selectedUbicacion, setSelectedUbicacion] = useState<string>('');
  const { user } = useAuth();

  const ubicacion = localStorage.getItem('ubicacion');
  useEffect(() => {
    if (ubicacion) {
      setSelectedUbicacion(ubicacion);
    }
  }, [ubicacion]);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadUbicaciones();
    }
  }, [user]);

  const loadUbicaciones = async () => {
    try {
      const data = await ubicacionesAPI.getUbicaciones();
      setUbicaciones(data);
    } catch (error) {
      toast.error('Error al cargar ubicaciones');
    }
  };

  const loadReport = async (date: string) => {
    setIsLoading(true);
    setCurrentReport(null);
    try {
      const report = isGuatemalaToday(date)
        ? await getCurrentReport(selectedUbicacion)
        : await getReportByDate(date, selectedUbicacion);
      setCurrentReport(report);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar el reporte';
      if (errorMessage === 'No hay reporte para esta fecha' || errorMessage === 'No se encontró reporte para esa fecha') {
        setCurrentReport(null);
      } else if (errorMessage.includes('ubicación')) {
        setCurrentReport(null);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport(selectedDate);
  }, [selectedDate]);

  const handleGeneratePDF = async () => {
    if (!currentReport) return;
    try {
      setIsGenerating(true);
      await generatePDF(currentReport, undefined, undefined, user?.role === 'admin' ? ubicaciones : undefined);
      toast.success('PDF generado exitosamente');
    } catch (error) {
      toast.error('Error al generar el PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateExcel = async () => {
    if (!currentReport) return;
    try {
      setIsGenerating(true);
      await generateExcel(currentReport, undefined, undefined, user?.role === 'admin' ? ubicaciones : undefined);
      toast.success('Excel generado exitosamente');
    } catch (error) {
      toast.error('Error al generar el Excel');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadReportsByRange = async () => {
    setIsLoading(true);
    setReportsByRange([]);
    try {
      const response = await getReportsByRange(startDate, endDate, selectedUbicacion);
      setReportsByRange(response);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al cargar reportes por rango';
      if (errorMessage.includes('ubicación')) {
        setReportsByRange([]);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRangePDF = async () => {
    if (!startDate || !endDate) return;
    try {
      setIsGenerating(true);
      await generatePDF(null, startDate, endDate, user?.role === 'admin' ? ubicaciones : undefined);
      toast.success('PDF generado exitosamente');
    } catch (error) {
      toast.error('Error al generar el PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateRangeExcel = async () => {
    if (!startDate || !endDate) return;
    try {
      setIsGenerating(true);
      await generateExcel(null, startDate, endDate, user?.role === 'admin' ? ubicaciones : undefined);
      toast.success('Excel generado exitosamente');
    } catch (error) {
      toast.error('Error al generar el Excel');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 p-3 sm:p-6">
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              {isRangeMode
                ? 'Reportes por Rango'
                : isGuatemalaToday(selectedDate)
                  ? 'Reporte del Día'
                  : 'Reporte Histórico'}
            </h1>
            {user?.role === 'admin' && (
              <select
                value={selectedUbicacion}
                onChange={(e) => {
                  setSelectedUbicacion(e.target.value);
                  loadReport(selectedDate);
                }}
                className="px-3 py-2 border rounded-md w-full sm:w-auto"
              >
                <option value="">Todas las ubicaciones</option>
                {ubicaciones.map((ubicacion) => (
                  <option key={ubicacion._id} value={ubicacion._id}>
                    {ubicacion.nombre}
                  </option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsRangeMode(false)}
                className={`px-3 py-2 rounded-md text-sm ${!isRangeMode ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Por Día
              </button>
              <button
                onClick={() => setIsRangeMode(true)}
                className={`px-3 py-2 rounded-md text-sm ${isRangeMode ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                Por Rango
              </button>
            </div>
          </div>

          {!isRangeMode ? (
            <div>
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 mb-6">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border rounded-md w-full sm:w-auto"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleGeneratePDF}
                    disabled={isGenerating || !currentReport}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <FileDown className="h-5 w-5" />
                    <span className="hidden sm:inline">PDF</span>
                    <span className="sm:hidden">PDF</span>
                  </button>
                  <button
                    onClick={handleGenerateExcel}
                    disabled={isGenerating || !currentReport}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <FileSpreadsheet className="h-5 w-5" />
                    <span className="hidden sm:inline">Excel</span>
                    <span className="sm:hidden">Excel</span>
                  </button>
                </div>
              </div>
              {isLoading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : currentReport ? (
                <ReportSummary
                  report={currentReport}
                  ubicaciones={ubicaciones}
                  isAdmin={user?.role === 'admin'}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay reporte disponible para esta fecha
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 mb-6">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border rounded-md w-full sm:w-auto"
                />
                <span className="hidden sm:inline">a</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border rounded-md w-full sm:w-auto"
                />
                <button
                  onClick={loadReportsByRange}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-full sm:w-auto"
                >
                  Buscar
                </button>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleGenerateRangePDF}
                    disabled={isGenerating || !reportsByRange.length}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex-1 sm:flex-none justify-center"
                  >
                    <FileDown className="h-5 w-5" />
                    PDF
                  </button>
                  <button
                    onClick={handleGenerateRangeExcel}
                    disabled={isGenerating || !reportsByRange.length}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex-1 sm:flex-none justify-center"
                  >
                    <FileSpreadsheet className="h-5 w-5" />
                    Excel
                  </button>
                </div>
              </div>
              {isLoading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : reportsByRange?.length > 0 ? (
                <div>
                  {reportsByRange.map((report) => (
                    <div key={report._id} className="mb-6 border-b pb-4">
                      <div className="font-semibold text-lg mb-2">
                        Fecha: {new Date(report.startDate).toLocaleDateString()}
                      </div>
                      <ReportSummary
                        report={report}
                        ubicaciones={ubicaciones}
                        isAdmin={user?.role === 'admin'}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay reportes para este rango de fechas
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}