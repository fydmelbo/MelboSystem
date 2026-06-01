// src/hooks/useNotifications.ts
import { useState, useEffect } from 'react';
import { getProducts } from '../features/products/services/productService';
import { 
  Notification, 
  getNotifications, 
  markNotificationAsRead,
  createNotification 
} from '../features/notifications/services/notificationService';
import { useAuth } from '../features/auth/context/AuthContext';

const LOW_STOCK_THRESHOLD = 10;
const EXPIRATION_WARNING_MONTHS = 6;

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const notificationsData = await getNotifications();
      setNotifications(notificationsData);
      setError(null);
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al obtener notificaciones';
      console.error('Error al obtener notificaciones:', errorMessage);
      setError(errorMessage);
      setNotifications([]);
    }
  };

  useEffect(() => {
    const checkProductsStatus = async () => {
      try {
        // Obtener notificaciones existentes primero para no duplicar
        const existingNotifs = await getNotifications();
        setNotifications(existingNotifs);

        const products = await getProducts(user?.ubicacion || undefined);
        const today = new Date();
        const notificationPromises: Promise<Notification>[] = [];
        
        products.forEach(product => {
          // Helper para saber si ya hay una notificación no leída de este tipo para este producto
          const hasUnreadNotif = (type: string) => {
            return existingNotifs.some(n => n.productId === product._id && n.type === type && !n.read);
          };

          // Verificar stock bajo
          if (product.sellOptions.unit && product.stock.units <= LOW_STOCK_THRESHOLD) {
            if (!hasUnreadNotif('stock-low')) {
              notificationPromises.push(
                createNotification({
                  productId: product._id,
                  type: 'stock-low',
                  title: 'Stock Bajo',
                  message: `El producto ${product.name} tiene stock bajo (${product.stock.units} unidades).`
                })
              );
            }
          }

          // Verificar fecha de vencimiento si tiene una fecha válida
          if (product.expirationDate) {
            const expirationDate = new Date(product.expirationDate);
            if (!isNaN(expirationDate.getTime())) {
              const monthsUntilExpiration = (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);

              if (monthsUntilExpiration <= 0) {
                if (!hasUnreadNotif('expired')) {
                  notificationPromises.push(
                    createNotification({
                      productId: product._id,
                      type: 'expired',
                      title: 'Producto Vencido',
                      message: `El producto ${product.name} ha vencido.`
                    })
                  );
                }
              } else if (monthsUntilExpiration <= EXPIRATION_WARNING_MONTHS) {
                if (!hasUnreadNotif('expiring-soon')) {
                  notificationPromises.push(
                    createNotification({
                      productId: product._id,
                      type: 'expiring-soon',
                      title: 'Próximo a Vencer',
                      message: `El producto ${product.name} vencerá en ${Math.ceil(monthsUntilExpiration)} meses.`
                    })
                  );
                }
              }
            }
          }
        });

        // Esperar a que todas las notificaciones nuevas se creen
        if (notificationPromises.length > 0) {
          await Promise.all(notificationPromises);
          await fetchNotifications();
        }
      } catch (error: any) {
        const errorMessage = error?.message || 'Error al verificar el estado de los productos';
        console.error('Error checking products status:', errorMessage);
        setError(errorMessage);
      }
    };

    checkProductsStatus();
    // Ejecutar cada hora en lugar de cada minuto para no sobrecargar
    const interval = setInterval(checkProductsStatus, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      await fetchNotifications();
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
    }
  };

  return {
    notifications,
    markAsRead: handleMarkAsRead,
    unreadCount: notifications.filter(n => !n.read).length,
    error
  };
}
