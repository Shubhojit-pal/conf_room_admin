"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, User, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
    fetchNotifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    Notification
} from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

export function TopBar() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Failed to load notifications', error);
    }
  };

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('admin_user');
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse admin_user', e);
      }
    }
    loadNotifications();

    // Poll for notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all read', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/');
  };

  return (
    <div className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-foreground">Conference Room Booking System</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 mr-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">
            {mounted ? (user?.name || 'Admin') : 'Admin'}
          </span>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-card" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-8 px-2 text-primary hover:text-primary"
                  onClick={handleMarkAllRead}
                >
                  Mark all as read
                </Button>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification: Notification) => (
                  <div 
                    key={notification._id}
                    className={`p-4 border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer group relative ${!notification.isRead ? 'bg-primary/5' : ''}`}
                    onClick={() => !notification.isRead && handleMarkRead(notification._id)}
                  >
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <p className={`text-sm leading-tight ${!notification.isRead ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase font-medium">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-primary rounded-full mt-1 shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-2 border-t border-border">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs text-muted-foreground"
                onClick={() => router.push('/admin/notifications')}
              >
                View all settings
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="sm" className="gap-2" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
