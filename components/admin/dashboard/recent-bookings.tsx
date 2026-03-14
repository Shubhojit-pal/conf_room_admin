"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Trash2 } from 'lucide-react';
import { fetchAllBookings, cancelBooking, Booking, getAdminUser } from '@/lib/api';
import Link from 'next/link';

export function RecentBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetchAllBookings()
      .then(all => setBookings(all.slice(0, 5))) // Only show 5
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string, currentStatus: string) => {
    if (currentStatus === 'cancelled' || currentStatus === 'rejected') {
      alert('This booking is already cancelled or rejected.');
      return;
    }
    const adminUser = getAdminUser();
    if (!adminUser) return;

    if (!confirm('Cancel this booking?')) return;
    try {
      await cancelBooking(id, adminUser.uid, 'Cancelled by Admin');
      setBookings(prev => prev.map(b => b.booking_id === id ? { ...b, status: 'cancelled' } : b));
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <Card className="p-6 h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></Card>;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Bookings</h3>
        <Link href="/admin/bookings">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Room</th>
              <th className="text-left py-3 px-3 font-semibold text-muted-foreground">User</th>
              <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Date & Time</th>
              <th className="text-left py-3 px-3 font-semibold text-muted-foreground">Status</th>
              <th className="text-right py-3 px-3 font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.booking_id} className="border-b border-border hover:bg-muted/50 transition-colors">
                <td className="py-3 px-3">
                  <p className="font-medium text-foreground">{booking.room_name || booking.room_id}</p>
                </td>
                <td className="py-3 px-3">
                  <p className="text-foreground">{booking.user_name || booking.uid}</p>
                </td>
                <td className="py-3 px-3">
                  <p className="text-muted-foreground">{booking.start_date?.slice(0, 10)}</p>
                  <p className="text-xs text-muted-foreground">{booking.start_time} - {booking.end_time}</p>
                </td>
                <td className="py-3 px-3">
                  <Badge
                    className={
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }
                  >
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(booking.booking_id, booking.status)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
