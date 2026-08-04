import { useState, useEffect, useCallback } from 'react';
import { getProducts } from '../features/products/services/productService';
import { 
  Notification, 
  getNotifications, 
  markNotificationAsRead,
  markAllNotificationsAsRead,
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
        const existingNotifs = await getNotifications();
        setNotifications(existingNotifs);

        const products = await getProducts(user?.ubicacion || undefined);
        const today = new Date();
        const notificationPromises: Promise<Notification>[] = [];
        
        products.forEach(product => {
          // Check for ANY existing notification (read or not) to prevent duplicates
          const hasAnyNotif = (type: string) => {
            return existingNotifs.some(n => n.productId === product._id && n.type === type);
          };

          if (product.sellOptions.unit && product.stock.units <= LOW_STOCK_THRESHOLD) {
            if (!hasAnyNotif('stock-low')) {
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

          if (product.expirationDate) {
            const expirationDate = new Date(product.expirationDate);
            if (!isNaN(expirationDate.getTime())) {
              const monthsUntilExpiration = (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);

              if (monthsUntilExpiration <= 0) {
                if (!hasAnyNotif('expired')) {
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
                if (!hasAnyNotif('expiring-soon')) {
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
    const interval = setInterval(checkProductsStatus, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      await fetchNotifications();
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.filter(n => n.read));
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
      await fetchNotifications();
    }
  }, []);

  const unreadNotifications = notifications.filter(n => !n.read);

  return {
    notifications: unreadNotifications,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    unreadCount: unreadNotifications.length,
    error
  };
}
