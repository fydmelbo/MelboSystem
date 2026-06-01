export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  saleType: 'unit' | 'blister' | 'box';
  unitsPerSale: number;
  subtotal: number;
}

export interface Sale {
  items: SaleItem[];
  total: number;
  createdAt: string;
}

export interface Report {
  _id: string;
  startDate: string;
  endDate: string;
  sales: Sale[];
  totalSales: number;
  totalProducts: number;
  status: 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}