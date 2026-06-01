import { Product } from '../features/products/types/Product';

export const mockProducts: Product[] = [
  {
    _id: '1',
    barcode: '7501234567890',
    name: 'Paracetamol 500mg',
    prices: {
      unit: 1.25, // Q1.25 por unidad
      blister: 10.00, // Q10.00 por blister
      box: 85.00 // Q85.00 por caja
    },
    stock: {
      units: 100, // 100 unidades individuales
      blisters: 10, // 10 blisters
      boxes: 1 // 1 caja
    },
    packaging: {
      unitsPerBlister: 10, // 10 unidades por blister
      blistersPerBox: 10 // 10 blisters por caja
    },
    sellOptions: {
      unit: true,
      blister: true,
      box: true
    },
    types: undefined,
    expirationDate: '',
    paymentType: [],
    pharmaceuticalCompany: '',
    purchasePrices: {
      unit: 0,
      blister: 0,
      box: 0
    },
    location: {
      _id: undefined
    }
  },
  {
    _id: '2',
    barcode: '7502345678901',
    name: 'Ibuprofeno 400mg',
    prices: {
      unit: 1.50, // Q1.50 por unidad
      blister: 12.00 // Q12.00 por blister
    },
    stock: {
      units: 85, // 85 unidades individuales
      blisters: 10, // 10 blisters
      boxes: 0 // No se vende por caja
    },
    packaging: {
      unitsPerBlister: 8, // 8 unidades por blister
      blistersPerBox: 10 // No relevante ya que no se vende por caja
    },
    sellOptions: {
      unit: true,
      blister: true,
      box: false
    },
    types: undefined,
    expirationDate: '',
    paymentType: [],
    pharmaceuticalCompany: '',
    purchasePrices: {
      unit: 0,
      blister: 0,
      box: 0
    },
    location: {
      _id: undefined
    }
  },
  {
    _id: '3',
    barcode: '7503456789012',
    name: 'Omeprazol 20mg',
    prices: {
      blister: 25.00, // Q25.00 por blister
      box: 225.00 // Q225.00 por caja
    },
    stock: {
      units: 140, // 140 unidades totales
      blisters: 10, // 10 blisters
      boxes: 1 // 1 caja
    },
    packaging: {
      unitsPerBlister: 14, // 14 unidades por blister
      blistersPerBox: 10 // 10 blisters por caja
    },
    sellOptions: {
      unit: false,
      blister: true,
      box: true
    },
    types: undefined,
    expirationDate: '',
    paymentType: [],
    pharmaceuticalCompany: '',
    purchasePrices: {
      unit: 0,
      blister: 0,
      box: 0
    },
    location: {
      _id: undefined
    }
  },
  {
    _id: '4',
    barcode: '7504567890123',
    name: 'Amoxicilina 500mg',
    prices: {
      blister: 35.00, // Q35.00 por blister
      box: 350.00 // Q350.00 por caja
    },
    stock: {
      units: 144, // 144 unidades totales
      blisters: 12, // 12 blisters
      boxes: 1 // 1 caja
    },
    packaging: {
      unitsPerBlister: 12, // 12 unidades por blister
      blistersPerBox: 12 // 12 blisters por caja
    },
    sellOptions: {
      unit: false,
      blister: true,
      box: true
    },
    types: undefined,
    expirationDate: '',
    paymentType: [],
    pharmaceuticalCompany: '',
    purchasePrices: {
      unit: 0,
      blister: 0,
      box: 0
    },
    location: {
      _id: undefined
    }
  },
  {
    _id: '5',
    barcode: '7505678901234',
    name: 'Jeringa 5ml',
    prices: {
      unit: 3.50 // Q3.50 por unidad
    },
    stock: {
      units: 75, // 75 unidades
      blisters: 0, // No aplica
      boxes: 0 // No aplica
    },
    packaging: {
      unitsPerBlister: 0, // No aplica
      blistersPerBox: 0 // No aplica
    },
    sellOptions: {
      unit: true,
      blister: false,
      box: false
    },
    types: undefined,
    expirationDate: '',
    paymentType: [],
    pharmaceuticalCompany: '',
    purchasePrices: {
      unit: 0,
      blister: 0,
      box: 0
    },
    location: {
      _id: undefined
    }
  }
];

export const findProductByBarcode = (barcode: string): Product | undefined => {
  return mockProducts.find(product => product.barcode === barcode);
};

export const updateProductStock = (productId: string, quantity: number): void => {
  const product = mockProducts.find(p => p._id === productId);
  if (product) {
    product.stock.units -= quantity;
    // Actualizar blisters y cajas según corresponda
    product.stock.blisters = Math.floor(product.stock.units / product.packaging.unitsPerBlister);
    product.stock.boxes = Math.floor(product.stock.blisters / product.packaging.blistersPerBox);
  }
};