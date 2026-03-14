'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { fetchRooms, deleteRoom, updateRoom, Room } from '@/lib/api';
import { RoomModal } from '@/components/admin/rooms/RoomModal';
import { getDirectImageUrl } from '@/lib/imageUtils';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | undefined>(undefined);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const loadRooms = async () => {
    try {
      const data = await fetchRooms();
      setRooms(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRooms(); }, []);

  const handleDelete = async (catalog_id: string, room_id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    try {
      await deleteRoom(catalog_id, room_id);
      setRooms(prev => prev.filter(r => !(r.catalog_id === catalog_id && r.room_id === room_id)));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleToggleStatus = async (room: Room) => {
    const key = `${room.catalog_id}-${room.room_id}`;
    if (togglingIds.has(key)) return;

    const newStatus = room.status === 'inactive' ? 'active' : 'inactive';

    // Optimistic update for instant UI feedback
    setRooms(prev => prev.map(r =>
      r.catalog_id === room.catalog_id && r.room_id === room.room_id
        ? { ...r, status: newStatus }
        : r
    ));
    setTogglingIds(prev => new Set(prev).add(key));

    try {
      await updateRoom(room.catalog_id, room.room_id, { status: newStatus });
    } catch (e: any) {
      // Rollback on failure
      setRooms(prev => prev.map(r =>
        r.catalog_id === room.catalog_id && r.room_id === room.room_id
          ? { ...r, status: room.status }
          : r
      ));
      alert(`Failed to update status: ${e.message}`);
    } finally {
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const totalRooms = rooms.length;
  const activeRooms = rooms.filter(r => r.status !== 'inactive').length;
  const inactiveRooms = rooms.filter(r => r.status === 'inactive').length;
  const avgCapacity = totalRooms > 0 ? Math.round(rooms.reduce((s, r) => s + r.capacity, 0) / totalRooms) : 0;

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-[300px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Room Management</h1>
          <p className="text-muted-foreground mt-1">Manage conference rooms and their amenities</p>
        </div>
        <Button className="gap-2" onClick={() => { setSelectedRoom(undefined); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4" />
          Add Room
        </Button>
      </div>

      {isModalOpen && (
        <RoomModal
          room={selectedRoom}
          onClose={() => setIsModalOpen(false)}
          onSuccess={loadRooms}
        />
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Rooms</p>
          <p className="text-2xl font-bold text-foreground mt-1">{totalRooms}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Active Rooms</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeRooms}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Inactive Rooms</p>
          <p className="text-2xl font-bold text-slate-400 mt-1">{inactiveRooms}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Avg Capacity</p>
          <p className="text-2xl font-bold text-foreground mt-1">{avgCapacity}</p>
        </Card>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rooms.map((room) => {
          const amenityList = room.amenities ? room.amenities.split(',').map(a => a.trim()) : [];
          const isActive = room.status !== 'inactive';
          const toggleKey = `${room.catalog_id}-${room.room_id}`;
          const isToggling = togglingIds.has(toggleKey);

          return (
            <Card
              key={toggleKey}
              className={`p-6 hover:shadow-lg transition-all duration-300 ${!isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-4">
                  {room.image_url && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-border bg-muted shrink-0">
                      <img
                        src={getDirectImageUrl(room.image_url)}
                        alt={room.room_name}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{room.room_name}</h3>
                    <p className="text-sm text-muted-foreground">Floor {room.floor_no} — Room {room.room_number}</p>
                  </div>
                </div>

                {/* Active / Inactive Toggle Switch */}
                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => handleToggleStatus(room)}
                    disabled={isToggling}
                    title={isActive ? 'Click to deactivate room' : 'Click to activate room'}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    } ${isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                        isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isToggling ? 'text-slate-400' : isActive ? 'text-green-600' : 'text-slate-400'
                  }`}>
                    {isToggling ? 'Saving...' : isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Capacity</p>
                  <p className="text-2xl font-bold text-foreground">{room.capacity} people</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Location</p>
                  <p className="text-sm font-medium text-foreground">{room.location}</p>
                </div>

                {amenityList.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {amenityList.map((amenity) => (
                        <Badge key={amenity} variant="secondary" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => { setSelectedRoom(room); setIsModalOpen(true); }}
                  >
                    <Plus className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(room.catalog_id, room.room_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {rooms.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No rooms found. Add a room to get started.</p>
        </Card>
      )}
    </div>
  );
}
