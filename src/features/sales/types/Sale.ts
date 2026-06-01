export interface SaleItem {
  productId: string;
  barcode: string;
  name: string;
  price: number;
  quantity: number;
  saleType: 'unit' | 'blister' | 'box';
  unitsPerSale: number;
  subtotal: number;
  paymentType: string;
  discount?: number;
  promotion?: {
    promotionId: string;
    name: string;
    type: string;
    description: string;
    config?: {
      buyQuantity: number;
      getQuantity: number;
    } | null;
    discountValue: number;
  } | null;
}

export interface Sale {
  items: SaleItem[];
  total: number;
  paymentType: string;
}