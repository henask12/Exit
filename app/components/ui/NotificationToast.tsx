import React from 'react';
import { Notification, NotificationType } from '@/hooks/useNotifications';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

const styles: Record<NotificationType, string> = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-500 text-white',
};

export function NotificationToast({ notification, onClose }: NotificationToastProps) {
  return (
    <div
      className={`${styles[notification.type]} rounded-lg shadow-lg p-4 animate-slide-in-right min-w-[300px] max-w-md`}
    >
      <div className="flex items-start gap-3">
        <p className="font-semibold text-sm flex-1">{notification.message}</p>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {notification.details && (
        <p className="text-xs mt-2 opacity-90">{notification.details}</p>
      )}
    </div>
  );
}

export function NotificationContainer({ notifications, onRemove }: { notifications: Notification[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
}

