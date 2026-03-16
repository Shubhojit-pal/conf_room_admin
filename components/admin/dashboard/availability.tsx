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
    <Card className="p-4 lg:p-6">
      <h3 className="text-sm lg:text-lg font-bold text-foreground mb-4">Live Availability</h3>

      <div className="space-y-3">
        {rooms.map((room) => (
          <div key={`${room.catalog_id}-${room.room_id}`} className="flex items-center justify-between p-3 bg-muted/30 border border-border/50 rounded-lg">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-xs lg:text-sm text-foreground truncate">{room.room_name}</p>
              </div>

              <div className="mt-1 text-[10px] lg:text-xs text-muted-foreground flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  {room.capacity}
                </span>
                {(room.status === 'available' || room.status === 'active') && (
                  <span className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Available
                  </span>
                )}
                {room.status === 'occupied' && (
                  <span className="flex items-center gap-1 text-blue-600 font-medium">
                    <Clock className="w-3 h-3" />
                    Occupied
                  </span>
                )}
              </div>
            </div>

            <Badge
              className={`ml-2 text-[9px] lg:text-xs px-1.5 py-0 uppercase font-black ${room.status === 'available' || room.status === 'active'
                ? 'bg-green-100 text-green-800'
                : room.status === 'occupied'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-orange-100 text-orange-800'
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
