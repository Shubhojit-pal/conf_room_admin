"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, CalendarCheck, AlertCircle } from 'lucide-react';
import { fetchAllBookings, fetchAllUsers, fetchRooms, Booking, User, Room } from '@/lib/api';

export function DashboardAnalytics() {
  const [data, setData] = useState<{
    bookings: Booking[];
    users: User[];
    rooms: Room[];
  }>({ bookings: [], users: [], rooms: [] });
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([fetchAllBookings(), fetchAllUsers(), fetchRooms()])
      .then(([bookings, users, rooms]) => {
        setData({ bookings, users, rooms });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const totalBookings = data.bookings.length;
  const activeUsers = data.users.length;

  // Calculate utilization (simplistic: % of rooms with at least one confirmed booking)
  const roomsWithBookings = new Set(data.bookings.filter(b => b.status === 'confirmed').map(b => `${b.catalog_id}-${b.room_id}`));
  const utilization = data.rooms.length > 0 ? Math.round((roomsWithBookings.size / data.rooms.length) * 100) : 0;

  const metrics = [
    {
      label: 'Total Bookings',
      value: totalBookings.toString(),
      change: '+12%', // Static for now as we don't have historical data
      icon: CalendarCheck,
      color: 'text-blue-500',
    },
    {
      label: 'Active Users',
      value: activeUsers.toString(),
      change: '+5%',
      icon: Users,
      color: 'text-green-500',
    },
    {
      label: 'Avg. Utilization',
      value: `${utilization}%`,
      change: '+8%',
      icon: TrendingUp,
      color: 'text-purple-500',
    },
  ];

  // Helper to get last 7 days names
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      name: days[d.getDay()],
      fullDate: d.toISOString().split('T')[0],
      bookings: 0,
      cancelled: 0
    };
  });

  // Map bookings to trend
  data.bookings.forEach(b => {
    const date = b.start_date?.split('T')[0];
    const trendDay = last7Days.find(d => d.fullDate === date);
    if (trendDay) {
      if (b.status === 'confirmed') trendDay.bookings++;
      if (b.status === 'cancelled' || b.status === 'rejected') trendDay.cancelled++;
    }
  });

  // Map rooms to utilization chart
  const roomUtilizationData = data.rooms.slice(0, 5).map(room => ({
    room: room.room_name,
    utilization: data.bookings.filter(b => b.catalog_id === room.catalog_id && b.room_id === room.room_id && b.status === 'confirmed').length * 20 // Dummy factor for visualization
  }));

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{metric.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${metric.color}`} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Daily Booking Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="bookings"
                name="Confirmed"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="cancelled"
                name="Cancelled/Rejected"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Room Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roomUtilizationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="room" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar
                dataKey="utilization"
                name="Booking Count"
                fill="#10b981"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
