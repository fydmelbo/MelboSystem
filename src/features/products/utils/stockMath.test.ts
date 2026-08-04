import { describe, it, expect } from 'vitest';
import {
  normalizeFromUnits,
  normalizeFromBlisters,
  autoFillFromBoxes,
  computeTotalUnits,
  unitsToDeductForSale,
  deductFromStock,
  StockPackaging,
  StockSellOptions,
} from '../utils/stockMath';

const configStandard: StockPackaging = {
  unitsPerBlister: 10,
  blistersPerBox: 10,
  unitsPerBox: 100, // cuando no hay blister
};

const sellAll: StockSellOptions = { unit: true, blister: true, box: true };
const sellBoxBlister: StockSellOptions = { unit: false, blister: true, box: true };
const sellBoxUnit: StockSellOptions = { unit: true, blister: false, box: true };
const sellBoxOnly: StockSellOptions = { unit: false, blister: false, box: true };
const sellBlisterOnly: StockSellOptions = { unit: false, blister: true, box: false };
const sellUnitOnly: StockSellOptions = { unit: true, blister: false, box: false };

describe('normalizeFromUnits', () => {
  describe('box + blister + unit (config: 10 blister/caja, 10 unidades/blister)', () => {
    it('302 → 3 cajas / 30 blisters / 302 unidades', () => {
      const r = normalizeFromUnits(302, configStandard, sellAll);
      expect(r).toEqual({ boxes: 3, blisters: 30, units: 302 });
    });

    it('312 → 3 cajas / 31 blisters / 312 unidades', () => {
      const r = normalizeFromUnits(312, configStandard, sellAll);
      expect(r).toEqual({ boxes: 3, blisters: 31, units: 312 });
    });

    it('402 → 4 cajas / 40 blisters / 402 unidades', () => {
      const r = normalizeFromUnits(402, configStandard, sellAll);
      expect(r).toEqual({ boxes: 4, blisters: 40, units: 402 });
    });

    it('100 → 1 caja / 10 blisters / 100 unidades', () => {
      const r = normalizeFromUnits(100, configStandard, sellAll);
      expect(r).toEqual({ boxes: 1, blisters: 10, units: 100 });
    });

    it('110 → 1 caja / 11 blisters / 110 unidades', () => {
      const r = normalizeFromUnits(110, configStandard, sellAll);
      expect(r).toEqual({ boxes: 1, blisters: 11, units: 110 });
    });

    it('0 → 0 / 0 / 0', () => {
      const r = normalizeFromUnits(0, configStandard, sellAll);
      expect(r).toEqual({ boxes: 0, blisters: 0, units: 0 });
    });

    it('1 → 0 cajas / 0 blisters / 1 unidad', () => {
      const r = normalizeFromUnits(1, configStandard, sellAll);
      expect(r).toEqual({ boxes: 0, blisters: 0, units: 1 });
    });

    it('10 → 0 cajas / 1 blister / 10 unidades', () => {
      const r = normalizeFromUnits(10, configStandard, sellAll);
      expect(r).toEqual({ boxes: 0, blisters: 1, units: 10 });
    });

    it('valores extremos: 9999', () => {
      const r = normalizeFromUnits(9999, configStandard, sellAll);
      // 9999 / 100 = 99 cajas (9900), rem = 99, blistersSueltos = 9, unidadesSueltas = 9
      expect(r).toEqual({ boxes: 99, blisters: 99 * 10 + 9, units: 9999 });
    });
  });

  describe('solo box (config: 100 unidades/caja)', () => {
    it('250 → 2 cajas / 0 blisters / 250 unidades', () => {
      const r = normalizeFromUnits(250, configStandard, sellBoxOnly);
      expect(r).toEqual({ boxes: 2, blisters: 0, units: 250 });
    });

    it('100 exacto → 1 caja / 0 / 100', () => {
      const r = normalizeFromUnits(100, configStandard, sellBoxOnly);
      expect(r).toEqual({ boxes: 1, blisters: 0, units: 100 });
    });
  });

  describe('solo blister (config: 10 unidades/blister)', () => {
    it('25 → 0 cajas / 2 blisters / 25 unidades', () => {
      const r = normalizeFromUnits(25, configStandard, sellBlisterOnly);
      expect(r).toEqual({ boxes: 0, blisters: 2, units: 25 });
    });
  });

  describe('solo unit', () => {
    it('cualquier valor → 0 / 0 / valor', () => {
      const r = normalizeFromUnits(7, configStandard, sellUnitOnly);
      expect(r).toEqual({ boxes: 0, blisters: 0, units: 7 });
    });
  });

  describe('edge cases', () => {
    it('NaN → 0 / 0 / 0', () => {
      const r = normalizeFromUnits(NaN, configStandard, sellAll);
      expect(r).toEqual({ boxes: 0, blisters: 0, units: 0 });
    });

    it('negativo → tratado como 0', () => {
      const r = normalizeFromUnits(-10, configStandard, sellAll);
      expect(r).toEqual({ boxes: 0, blisters: 0, units: 0 });
    });

    it('config con unitsPerBlister = 0 → fallback a 1 (no división por cero)', () => {
      const cfg: StockPackaging = { unitsPerBlister: 0, blistersPerBox: 10, unitsPerBox: 100 };
      const r = normalizeFromUnits(50, cfg, sellAll);
      // Con uPerB fallback a 1: unitsInBox = 10*1=10, boxes=5, rem=0, blistersSueltos=0, unidadesSueltas=0
      expect(r.boxes).toBe(5);
      expect(r.units).toBe(50);
    });
  });
});

describe('normalizeFromBlisters', () => {
  it('30 blisters (box+blister) → 3 cajas / 30 blisters / 300 unidades', () => {
    const r = normalizeFromBlisters(30, configStandard, sellAll);
    expect(r).toEqual({ boxes: 3, blisters: 30, units: 300 });
  });

  it('15 blisters (box+blister) → 1 caja / 15 blisters / 150 unidades', () => {
    const r = normalizeFromBlisters(15, configStandard, sellAll);
    // boxes = 1, blistersSueltos = 5, unidadesSueltas = 50, units = 100 + 50 = 150
    expect(r).toEqual({ boxes: 1, blisters: 15, units: 150 });
  });

  it('10 blisters (box+blister) → 1 caja / 10 blisters / 100 unidades', () => {
    const r = normalizeFromBlisters(10, configStandard, sellAll);
    expect(r).toEqual({ boxes: 1, blisters: 10, units: 100 });
  });

  it('0 blisters → 0 / 0 / 0', () => {
    const r = normalizeFromBlisters(0, configStandard, sellAll);
    expect(r).toEqual({ boxes: 0, blisters: 0, units: 0 });
  });

  it('solo blister: 5 → 0 / 5 / 50', () => {
    const r = normalizeFromBlisters(5, configStandard, sellBlisterOnly);
    expect(r).toEqual({ boxes: 0, blisters: 5, units: 50 });
  });
});

describe('autoFillFromBoxes', () => {
  it('3 cajas (box+blister) → 3 / 30 / 300', () => {
    const r = autoFillFromBoxes(3, configStandard, sellAll);
    expect(r).toEqual({ boxes: 3, blisters: 30, units: 300 });
  });

  it('5 cajas (solo box) → 5 / 0 / 500', () => {
    const r = autoFillFromBoxes(5, configStandard, sellBoxOnly);
    expect(r).toEqual({ boxes: 5, blisters: 0, units: 500 });
  });

  it('0 cajas → 0 / 0 / 0', () => {
    const r = autoFillFromBoxes(0, configStandard, sellAll);
    expect(r).toEqual({ boxes: 0, blisters: 0, units: 0 });
  });
});

describe('computeTotalUnits', () => {
  it('3 cajas + 30 blisters + 300 unidades → 300 (units ES el total)', () => {
    const r = computeTotalUnits(
      { boxes: 3, blisters: 30, units: 300 },
      configStandard,
      sellAll,
    );
    expect(r).toBe(300);
  });

  it('3 cajas + 30 blisters + 302 unidades → 302', () => {
    const r = computeTotalUnits(
      { boxes: 3, blisters: 30, units: 302 },
      configStandard,
      sellAll,
    );
    expect(r).toBe(302);
  });

  it('3 cajas + 31 blisters + 312 unidades → 312', () => {
    const r = computeTotalUnits(
      { boxes: 3, blisters: 31, units: 312 },
      configStandard,
      sellAll,
    );
    expect(r).toBe(312);
  });

  it('4 cajas + 40 blisters + 402 unidades → 402', () => {
    const r = computeTotalUnits(
      { boxes: 4, blisters: 40, units: 402 },
      configStandard,
      sellAll,
    );
    expect(r).toBe(402);
  });

  it('roundtrip: normalizeFromUnits(N) → computeTotalUnits → N', () => {
    for (const n of [0, 1, 10, 99, 100, 101, 110, 200, 302, 312, 402, 1000, 9999]) {
      const norm = normalizeFromUnits(n, configStandard, sellAll);
      const total = computeTotalUnits(norm, configStandard, sellAll);
      expect(total).toBe(n);
    }
  });

  it('ignora packaging/sellOptions: devuelve units directamente', () => {
    expect(computeTotalUnits({ boxes: 0, blisters: 0, units: 7 })).toBe(7);
    expect(computeTotalUnits({ boxes: 0, blisters: 0, units: 0 })).toBe(0);
  });
});

describe('unitsToDeductForSale', () => {
  it('unit: 1 unidad → 1', () => {
    expect(unitsToDeductForSale(1, 'unit', configStandard, sellAll)).toBe(1);
  });

  it('blister: 1 blister con uPerB=10 → 10 unidades', () => {
    expect(unitsToDeductForSale(1, 'blister', configStandard, sellAll)).toBe(10);
  });

  it('box (con blister): 1 caja con 10×10 → 100 unidades', () => {
    expect(unitsToDeductForSale(1, 'box', configStandard, sellAll)).toBe(100);
  });

  it('box (sin blister, con unitsPerBox=100): 1 caja → 100 unidades', () => {
    expect(unitsToDeductForSale(1, 'box', configStandard, sellBoxOnly)).toBe(100);
  });

  it('blister: 3 blisters → 30 unidades', () => {
    expect(unitsToDeductForSale(3, 'blister', configStandard, sellAll)).toBe(30);
  });

  it('box: 2 cajas → 200 unidades', () => {
    expect(unitsToDeductForSale(2, 'box', configStandard, sellAll)).toBe(200);
  });

  it('quantity negativo o NaN se trata como 0', () => {
    expect(unitsToDeductForSale(-5, 'unit', configStandard, sellAll)).toBe(0);
    expect(unitsToDeductForSale(NaN, 'unit', configStandard, sellAll)).toBe(0);
  });
});

describe('deductFromStock', () => {
  describe('caso de Lucy: 3 cajas (300 unidades) + 2 sueltas (TOTAL=302)', () => {
    // El auto-fill de 3 cajas da blisters=30, units=300.
    // Al añadir 2 unidades sueltas via handleUnitsChange queda en units=302
    // (TOTAL), cajas=3, blisters=30.
    const initial = { boxes: 3, blisters: 30, units: 302 };

    it('vender 1 unidad: queda 3 cajas / 30 blisters / 301 unidades', () => {
      const r = deductFromStock(initial, 1, 'unit', configStandard, sellAll);
      expect(r.ok).toBe(true);
      expect(r.remaining).toEqual({ boxes: 3, blisters: 30, units: 301 });
    });

    it('vender 1 blister (10 unidades): queda 2 cajas / 29 blisters / 292 unidades', () => {
      // 302 - 10 = 292. boxes=floor(292/100)=2, rem1=92, blistersSueltos=9, unidadesSueltas=2
      // blisters(TOTAL) = 2*10 + 9 = 29, units = 292
      const r = deductFromStock(initial, 1, 'blister', configStandard, sellAll);
      expect(r.ok).toBe(true);
      expect(r.remaining).toEqual({ boxes: 2, blisters: 29, units: 292 });
    });

    it('vender 1 caja (100 unidades): queda 2 cajas / 30 blisters / 202 unidades', () => {
      const r = deductFromStock(initial, 1, 'box', configStandard, sellAll);
      expect(r.ok).toBe(true);
      // remainingTotal = 302 - 100 = 202
      // boxes = floor(202/100) = 2
      // rem1 = 2, blistersSueltos = 0, unidadesSueltas = 2
      // blisters = 2*10 + 0 = 20
      // units = 202
      expect(r.remaining).toEqual({ boxes: 2, blisters: 20, units: 202 });
    });

    it('vender 3 cajas (300 unidades): queda 0 cajas / 0 blisters / 2 unidades', () => {
      const r = deductFromStock(initial, 3, 'box', configStandard, sellAll);
      expect(r.ok).toBe(true);
      expect(r.remaining).toEqual({ boxes: 0, blisters: 0, units: 2 });
    });

    it('vender 4 cajas (400 unidades): error de stock insuficiente', () => {
      const r = deductFromStock(initial, 4, 'box', configStandard, sellAll);
      expect(r.ok).toBe(false);
      expect(r.error).toBe('Stock insuficiente');
    });

    it('vender más de lo disponible: error de stock insuficiente', () => {
      const r = deductFromStock(initial, 500, 'unit', configStandard, sellAll);
      expect(r.ok).toBe(false);
      expect(r.error).toBe('Stock insuficiente');
    });
  });

  describe('caso 5 cajas (500 unidades)', () => {
    const initial = { boxes: 5, blisters: 50, units: 500 };

    it('vender 1 caja: queda 4 cajas / 40 blisters / 400 unidades (400 TOTAL)', () => {
      // 500 - 100 = 400. boxes=4, rem1=0, blistersSueltos=0, unidadesSueltas=0
      // blisters(TOTAL) = 4*10 + 0 = 40, units = 400
      const r = deductFromStock(initial, 1, 'box', configStandard, sellAll);
      expect(r.ok).toBe(true);
      expect(r.remaining).toEqual({ boxes: 4, blisters: 40, units: 400 });
    });
  });

  describe('stock inicial 0', () => {
    it('cualquier venta: error', () => {
      const r = deductFromStock({ boxes: 0, blisters: 0, units: 0 }, 1, 'unit', configStandard, sellAll);
      expect(r.ok).toBe(false);
      expect(r.error).toBe('Stock insuficiente');
    });
  });

  describe('consistencia con normalizeFromUnits', () => {
    it('deductFromStock → remaining == normalizeFromUnits(remainingTotal)', () => {
      const initial = { boxes: 3, blisters: 30, units: 302 };
      const r = deductFromStock(initial, 100, 'unit', configStandard, sellAll);
      expect(r.ok).toBe(true);
      // remainingTotal = 302 - 100 = 202
      const expected = normalizeFromUnits(202, configStandard, sellAll);
      expect(r.remaining).toEqual(expected);
    });
  });
});
