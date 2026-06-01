export interface HistoricoProducto {
  _id: string;
  barcode: string;
  name: string;
  expirationDate: Date;
  pharmaceuticalCompany: string;
  paymentType: 'excento' | 'gravado';
  prices: {
    unit: number;
    blister: number;
    box: number;
  };
  packaging: {
    unitsPerBlister: number;
    blistersPerBox: number;
  };
  types: string[];
  deletedAt: Date;
  deletionReason: 'manual' | 'expired' | 'other';
}