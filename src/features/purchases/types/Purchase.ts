export interface PurchaseItem {
  name: string;
  quantity: number;
  costPerUnit: number;
  subtotal: number;
  productId?: string;
}

export interface Purchase {
  _id?: string;
  items: PurchaseItem[];
  total: number;
  invoiceUrl?: string;
  ubicacion?: string;
  supplier?: string;
  supplierNit?: string;
  invoiceSerie?: string;
  invoiceNumber?: string;
  paymentMethod?: 'contado' | 'credito';
  dueDate?: string;
  transport?: string;
  purchaseDate?: string;
  createdAt: string;
  revertedAt?: string;
  revertReason?: string;
  revertedBy?: string;
}
