"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, Info, AlertTriangle, XCircle } from 'lucide-react';
import { fetchNotifications, Notification } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { useUISound } from '@/hooks/use-ui-sound';

export function NotificationFeed() {
    const { playNotification } = useUISound();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const data = await fetchNotifications();
            // If new notifications arrived, play sound
            if (notifications.length > 0 && data.length > notifications.length) {
                playNotification();
            }
            setNotifications(data.slice(0, 10)); // Show latest 10
        } catch (error) {
            console.error('Failed to load notifications', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'booking': return <Bell className="w-4 h-4 text-primary" />;
            case 'reminder': return <Clock className="w-4 h-4 text-blue-500" />;
            case 'system': return <Info className="w-4 h-4 text-green-500" />;
            default: return <Bell className="w-4 h-4 text-muted-foreground" />;
        }
    };

    if (loading) {
        return (
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-4 items-start animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-muted" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-1/2" />
                                <div className="h-3 bg-muted rounded w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        );
    }

    return (
    <Card className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <Badge variant="secondary" className="text-[10px] tracking-tight bg-primary/5 text-primary border-none">
          Latest
        </Badge>
      </div>
      <div className="space-y-5 flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-10" />
            <p className="text-xs">No recent activity</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div key={notification._id} className="flex gap-4 items-start relative group transition-opacity hover:opacity-80">
              <div className="w-9 h-9 rounded-xl bg-muted/40 flex items-center justify-center shrink-0 border border-border/40">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-semibold text-foreground leading-tight truncate ${!notification.isRead ? 'text-primary' : ''}`}>
                    {notification.title}
                  </p>
                  {!notification.isRead && (
                    <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0 shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-2">
                  {notification.message}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-3 h-3 text-muted-foreground/60" />
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
