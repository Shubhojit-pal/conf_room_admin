"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { fetchRooms, Room } from '@/lib/api';

export function RealTimeAvailability() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms()
      .then(setRooms)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Card className="p-6 h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></Card>;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Live Availability</h3>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-bold opacity-70">
          Real-time
        </Badge>
      </div>

      <div className="space-y-4">
        {rooms.map((room) => (
          <div key={`${room.catalog_id}-${room.room_id}`} className="group relative flex items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-xl transition-all hover:bg-muted/40 hover:border-border">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-foreground truncate">{room.room_name}</p>
              </div>

              <div className="mt-1 text-xs text-muted-foreground flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  {room.capacity} seats
                </span>
                {(room.status === 'available' || room.status === 'active') && (
                  <span className="flex items-center gap-1.5 text-green-500 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Available
                  </span>
                )}
                {room.status === 'occupied' && (
                  <span className="flex items-center gap-1.5 text-blue-500 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Occupied
                  </span>
                )}
              </div>
            </div>

            <Badge
              className={`ml-2 text-[10px] px-2 py-0.5 uppercase font-bold tracking-tight rounded-full ${room.status === 'available' || room.status === 'active'
                ? 'bg-green-500/10 text-green-600 border-none'
                : room.status === 'occupied'
                  ? 'bg-blue-500/10 text-blue-600 border-none'
                  : 'bg-orange-500/10 text-orange-600 border-none'
                }`}
            >
              {room.status === 'active' ? 'Free' : room.status}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
