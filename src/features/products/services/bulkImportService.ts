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
  packaging: { unitsPerBlister: number; blistersPerBox: number; unitsPerBox: number; description: string };
  category: string;
  location: string;
  prices: { unit?: number; blister?: number; box?: number };
  purchasePrices: { unit: number; blister: number; box: number };
  profitMargin: number;
  entryDate: string;
  expirationDate: string;
  invoice: string;
  stock: { units: number; blisters: number; boxes: number; initial: number };
  pharmaceuticalCompany: string;
  paymentType: string;
  sheetName: string;
  // Campo para rastrear si fue enriquecido desde Petapa
  enrichmentSource?: 'petapa' | 'excel-only';
}

// Resultado del enriquecimiento con Petapa
export interface EnrichmentResult {
  enrichedProducts: ParsedProduct[];
  matchedCount: number;   // Productos encontrados en Petapa
  unmatchedCount: number; // Productos NO encontrados en Petapa
  matchedNames: string[];   // Nombres de los que sí se encontraron
  unmatchedNames: string[]; // Nombres de los que NO se encontraron
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

  // Si es un Date object (de cellDates: true en XLSX)
  if (value instanceof Date) {
    // Usar getFullYear/getMonth/getDate para evitar problemas de timezone
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

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

  // Intentar parsear como string ISO o similar — usar local timezone
  // Agregar T12:00:00 para evitar que se interprete como UTC midnight y cambie de día
  const d = new Date(str + 'T12:00:00');
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
  
  // IMPORTANTE: En el Excel de la farmacia, las columnas "PRECIO" son los costos de compra
  // y las columnas "COSTO" son los precios de venta al público
  const purchaseBox = parseNumber(row['PRECIO CAJA'] || row['PRECIO_CAJA']);
  const purchaseBlister = parseNumber(row['PRECIO BLIS'] || row['PRECIO_BLIS'] || row['PRECIO BLISTER'] || row['PRECIO_BLISTER']);
  const purchaseUnit = parseNumber(row['PRECIO UN'] || row['PRECIO_UN'] || row['PRECIO UNIDAD'] || row['PRECIO_UNIDAD']);
  
  const profitMargin = parsePercentage(row['% GANACIA'] || row['%_GANACIA'] || row['% GANANCIA'] || row['%_GANANCIA']);
  
  // COSTO UNITARIO/BLIS/CAJA = precio de venta al público
  const saleBox = parseNumber(row['COSTO CAJA'] || row['COSTO_CAJA']);
  const saleBlister = parseNumber(row['COSTO BLIS'] || row['COSTO_BLIS'] || row['COSTO BLISTER'] || row['COSTO_BLISTER']);
  const saleUnit = parseNumber(row['COSTO UNITARI'] || row['COSTO_UNITARI'] || row['COSTO UNITARIO'] || row['COSTO_UNITARIO']);
  
  const entryDate = parseExcelDate(row['FECHA INGRESO'] || row['FECHA_INGRESO']);
  const expirationDate = parseExcelDate(row['FECHA DE VENCIMIENTO'] || row['FECHA_DE_VENCIMIENTO'] || row['FECHA DE\nVENCIMIENTO']);
  
  const invoice = cleanString(row['FACTURA'] || row['factura'] || '');
  
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
    packaging: { unitsPerBlister: 0, blistersPerBox: 0, unitsPerBox: 0, description: packagingDesc },
    category,
    location,
    prices: {
      unit: saleUnit || undefined,
      blister: saleBlister || undefined,
      box: saleBox || undefined,
    },
    purchasePrices: { unit: purchaseUnit, blister: purchaseBlister, box: purchaseBox },
    profitMargin,
    entryDate,
    expirationDate,
    invoice,
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
// Parser específico para Excel de San Jorge
// Hoja: "traslados a zona 12"
// ==========================================

function parseSanJorgeRow(row: any): ParsedProduct | null {
  // La columna del nombre en este Excel es un espacio literal ' '
  const name = cleanString(row[' '] || row['NOMBRE DE PRODUCTO'] || '');
  if (!name) return null;

  // Solo importar filas con inventario positivo en San Jorge
  const sanJorgeStock = parseNumber(row['Inventario San Jorge']);
  if (sanJorgeStock <= 0) return null;

  // Fecha de vencimiento SIEMPRE del Excel de San Jorge
  const expirationDate = parseExcelDate(row['vencimiento'] || '');

  // Precio de venta y costo del Excel
  const precioVenta = parseNumber(row['PRECIO DE VENTA']);
  const costoUnitario = parseNumber(row['Precio unitario COSTO']);

  // Margen de ganancia (viene como decimal, ej: 0.48 = 48%)
  const marginDecimal = parseNumber(row['__EMPTY']);
  const profitMargin = marginDecimal > 0 ? Math.round(marginDecimal * 100 * 100) / 100 : 0;

  // Categoría del Excel
  const category = cleanString(row['CATEGORIA'] || '');

  // Casa farmacéutica del Excel
  const pharmaceuticalCompany = cleanString(row['CASA FARMACEUTICA'] || '');

  // Tipo de pago: 'excento' o 'gravado'
  const geRaw = cleanString(row['Excento/Gravado'] || row['Ex/Gra'] || '');
  let paymentType = 'gravado';
  if (geRaw.toLowerCase().includes('excento') || geRaw.toLowerCase().includes('exento')) {
    paymentType = 'excento';
  }

  // Número de factura
  const invoice = cleanString(row['factura'] || '');

  // Distribución (NO es empaquetado, es descripción de presentación)
  const distribucion = cleanString(row['Distribución'] || '');

  // Fecha de ingreso: no viene en el Excel San Jorge, usar fecha actual
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const entryDate = `${year}-${month}-${day}`;

  return {
    barcode: '',  // Se llenará desde Petapa si existe
    name,
    sellOptions: { unit: true, blister: false, box: false }, // Default: solo unidad, se sobrescribe con Petapa
    packaging: {
      unitsPerBlister: 0,
      blistersPerBox: 0,
      unitsPerBox: 0,
      description: distribucion,
    },
    category: category || 'General',
    location: '',
    prices: {
      unit: precioVenta || undefined,
    },
    purchasePrices: {
      unit: costoUnitario,
      blister: 0,
      box: 0,
    },
    profitMargin,
    entryDate,
    expirationDate,
    invoice: String(invoice),
    stock: {
      units: sanJorgeStock,
      blisters: 0,
      boxes: 0,
      initial: sanJorgeStock,
    },
    pharmaceuticalCompany,
    paymentType,
    sheetName: 'junio 2026',
    enrichmentSource: 'excel-only',
  };
}

/**
 * Parsea el archivo Excel específico de San Jorge.
 * Lee la hoja "traslados a zona 12" y filtra solo productos con inventario > 0.
 */
export async function parseSanJorgeExcelFile(file: File): Promise<{
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
        const categoriesSet = new Set<string>();
        const companiesSet = new Set<string>();

        // Buscar la hoja "junio 2026" (o similar con 'junio')
        const targetSheetName = sheetNames.find(
          s => s.toLowerCase().includes('junio')
        ) || sheetNames[0];

        const sheet = workbook.Sheets[targetSheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        for (const row of rows) {
          const product = parseSanJorgeRow(row);
          if (product) {
            allProducts.push(product);
            if (product.category && product.category !== 'General') {
              categoriesSet.add(product.category);
            }
            if (product.pharmaceuticalCompany) {
              companiesSet.add(product.pharmaceuticalCompany);
            }
          }
        }

        resolve({
          products: allProducts,
          categories: [...categoriesSet],
          companies: [...companiesSet],
          sheetNames,
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Error leyendo el archivo'));
    reader.readAsArrayBuffer(file);
  });
}

// ==========================================
// Obtener productos de Petapa para cruce
// ==========================================

/**
 * Consulta TODOS los productos de una ubicación (ej. Petapa) en Firestore
 * y retorna un Map indexado por nombre en minúsculas para búsqueda rápida.
 */
export async function fetchLocationProductsMap(
  locationId: string
): Promise<Map<string, any>> {
  const productsMap = new Map<string, any>();

  try {
    const productsRef = collection(db, 'ubicaciones', locationId, 'products');
    const productsSnap = await getDocs(productsRef);

    productsSnap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.name) {
        // Indexar por nombre normalizado (minúsculas, sin espacios extra)
        const normalizedName = data.name.toLowerCase().trim().replace(/\s+/g, ' ');
        productsMap.set(normalizedName, data);
      }
    });
  } catch (error) {
    console.error('Error fetching products from location for enrichment:', error);
  }

  return productsMap;
}

// ==========================================
// Enriquecer productos de San Jorge con datos de Petapa
// ==========================================

/**
 * Recorre la lista de productos parseados del Excel de San Jorge
 * y los enriquece con datos de Petapa según la matriz de campos del plan.
 * 
 * Campos que se copian de Petapa (si existe):
 * - barcode, sellOptions, packaging (completo), prices (blister/box),
 *   purchasePrices (blister/box), category, pharmaceuticalCompany,
 *   paymentType, profitMargin
 * 
 * Campos que SIEMPRE vienen del Excel de San Jorge:
 * - name, expirationDate, stock, entryDate
 * 
 * Campos donde el Excel sobrescribe si tiene valor:
 * - prices.unit (PRECIO DE VENTA), purchasePrices.unit (Precio unitario COSTO)
 */
export function enrichSanJorgeProducts(
  products: ParsedProduct[],
  petapaMap: Map<string, any>
): EnrichmentResult {
  const matchedNames: string[] = [];
  const unmatchedNames: string[] = [];

  const enrichedProducts = products.map(product => {
    const normalizedName = product.name.toLowerCase().trim().replace(/\s+/g, ' ');
    const petapaProduct = petapaMap.get(normalizedName);

    if (petapaProduct) {
      matchedNames.push(product.name);

      // Guardar precios/costos originales del Excel de San Jorge
      const excelPriceUnit = product.prices.unit;
      const excelCostUnit = product.purchasePrices.unit;

      // --- Campos copiados de Petapa ---

      // Código de barras
      product.barcode = petapaProduct.barcode || '';

      // Opciones de venta (cómo se vende: unidad, blister, caja)
      if (petapaProduct.sellOptions) {
        product.sellOptions = {
          unit: petapaProduct.sellOptions.unit ?? true,
          blister: petapaProduct.sellOptions.blister ?? false,
          box: petapaProduct.sellOptions.box ?? false,
        };
      }

      // Empaquetado (unidades por blister, blisters por caja, etc.)
      if (petapaProduct.packaging) {
        product.packaging = {
          unitsPerBlister: petapaProduct.packaging.unitsPerBlister ?? 0,
          blistersPerBox: petapaProduct.packaging.blistersPerBox ?? 0,
          unitsPerBox: petapaProduct.packaging.unitsPerBox ?? 0,
          description: petapaProduct.packaging.description || product.packaging.description || '',
        };
      }

      // Precios de venta: copiar blister/box de Petapa, unit del Excel si existe
      if (petapaProduct.prices) {
        product.prices = {
          unit: excelPriceUnit || petapaProduct.prices.unit || undefined,
          blister: petapaProduct.prices.blister || undefined,
          box: petapaProduct.prices.box || undefined,
        };
      }

      // Costos de compra: copiar blister/box de Petapa, unit del Excel si existe
      if (petapaProduct.purchasePrices) {
        product.purchasePrices = {
          unit: excelCostUnit || petapaProduct.purchasePrices.unit || 0,
          blister: petapaProduct.purchasePrices.blister || 0,
          box: petapaProduct.purchasePrices.box || 0,
        };
      }

      // Categoría: preferir Petapa si tiene, sino mantener Excel
      if (petapaProduct.category) {
        product.category = petapaProduct.category;
      }

      // Casa farmacéutica: preferir Petapa si tiene, sino mantener Excel
      if (petapaProduct.pharmaceuticalCompany) {
        product.pharmaceuticalCompany = petapaProduct.pharmaceuticalCompany;
      }

      // Tipo de pago: preferir Petapa
      if (petapaProduct.paymentType) {
        product.paymentType = petapaProduct.paymentType;
      }

      // Margen de ganancia: preferir Petapa si tiene
      if (petapaProduct.profitMargin !== undefined && petapaProduct.profitMargin !== null) {
        product.profitMargin = petapaProduct.profitMargin;
      }

      product.enrichmentSource = 'petapa';
    } else {
      unmatchedNames.push(product.name);
      product.enrichmentSource = 'excel-only';
    }

    // Campos que NUNCA se copian de Petapa (siempre del Excel / San Jorge):
    // - name (ya viene del Excel)
    // - expirationDate (ya viene del Excel)
    // - stock (ya viene del Excel)
    // - entryDate (ya se asignó fecha actual)

    return product;
  });

  return {
    enrichedProducts,
    matchedCount: matchedNames.length,
    unmatchedCount: unmatchedNames.length,
    matchedNames,
    unmatchedNames,
  };
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
            prices: {
              ...(product.prices.unit ? { unit: Math.round(product.prices.unit * 100) / 100 } : {}),
              ...(product.prices.blister ? { blister: Math.round(product.prices.blister * 100) / 100 } : {}),
              ...(product.prices.box ? { box: Math.round(product.prices.box * 100) / 100 } : {}),
            },
            purchasePrices: {
              ...(product.purchasePrices.unit ? { unit: Math.round(product.purchasePrices.unit * 100) / 100 } : {}),
              ...(product.purchasePrices.blister ? { blister: Math.round(product.purchasePrices.blister * 100) / 100 } : {}),
              ...(product.purchasePrices.box ? { box: Math.round(product.purchasePrices.box * 100) / 100 } : {}),
            },
            profitMargin: product.profitMargin,
            invoice: product.invoice,
            stock: product.stock, // Reemplaza el stock con el del Excel
            pharmaceuticalCompany: product.pharmaceuticalCompany,
            paymentType: product.paymentType,
            needsReview: product.enrichmentSource === 'excel-only',
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
            prices: {
              ...(product.prices.unit ? { unit: Math.round(product.prices.unit * 100) / 100 } : {}),
              ...(product.prices.blister ? { blister: Math.round(product.prices.blister * 100) / 100 } : {}),
              ...(product.prices.box ? { box: Math.round(product.prices.box * 100) / 100 } : {}),
            },
            purchasePrices: {
              ...(product.purchasePrices.unit ? { unit: Math.round(product.purchasePrices.unit * 100) / 100 } : {}),
              ...(product.purchasePrices.blister ? { blister: Math.round(product.purchasePrices.blister * 100) / 100 } : {}),
              ...(product.purchasePrices.box ? { box: Math.round(product.purchasePrices.box * 100) / 100 } : {}),
            },
            profitMargin: product.profitMargin,
            entryDate: product.entryDate,
            expirationDate: product.expirationDate,
            invoice: product.invoice,
            stock: product.stock,
            pharmaceuticalCompany: product.pharmaceuticalCompany,
            paymentType: product.paymentType,
            needsReview: product.enrichmentSource === 'excel-only',
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

// ==========================================
// Eliminar TODOS los productos de todas las ubicaciones
// ==========================================

export async function deleteAllProducts(
  onProgress?: (current: number, total: number) => void
): Promise<{ deleted: number }> {
  const ubicacionesSnap = await getDocs(collection(db, 'ubicaciones'));
  let totalDeleted = 0;
  let totalToDelete = 0;

  // Primero contar todos los productos
  const allProductRefs: any[] = [];
  for (const ubDoc of ubicacionesSnap.docs) {
    const productsRef = collection(db, 'ubicaciones', ubDoc.id, 'products');
    const productsSnap = await getDocs(productsRef);
    productsSnap.docs.forEach(d => allProductRefs.push(d.ref));
  }
  totalToDelete = allProductRefs.length;

  if (totalToDelete === 0) {
    return { deleted: 0 };
  }

  // Eliminar en lotes de 450
  const BATCH_SIZE = 450;
  for (let i = 0; i < allProductRefs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = allProductRefs.slice(i, i + BATCH_SIZE);
    chunk.forEach(ref => batch.delete(ref));
    await batch.commit();
    totalDeleted += chunk.length;
    onProgress?.(totalDeleted, totalToDelete);
  }

  return { deleted: totalDeleted };
}
