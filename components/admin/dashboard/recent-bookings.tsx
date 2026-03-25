"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Trash2 } from 'lucide-react';
import { fetchAllBookings, cancelBooking, Booking, getAdminUser } from '@/lib/api';
import Link from 'next/link';
import { useUISound } from '@/hooks/use-ui-sound';

export function RecentBookings() {
  const { playSuccess, playError } = useUISound();
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
      await cancelBooking(id, adminUser.admin_id, 'Cancelled by Admin');
      playSuccess();
      setBookings(prev => prev.map(b => b.booking_id === id ? { ...b, status: 'cancelled' } : b));
    } catch (e: any) {
      playError();
      alert(e.message || 'Failed to cancel booking');
    }
  };

  if (loading) return <Card className="p-6 h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></Card>;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Bookings</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Manage latest resource requests</p>
        </div>
        <Link href="/admin/bookings">
          <Button variant="outline" size="sm" className="h-9 px-4 rounded-lg font-medium">
            View All
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto -mx-6 lg:mx-0">
        <div className="inline-block min-w-full align-middle px-6 lg:px-0">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left py-4 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Room</th>
                <th className="text-left py-4 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">User</th>
                <th className="text-left py-4 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Schedule</th>
                <th className="text-left py-4 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                <th className="text-right py-4 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {bookings.map((booking) => (
                <tr key={booking.booking_id} className="group hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-3">
                    <p className="font-semibold text-sm text-foreground whitespace-nowrap">{booking.room_name || booking.room_id.slice(0, 8)}</p>
                  </td>
                  <td className="py-4 px-3">
                    <p className="text-sm text-foreground whitespace-nowrap">{booking.user_name || booking.uid.slice(0, 8)}</p>
                  </td>
                  <td className="py-4 px-3">
                    <p className="text-sm font-medium text-foreground whitespace-nowrap">{booking.start_date?.slice(0, 10)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">{booking.start_time} - {booking.end_time}</p>
                  </td>
                  <td className="py-4 px-3">
                    <Badge
                      className={`whitespace-nowrap px-2.5 py-0.5 text-[10px] font-bold rounded-full border-none ${
                        booking.status === 'confirmed'
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-red-500/10 text-red-600'
                      }`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="py-4 px-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg lg:opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(booking.booking_id, booking.status)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
