export interface Promotion {
  _id: string;
  name: string;
  description: string;
  startDate: Date | string;
  endDate: Date | string;
  isActive: boolean;
  promotionType?: 'NxM' | 'percentage' | 'fixed';
  discountType?: 'percentage' | 'fixed';
  discountValue: number;
  nxmConfig?: {
    buyQuantity: number;
    getQuantity: number;
  };
  products: {
    productId: string;
    minimumQuantity: number;
  }[];
  conditions: {
    minimumPurchase: number;
    maxUses?: number | null;
    usedCount: number;
  };
}