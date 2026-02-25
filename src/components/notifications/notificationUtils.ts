import type { Notification } from './NotificationBell';

// Helper function to create and dispatch notifications from anywhere in the app
export const sendNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
  const fullNotification: Notification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    read: false,
  };
  
  window.dispatchEvent(
    new CustomEvent('mission-control-notification', {
      detail: fullNotification,
    })
  );
  
  return fullNotification;
};
