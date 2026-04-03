import { useState } from 'react';

export function useNotifications() {
  const requestPushPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  return {
    notifications: [] as any[],
    unreadCount: 0,
    isLoading: false,
    markAsRead: async (_id: string) => {},
    markAllAsRead: async () => {},
    deleteNotification: async (_id: string) => {},
    requestPushPermission,
    refresh: async () => {}
  };
}
