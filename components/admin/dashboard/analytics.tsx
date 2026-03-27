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

  const [timeRange, setTimeRange] = useState<'daily'|'weekly'|'monthly'>('daily');
  const [roomTimeRange, setRoomTimeRange] = useState<'daily'|'weekly'|'monthly'>('monthly');

  // Generator for chart data
  const getTrendData = () => {
    if (timeRange === 'daily') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return {
          name: `${d.getDate()} ${months[d.getMonth()]}`,
          fullDate: d.toISOString().split('T')[0],
          bookings: 0,
          cancelled: 0
        };
      });
      data.bookings.forEach(b => {
        const date = b.start_date?.split('T')[0];
        const trendDay = last7Days.find(d => d.fullDate === date);
        if (trendDay) {
          if (b.status === 'confirmed') trendDay.bookings++;
          if (b.status === 'cancelled' || b.status === 'rejected') trendDay.cancelled++;
        }
      });
      return last7Days;
    } else if (timeRange === 'weekly') {
      const dataPoints = Array.from({ length: 4 }, (_, i) => {
        const end = new Date();
        end.setDate(end.getDate() - (3 - i) * 7);
        const start = new Date(end);
        start.setDate(end.getDate() - 6);
        // Start of day for start, end of day for end
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return {
          name: `${start.getDate()}/${start.getMonth()+1} - ${end.getDate()}/${end.getMonth()+1}`,
          start: start.getTime(),
          end: end.getTime(),
          bookings: 0,
          cancelled: 0
        };
      });
      data.bookings.forEach(b => {
        if (!b.start_date) return;
        const bTime = new Date(b.start_date).getTime();
        const week = dataPoints.find(w => bTime >= w.start && bTime <= w.end);
        if (week) {
          if (b.status === 'confirmed') week.bookings++;
          if (b.status === 'cancelled' || b.status === 'rejected') week.cancelled++;
        }
      });
      return dataPoints;
    } else {
      // Monthly
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dataPoints = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return {
          name: months[d.getMonth()],
          year: d.getFullYear(),
          month: d.getMonth(),
          bookings: 0,
          cancelled: 0
        };
      });
      data.bookings.forEach(b => {
        if (!b.start_date) return;
        const bDate = new Date(b.start_date);
        const point = dataPoints.find(m => m.year === bDate.getFullYear() && m.month === bDate.getMonth());
        if (point) {
          if (b.status === 'confirmed') point.bookings++;
          if (b.status === 'cancelled' || b.status === 'rejected') point.cancelled++;
        }
      });
      return dataPoints;
    }
  };

  const trendData = getTrendData();

  // Map rooms to utilization chart
  const getFilteredRoomBookings = () => {
    const now = new Date();
    if (roomTimeRange === 'daily') {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return data.bookings.filter(b => b.start_date && new Date(b.start_date) >= cutoff && b.status === 'confirmed');
    } else if (roomTimeRange === 'weekly') {
      const cutoff = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
      return data.bookings.filter(b => b.start_date && new Date(b.start_date) >= cutoff && b.status === 'confirmed');
    } else {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 6);
      return data.bookings.filter(b => b.start_date && new Date(b.start_date) >= cutoff && b.status === 'confirmed');
    }
  };

  const filteredRoomBookings = getFilteredRoomBookings();
  const roomUtilizationData = data.rooms.slice(0, 5).map(room => ({
    room: room.room_name,
    utilization: filteredRoomBookings.filter(b => b.catalog_id === room.catalog_id && b.room_id === room.room_id).length * 20 // Dummy factor
  }));

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 transition-opacity group-hover:opacity-20">
                <Icon className={`w-12 h-12 lg:w-16 lg:h-16 ${metric.color}`} />
              </div>
              <div className="p-4 lg:p-6 relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg bg-current/10 ${metric.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl lg:text-3xl font-bold text-foreground">
                    {metric.value}
                  </p>
                  <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">
                    {metric.change}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold text-foreground">Booking Trend</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex bg-muted/50 p-1 rounded-lg">
                <button
                  onClick={() => setTimeRange('daily')}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${timeRange === 'daily' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setTimeRange('weekly')}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${timeRange === 'weekly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setTimeRange('monthly')}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${timeRange === 'monthly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Monthly
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--chart-1)]" />
                  <span>Confirmed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--destructive)]" />
                  <span>Cancelled</span>
                </div>
              </div>
            </div>
          </div>
          <div className="h-[250px] lg:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--muted-foreground)" 
                  tick={{fontSize: 10}}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="var(--muted-foreground)" 
                  tick={{fontSize: 12}}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke="var(--chart-1)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--chart-1)', r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="cancelled"
                  stroke="var(--destructive)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--destructive)', r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold text-foreground">Room Activity</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex bg-muted/50 p-1 rounded-lg">
                <button
                  onClick={() => setRoomTimeRange('daily')}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${roomTimeRange === 'daily' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setRoomTimeRange('weekly')}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${roomTimeRange === 'weekly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setRoomTimeRange('monthly')}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${roomTimeRange === 'monthly' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Monthly
                </button>
              </div>
              <div className="text-xs font-medium text-muted-foreground hidden lg:block">
                Top performing rooms
              </div>
            </div>
          </div>
          <div className="h-[250px] lg:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomUtilizationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis 
                  dataKey="room" 
                  stroke="var(--muted-foreground)" 
                  tick={{fontSize: 10}}
                  axisLine={false}
                  tickLine={false}
                  height={60}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="var(--muted-foreground)" 
                  tick={{fontSize: 12}}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Bar
                  dataKey="utilization"
                  fill="var(--chart-2)"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
