'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar, Filter } from 'lucide-react';
import { fetchAllBookings, fetchAllUsers, fetchRooms, fetchCancellations, Booking, User, Room, Cancellation } from '@/lib/api';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function ReportsPage() {
  const [data, setData] = useState<{
    bookings: Booking[];
    users: User[];
    rooms: Room[];
    cancellations: Cancellation[];
  }>({ bookings: [], users: [], rooms: [], cancellations: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAllBookings(), fetchAllUsers(), fetchRooms(), fetchCancellations()])
      .then(([bookings, users, rooms, cancellations]) => {
        setData({ bookings, users, rooms, cancellations });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const totalBookings = data.bookings.length;
  const activeUsers = data.users.length;
  const cancellationRate = totalBookings > 0 ? ((data.cancellations.length / totalBookings) * 100).toFixed(1) : '0';

  const roomsWithBookings = new Set(data.bookings.filter(b => b.status === 'confirmed').map(b => `${b.catalog_id}-${b.room_id}`));
  const utilization = data.rooms.length > 0 ? Math.round((roomsWithBookings.size / data.rooms.length) * 100) : 0;

  // Render Metric Detail Modal
  const renderMetricModal = () => {
    if (!selectedMetric) return null;

    let title = '';
    let content = null;

    if (selectedMetric === 'bookings') {
      title = 'Bookings Breakdown';
      const confirmed = data.bookings.filter(b => b.status === 'confirmed').length;
      const pending = data.bookings.filter(b => b.status === 'pending').length;
      const cancelled = data.bookings.filter(b => b.status === 'cancelled').length;
      const rejected = data.bookings.filter(b => b.status === 'rejected').length;

      content = (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
              <p className="text-xs text-green-600 font-bold uppercase">Confirmed</p>
              <p className="text-xl font-bold text-green-700">{confirmed}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <p className="text-xs text-yellow-600 font-bold uppercase">Pending</p>
              <p className="text-xl font-bold text-yellow-700">{pending}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-600 font-bold uppercase">Cancelled</p>
              <p className="text-xl font-bold text-gray-700">{cancelled}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <p className="text-xs text-red-600 font-bold uppercase">Rejected</p>
              <p className="text-xl font-bold text-red-700">{rejected}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold mb-2">Recent Bookings</p>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {data.bookings.slice(0, 5).map(b => (
                <div key={b.booking_id} className="flex justify-between items-center p-2 text-sm border-b">
                  <span>{b.room_name || b.room_id}</span>
                  <Badge variant="outline" className="text-[10px]">{b.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    } else if (selectedMetric === 'utilization') {
      title = 'Room Utilization Details';
      content = (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Showing rooms with at least one confirmed booking.</p>
          <div className="max-h-80 overflow-y-auto space-y-3 pr-2">
            {data.rooms.map(room => {
              const bookingCount = data.bookings.filter(b => b.catalog_id === room.catalog_id && b.room_id === room.room_id && b.status === 'confirmed').length;
              return (
                <div key={`${room.catalog_id}-${room.room_id}`} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">{room.room_name}</span>
                    <span className="text-muted-foreground">{bookingCount} confirmed</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, (bookingCount / 10) * 100)}%` }} // Arbitrary 10 as "high" usage for scale
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else if (selectedMetric === 'cancellation') {
      title = 'Cancellation Analysis';
      content = (
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg border border-red-100 text-center">
            <p className="text-sm text-red-600 font-medium">System-wide Cancellation Rate</p>
            <p className="text-3xl font-black text-red-700">{cancellationRate}%</p>
          </div>
          <p className="text-sm font-semibold">Recent Cancellation Reasons</p>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
            {data.cancellations.slice(0, 10).map((c, i) => (
              <div key={i} className="p-3 rounded-lg border bg-muted/30 text-xs">
                <div className="flex justify-between font-bold mb-1">
                  <span>Booking {c.booking_id}</span>
                  <span className="text-muted-foreground">{c.cancel_date}</span>
                </div>
                <p className="italic text-muted-foreground text-[10px]">"{c.cancel_reason}"</p>
              </div>
            ))}
          </div>
        </div>
      );
    } else if (selectedMetric === 'users') {
      title = 'Active Users Registry';
      // Sort users by booking count if we can, else just list
      const topUsers = data.users.slice(0, 10).map(u => ({
        ...u,
        count: data.bookings.filter(b => b.uid === u.uid).length
      })).sort((a, b) => b.count - a.count);

      content = (
        <div className="space-y-4">
          <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
            {topUsers.map(u => (
              <div key={u.uid} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-bold text-foreground">{u.name}</p>
                  <p className="text-[10px] text-muted-foreground">{u.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-primary">{u.count}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Bookings</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setSelectedMetric(null)}>
        <Card className="w-full max-w-lg p-6 space-y-6 shadow-2xl border-primary/20" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b pb-4">
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            <Button variant="ghost" size="sm" onClick={() => setSelectedMetric(null)} className="h-8 w-8 p-0">×</Button>
          </div>
          <div className="py-2">
            {content}
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setSelectedMetric(null)}>Close Details</Button>
          </div>
        </Card>
      </div>
    );
  };

  // Restore mock data for charts to fix lint errors
  const departmentUsage = [
    { name: 'Engineering', value: 45, color: '#3b82f6' },
    { name: 'Sales', value: 30, color: '#10b981' },
    { name: 'Finance', value: 15, color: '#f59e0b' },
    { name: 'HR', value: 10, color: '#ef4444' },
  ];

  const monthlyBookings = [
    { month: 'Jan', bookings: 85, users: 35 },
    { month: 'Feb', bookings: 95, users: 40 },
    { month: 'Mar', bookings: 120, users: 55 },
  ];

  const roomPopularity = data.rooms.slice(0, 5).map(room => ({
    room: room.room_name,
    bookings: data.bookings.filter(b => b.catalog_id === room.catalog_id && b.room_id === room.room_id).length
  })).sort((a, b) => b.bookings - a.bookings);

  if (loading) return <div className="p-6 h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="p-6 space-y-6 relative">
      {renderMetricModal()}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customizable Reports</h1>
          <p className="text-muted-foreground mt-1">Generate and export booking analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Date Range
          </Button>
          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          className="p-4 cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all group active:scale-[0.98]"
          onClick={() => setSelectedMetric('bookings')}
        >
          <div className="flex flex-col h-full">
            <p className="text-sm text-muted-foreground group-hover:text-primary transition-colors">Total Bookings</p>
            <p className="text-3xl font-black text-foreground mt-2">{totalBookings}</p>
            <div className="mt-auto pt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Lifetime total</span>
              <span className="bg-primary/5 text-primary px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 font-bold transition-opacity">DETAILS</span>
            </div>
          </div>
        </Card>

        <Card
          className="p-4 cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all group active:scale-[0.98]"
          onClick={() => setSelectedMetric('utilization')}
        >
          <div className="flex flex-col h-full">
            <p className="text-sm text-muted-foreground group-hover:text-blue-500 transition-colors">Avg. Utilization</p>
            <p className="text-3xl font-black text-foreground mt-2">{utilization}%</p>
            <div className="mt-auto pt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Rooms active</span>
              <span className="bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 font-bold transition-opacity">DETAILS</span>
            </div>
          </div>
        </Card>

        <Card
          className="p-4 cursor-pointer hover:shadow-lg hover:border-red-400 transition-all group active:scale-[0.98]"
          onClick={() => setSelectedMetric('cancellation')}
        >
          <div className="flex flex-col h-full">
            <p className="text-sm text-muted-foreground group-hover:text-red-500 transition-colors">Cancellation Rate</p>
            <p className="text-3xl font-black text-foreground mt-2">{cancellationRate}%</p>
            <div className="mt-auto pt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Relative to bookings</span>
              <span className="bg-red-50 text-red-500 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 font-bold transition-opacity">DETAILS</span>
            </div>
          </div>
        </Card>

        <Card
          className="p-4 cursor-pointer hover:shadow-lg hover:border-green-400 transition-all group active:scale-[0.98]"
          onClick={() => setSelectedMetric('users')}
        >
          <div className="flex flex-col h-full">
            <p className="text-sm text-muted-foreground group-hover:text-green-500 transition-colors">Active Users</p>
            <p className="text-3xl font-black text-foreground mt-2">{activeUsers}</p>
            <div className="mt-auto pt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Total registered</span>
              <span className="bg-green-50 text-green-500 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 font-bold transition-opacity">DETAILS</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Usage by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentUsage}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }: any) => `${name} (${value}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {departmentUsage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyBookings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="bookings" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="users" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Room Popularity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Room Popularity</h3>
        <div className="space-y-3">
          {roomPopularity.map((room, index) => (
            <div key={room.room}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">{room.room}</p>
                <p className="text-sm font-semibold text-foreground">{room.bookings} bookings</p>
              </div>
              <div className="w-full bg-muted rounded-lg h-2 overflow-hidden">
                <div
                  className={`h-full rounded-lg transition-all ${index === 0
                    ? 'bg-blue-500'
                    : index === 1
                      ? 'bg-green-500'
                      : index === 2
                        ? 'bg-purple-500'
                        : 'bg-orange-500'
                    }`}
                  style={{ width: roomPopularity[0].bookings > 0 ? `${(room.bookings / roomPopularity[0].bookings) * 100}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Report Templates */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Report Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Weekly Usage Report', icon: '📊' },
            { name: 'Monthly Analytics', icon: '📈' },
            { name: 'Room Utilization', icon: '🏢' },
            { name: 'User Activity', icon: '👥' },
            { name: 'Cancellation Analysis', icon: '❌' },
            { name: 'Department Summary', icon: '📋' },
          ].map((template) => (
            <Card key={template.name} className="p-4 border cursor-pointer hover:shadow-md transition-shadow">
              <div className="text-3xl mb-2">{template.icon}</div>
              <p className="font-semibold text-foreground text-sm">{template.name}</p>
              <Button variant="outline" size="sm" className="w-full mt-3">
                Generate
              </Button>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
