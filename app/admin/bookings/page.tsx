'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Trash2 } from 'lucide-react';
import { fetchAllBookings, cancelBooking, Booking, getAdminUser } from '@/lib/api';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadBookings = async () => {
    try {
      const data = await fetchAllBookings();
      setBookings(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    const interval = setInterval(loadBookings, 10000);
    return () => clearInterval(interval);
  }, []);

  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  const openCancelModal = (b: Booking) => {
    if (b.status === 'cancelled' || b.status === 'rejected') {
      alert('This booking is already cancelled or rejected.');
      return;
    }
    setCancellingBooking(b);
    setCancelReason('Cancelled by Admin');

    // Use selected segments if available
    const days = b.selected_dates ? b.selected_dates.split(',') : (() => {
      const start = new Date(b.start_date);
      const end = new Date(b.end_date);
      const d = [];
      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        d.push(dt.toISOString().slice(0, 10));
      }
      return d;
    })();
    setSelectedDates(days);

    const slots = b.selected_slots ? b.selected_slots.split(',') : (() => {
      const s = [];
      let h = parseInt(b.start_time.split(':')[0]);
      const endH = parseInt(b.end_time.split(':')[0]);
      while (h < endH) {
        s.push(`${h.toString().padStart(2, '0')}:00:00-${(h + 1).toString().padStart(2, '0')}:00:00`);
        h++;
      }
      return s;
    })();
    setSelectedSlots(slots);
  };

  const handleCancelSubmit = async () => {
    if (!cancellingBooking) return;
    const adminUser = getAdminUser();
    if (!adminUser) return;

    const start = new Date(cancellingBooking.start_date);
    const end = new Date(cancellingBooking.end_date);

    const allDatesCount = cancellingBooking.selected_dates
      ? cancellingBooking.selected_dates.split(',').length
      : Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const allSlotsCount = cancellingBooking.selected_slots
      ? cancellingBooking.selected_slots.split(',').length
      : (() => {
        let h = parseInt(cancellingBooking.start_time.split(':')[0]);
        const endH = parseInt(cancellingBooking.end_time.split(':')[0]);
        return endH - h;
      })();

    const isFullCancel = selectedDates.length === allDatesCount && selectedSlots.length === allSlotsCount;

    try {
      await cancelBooking(cancellingBooking.booking_id, adminUser.uid, cancelReason, {
        partial: !isFullCancel,
        dates: selectedDates,
        slots: selectedSlots.map(s => ({ from: s.split('-')[0], to: s.split('-')[1] })),
        cancel_fromtime: selectedSlots.length > 0 ? selectedSlots.sort()[0].split('-')[0] : cancellingBooking.start_time,
        cancel_totime: selectedSlots.length > 0 ? selectedSlots.sort()[selectedSlots.length - 1].split('-')[1] : cancellingBooking.end_time
      });
      setCancellingBooking(null);
      loadBookings();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filtered = bookings.filter(b => {
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || (b.room_name || '').toLowerCase().includes(q) || (b.user_name || '').toLowerCase().includes(q) || b.purpose.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const totalBookings = bookings.length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length;

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-[300px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Bookings</h1>
          <p className="text-muted-foreground mt-1">View and manage all conference room bookings</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Bookings</p>
          <p className="text-2xl font-bold text-foreground mt-1">{totalBookings}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Confirmed</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{confirmedCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Cancelled/Rejected</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{cancelledCount}</p>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by room, user, or purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'confirmed', 'pending', 'rejected', 'cancelled'].map(s => (
            <Button
              key={s}
              variant={filterStatus === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Booking ID</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Room</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">User</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Date</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Time</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Purpose</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.booking_id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-sm font-mono text-foreground">{b.booking_id}</td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-foreground">{b.room_name || b.room_id}</p>
                    <p className="text-xs text-muted-foreground">{b.location}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-foreground">{b.user_name || b.uid}</p>
                    <p className="text-xs text-muted-foreground">{b.email}</p>
                  </td>
                  <td className="p-4 text-sm text-foreground">
                    {b.selected_dates ? (
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {b.selected_dates.split(',').sort().map(d => (
                          <Badge key={d} variant="outline" className="text-[10px] px-1 py-0">{d.slice(5)}</Badge>
                        ))}
                      </div>
                    ) : (
                      <>
                        {b.start_date?.slice(0, 10)}
                        {b.start_date?.slice(0, 10) !== b.end_date?.slice(0, 10) && ` to ${b.end_date?.slice(0, 10)}`}
                      </>
                    )}
                  </td>
                  <td className="p-4 text-sm text-foreground">
                    {b.selected_slots ? (
                      <div className="flex flex-wrap gap-1 max-w-[120px]">
                        {b.selected_slots.split(',').sort().map(s => (
                          <Badge key={s} variant="outline" className="text-[10px] px-1 py-0">{s.split('-')[0].slice(0, 5)}</Badge>
                        ))}
                      </div>
                    ) : (
                      `${b.start_time?.slice(0, 5)} – ${b.end_time?.slice(0, 5)}`
                    )}
                  </td>
                  <td className="p-4 text-sm text-foreground max-w-[200px] truncate">{b.purpose}</td>
                  <td className="p-4">
                    <Badge className={getStatusBadge(b.status)}>
                      {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => openCancelModal(b)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No bookings found</p>
          </div>
        )}
      </Card>

      {/* Cancellation Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 space-y-6">
            <h2 className="text-xl font-bold">Cancel Booking</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Reason</label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows={2}
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                />
              </div>

              {/* Date Selection */}
              {(cancellingBooking.selected_dates || (cancellingBooking.start_date.slice(0, 10) !== cancellingBooking.end_date.slice(0, 10))) && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Days to Cancel</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                    {(() => {
                      const days = cancellingBooking.selected_dates ? cancellingBooking.selected_dates.split(',') : (() => {
                        const start = new Date(cancellingBooking.start_date);
                        const end = new Date(cancellingBooking.end_date);
                        const d = [];
                        for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
                          d.push(dt.toISOString().slice(0, 10));
                        }
                        return d;
                      })();
                      return days.map(d => (
                        <label key={d} className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-all ${selectedDates.includes(d) ? 'border-red-200 bg-red-50 text-red-700' : 'hover:bg-muted/50'}`}>
                          <input
                            type="checkbox"
                            checked={selectedDates.includes(d)}
                            onChange={() => setSelectedDates(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                          />
                          <span className="text-xs">{d}</span>
                        </label>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Slot Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Select Slots to Cancel</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {(() => {
                    const slots = cancellingBooking.selected_slots ? cancellingBooking.selected_slots.split(',') : (() => {
                      const s = [];
                      let h = parseInt(cancellingBooking.start_time.split(':')[0]);
                      const endH = parseInt(cancellingBooking.end_time.split(':')[0]);
                      while (h < endH) {
                        s.push(`${h.toString().padStart(2, '0')}:00:00-${(h + 1).toString().padStart(2, '0')}:00:00`);
                        h++;
                      }
                      return s;
                    })();
                    return slots.map(s => (
                      <label key={s} className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-all ${selectedSlots.includes(s) ? 'border-red-200 bg-red-50 text-red-700' : 'hover:bg-muted/50'}`}>
                        <input
                          type="checkbox"
                          checked={selectedSlots.includes(s)}
                          onChange={() => setSelectedSlots(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                        />
                        <span className="text-xs">{s.replace(/:00:00/g, ':00')}</span>
                      </label>
                    ));
                  })()}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCancellingBooking(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleCancelSubmit} disabled={selectedDates.length === 0 && selectedSlots.length === 0}>
                Confirm Cancellation
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
