"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Bell, Clock, Info, AlertTriangle, XCircle } from 'lucide-react';
import { fetchNotifications, Notification } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

export function NotificationFeed() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const data = await fetchNotifications();
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
        <Card className="p-4 lg:p-6 h-full">
            <h3 className="text-sm lg:text-lg font-bold mb-4 text-foreground">Recent Activity</h3>
            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-10" />
                        <p className="text-xs">No recent activity</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div key={notification._id} className="flex gap-3 items-start relative group">
                            <div className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                                {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs lg:text-sm font-bold text-foreground leading-tight truncate">
                                    {notification.title}
                                </p>
                                <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                                    {notification.message}
                                </p>
                                <p className="text-[9px] text-muted-foreground mt-1 uppercase font-black flex items-center gap-1 opacity-70">
                                    <Clock className="w-2.5 h-2.5" />
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </p>
                            </div>
                            {!notification.isRead && (
                                <div className="w-1.5 h-1.5 bg-primary rounded-full absolute -left-0.5 top-2.5 shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                            )}
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}
