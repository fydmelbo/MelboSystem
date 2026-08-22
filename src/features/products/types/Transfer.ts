import { Timestamp } from 'firebase/firestore';

export type TransferStatus = 'pendiente' | 'recibida' | 'rechazada';

export interface TransferProductRecord {
  productId: string;
  productName: string;
  quantity: number;
  saleType: 'unit' | 'blister' | 'box';
  unitsTransferred: number;
}

export interface TransferRecord {
  _id?: string;
  ubicacionOrigenId: string;
  ubicacionOrigenNombre: string;
  ubicacionDestinoId: string;
  ubicacionDestinoNombre: string;
  productos: TransferProductRecord[];
  totalProductos: number;
  totalUnidades: number;
  status: TransferStatus;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: Timestamp;
  receivedAt?: Timestamp;
  receivedBy?: string;
  rejectedAt?: Timestamp;
  rejectedBy?: string;
  rejectionReason?: string;
}
