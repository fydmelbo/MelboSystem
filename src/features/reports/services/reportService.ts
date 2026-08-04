import { reportsAPI } from '../../../lib/api';
import { Report, Sale } from '../types/Report';

export const getCurrentReport = async (ubicacion?: string): Promise<Report> => {
  return reportsAPI.getCurrentReport(ubicacion) as unknown as Report;
};

export const addSaleToReport = async (sale: Sale): Promise<any> => {
  return reportsAPI.addSaleToReport(sale);
};

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const generatePDF = async (report: Report | null, startDate?: string, endDate?: string, ubicaciones?: Array<{ _id: string; nombre: string }>): Promise<void> => {
  try {
    const doc = new jsPDF();
    const ubicacionMap = new Map((ubicaciones || []).map(ub => [ub._id, ub.nombre]));
    const showUbicacionColumn = ubicaciones && ubicaciones.length > 0;
    
    // Configuración de encabezado corporativo
    doc.setFillColor(33, 150, 243); // Azul corporativo
    doc.rect(0, 0, doc.internal.pageSize.width, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('MELBO SYSTEM', 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Reporte de Ventas', doc.internal.pageSize.width - 50, 20);

    let allSales: any[] = [];
    let title = '';
    let totalAcumulado = 0;

    if (report) {
      allSales = report.sales || [];
      const reportDate = new Date(report.startDate).toLocaleDateString();
      title = `Reporte del Día: ${reportDate}`;
      totalAcumulado = report.totalSales;
    } else if (startDate && endDate) {
      const reports = await getReportsByRange(startDate, endDate);
      reports.forEach(r => {
        allSales = [...allSales, ...(r.sales || [])];
        totalAcumulado += r.totalSales || 0;
      });
      title = `Reporte de Rango: ${new Date(startDate).toLocaleDateString()} al ${new Date(endDate).toLocaleDateString()}`;
    }

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 45);

    const tableColumn = showUbicacionColumn
      ? ["Fecha/Hora", "Ubicación", "Producto", "Cantidad", "Tipo", "Subtotal"]
      : ["Fecha/Hora", "Producto", "Cantidad", "Tipo", "Subtotal"];
    const tableRows: any[] = [];

    // Desglosar items de venta
    allSales.forEach((sale) => {
      const saleDate = new Date(sale.createdAt).toLocaleString();
      const ubName = sale.ubicacion ? (ubicacionMap.get(sale.ubicacion) || '-') : '-';
      if (sale.items && sale.items.length > 0) {
        sale.items.forEach((item: any) => {
          const row = showUbicacionColumn
            ? [saleDate, ubName, item.name, item.quantity.toString(), item.saleType === 'unit' ? 'Unidad' : item.saleType === 'blister' ? 'Blister' : 'Caja', `Q${item.subtotal.toFixed(2)}`]
            : [saleDate, item.name, item.quantity.toString(), item.saleType === 'unit' ? 'Unidad' : item.saleType === 'blister' ? 'Blister' : 'Caja', `Q${item.subtotal.toFixed(2)}`];
          tableRows.push(row);
        });
      } else {
        const row = showUbicacionColumn
          ? [saleDate, ubName, 'Venta general', '-', '-', `Q${(sale.total || 0).toFixed(2)}`]
          : [saleDate, 'Venta general', '-', '-', `Q${(sale.total || 0).toFixed(2)}`];
        tableRows.push(row);
      }
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: 'striped',
      headStyles: { fillColor: [33, 150, 243], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    // Totales
    const finalY = (doc as any).lastAutoTable.finalY || 55;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 150, 243);
    doc.text(`Total Generado: Q${totalAcumulado.toFixed(2)}`, 14, finalY + 15);

    doc.save(`Reporte_Ventas_${new Date().getTime()}.pdf`);
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw new Error('Error al generar el PDF.');
  }
};

export const getReportByDate = async (date: string, ubicacion?: string): Promise<Report> => {
  return reportsAPI.getReportByDate(date, ubicacion) as unknown as Report;
};

export const generateDetailedPDF = async (report: Report): Promise<void> => {
  return generatePDF(report);
};

export const generateExcel = async (report: Report | null, startDate?: string, endDate?: string, ubicaciones?: Array<{ _id: string; nombre: string }>): Promise<void> => {
  try {
    const ubicacionMap = new Map((ubicaciones || []).map(ub => [ub._id, ub.nombre]));
    const showUbicacionColumn = ubicaciones && ubicaciones.length > 0;
    
    let allSales: any[] = [];
    
    if (report) {
      allSales = report.sales || [];
    } else if (startDate && endDate) {
      const reports = await getReportsByRange(startDate, endDate);
      reports.forEach(r => {
        allSales = [...allSales, ...(r.sales || [])];
      });
    }

    const excelData: any[] = [];

    allSales.forEach((sale) => {
      const saleDate = new Date(sale.createdAt).toLocaleString();
      const ubName = sale.ubicacion ? (ubicacionMap.get(sale.ubicacion) || '-') : '-';
      if (sale.items && sale.items.length > 0) {
        sale.items.forEach((item: any) => {
          const row: any = {
            "Fecha y Hora": saleDate,
            "Producto": item.name,
            "Cantidad": item.quantity,
            "Tipo": item.saleType === 'unit' ? 'Unidad' : item.saleType === 'blister' ? 'Blister' : 'Caja',
            "Precio Unitario": item.price,
            "Subtotal": item.subtotal
          };
          if (showUbicacionColumn) {
            row["Ubicación"] = ubName;
          }
          excelData.push(row);
        });
      } else {
        const row: any = {
          "Fecha y Hora": saleDate,
          "Producto": "Venta general",
          "Cantidad": 1,
          "Tipo": "N/A",
          "Precio Unitario": sale.total,
          "Subtotal": sale.total
        };
        if (showUbicacionColumn) {
          row["Ubicación"] = ubName;
        }
        excelData.push(row);
      }
    });

    const worksheet = XLSX.utils.json_to_sheet([]);
    
    // Agregar un encabezado bonito al Excel
    XLSX.utils.sheet_add_aoa(worksheet, [
      ["MELBO SYSTEM"],
      ["Reporte de Ventas"],
      [`Generado el: ${new Date().toLocaleString()}`],
      []
    ], { origin: "A1" });

    // Agregar los datos a partir de la fila 5
    XLSX.utils.sheet_add_json(worksheet, excelData, { origin: "A5" });
    
    // Dar un poco de formato a las columnas
    const wscols = showUbicacionColumn
      ? [
          { wch: 20 }, // Fecha
          { wch: 20 }, // Ubicación
          { wch: 40 }, // Producto
          { wch: 10 }, // Cantidad
          { wch: 15 }, // Tipo
          { wch: 15 }, // Precio Unitario
          { wch: 15 }  // Subtotal
        ]
      : [
          { wch: 20 }, // Fecha
          { wch: 40 }, // Producto
          { wch: 10 }, // Cantidad
          { wch: 15 }, // Tipo
          { wch: 15 }, // Precio Unitario
          { wch: 15 }  // Subtotal
        ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ventas");

    XLSX.writeFile(workbook, `Reporte_Ventas_${new Date().getTime()}.xlsx`);
  } catch (error) {
    console.error('Error generando Excel:', error);
    throw new Error('Error al generar el Excel.');
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
