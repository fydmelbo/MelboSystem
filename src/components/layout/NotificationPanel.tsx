import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Check, AlertTriangle, Clock, PackageX, ChevronDown } from 'lucide-react';
import { Notification } from '../../features/notifications/services/notificationService';

interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  ubicaciones?: Array<{ _id: string; nombre: string }>;
  isAdmin?: boolean;
}

const INITIAL_LOAD = 50;
const LOAD_MORE = 50;

const typeIcons: Record<string, React.ReactNode> = {
  'expired': <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />,
  'stock-low': <PackageX className="w-4 h-4 text-amber-500 shrink-0" />,
  'expiring-soon': <Clock className="w-4 h-4 text-blue-500 shrink-0" />,
  'out-of-stock': <PackageX className="w-4 h-4 text-red-600 shrink-0" />,
};

const typeBg: Record<string, string> = {
  'expired': 'bg-red-50/80',
  'stock-low': 'bg-amber-50/80',
  'expiring-soon': 'bg-blue-50/80',
  'out-of-stock': 'bg-red-50/80',
};

const NotificationItem = React.memo(({
  notification,
  isArchiving,
  isCollapsed,
  onArchive,
  ubicacionName,
}: {
  notification: Notification;
  isArchiving: boolean;
  isCollapsed: boolean;
  onArchive: (id: string) => void;
  ubicacionName?: string;
}) => {
  return (
    <div
      className="relative overflow-hidden border-b border-gray-50 last:border-0"
      style={{
        height: isCollapsed ? '0px' : 'auto',
        transition: isCollapsed ? 'height 0.3s ease-in-out' : 'none',
      }}
    >
      {/* Green archive background */}
      <div
        className="absolute inset-0 flex items-center justify-end px-6 bg-gradient-to-l from-green-500 to-green-400 transition-opacity duration-150"
        style={{ opacity: isArchiving ? 1 : 0 }}
      >
        <Check className="w-6 h-6 text-white" strokeWidth={3} />
      </div>

      {/* Notification content */}
      <div
        className={`relative ${typeBg[notification.type] || 'bg-white'}`}
        style={{
          transform: isArchiving ? 'translateX(100%)' : 'translateX(0)',
          transition: isArchiving ? 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
      >
        <div className="px-4 py-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              {typeIcons[notification.type] || <Bell className="w-4 h-4 text-gray-400 shrink-0" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                {ubicacionName && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-primary-100 text-primary-700 rounded-full">
                    {ubicacionName}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.message}</p>
              <p className="text-[11px] text-gray-400 mt-1">
                {new Date(notification.createdAt).toLocaleString('es-GT', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit', timeZone: 'America/Guatemala',
                })}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onArchive(notification._id); }}
              className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all"
              title="Marcar como leída"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';

export default function NotificationPanel({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  ubicaciones = [],
  isAdmin = false,
}: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [archivingIds, setArchivingIds] = useState<Set<string>>(new Set());
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const ubicacionMap = useMemo(() => new Map(ubicaciones.map(ub => [ub._id, ub.nombre])), [ubicaciones]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset visible count when panel closes or notifications change significantly
  useEffect(() => {
    if (!isOpen) setVisibleCount(INITIAL_LOAD);
  }, [isOpen]);

  useEffect(() => {
    setVisibleCount(INITIAL_LOAD);
  }, [notifications.length]);

  const archiveNotification = useCallback((id: string) => {
    setArchivingIds(prev => new Set(prev).add(id));
    setTimeout(() => setCollapsedIds(prev => new Set(prev).add(id)), 200);
    setTimeout(() => {
      onMarkAsRead(id);
      setArchivingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      setCollapsedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }, 500);
  }, [onMarkAsRead]);

  const archiveAll = useCallback(() => {
    // Close panel first for immediate feedback
    setIsOpen(false);
    // Batch mark all as read (Firestore batch + state update)
    onMarkAllAsRead();
  }, [onMarkAllAsRead]);

  const visibleNotifications = useMemo(
    () => notifications.slice(0, visibleCount),
    [notifications, visibleCount]
  );

  const hasMore = visibleCount < notifications.length;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-6 w-6 text-gray-700" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="notification-panel"
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed sm:absolute right-2 sm:right-0 mt-2 w-[calc(100vw-16px)] sm:w-96 max-w-96 bg-white rounded-2xl shadow-elevated border border-gray-100 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={archiveAll}
                  className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Marcar todas</span>
                  <span className="sm:hidden">Todas</span>
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div className="max-h-[50vh] sm:max-h-80 overflow-y-auto">
              {notifications.length > 0 ? (
                <>
                  {visibleNotifications.map((notification) => (
                    <NotificationItem
                      key={notification._id}
                      notification={notification}
                      isArchiving={archivingIds.has(notification._id)}
                      isCollapsed={collapsedIds.has(notification._id)}
                      onArchive={archiveNotification}
                      ubicacionName={isAdmin && notification.ubicacion ? ubicacionMap.get(notification.ubicacion) : undefined}
                    />
                  ))}
                  {hasMore && (
                    <button
                      onClick={() => setVisibleCount(prev => prev + LOAD_MORE)}
                      className="w-full px-4 py-3 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5 border-t border-gray-100"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      Cargar más ({notifications.length - visibleCount} restantes)
                    </button>
                  )}
                </>
              ) : (
                <div className="px-4 py-10 text-center">
                  <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 font-medium">Sin notificaciones</p>
                  <p className="text-xs text-gray-400 mt-1">Todo está al día</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
