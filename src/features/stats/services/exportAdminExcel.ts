import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  getTopSellingProducts,
  getDailySalesStats,
  getPaymentMethodBreakdown,
  getRevenueByCategory,
  getRevenueByLocation,
  getInventorySummary,
  getExpiringProducts,
  getLowStockProducts,
  getFinancialMetrics,
  getProductsSalesStats,
  getSalesByDayOfWeek,
  getMarginRanking,
} from './statsService';
import { formatGuatemalaDate } from '../../../lib/timezone';
import {
  generateLineChart,
  generateBarChart,
  generatePieChart,
  generateMultiLineChart,
  BRAND as CHART_COLORS,
} from './chartImageGenerator';

const BRAND = {
  navy: '1B3A5C',
  green: '2D8C3C',
  lightBlue: '4A9BD9',
  red: 'C41E3A',
  white: 'FFFFFF',
  lightGray: 'F0F4F8',
  borderGray: 'D1D5DB',
  darkText: '1F2937',
};

const CURRENCY_FMT = 'Q#,##0.00';
const PERCENT_FMT = '0.0%';
const INTEGER_FMT = '#,##0';

function applyHeaderStyle(row: ExcelJS.Row, colCount: number) {
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.navy } };
    cell.font = { color: { argb: BRAND.white }, bold: true, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'thin', color: { argb: BRAND.borderGray } } };
  }
}

function applyDataRowsStyle(sheet: ExcelJS.Worksheet, startRow: number, endRow: number, colCount: number) {
  for (let r = startRow; r <= endRow; r++) {
    const isEven = r % 2 === 0;
    for (let c = 1; c <= colCount; c++) {
      const cell = sheet.getRow(r).getCell(c);
      if (isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND.lightGray } };
      }
      cell.border = { bottom: { style: 'thin', color: { argb: BRAND.borderGray } } };
      cell.font = { color: { argb: BRAND.darkText }, size: 10 };
    }
  }
}

function addSectionTitle(sheet: ExcelJS.Worksheet, row: number, title: string, colCount: number) {
  sheet.mergeCells(row, 1, row, colCount);
  const cell = sheet.getCell(row, 1);
  cell.value = title;
  cell.font = { bold: true, size: 14, color: { argb: BRAND.navy } };
  cell.alignment = { vertical: 'middle' };
  return row + 1;
}

export async function exportAdminExcel(
  ubicacion: string | null,
  dateFilter: { startDate: Date; endDate: Date },
  ubicacionNombre: string
) {
  const start = dateFilter.startDate;
  const end = dateFilter.endDate;

  const [
    topProducts,
    dailyData,
    paymentMethods,
    categoryRevenue,
    locationRevenue,
    inventory,
    expiringProducts,
    lowStockProducts,
    financialData,
    productStats,
    dayOfWeekData,
    marginRanking,
  ] = await Promise.all([
    getTopSellingProducts(ubicacion, start, end),
    getDailySalesStats(ubicacion, start, end),
    getPaymentMethodBreakdown(ubicacion, start, end),
    getRevenueByCategory(ubicacion, start, end),
    ubicacion ? null : getRevenueByLocation(start, end),
    getInventorySummary(ubicacion),
    getExpiringProducts(ubicacion),
    getLowStockProducts(ubicacion),
    getFinancialMetrics(ubicacion, start, end),
    getProductsSalesStats(ubicacion, start, end),
    getSalesByDayOfWeek(ubicacion, start, end),
    getMarginRanking(ubicacion, start, end),
  ]);

  const totalRevenue = topProducts.reduce((s, p) => s + p.totalAmount, 0);
  const totalSales = dailyData.reduce((s, d) => s + d.numberOfSales, 0);
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

  // ========== CREATE WORKBOOK ==========
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Farmacias Melbo';
  wb.created = new Date();

  // Hoja: Resumen Ejecutivo
  const ws1 = wb.addWorksheet('Resumen Ejecutivo', { properties: { tabColor: { argb: BRAND.navy } } });
  ws1.columns = [
    { header: '', key: 'label', width: 30 },
    { header: '', key: 'value', width: 25 },
    { header: '', key: 'extra', width: 25 },
  ];

  let r = 1;
  r = addSectionTitle(ws1, r, 'PANEL DE ADMINISTRACION - FARMACIAS MELBO', 3);
  r++;
  ws1.getCell(r, 1).value = 'Ubicacion:';
  ws1.getCell(r, 1).font = { bold: true, size: 11 };
  ws1.getCell(r, 2).value = ubicacionNombre || 'Todas las ubicaciones';
  r++;
  ws1.getCell(r, 1).value = 'Periodo:';
  ws1.getCell(r, 1).font = { bold: true, size: 11 };
  ws1.getCell(r, 2).value = `${formatGuatemalaDate(start)} al ${formatGuatemalaDate(end)}`;
  r++;
  ws1.getCell(r, 1).value = 'Fecha de exportacion:';
  ws1.getCell(r, 1).font = { bold: true, size: 11 };
  ws1.getCell(r, 2).value = formatGuatemalaDate(new Date());
  r += 2;

  r = addSectionTitle(ws1, r, 'INDICADORES CLAVE (KPIs)', 3);
  r++;
  ws1.getRow(r).values = ['Indicador', 'Valor', 'Descripcion'];
  applyHeaderStyle(ws1.getRow(r), 3);
  r++;
  const kpiStart = r;
  ws1.getRow(r).values = ['Ingresos Totales', totalRevenue, 'Suma de todos los ingresos del periodo'];
  ws1.getRow(r).getCell(2).numFmt = CURRENCY_FMT;
  r++;
  ws1.getRow(r).values = ['Ventas Totales', totalSales, 'Cantidad total de transacciones'];
  ws1.getRow(r).getCell(2).numFmt = INTEGER_FMT;
  r++;
  ws1.getRow(r).values = ['Ticket Promedio', avgTicket, 'Ingresos / Numero de ventas'];
  ws1.getRow(r).getCell(2).numFmt = CURRENCY_FMT;
  r++;
  ws1.getRow(r).values = ['Productos Distintos', topProducts.length, 'Productos que aparecen en ventas'];
  ws1.getRow(r).getCell(2).numFmt = INTEGER_FMT;
  r++;
  ws1.getRow(r).values = ['Margen de Contribucion', financialData.contributionMargin, 'Ingresos - Costos'];
  ws1.getRow(r).getCell(2).numFmt = CURRENCY_FMT;
  r++;
  ws1.getRow(r).values = ['Porcentaje de Margen', financialData.marginPercentage / 100, 'Utilidad / Ingresos'];
  ws1.getRow(r).getCell(2).numFmt = PERCENT_FMT;
  r++;
  ws1.getRow(r).values = ['Total Productos Inventario', inventory.totalProducts, 'Productos en inventario'];
  ws1.getRow(r).getCell(2).numFmt = INTEGER_FMT;
  r++;
  ws1.getRow(r).values = ['Stock Bajo', inventory.lowStockCount, 'Productos con <=5 unidades'];
  ws1.getRow(r).getCell(2).numFmt = INTEGER_FMT;
  r++;
  ws1.getRow(r).values = ['Por Vencer (30 dias)', inventory.expiringSoonCount, 'Productos proximos a vencer'];
  ws1.getRow(r).getCell(2).numFmt = INTEGER_FMT;
  applyDataRowsStyle(ws1, kpiStart, r, 3);

  // Hoja: Ingresos Diarios
  const ws2 = wb.addWorksheet('Ingresos Diarios', { properties: { tabColor: { argb: BRAND.green } } });
  ws2.columns = [
    { header: 'Fecha', key: 'date', width: 18 },
    { header: 'Ingresos (Q)', key: 'revenue', width: 18 },
    { header: 'Numero de Ventas', key: 'sales', width: 18 },
    { header: 'Promedio por Venta', key: 'avg', width: 20 },
  ];
  applyHeaderStyle(ws2.getRow(1), 4);
  dailyData.forEach((d) => {
    ws2.addRow({
      date: d.date,
      revenue: d.totalSales,
      sales: d.numberOfSales,
      avg: d.numberOfSales > 0 ? d.totalSales / d.numberOfSales : 0,
    });
  });
  ws2.getColumn(2).numFmt = CURRENCY_FMT;
  ws2.getColumn(3).numFmt = INTEGER_FMT;
  ws2.getColumn(4).numFmt = CURRENCY_FMT;
  if (dailyData.length > 0) applyDataRowsStyle(ws2, 2, dailyData.length + 1, 4);

  // Hoja: Top Productos
  const ws3 = wb.addWorksheet('Top Productos', { properties: { tabColor: { argb: BRAND.lightBlue } } });
  ws3.columns = [
    { header: '#', key: 'rank', width: 6 },
    { header: 'Producto', key: 'name', width: 35 },
    { header: 'Categoria', key: 'category', width: 20 },
    { header: 'Unidades', key: 'units', width: 12 },
    { header: 'Ingresos (Q)', key: 'revenue', width: 18 },
    { header: 'Costo (Q)', key: 'cost', width: 18 },
    { header: 'Utilidad (Q)', key: 'profit', width: 18 },
    { header: 'Margen %', key: 'margin', width: 12 },
  ];
  applyHeaderStyle(ws3.getRow(1), 8);
  topProducts.forEach((p, i) => {
    ws3.addRow({
      rank: i + 1,
      name: p.name,
      category: p.category,
      units: p.totalUnits,
      revenue: p.totalAmount,
      cost: p.totalCost,
      profit: p.profit,
      margin: p.totalAmount > 0 ? p.profit / p.totalAmount : 0,
    });
  });
  ws3.getColumn(4).numFmt = INTEGER_FMT;
  ws3.getColumn(5).numFmt = CURRENCY_FMT;
  ws3.getColumn(6).numFmt = CURRENCY_FMT;
  ws3.getColumn(7).numFmt = CURRENCY_FMT;
  ws3.getColumn(8).numFmt = PERCENT_FMT;
  if (topProducts.length > 0) applyDataRowsStyle(ws3, 2, topProducts.length + 1, 8);

  // Hoja: Metodos de Pago
  const ws4 = wb.addWorksheet('Metodos de Pago', { properties: { tabColor: { argb: BRAND.red } } });
  ws4.columns = [
    { header: 'Metodo', key: 'method', width: 20 },
    { header: 'Monto (Q)', key: 'amount', width: 18 },
    { header: 'Porcentaje', key: 'percent', width: 15 },
  ];
  applyHeaderStyle(ws4.getRow(1), 3);
  const pmTotal = paymentMethods.total || 1;
  ws4.addRow({ method: 'Efectivo', amount: paymentMethods.efectivo, percent: paymentMethods.efectivo / pmTotal });
  ws4.addRow({ method: 'Tarjeta de Credito', amount: paymentMethods.TC, percent: paymentMethods.TC / pmTotal });
  ws4.addRow({ method: 'Transferencia', amount: paymentMethods.transferencia, percent: paymentMethods.transferencia / pmTotal });
  ws4.addRow({ method: 'TOTAL', amount: paymentMethods.total, percent: 1 });
  ws4.getRow(4).font = { bold: true, size: 11 };
  ws4.getColumn(2).numFmt = CURRENCY_FMT;
  ws4.getColumn(3).numFmt = PERCENT_FMT;
  applyDataRowsStyle(ws4, 2, 4, 3);

  // Hoja: Categorias
  const ws5 = wb.addWorksheet('Categorias', { properties: { tabColor: { argb: BRAND.navy } } });
  ws5.columns = [
    { header: 'Categoria', key: 'category', width: 30 },
    { header: 'Ingresos (Q)', key: 'revenue', width: 18 },
    { header: 'Unidades', key: 'units', width: 12 },
    { header: 'Porcentaje', key: 'percent', width: 15 },
  ];
  applyHeaderStyle(ws5.getRow(1), 4);
  const catTotal = categoryRevenue.reduce((s, c) => s + c.revenue, 0) || 1;
  categoryRevenue.forEach((c) => {
    ws5.addRow({ category: c.category, revenue: c.revenue, units: c.units, percent: c.revenue / catTotal });
  });
  ws5.getColumn(2).numFmt = CURRENCY_FMT;
  ws5.getColumn(3).numFmt = INTEGER_FMT;
  ws5.getColumn(4).numFmt = PERCENT_FMT;
  if (categoryRevenue.length > 0) applyDataRowsStyle(ws5, 2, categoryRevenue.length + 1, 4);

  // Hoja: Ubicaciones
  if (locationRevenue && locationRevenue.length > 0) {
    const ws6 = wb.addWorksheet('Ubicaciones', { properties: { tabColor: { argb: BRAND.green } } });
    ws6.columns = [
      { header: 'Ubicacion', key: 'name', width: 25 },
      { header: 'Ingresos (Q)', key: 'revenue', width: 18 },
      { header: 'Ventas', key: 'sales', width: 12 },
      { header: 'Ticket Promedio (Q)', key: 'avg', width: 20 },
      { header: 'Porcentaje', key: 'percent', width: 15 },
    ];
    applyHeaderStyle(ws6.getRow(1), 5);
    const locTotal = locationRevenue.reduce((s, l) => s + l.revenue, 0) || 1;
    locationRevenue.forEach((l) => {
      ws6.addRow({
        name: l.ubicacionNombre,
        revenue: l.revenue,
        sales: l.salesCount,
        avg: l.averageTicket,
        percent: l.revenue / locTotal,
      });
    });
    ws6.getColumn(2).numFmt = CURRENCY_FMT;
    ws6.getColumn(3).numFmt = INTEGER_FMT;
    ws6.getColumn(4).numFmt = CURRENCY_FMT;
    ws6.getColumn(5).numFmt = PERCENT_FMT;
    applyDataRowsStyle(ws6, 2, locationRevenue.length + 1, 5);
  }

  // Hoja: Detalle Productos
  const ws7 = wb.addWorksheet('Detalle Productos', { properties: { tabColor: { argb: BRAND.lightBlue } } });
  ws7.columns = [
    { header: 'Producto', key: 'name', width: 35 },
    { header: 'Unidades Vendidas', key: 'sold', width: 18 },
    { header: 'Ingresos (Q)', key: 'revenue', width: 18 },
    { header: 'Costo (Q)', key: 'cost', width: 18 },
    { header: 'Utilidad (Q)', key: 'profit', width: 18 },
    { header: 'Margen %', key: 'margin', width: 12 },
  ];
  applyHeaderStyle(ws7.getRow(1), 6);
  productStats.forEach((p) => {
    ws7.addRow({
      name: p.name,
      sold: p.totalSold,
      revenue: p.revenue,
      cost: p.cost,
      profit: p.revenue - p.cost,
      margin: p.revenue > 0 ? (p.revenue - p.cost) / p.revenue : 0,
    });
  });
  ws7.getColumn(2).numFmt = INTEGER_FMT;
  ws7.getColumn(3).numFmt = CURRENCY_FMT;
  ws7.getColumn(4).numFmt = CURRENCY_FMT;
  ws7.getColumn(5).numFmt = CURRENCY_FMT;
  ws7.getColumn(6).numFmt = PERCENT_FMT;
  if (productStats.length > 0) applyDataRowsStyle(ws7, 2, productStats.length + 1, 6);

  // Hoja: Metricas Financieras
  const ws8 = wb.addWorksheet('Metricas Financieras', { properties: { tabColor: { argb: BRAND.navy } } });
  ws8.columns = [
    { header: 'Concepto', key: 'label', width: 30 },
    { header: 'Valor', key: 'value', width: 20 },
    { header: 'Descripcion', key: 'desc', width: 40 },
  ];
  applyHeaderStyle(ws8.getRow(1), 3);
  ws8.addRow({ label: 'Ingresos Totales', value: financialData.totalRevenue, desc: 'Total de ventas brutas' });
  ws8.addRow({ label: 'Costos Totales', value: financialData.totalCost, desc: 'Costo de productos vendidos' });
  ws8.addRow({ label: 'Utilidad (Margen)', value: financialData.contributionMargin, desc: 'Ingresos - Costos' });
  ws8.addRow({ label: 'Porcentaje de Margen', value: financialData.marginPercentage / 100, desc: 'Utilidad / Ingresos' });
  ws8.addRow({ label: 'Ticket Promedio', value: financialData.averageTicket, desc: 'Ingresos / Ventas' });
  ws8.addRow({ label: 'Total Ventas', value: financialData.totalSales, desc: 'Cantidad de transacciones' });
  ws8.getRow(4).font = { bold: true, size: 11 };
  ws8.getRow(4).getCell(2).font = { bold: true, size: 11 };
  ws8.getCell(4, 2).numFmt = CURRENCY_FMT;
  ws8.getColumn(2).numFmt = CURRENCY_FMT;
  ws8.getRow(6).getCell(2).numFmt = PERCENT_FMT;
  ws8.getRow(7).getCell(2).numFmt = CURRENCY_FMT;
  ws8.getRow(8).getCell(2).numFmt = INTEGER_FMT;
  applyDataRowsStyle(ws8, 2, 8, 3);

  // Hoja: Tendencia Diaria
  const ws9 = wb.addWorksheet('Tendencia Diaria', { properties: { tabColor: { argb: BRAND.green } } });
  ws9.columns = [
    { header: 'Fecha', key: 'date', width: 18 },
    { header: 'Ingresos (Q)', key: 'revenue', width: 18 },
    { header: 'Costos (Q)', key: 'cost', width: 18 },
    { header: 'Utilidad (Q)', key: 'margin', width: 18 },
    { header: 'Margen %', key: 'marginPct', width: 12 },
  ];
  applyHeaderStyle(ws9.getRow(1), 5);
  financialData.dailyMarginTrend.forEach((d: Record<string, string | number>) => {
    const revenue = Number(d.revenue);
    ws9.addRow({
      date: String(d.date),
      revenue,
      cost: Number(d.cost),
      margin: Number(d.margin),
      marginPct: revenue > 0 ? Number(d.margin) / revenue : 0,
    });
  });
  ws9.getColumn(2).numFmt = CURRENCY_FMT;
  ws9.getColumn(3).numFmt = CURRENCY_FMT;
  ws9.getColumn(4).numFmt = CURRENCY_FMT;
  ws9.getColumn(5).numFmt = PERCENT_FMT;
  if (financialData.dailyMarginTrend.length > 0) applyDataRowsStyle(ws9, 2, financialData.dailyMarginTrend.length + 1, 5);

  // Hoja: Inventario
  const ws10 = wb.addWorksheet('Inventario', { properties: { tabColor: { argb: BRAND.red } } });
  ws10.columns = [
    { header: 'Concepto', key: 'label', width: 30 },
    { header: 'Valor', key: 'value', width: 20 },
  ];
  applyHeaderStyle(ws10.getRow(1), 2);
  ws10.addRow({ label: 'Total Productos', value: inventory.totalProducts });
  ws10.addRow({ label: 'Unidades Totales', value: inventory.totalUnits });
  ws10.addRow({ label: 'Stock Bajo (<=5 uds)', value: inventory.lowStockCount });
  ws10.addRow({ label: 'Por Vencer (30 dias)', value: inventory.expiringSoonCount });
  ws10.addRow({ label: 'Sin Stock', value: inventory.outOfStockCount });
  ws10.getColumn(2).numFmt = INTEGER_FMT;
  applyDataRowsStyle(ws10, 2, 6, 2);

  // Productos por vencer
  let invRow = 8;
  invRow = addSectionTitle(ws10, invRow, 'PRODUCTOS POR VENCER (30 DIAS)', 5);
  ws10.getColumn(3).width = 25;
  ws10.getColumn(4).width = 18;
  ws10.getColumn(5).width = 15;
  ws10.getRow(invRow).values = ['Producto', 'Ubicacion', 'Vencimiento', 'Dias Restantes', 'Stock'];
  applyHeaderStyle(ws10.getRow(invRow), 5);
  invRow++;
  expiringProducts.forEach((p) => {
    ws10.getRow(invRow).values = [p.name, p.ubicacionNombre, p.expirationDate, p.daysUntilExpiration, p.stock];
    invRow++;
  });
  if (expiringProducts.length > 0) {
    applyDataRowsStyle(ws10, invRow - expiringProducts.length, invRow - 1, 5);
  }

  // Stock bajo
  invRow += 2;
  invRow = addSectionTitle(ws10, invRow, 'PRODUCTOS CON STOCK BAJO (<=5 UNIDADES)', 4);
  ws10.getRow(invRow).values = ['Producto', 'Ubicacion', 'Categoria', 'Stock Actual'];
  applyHeaderStyle(ws10.getRow(invRow), 4);
  invRow++;
  lowStockProducts.forEach((p) => {
    ws10.getRow(invRow).values = [p.name, p.ubicacionNombre, p.category, p.currentStock];
    invRow++;
  });
  if (lowStockProducts.length > 0) {
    applyDataRowsStyle(ws10, invRow - lowStockProducts.length, invRow - 1, 4);
  }

  // Hoja: Ventas por Dia
  const ws11 = wb.addWorksheet('Ventas por Dia', { properties: { tabColor: { argb: BRAND.lightBlue } } });
  ws11.columns = [
    { header: 'Dia', key: 'day', width: 15 },
    { header: 'Cantidad Ventas', key: 'count', width: 18 },
    { header: 'Ingresos (Q)', key: 'revenue', width: 18 },
    { header: 'Promedio (Q)', key: 'avg', width: 18 },
  ];
  applyHeaderStyle(ws11.getRow(1), 4);
  dayOfWeekData.forEach((d) => {
    ws11.addRow({
      day: d.day,
      count: d.salesCount,
      revenue: d.revenue,
      avg: d.salesCount > 0 ? d.revenue / d.salesCount : 0,
    });
  });
  ws11.getColumn(2).numFmt = INTEGER_FMT;
  ws11.getColumn(3).numFmt = CURRENCY_FMT;
  ws11.getColumn(4).numFmt = CURRENCY_FMT;
  applyDataRowsStyle(ws11, 2, dayOfWeekData.length + 1, 4);

  // Hoja: Ranking Margenes
  const ws12 = wb.addWorksheet('Ranking Margenes', { properties: { tabColor: { argb: BRAND.navy } } });
  ws12.columns = [
    { header: '#', key: 'rank', width: 6 },
    { header: 'Producto', key: 'name', width: 35 },
    { header: 'Categoria', key: 'category', width: 20 },
    { header: 'Ingresos (Q)', key: 'revenue', width: 18 },
    { header: 'Costo (Q)', key: 'cost', width: 18 },
    { header: 'Utilidad (Q)', key: 'profit', width: 18 },
    { header: 'Margen %', key: 'margin', width: 12 },
    { header: 'Unidades', key: 'units', width: 12 },
  ];
  applyHeaderStyle(ws12.getRow(1), 8);
  marginRanking.forEach((p, i) => {
    ws12.addRow({
      rank: i + 1,
      name: p.name,
      category: p.category,
      revenue: p.revenue,
      cost: p.cost,
      profit: p.profit,
      margin: p.marginPercent / 100,
      units: p.unitsSold,
    });
  });
  ws12.getColumn(4).numFmt = CURRENCY_FMT;
  ws12.getColumn(5).numFmt = CURRENCY_FMT;
  ws12.getColumn(6).numFmt = CURRENCY_FMT;
  ws12.getColumn(7).numFmt = PERCENT_FMT;
  ws12.getColumn(8).numFmt = INTEGER_FMT;
  if (marginRanking.length > 0) applyDataRowsStyle(ws12, 2, marginRanking.length + 1, 8);

  // ========== CHART SHEETS (images rendered via Chart.js) ==========
  const CHART_RANGE = 'A1:J25';

  // Chart 1: Ingresos Diarios (line)
  if (dailyData.length > 0) {
    try {
      const chart1 = generateLineChart(
        'Tendencia de Ingresos Diarios',
        dailyData.map((d) => d.date),
        [
          { label: 'Ingresos (Q)', data: dailyData.map((d) => d.totalSales), color: CHART_COLORS.green, fill: true },
          { label: 'Ventas', data: dailyData.map((d) => d.numberOfSales), color: CHART_COLORS.lightBlue },
        ]
      );
      const imgId1 = wb.addImage({ base64: chart1.base64, extension: 'png' });
      const wsChart1 = wb.addWorksheet('Graf Ingresos', { properties: { tabColor: { argb: BRAND.green } } });
      wsChart1.addImage(imgId1, CHART_RANGE);
    } catch (e) { console.error('Chart 1 error:', e); }
  }

  // Chart 2: Top Productos (bar)
  if (topProducts.length > 0) {
    try {
      const top10 = topProducts.slice(0, 10);
      const chart2 = generateBarChart(
        'Top 10 Productos por Ingresos',
        top10.map((p) => p.name.substring(0, 20)),
        [{ label: 'Ingresos (Q)', data: top10.map((p) => p.totalAmount), color: CHART_COLORS.lightBlue }]
      );
      const imgId2 = wb.addImage({ base64: chart2.base64, extension: 'png' });
      const wsChart2 = wb.addWorksheet('Graf Top Productos', { properties: { tabColor: { argb: BRAND.lightBlue } } });
      wsChart2.addImage(imgId2, CHART_RANGE);
    } catch (e) { console.error('Chart 2 error:', e); }
  }

  // Chart 3: Metodos de Pago (pie/doughnut)
  try {
    const chart3 = generatePieChart(
      'Distribucion por Metodo de Pago',
      ['Efectivo', 'Tarjeta', 'Transferencia'],
      [paymentMethods.efectivo, paymentMethods.TC, paymentMethods.transferencia],
      [CHART_COLORS.green, CHART_COLORS.lightBlue, CHART_COLORS.navy]
    );
    const imgId3 = wb.addImage({ base64: chart3.base64, extension: 'png' });
    const wsChart3 = wb.addWorksheet('Graf Metodos Pago', { properties: { tabColor: { argb: BRAND.red } } });
    wsChart3.addImage(imgId3, CHART_RANGE);
  } catch (e) { console.error('Chart 3 error:', e); }

  // Chart 4: Categorias (horizontal bar)
  if (categoryRevenue.length > 0) {
    try {
      const cats = categoryRevenue.slice(0, 8);
      const chart4 = generateBarChart(
        'Ingresos por Categoria',
        cats.map((c) => c.category),
        [{ label: 'Ingresos (Q)', data: cats.map((c) => c.revenue), color: CHART_COLORS.navy }],
        true
      );
      const imgId4 = wb.addImage({ base64: chart4.base64, extension: 'png' });
      const wsChart4 = wb.addWorksheet('Graf Categorias', { properties: { tabColor: { argb: BRAND.navy } } });
      wsChart4.addImage(imgId4, CHART_RANGE);
    } catch (e) { console.error('Chart 4 error:', e); }
  }

  // Chart 5: Ubicaciones (bar)
  if (locationRevenue && locationRevenue.length > 0) {
    try {
      const chart5 = generateBarChart(
        'Comparacion por Ubicacion',
        locationRevenue.map((l) => l.ubicacionNombre),
        [{ label: 'Ingresos (Q)', data: locationRevenue.map((l) => l.revenue), color: CHART_COLORS.green }]
      );
      const imgId5 = wb.addImage({ base64: chart5.base64, extension: 'png' });
      const wsChart5 = wb.addWorksheet('Graf Ubicaciones', { properties: { tabColor: { argb: BRAND.green } } });
      wsChart5.addImage(imgId5, CHART_RANGE);
    } catch (e) { console.error('Chart 5 error:', e); }
  }

  // Chart 6: Tendencia Ingresos vs Costos vs Utilidad (multi-line)
  if (financialData.dailyMarginTrend.length > 0) {
    try {
      const trend = financialData.dailyMarginTrend;
      const chart6 = generateMultiLineChart(
        'Ingresos vs Costos vs Utilidad',
        trend.map((d: Record<string, string | number>) => String(d.date)),
        [
          { label: 'Ingresos', data: trend.map((d: Record<string, string | number>) => Number(d.revenue)), color: CHART_COLORS.green },
          { label: 'Costos', data: trend.map((d: Record<string, string | number>) => Number(d.cost)), color: CHART_COLORS.red },
          { label: 'Utilidad', data: trend.map((d: Record<string, string | number>) => Number(d.margin)), color: CHART_COLORS.lightBlue },
        ]
      );
      const imgId6 = wb.addImage({ base64: chart6.base64, extension: 'png' });
      const wsChart6 = wb.addWorksheet('Graf Tendencia', { properties: { tabColor: { argb: BRAND.green } } });
      wsChart6.addImage(imgId6, CHART_RANGE);
    } catch (e) { console.error('Chart 6 error:', e); }
  }

  // Chart 7: Ventas por Dia de la Semana (grouped bar)
  if (dayOfWeekData.length > 0) {
    try {
      const chart7 = generateBarChart(
        'Ventas por Dia de la Semana',
        dayOfWeekData.map((d) => d.day),
        [
          { label: 'Ingresos (Q)', data: dayOfWeekData.map((d) => d.revenue), color: CHART_COLORS.green },
          { label: 'Cantidad Ventas', data: dayOfWeekData.map((d) => d.salesCount), color: CHART_COLORS.lightBlue },
        ]
      );
      const imgId7 = wb.addImage({ base64: chart7.base64, extension: 'png' });
      const wsChart7 = wb.addWorksheet('Graf Ventas Dia', { properties: { tabColor: { argb: BRAND.lightBlue } } });
      wsChart7.addImage(imgId7, CHART_RANGE);
    } catch (e) { console.error('Chart 7 error:', e); }
  }

  // Chart 8: Ranking Margenes (horizontal bar)
  if (marginRanking.length > 0) {
    try {
      const top10m = marginRanking.slice(0, 10);
      const chart8 = generateBarChart(
        'Top 10 Productos por Utilidad',
        top10m.map((p) => p.name.substring(0, 20)),
        [{ label: 'Utilidad (Q)', data: top10m.map((p) => p.profit), color: CHART_COLORS.navy }],
        true
      );
      const imgId8 = wb.addImage({ base64: chart8.base64, extension: 'png' });
      const wsChart8 = wb.addWorksheet('Graf Margenes', { properties: { tabColor: { argb: BRAND.navy } } });
      wsChart8.addImage(imgId8, CHART_RANGE);
    } catch (e) { console.error('Chart 8 error:', e); }
  }

  // Generate and download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const dateStr = formatGuatemalaDate(new Date());
  saveAs(blob, `Panel_Administracion_Melbo_${dateStr}.xlsx`);
}
