"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
import { fetchAllBookings, updateBookingStatus, Booking } from '@/lib/api';

export function PendingApprovals() {
  const [approvals, setApprovals] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetchAllBookings()
      .then(all => setApprovals(all.filter(b => b.status === 'pending')))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, status: 'confirmed' | 'rejected') => {
    try {
      await updateBookingStatus(id, status);
      setApprovals(prev => prev.filter(b => b.booking_id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <Card className="p-6 h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></Card>;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Pending Approvals</h3>
        <Badge variant="secondary">{approvals.length}</Badge>
      </div>

      <div className="space-y-4">
        {approvals.map((approval) => (
          <div
            key={approval.booking_id}
            className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  Booking Request
                </Badge>
              </div>

              <p className="font-semibold text-foreground">{approval.user_name || approval.uid}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {approval.room_name || approval.room_id} • {approval.purpose}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{approval.start_date?.slice(0, 10)} • {approval.start_time}</p>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
                onClick={() => handleAction(approval.booking_id, 'confirmed')}
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleAction(approval.booking_id, 'rejected')}
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {approvals.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No pending approvals</p>
        </div>
      )}
    </Card>
  );
}
