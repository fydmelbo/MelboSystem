export interface ProductPricing {
  unit?: number;    // Precio por unidad
  blister?: number; // Precio por blister
  box?: number;     // Precio por caja
}

export interface ProductStock {
  units: number;      // Stock en unidades individuales (stock final)
  blisters: number;   // Stock en blisters
  boxes: number;      // Stock en cajas
  initial: number;    // Stock inicial
}

export interface ProductPackaging {
  unitsPerBlister: number; // Unidades por blister
  blistersPerBox: number;  // Blisters por caja
  unitsPerBox: number;     // Unidades por caja (directo, cuando no hay blister)
  description: string;     // "Frasco x 100 mL", "Blister x 10/Unidad"
}

export interface Product {
  _id: string;
  barcode: string;
  name: string;
  category: string;              // Categoría del producto (desde colección 'categorias')
  expirationDate: string | Date; // Fecha de vencimiento
  entryDate: string | Date;      // Fecha de ingreso
  paymentType: string;           // 'gravado' | 'excento'
  pharmaceuticalCompany: string; // Casa farmacéutica (desde colección 'casasFarmaceuticas')
  profitMargin: number;          // % de ganancia
  invoice: string;               // Número de factura
  prices: ProductPricing;
  stock: ProductStock;
  packaging: ProductPackaging;
  purchasePrices: {
    unit?: number;
    blister?: number;
    box?: number;
  };
  sellOptions: {
    unit: boolean;
    blister: boolean;
    box: boolean;
  };
  location: {
    _id: any;
  };
  needsReview?: boolean;
}