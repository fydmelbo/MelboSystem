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
  _id?: string;
  items: SaleItem[];
  total: number;
  createdAt: string;
  ubicacion?: string;
  paymentType?: string;
  cashGiven?: number;
  change?: number;
  revertedAt?: string;
  revertReason?: string;
  revertedBy?: string;
  isBackdated?: boolean;
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