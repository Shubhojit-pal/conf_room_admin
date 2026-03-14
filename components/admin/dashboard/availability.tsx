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
      <h3 className="text-lg font-semibold text-foreground mb-4">Real-Time Availability</h3>

      <div className="space-y-3">
        {rooms.map((room) => (
          <div key={`${room.catalog_id}-${room.room_id}`} className="flex items-start justify-between p-3 bg-muted rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm text-foreground">{room.room_name}</p>
                <Badge variant="outline" className="text-xs">
                  {room.capacity} people
                </Badge>
              </div>

              <div className="mt-1 text-xs text-muted-foreground">
                {(room.status === 'available' || room.status === 'active') && (
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    Available
                  </div>
                )}
                {room.status === 'occupied' && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-600" />
                    Occupied
                  </div>
                )}
                {room.status === 'maintenance' && (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-orange-600" />
                    Maintenance
                  </div>
                )}
              </div>
            </div>

            <Badge
              className={`ml-2 ${room.status === 'available' || room.status === 'active'
                ? 'bg-green-100 text-green-800'
                : room.status === 'occupied'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-orange-100 text-orange-800'
                }`}
            >
              {(room.status === 'active' ? 'Available' : room.status).charAt(0).toUpperCase() + (room.status === 'active' ? 'available' : room.status).slice(1)}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
