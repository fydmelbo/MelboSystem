import * as XLSX from 'xlsx';
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { bulkAddCategories, bulkAddPharmaceuticalCompanies } from './catalogService';

export interface ImportResult {
  totalRows: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; name: string; error: string }>;
  categoriesAdded: number;
  companiesAdded: number;
}

export interface ParsedProduct {
  barcode: string;
  name: string;
  sellOptions: { unit: boolean; blister: boolean; box: boolean };
  packaging: { unitsPerBlister: number; blistersPerBox: number; description: string };
  category: string;
  location: string;
  prices: { unit?: number; blister?: number; box?: number };
  purchasePrices: { unit: number; blister: number; box: number };
  profitMargin: number;
  entryDate: string;
  expirationDate: string;
  invoice: string;
  totalSales: number;
  stock: { units: number; blisters: number; boxes: number; initial: number };
  pharmaceuticalCompany: string;
  paymentType: string;
  sheetName: string;
}

// ==========================================
// Helpers para parsear datos del Excel
// ==========================================

function parseSiNo(value: any): boolean {
  if (value === undefined || value === null || value === '') return false;
  const str = String(value).toLowerCase().trim();
  return str === 'si' || str === 'sí' || str === 'yes' || str === 's' || str === '1';
}

function parseNumber(value: any): number {
  if (value === undefined || value === null || value === '' || value === '-') return 0;
  // Quitar "Q" y espacios
  const str = String(value).replace(/[Qq\s,]/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function parsePercentage(value: any): number {
  if (value === undefined || value === null || value === '' || value === '-') return 0;
  const str = String(value).replace('%', '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function parseExcelDate(value: any): string {
  if (!value || value === '-' || value === '') return '';

  // Si es un número (serial date de Excel)
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const month = String(date.m).padStart(2, '0');
      const day = String(date.d).padStart(2, '0');
      return `${date.y}-${month}-${day}`;
    }
  }

  // Si es string en formato dd/mm/yyyy o d/mm/yyyy
  const str = String(value).trim();
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }

  // Intentar parsear como Date directamente
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return '';
}

function cleanString(value: any): string {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

// ==========================================
// Parsear fila del Excel a producto
// ==========================================

function parseProductRow(row: any, sheetName: string): ParsedProduct | null {
  const name = cleanString(row['NOMBRE DE PRODUCTO'] || row['NOMBRE_DE_PRODUCTO'] || row['nombre de producto']);
  
  // Si no tiene nombre, saltar la fila
  if (!name) return null;

  const barcode = cleanString(row['CODIGO BARRA'] || row['CODIGO_BARRA'] || row['codigo barra'] || '');
  
  const sellBox = parseSiNo(row['OV -CAJA'] || row['OV-CAJA'] || row['OV_CAJA']);
  const sellBlister = parseSiNo(row['OV-BLUSTER'] || row['OV-BLISTER'] || row['OV_BLISTER'] || row['OV-BUSTER']);
  const sellUnit = parseSiNo(row['OV-UNIDAD'] || row['OV_UNIDAD']);
  
  const packagingDesc = cleanString(
    row['DISTRIBUCIÓN / EMPAQUETADO'] || row['DISTRIBUCION / EMPAQUETADO'] || 
    row['DISTRIBUCIÓN/EMPAQUETADO'] || row['DISTRIBUCION/EMPAQUETADO'] || ''
  );
  
  const category = cleanString(row['CATEGORÍA'] || row['CATEGORIA'] || row['categoria'] || '');
  const location = cleanString(row['UBICACIÓN'] || row['UBICACION'] || row['ubicacion'] || '');
  
  const priceBox = parseNumber(row['PRECIO CAJA'] || row['PRECIO_CAJA']);
  const priceBlister = parseNumber(row['PRECIO BLIS'] || row['PRECIO_BLIS'] || row['PRECIO BLISTER'] || row['PRECIO_BLISTER']);
  const priceUnit = parseNumber(row['PRECIO UN'] || row['PRECIO_UN'] || row['PRECIO UNIDAD'] || row['PRECIO_UNIDAD']);
  
  const profitMargin = parsePercentage(row['% GANACIA'] || row['%_GANACIA'] || row['% GANANCIA'] || row['%_GANANCIA']);
  
  const costBox = parseNumber(row['COSTO CAJA'] || row['COSTO_CAJA']);
  const costBlister = parseNumber(row['COSTO BLIS'] || row['COSTO_BLIS'] || row['COSTO BLISTER'] || row['COSTO_BLISTER']);
  const costUnit = parseNumber(row['COSTO UNITARI'] || row['COSTO_UNITARI'] || row['COSTO UNITARIO'] || row['COSTO_UNITARIO']);
  
  const entryDate = parseExcelDate(row['FECHA INGRESO'] || row['FECHA_INGRESO']);
  const expirationDate = parseExcelDate(row['FECHA DE VENCIMIENTO'] || row['FECHA_DE_VENCIMIENTO'] || row['FECHA DE\nVENCIMIENTO']);
  
  const invoice = cleanString(row['FACTURA'] || row['factura'] || '');
  const totalSales = parseNumber(row['Total de ventas'] || row['Total_de_ventas'] || row['TOTAL DE VENTAS'] || 0);
  
  const stockInitial = parseNumber(row['STOCK INICIAL'] || row['STOCK_INICIAL'] || 0);
  const stockFinal = parseNumber(row['STOCK final'] || row['STOCK_final'] || row['STOCK FINAL'] || row['STOCK_FINAL'] || 0);
  
  const pharmaCompany = cleanString(row['CASA FARMACEUTICA'] || row['CASA_FARMACEUTICA'] || '');
  
  // Determinar paymentType - buscamos en la fila si hay un campo G/E
  const ge = cleanString(row['G/E'] || row['G_E'] || '');
  let paymentType = 'excento';
  if (ge.toLowerCase().includes('gravado')) {
    paymentType = 'gravado';
  }

  return {
    barcode,
    name,
    sellOptions: { unit: sellUnit, blister: sellBlister, box: sellBox },
    packaging: { unitsPerBlister: 0, blistersPerBox: 0, description: packagingDesc },
    category,
    location,
    prices: {
      unit: priceUnit || undefined,
      blister: priceBlister || undefined,
      box: priceBox || undefined,
    },
    purchasePrices: { unit: costUnit, blister: costBlister, box: costBox },
    profitMargin,
    entryDate,
    expirationDate,
    invoice,
    totalSales,
    stock: { units: stockFinal, blisters: 0, boxes: 0, initial: stockInitial },
    pharmaceuticalCompany: pharmaCompany,
    paymentType,
    sheetName,
  };
}

// ==========================================
// Leer Excel y parsear productos
// ==========================================

export async function parseExcelFile(file: File): Promise<{
  products: ParsedProduct[];
  categories: string[];
  companies: string[];
  sheetNames: string[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const sheetNames = workbook.SheetNames;
        const allProducts: ParsedProduct[] = [];
        let categories: string[] = [];
        let companies: string[] = [];

        // Buscar hojas de productos (Base de datos)
        for (const sheetName of sheetNames) {
          const lowerName = sheetName.toLowerCase();
          
          if (lowerName === 'listas' || lowerName === 'lista') {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

            for (const row of rows as any[]) {
              const cat = cleanString(row['CATEGORIA'] || row['CATEGORÍA'] || row['categoria'] || '');
              if (cat) categories.push(cat);

              const comp = cleanString(row['CASA FARMACEUTICA'] || row['CASA_FARMACEUTICA'] || row['CASA FARMACEÚTICA'] || '');
              if (comp) companies.push(comp);
            }

            // Remover duplicados
            categories = [...new Set(categories)];
            companies = [...new Set(companies)];
          } else {
            // Parse products from all other sheets
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
            
            for (const row of rows) {
              const product = parseProductRow(row, sheetName);
              if (product) {
                allProducts.push(product);
              }
            }
          }
        }


        resolve({ products: allProducts, categories, companies, sheetNames });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Error leyendo el archivo'));
    reader.readAsArrayBuffer(file);
  });
}

// ==========================================
// Importar productos a Firestore
// ==========================================

export async function importProductsToFirestore(
  products: ParsedProduct[],
  locationId: string,
  categories: string[],
  companies: string[],
  importCatalogs: boolean,
  updateExisting: boolean,
  onProgress: (current: number, total: number) => void,
): Promise<ImportResult> {
  const result: ImportResult = {
    totalRows: products.length,
    imported: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    categoriesAdded: 0,
    companiesAdded: 0,
  };

  // 1. Importar catálogos si se pidió
  if (importCatalogs) {
    if (categories.length > 0) {
      result.categoriesAdded = await bulkAddCategories(categories);
    }
    if (companies.length > 0) {
      result.companiesAdded = await bulkAddPharmaceuticalCompanies(companies);
    }
  }

  // 2. Obtener productos existentes para mapa de duplicados
  const existingProductsMap = new Map<string, string>();
  try {
    const productsRef = collection(db, 'ubicaciones', locationId, 'products');
    const productsSnap = await getDocs(productsRef);
    productsSnap.forEach(docSnap => {
      const data = docSnap.data();
      // Llave: nombre_fechaIngreso_fechaVencimiento
      const key = `${data.name || ''}_${data.entryDate || ''}_${data.expirationDate || ''}`.toLowerCase().trim();
      existingProductsMap.set(key, docSnap.id);
    });
  } catch (error) {
    console.error('Error fetching existing products for duplicate check:', error);
  }

  // 3. Importar productos en lotes de 400 (dejando margen del límite 500)
  const BATCH_SIZE = 400;
  
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = products.slice(i, i + BATCH_SIZE);
    let batchOperations = 0;

    for (let j = 0; j < chunk.length; j++) {
      const product = chunk[j];
      const rowIndex = i + j + 1;

      try {
        const productKey = `${product.name || ''}_${product.entryDate || ''}_${product.expirationDate || ''}`.toLowerCase().trim();
        const existingId = existingProductsMap.get(productKey);

        if (existingId) {
          if (!updateExisting) {
            // Omitir producto
            result.skipped++;
            continue;
          }

          // Actualizar producto existente (reemplazar stock)
          const productRef = doc(db, 'ubicaciones', locationId, 'products', existingId);
          
          const updateData: any = {
            barcode: product.barcode,
            category: product.category,
            sellOptions: product.sellOptions,
            packaging: product.packaging,
            prices: product.prices,
            purchasePrices: product.purchasePrices,
            profitMargin: product.profitMargin,
            invoice: product.invoice,
            totalSales: product.totalSales,
            stock: product.stock, // Reemplaza el stock con el del Excel
            pharmaceuticalCompany: product.pharmaceuticalCompany,
            paymentType: product.paymentType,
            updatedAt: Timestamp.now(),
          };

          Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined) {
              delete updateData[key];
            }
          });
          if (updateData.prices) {
            Object.keys(updateData.prices).forEach(key => {
              if (updateData.prices[key] === undefined) {
                delete updateData.prices[key];
              }
            });
          }

          batch.update(productRef, updateData);
          result.updated++;
          batchOperations++;
        } else {
          // Crear nuevo producto
          const productRef = doc(collection(db, 'ubicaciones', locationId, 'products'));
          
          const productData: any = {
            barcode: product.barcode,
            name: product.name,
            category: product.category,
            sellOptions: product.sellOptions,
            packaging: product.packaging,
            prices: product.prices,
            purchasePrices: product.purchasePrices,
            profitMargin: product.profitMargin,
            entryDate: product.entryDate,
            expirationDate: product.expirationDate,
            invoice: product.invoice,
            totalSales: product.totalSales,
            stock: product.stock,
            pharmaceuticalCompany: product.pharmaceuticalCompany,
            paymentType: product.paymentType,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          };

          Object.keys(productData).forEach(key => {
            if (productData[key] === undefined) {
              delete productData[key];
            }
          });
          if (productData.prices) {
            Object.keys(productData.prices).forEach(key => {
              if (productData.prices[key] === undefined) {
                delete productData.prices[key];
              }
            });
          }

          batch.set(productRef, productData);
          result.imported++;
          batchOperations++;
        }
      } catch (error: any) {
        result.errors.push({
          row: rowIndex,
          name: product.name || 'Desconocido',
          error: error.message || 'Error desconocido',
        });
      }
    }

    if (batchOperations > 0) {
      try {
        await batch.commit();
      } catch (batchError: any) {
        for (let j = 0; j < chunk.length; j++) {
          const rowIndex = i + j + 1;
          result.errors.push({
            row: rowIndex,
            name: chunk[j].name || 'Desconocido',
            error: `Error de lote: ${batchError.message}`,
          });
        }
        // Corrección aproximada de contadores en caso de fallo
        // Sería complejo revertir exacto cuántos eran update vs insert
      }
    }

    onProgress(Math.min(i + BATCH_SIZE, products.length), products.length);
  }

  return result;
}
