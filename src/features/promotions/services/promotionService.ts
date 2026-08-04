import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { toast } from 'react-hot-toast';
import { Promotion } from '../types/Promotion';
import { logAuditAction } from '../../audit/services/auditService';

const PROMOTIONS_COLLECTION = 'promotions';

export const getPromotions = async (): Promise<Promotion[]> => {
  try {
    const snapshot = await getDocs(collection(db, PROMOTIONS_COLLECTION));
    return snapshot.docs.map(d => ({
      _id: d.id,
      ...d.data(),
    })) as unknown as Promotion[];
  } catch (error: any) {
    const message = error?.message || 'Error al obtener promociones';
    toast.error(message);
    throw error;
  }
};

export const getActivePromotions = async (): Promise<Promotion[]> => {
  try {
    const q = query(
      collection(db, PROMOTIONS_COLLECTION),
      where('isActive', '==', true)
    );
    const snapshot = await getDocs(q);
    const now = new Date();

    return snapshot.docs
      .map(d => ({ _id: d.id, ...d.data() } as unknown as Promotion))
      .filter(promo => {
        // Filtrar por ventana de vigencia: ya iniciadas y aún no vencidas
        const startDate = promo.startDate instanceof Date
          ? promo.startDate
          : new Date(promo.startDate as any);
        const endDate = promo.endDate instanceof Date
          ? promo.endDate
          : new Date(promo.endDate as any);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return false;
        return startDate <= now && endDate >= now;
      });
  } catch (error: any) {
    const message = error?.message || 'Error al obtener promociones activas';
    toast.error(message);
    throw error;
  }
};

export const createPromotion = async (promotionData: Partial<Promotion>): Promise<Promotion> => {
  try {
    const docRef = await addDoc(collection(db, PROMOTIONS_COLLECTION), {
      ...promotionData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    await logAuditAction(
      'CREAR',
      'Promoción', // Wait, AuditEntity type needs to support 'Promoción'. We'll check this next.
      docRef.id,
      `Se creó la promoción ${promotionData.name || 'Desconocida'}`
    );

    toast.success('Promoción creada exitosamente');
    return { _id: docRef.id, ...promotionData } as unknown as Promotion;
  } catch (error: any) {
    const message = error?.message || 'Error al crear la promoción';
    toast.error(message);
    throw error;
  }
};

export const updatePromotion = async (id: string, promotionData: Partial<Promotion>): Promise<Promotion> => {
  try {
    const promoRef = doc(db, PROMOTIONS_COLLECTION, id);
    const { _id, ...dataToSave } = promotionData as any;
    await updateDoc(promoRef, { ...dataToSave, updatedAt: Timestamp.now() });

    let targetName = promotionData.name;
    if (!targetName) {
      const snap = await getDoc(promoRef);
      if (snap.exists()) {
        targetName = snap.data().name;
      }
    }

    await logAuditAction(
      'ACTUALIZAR',
      'Promoción',
      id,
      `Se actualizó la promoción ${targetName || 'Desconocida'}`
    );

    toast.success('Promoción actualizada exitosamente');
    return { _id: id, ...promotionData } as unknown as Promotion;
  } catch (error: any) {
    const message = error?.message || 'Error al actualizar la promoción';
    toast.error(message);
    throw error;
  }
};

export const deletePromotion = async (id: string): Promise<void> => {
  try {
    const promoRef = doc(db, PROMOTIONS_COLLECTION, id);
    const snap = await getDoc(promoRef);
    const name = snap.exists() ? snap.data().name : 'Desconocida';

    await deleteDoc(promoRef);
    
    await logAuditAction(
      'ELIMINAR',
      'Promoción',
      id,
      `Se eliminó la promoción ${name}`
    );

    toast.success('Promoción eliminada exitosamente');
  } catch (error: any) {
    const message = error?.message || 'Error al eliminar la promoción';
    toast.error(message);
    throw error;
  }
};

export const validatePromotion = async (products: any[], total: number): Promise<Promotion[]> => {
  try {
    // Obtener todas las promociones activas (ya filtradas por vigencia)
    const activePromos = await getActivePromotions();

    // Filtrar las que aplican a los productos del carrito
    return activePromos.filter(promo => {
      // Verificar compra mínima
      if (promo.conditions?.minimumPurchase && total < promo.conditions.minimumPurchase) {
        return false;
      }

      // Verificar si la promoción ya alcanzó el límite de usos
      if (promo.conditions?.maxUses != null && promo.conditions.usedCount >= promo.conditions.maxUses) {
        return false;
      }

      // Verificar si alguno de los productos del carrito está en la promoción
      return promo.products?.some(promoProduct => {
        const cartProduct = products.find(cp => cp.productId === promoProduct.productId);
        if (!cartProduct) return false;

        // Para NxM: exigir la cantidad mínima configurada
        if (promo.promotionType === 'NxM') {
          return cartProduct.quantity >= (promoProduct.minimumQuantity || 1);
        }
        // Para descuentos (porcentaje o fijo): basta con tener el producto en el carrito
        return cartProduct.quantity > 0;
      });
    });
  } catch (error: any) {
    const message = error?.message || 'Error al validar promociones';
    toast.error(message);
    throw error;
  }
};

export const getPromotionsByProduct = async (productId: string): Promise<Promotion[]> => {
  try {
    const activePromos = await getActivePromotions();
    return activePromos.filter(promo =>
      promo.products?.some(p => p.productId === productId)
    );
  } catch (error: any) {
    const message = error?.message || 'Error al obtener promociones del producto';
    toast.error(message);
    throw error;
  }
};