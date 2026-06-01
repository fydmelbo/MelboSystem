interface Product {
  _id: string;
  barcode: string;
  name: string;
  expirationDate: string;
  pharmaceuticalCompany: string;
  paymentType: string;
  prices: {
    unit?: number;
    blister?: number;
    box?: number;
  };
  stock: {
    units: number;
    blisters: number;
    boxes: number;
  };
  packaging: {
    unitsPerBlister: number;
    blistersPerBox: number;
  };
  sellOptions: {
    unit: boolean;
    blister: boolean;
    box: boolean;
  };
} 