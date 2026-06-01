import { reportsAPI } from '../../../lib/api';
import { Report, Sale } from '../types/Report';

export const getCurrentReport = async (ubicacion?: string): Promise<Report> => {
  return reportsAPI.getCurrentReport(ubicacion) as unknown as Report;
};

export const addSaleToReport = async (sale: Sale): Promise<any> => {
  return reportsAPI.addSaleToReport(sale);
};

export const generatePDF = async (report: Report | null, startDate?: string, endDate?: string): Promise<void> => {
  try {
    // TODO: Migrar a Cloud Function
    console.warn('Generación de PDF pendiente de migración a Cloud Functions');
    throw new Error('La generación de PDF se implementará via Cloud Functions');
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw new Error('Error al generar el PDF. Funcionalidad pendiente de migración.');
  }
};

export const generateDetailedPDF = async (report: Report): Promise<void> => {
  try {
    // TODO: Migrar a Cloud Function
    console.warn('Generación de PDF detallado pendiente de migración a Cloud Functions');
    throw new Error('La generación de PDF detallado se implementará via Cloud Functions');
  } catch (error) {
    console.error('Error generando PDF detallado:', error);
    throw new Error('Error al generar el PDF detallado. Funcionalidad pendiente de migración.');
  }
};

export const getReportByDate = async (date: string, ubicacion?: string): Promise<Report> => {
  return reportsAPI.getReportByDate(date, ubicacion) as unknown as Report;
};

export const generateExcel = async (reportId: string | null, startDate?: string, endDate?: string): Promise<void> => {
  try {
    // TODO: Migrar a Cloud Function
    console.warn('Generación de Excel pendiente de migración a Cloud Functions');
    throw new Error('La generación de Excel se implementará via Cloud Functions');
  } catch (error) {
    console.error('Error generando Excel:', error);
    throw new Error('Error al generar el Excel. Funcionalidad pendiente de migración.');
  }
};

export const getReportsByRange = async (startDate: string, endDate: string, ubicacion?: string): Promise<Report[]> => {
  try {
    const response = await reportsAPI.getReportByRange(startDate, endDate, ubicacion);
    return response as unknown as Report[];
  } catch (error) {
    console.error('Error al obtener reportes por rango:', error);
    throw new Error('Error al obtener reportes por rango de fechas');
  }
};
