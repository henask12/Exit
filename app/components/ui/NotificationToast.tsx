'use client';

import React from 'react';
import { Notification, NotificationType } from '@/hooks/useNotifications';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
}

const styles: Record<NotificationType, string> = {
  success: 'bg-[#00A651] text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-yellow-500 text-white',
  info: 'bg-blue-500 text-white',
};

export function NotificationToast({ notification, onClose }: NotificationToastProps) {
  return (
    <div
      className="bg-gray-800 rounded-lg shadow-2xl p-4 animate-slide-in-right min-w-[360px] max-w-md relative overflow-hidden border-l-4 border-[#00A651]"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-[#00A651] flex items-center justify-center">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : notification.type === 'error' ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#00A651] font-semibold text-sm uppercase">
              {notification.type === 'success' ? 'Success' : notification.type === 'error' ? 'Error' : notification.type === 'warning' ? 'Warning' : 'Info'}
            </span>
          </div>
          <p className="text-white text-sm mb-2">{notification.message}</p>
          {notification.details && (
            <p className="text-gray-300 text-xs mb-2">{notification.details}</p>
          )}
          {notification.type === 'success' && (
            <button className="text-[#00A651] hover:text-[#00C366] text-xs font-semibold transition-colors">
              Undo Action
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
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

