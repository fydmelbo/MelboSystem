import { describe, it, expect } from 'vitest';

interface ProductFormData {
  name: string;
  category: string;
  sellOptions: { unit: boolean; blister: boolean; box: boolean };
  prices: { unit: string; blister: string; box: string };
  entryDate: string;
  location: string;
}

function validateProductStep(step: number, formData: ProductFormData): { errors: Record<string, string>; isValid: boolean } {
  const errors: Record<string, string> = {};
  let isValid = true;

  if (step === 0) {
    if (!formData.name.trim()) { errors.name = 'El nombre es obligatorio'; isValid = false; }
    if (!formData.category) { errors.category = 'Seleccione una categoría'; isValid = false; }
  } else if (step === 1) {
    if (!formData.sellOptions.unit && !formData.sellOptions.blister && !formData.sellOptions.box) {
      errors.sellOptions = 'Debe seleccionar al menos una opción de venta';
      isValid = false;
    }
    if (formData.sellOptions.unit && (!formData.prices.unit || Number(formData.prices.unit) <= 0)) {
      errors.priceUnit = 'Precio unitario inválido';
      isValid = false;
    }
    if (formData.sellOptions.blister && (!formData.prices.blister || Number(formData.prices.blister) <= 0)) {
      errors.priceBlister = 'Precio de blister inválido';
      isValid = false;
    }
    if (formData.sellOptions.box && (!formData.prices.box || Number(formData.prices.box) <= 0)) {
      errors.priceBox = 'Precio de caja inválido';
      isValid = false;
    }
  } else if (step === 2) {
    if (!formData.entryDate) { errors.entryDate = 'Fecha de ingreso obligatoria'; isValid = false; }
  } else if (step === 3) {
    if (!formData.location) { errors.location = 'Ubicación requerida'; isValid = false; }
  }

  return { errors, isValid };
}

describe('Product Validation', () => {
  const baseFormData: ProductFormData = {
    name: 'Paracetamol',
    category: 'Analgésicos',
    sellOptions: { unit: true, blister: false, box: false },
    prices: { unit: '10', blister: '', box: '' },
    entryDate: '2024-01-15',
    location: 'loc1',
  };

  describe('Step 0 - General Info', () => {
    it('fails when name is empty', () => {
      const result = validateProductStep(0, { ...baseFormData, name: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it('fails when category is empty', () => {
      const result = validateProductStep(0, { ...baseFormData, category: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.category).toBeDefined();
    });

    it('passes with valid data', () => {
      const result = validateProductStep(0, baseFormData);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Step 1 - Prices', () => {
    it('fails when no sell option selected', () => {
      const result = validateProductStep(1, {
        ...baseFormData,
        sellOptions: { unit: false, blister: false, box: false },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.sellOptions).toBeDefined();
    });

    it('fails when unit selected but price is empty', () => {
      const result = validateProductStep(1, {
        ...baseFormData,
        sellOptions: { unit: true, blister: false, box: false },
        prices: { unit: '', blister: '', box: '' },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.priceUnit).toBeDefined();
    });

    it('fails when unit selected but price is zero', () => {
      const result = validateProductStep(1, {
        ...baseFormData,
        sellOptions: { unit: true, blister: false, box: false },
        prices: { unit: '0', blister: '', box: '' },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.priceUnit).toBeDefined();
    });

    it('fails when blister selected but price is empty', () => {
      const result = validateProductStep(1, {
        ...baseFormData,
        sellOptions: { unit: true, blister: true, box: false },
        prices: { unit: '10', blister: '', box: '' },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.priceBlister).toBeDefined();
    });

    it('fails when box selected but price is empty', () => {
      const result = validateProductStep(1, {
        ...baseFormData,
        sellOptions: { unit: false, blister: false, box: true },
        prices: { unit: '', blister: '', box: '' },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.priceBox).toBeDefined();
    });

    it('passes when blister selected with valid price', () => {
      const result = validateProductStep(1, {
        ...baseFormData,
        sellOptions: { unit: true, blister: true, box: false },
        prices: { unit: '10', blister: '50', box: '' },
      });
      expect(result.isValid).toBe(true);
    });

    it('passes when box selected with valid price', () => {
      const result = validateProductStep(1, {
        ...baseFormData,
        sellOptions: { unit: false, blister: false, box: true },
        prices: { unit: '', blister: '', box: '200' },
      });
      expect(result.isValid).toBe(true);
    });
  });
});
