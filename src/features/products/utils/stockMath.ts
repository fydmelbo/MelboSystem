// src/features/products/utils/stockMath.ts
// Helpers puros para distribuir stock entre cajas / blisters / unidades
// respetando la configuración de empaque y las opciones de venta.
//
// Modelo: las tres magnitudes (boxes, blisters, units) son TOTALES.
//   - boxes           = número de cajas
//   - blisters        = blisters totales = blisters en cajas + blisters sueltos
//   - units           = unidades totales  = unidades en blisters + unidades sueltas
//   - TOTAL unidades  = boxes * (blistersPerBox * unitsPerBlister)
//                     + blisters sueltos * unitsPerBlister
//                     + unidades sueltas

export interface StockPackaging {
  unitsPerBlister: number;
  blistersPerBox: number;
  unitsPerBox: number;
}

export interface StockSellOptions {
  unit: boolean;
  blister: boolean;
  box: boolean;
}

export interface NormalizedStock {
  boxes: number;
  blisters: number;
  units: number;
}

const sanitize = (n: number, fallback = 1) => {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return fallback;
  return Math.floor(v);
};

const safe = (n: number) => {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 0) return 0;
  return Math.floor(v);
};

/**
 * Normaliza el stock a partir del TOTAL de unidades.
 * El campo `units` del resultado es el mismo `total` recibido.
 */
export function normalizeFromUnits(
  total: number,
  packaging: StockPackaging,
  sellOptions: StockSellOptions,
): NormalizedStock {
  const totalSafe = safe(total);
  const uPerB = sanitize(packaging.unitsPerBlister);
  const bPerBox = sanitize(packaging.blistersPerBox);

  // box + blister (+ unit implícito): ruta completa
  if (sellOptions.box && sellOptions.blister) {
    const unitsInBox = bPerBox * uPerB;
    const boxes = Math.floor(totalSafe / unitsInBox);
    const rem1 = totalSafe - boxes * unitsInBox;
    const blistersSueltos = Math.floor(rem1 / uPerB);
    const unidadesSueltas = rem1 - blistersSueltos * uPerB;
    return {
      boxes,
      blisters: boxes * bPerBox + blistersSueltos,
      units: totalSafe,
    };
  }

  // box only (sin blister): unidadesPorCaja = unitsPerBox
  if (sellOptions.box) {
    const uPerBox = sanitize(packaging.unitsPerBox);
    const boxes = Math.floor(totalSafe / uPerBox);
    return { boxes, blisters: 0, units: totalSafe };
  }

  // blister only (sin box)
  if (sellOptions.blister) {
    const blisters = Math.floor(totalSafe / uPerB);
    return { boxes: 0, blisters, units: totalSafe };
  }

  // unit only
  return { boxes: 0, blisters: 0, units: totalSafe };
}

/**
 * Normaliza el stock a partir del TOTAL de blisters.
 * El campo `blisters` del resultado es el mismo `total` recibido.
 */
export function normalizeFromBlisters(
  total: number,
  packaging: StockPackaging,
  sellOptions: StockSellOptions,
): NormalizedStock {
  const totalSafe = safe(total);
  const uPerB = sanitize(packaging.unitsPerBlister);
  const bPerBox = sanitize(packaging.blistersPerBox);

  // box + blister: la mayor parte van a cajas
  if (sellOptions.box && sellOptions.blister) {
    const boxes = Math.floor(totalSafe / bPerBox);
    const blistersSueltos = totalSafe - boxes * bPerBox;
    const unidadesSueltas = blistersSueltos * uPerB;
    const units = boxes * bPerBox * uPerB + unidadesSueltas;
    return { boxes, blisters: totalSafe, units };
  }

  // box only (sin blister)
  if (sellOptions.box) {
    const uPerBox = sanitize(packaging.unitsPerBox);
    const boxes = Math.floor(totalSafe / bPerBox);
    return { boxes, blisters: totalSafe, units: boxes * bPerBox * uPerBox };
  }

  // blister only (sin box): 1 blister = uPerB unidades
  if (sellOptions.blister) {
    return { boxes: 0, blisters: totalSafe, units: totalSafe * uPerB };
  }

  // unit only: el campo blisters no aplica
  return { boxes: 0, blisters: 0, units: 0 };
}

/**
 * Auto-fill al cambiar `boxes` (NO es normalización desde el total,
 * es el contenido implícito de las cajas).
 */
export function autoFillFromBoxes(
  boxes: number,
  packaging: StockPackaging,
  sellOptions: StockSellOptions,
): NormalizedStock {
  const boxesSafe = safe(boxes);
  const uPerB = sanitize(packaging.unitsPerBlister);
  const bPerBox = sanitize(packaging.blistersPerBox);
  const uPerBox = sanitize(packaging.unitsPerBox);

  if (sellOptions.box && sellOptions.blister) {
    const blisters = boxesSafe * bPerBox;
    return { boxes: boxesSafe, blisters, units: blisters * uPerB };
  }

  if (sellOptions.box) {
    return { boxes: boxesSafe, blisters: 0, units: boxesSafe * uPerBox };
  }

  // sin opción de venta por caja activa
  return { boxes: boxesSafe, blisters: 0, units: 0 };
}

/**
 * Devuelve el total de unidades del stock.
 * En el modelo TOTAL, el campo `units` ya ES el total, así que se devuelve tal cual.
 * Se conserva la firma con `packaging` y `sellOptions` por simetría con el resto de
 * helpers y para tolerar datos legados donde `units` pueda ser suelto.
 */
export function computeTotalUnits(
  stock: { boxes: number; blisters: number; units: number },
  _packaging?: StockPackaging,
  _sellOptions?: StockSellOptions,
): number {
  return safe(stock.units);
}

/**
 * Convierte una cantidad vendida a unidades a deducir del TOTAL,
 * respetando el tipo de venta y la configuración de empaque.
 */
export function unitsToDeductForSale(
  quantity: number,
  saleType: 'unit' | 'blister' | 'box',
  packaging: StockPackaging,
  sellOptions: StockSellOptions,
): number {
  const uPerB = sanitize(packaging.unitsPerBlister);
  const bPerBox = sanitize(packaging.blistersPerBox);
  const uPerBox = sanitize(packaging.unitsPerBox);
  const qty = Math.max(0, Math.floor(Number(quantity) || 0));

  if (saleType === 'unit') return qty;
  if (saleType === 'blister') return qty * uPerB;
  // box
  if (sellOptions.blister) {
    return qty * uPerB * bPerBox;
  }
  return qty * uPerBox;
}

export interface SaleResult {
  ok: boolean;
  remaining: NormalizedStock;
  error?: string;
}

/**
 * Aplica una venta al stock actual y devuelve el stock restante normalizado.
 * Si no hay stock suficiente, devuelve `ok: false` con un mensaje de error.
 */
export function deductFromStock(
  currentStock: { boxes: number; blisters: number; units: number },
  quantity: number,
  saleType: 'unit' | 'blister' | 'box',
  packaging: StockPackaging,
  sellOptions: StockSellOptions,
): SaleResult {
  const totalAvailable = safe(currentStock.units);
  const toDeduct = unitsToDeductForSale(quantity, saleType, packaging, sellOptions);
  const remainingTotal = totalAvailable - toDeduct;

  if (remainingTotal < 0) {
    return {
      ok: false,
      remaining: normalizeFromUnits(totalAvailable, packaging, sellOptions),
      error: 'Stock insuficiente',
    };
  }

  return {
    ok: true,
    remaining: normalizeFromUnits(remainingTotal, packaging, sellOptions),
  };
}

/**
 * Descuenta `unitsToDeduct` unidades del TOTAL de stock (`stock.units`)
 * y devuelve el stock restante re-normalizado. A diferencia de
 * `deductFromStock`, esta función NO convierte desde presentación: el
 * caller ya pasó la cantidad en unidades (por ejemplo, multiplicando
 * cantidad × empaque, o el `getQuantity` de una promoción NxM).
 *
 * Usar cuando se quiere evitar la doble conversión que ocurre si se
 * pasa una cantidad en presentación y luego `deductFromStock` la vuelve
 * a multiplicar por el empaque.
 */
export function deductUnitsFromStock(
  currentStock: { boxes: number; blisters: number; units: number },
  unitsToDeduct: number,
  packaging: StockPackaging,
  sellOptions: StockSellOptions,
): SaleResult {
  const totalAvailable = safe(currentStock.units);
  const toDeduct = safe(unitsToDeduct);
  const remainingTotal = totalAvailable - toDeduct;

  if (remainingTotal < 0) {
    return {
      ok: false,
      remaining: normalizeFromUnits(totalAvailable, packaging, sellOptions),
      error: 'Stock insuficiente',
    };
  }

  return {
    ok: true,
    remaining: normalizeFromUnits(remainingTotal, packaging, sellOptions),
  };
}
