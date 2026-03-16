'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar as CalendarIcon, Filter as FilterIcon } from 'lucide-react';
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

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { toast } from '@/components/ui/use-toast';

export default function ReportsPage() {
  const [data, setData] = useState<{
    bookings: Booking[];
    users: User[];
    rooms: Room[];
    cancellations: Cancellation[];
  }>({ bookings: [], users: [], rooms: [], cancellations: [] });
  const [loading, setLoading] = useState(true);

  const loadData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [bookings, users, rooms, cancellations] = await Promise.all([
        fetchAllBookings(),
        fetchAllUsers(),
        fetchRooms(),
        fetchCancellations()
      ]);
      setData({ bookings, users, rooms, cancellations });
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => loadData(), 30000); // 30s polling
    return () => clearInterval(interval);
  }, []);

  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Filter State
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days default
    to: new Date()
  });
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [roomFilter, setRoomFilter] = useState<string[]>([]);

  // Derived Filtered Data
  const filteredBookings = data.bookings.filter(b => {
    const bDate = new Date(b.start_date);
    const dateMatch = !dateRange?.from || !dateRange?.to || (bDate >= dateRange.from && bDate <= dateRange.to);
    const statusMatch = statusFilter.length === 0 || statusFilter.includes(b.status);
    const roomMatch = roomFilter.length === 0 || roomFilter.includes(`${b.catalog_id}-${b.room_id}`);
    return dateMatch && statusMatch && roomMatch;
  });

  const clearFilters = () => {
    setDateRange(undefined);
    setStatusFilter([]);
    setRoomFilter([]);
    toast({ title: 'Filters Cleared', description: 'Showing all historical data.' });
  };

  // Helper: Export to CSV
  const exportToCSV = (filename: string, rows: any[]) => {
    if (!rows.length) {
      toast({ title: 'No data', description: 'There is no data to export for this report.', variant: 'destructive' });
      return;
    }
    const headers = Object.keys(rows[0]).join(',');
    const csvContent = [headers, ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    toast({ title: 'Report Generated', description: `Your "${filename}" report has been downloaded.` });
  };

  const handleGenerateReport = (templateName: string) => {
    switch (templateName) {
      case 'Weekly Usage': {
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const filtered = filteredBookings.filter(b => new Date(b.start_date) >= lastWeek);
        exportToCSV('Weekly_Usage', filtered);
        break;
      }
      case 'Analytics': {
        const stats = [
          { metric: 'Total Bookings', value: filteredBookings.length },
          { metric: 'Confirmed', value: filteredBookings.filter(b => b.status === 'confirmed').length },
          { metric: 'Cancelled', value: filteredBookings.filter(b => b.status === 'cancelled').length },
          { metric: 'Active Users', value: data.users.length },
        ];
        exportToCSV('System_Analytics', stats);
        break;
      }
      case 'Utilization': {
        const utilization = data.rooms.map(room => ({
          room: room.room_name,
          total_bookings: filteredBookings.filter(b => b.catalog_id === room.catalog_id && b.room_id === room.room_id).length,
          confirmed: filteredBookings.filter(b => b.catalog_id === room.catalog_id && b.room_id === room.room_id && b.status === 'confirmed').length
        }));
        exportToCSV('Room_Utilization', utilization);
        break;
      }
      case 'User Activity': {
        const activity = data.users.map(u => ({
          name: u.name,
          email: u.email,
          dept: u.dept,
          total_bookings: filteredBookings.filter(b => b.uid === u.uid).length,
          confirmed: filteredBookings.filter(b => b.uid === u.uid && b.status === 'confirmed').length
        }));
        exportToCSV('User_Activity', activity);
        break;
      }
      case 'Cancellations': {
        exportToCSV('Cancellations_Report', data.cancellations.filter(c => filteredBookings.some(b => b.booking_id === c.booking_id)));
        break;
      }
      case 'Dept Summary': {
        const deptCounts: Record<string, number> = {};
        const userDeptMap: Record<string, string> = {};
        data.users.forEach(u => { userDeptMap[u.uid] = u.dept || 'Other'; });
        filteredBookings.forEach(b => {
          const dept = userDeptMap[b.uid] || 'Other';
          deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });
        const summary = Object.entries(deptCounts).map(([dept, count]) => ({ department: dept, total_bookings: count }));
        exportToCSV('Department_Summary', summary);
        break;
      }
      default: break;
    }
  };

  const totalBookings = filteredBookings.length;
// ... (rest of the processing logic)
  const activeUsers = data.users.length;
  const filteredCancellations = data.cancellations.filter(c => filteredBookings.some(b => b.booking_id === c.booking_id));
  const cancellationRate = totalBookings > 0 ? ((filteredCancellations.length / totalBookings) * 100).toFixed(1) : '0';

  const roomsWithBookings = new Set(filteredBookings.filter(b => b.status === 'confirmed').map(b => `${b.catalog_id}-${b.room_id}`));
  const utilization = data.rooms.length > 0 ? Math.round((roomsWithBookings.size / data.rooms.length) * 100) : 0;

  // Process Dynamic Chart Data
  const getDepartmentData = () => {
    const userDeptMap: Record<string, string> = {};
    data.users.forEach(u => { userDeptMap[u.uid] = u.dept || 'Other'; });

    const deptCounts: Record<string, number> = {};
    filteredBookings.filter(b => b.status === 'confirmed').forEach(b => {
      const dept = userDeptMap[b.uid] || 'Other';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];
    return Object.entries(deptCounts).map(([name, count], i) => ({
      name: name === 'undefined' ? 'Other' : name,
      value: count,
      color: colors[i % colors.length]
    })).sort((a, b) => b.value - a.value);
  };

  const getMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    const monthlyStats: Record<string, { bookings: number; users: Set<string> }> = {};

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = months[d.getMonth()];
      monthlyStats[m] = { bookings: 0, users: new Set() };
    }

    filteredBookings.filter(b => b.status === 'confirmed').forEach(b => {
      const date = new Date(b.start_date);
      if (date.getFullYear() === currentYear) {
        const m = months[date.getMonth()];
        if (monthlyStats[m]) {
          monthlyStats[m].bookings++;
          monthlyStats[m].users.add(b.uid);
        }
      }
    });

    return Object.entries(monthlyStats).map(([month, stats]) => ({
      month,
      bookings: stats.bookings,
      users: stats.users.size
    }));
  };

  const departmentUsage = getDepartmentData().length > 0 ? getDepartmentData() : [
    { name: 'No Data', value: 1, color: '#e5e7eb' }
  ];

  const monthlyBookings = getMonthlyData();

  const roomPopularity = data.rooms.slice(0, 5).map(room => ({
    room: room.room_name,
    bookings: filteredBookings.filter(b => b.catalog_id === room.catalog_id && b.room_id === room.room_id && b.status === 'confirmed').length
  })).sort((a, b) => b.bookings - a.bookings);

  // Render Metric Detail Modal
  const renderMetricModal = () => {
    if (!selectedMetric) return null;

    let title = '';
    let content = null;

    if (selectedMetric === 'bookings') {
      title = 'Bookings Breakdown';
      const confirmed = filteredBookings.filter(b => b.status === 'confirmed').length;
      const cancelled = filteredBookings.filter(b => b.status === 'cancelled').length;
      const rejected = filteredBookings.filter(b => b.status === 'rejected').length;

      content = (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
              <p className="text-[10px] text-green-600 font-bold uppercase">Confirmed</p>
              <p className="text-xl font-bold text-green-700">{confirmed}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-[10px] text-gray-600 font-bold uppercase">Cancelled</p>
              <p className="text-xl font-bold text-gray-700">{cancelled}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <p className="text-[10px] text-red-600 font-bold uppercase">Rejected</p>
              <p className="text-xl font-bold text-red-700">{rejected}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-semibold mb-2">Recent Bookings</p>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {filteredBookings.slice(0, 5).map(b => (
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
              const bookingCount = filteredBookings.filter(b => b.catalog_id === room.catalog_id && b.room_id === room.room_id && b.status === 'confirmed').length;
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
            {filteredCancellations.slice(0, 10).map((c, i) => (
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
        count: filteredBookings.filter(b => b.uid === u.uid).length
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

  if (loading) return <div className="p-6 h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="p-4 lg:p-6 space-y-6 relative">
      {renderMetricModal()}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Customizable Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate and export booking analytics</p>
        </div>
        <div className="flex overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 gap-2 scrollbar-none">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={`gap-2 whitespace-nowrap ${dateRange ? 'border-primary ring-1 ring-primary/30' : ''}`}>
                <CalendarIcon className="w-4 h-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick Range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={`gap-2 whitespace-nowrap ${(statusFilter.length > 0 || roomFilter.length > 0) ? 'border-primary ring-1 ring-primary/30' : ''}`}>
                <FilterIcon className="w-4 h-4" />
                Filter {(statusFilter.length + roomFilter.length) > 0 && `(${(statusFilter.length + roomFilter.length)})`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="end">
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-xs uppercase text-muted-foreground mb-2">Status</h4>
                  <div className="space-y-2">
                    {['confirmed', 'cancelled', 'rejected'].map(status => (
                      <div key={status} className="flex items-center gap-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={statusFilter.includes(status)}
                          onCheckedChange={(checked) => {
                            if (checked) setStatusFilter([...statusFilter, status]);
                            else setStatusFilter(statusFilter.filter(s => s !== status));
                          }}
                        />
                        <label htmlFor={`status-${status}`} className="text-sm capitalize">{status}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-xs uppercase text-muted-foreground mb-2">Rooms</h4>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                    {data.rooms.map(room => (
                      <div key={`${room.catalog_id}-${room.room_id}`} className="flex items-center gap-2">
                        <Checkbox
                          id={`room-${room.room_id}`}
                          checked={roomFilter.includes(`${room.catalog_id}-${room.room_id}`)}
                          onCheckedChange={(checked) => {
                            const id = `${room.catalog_id}-${room.room_id}`;
                            if (checked) setRoomFilter([...roomFilter, id]);
                            else setRoomFilter(roomFilter.filter(r => r !== id));
                          }}
                        />
                        <label htmlFor={`room-${room.room_id}`} className="text-xs truncate">{room.room_name}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button variant="secondary" size="sm" className="w-full text-xs font-bold" onClick={clearFilters}>Reset Filters</Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button size="sm" className="gap-2 whitespace-nowrap" onClick={() => exportToCSV('All_Bookings', filteredBookings)}>
            <Download className="w-4 h-4" />
            Export ({filteredBookings.length})
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { label: 'Total Bookings', value: totalBookings, metric: 'bookings', color: 'primary', subText: 'Lifetime total' },
          { label: 'Avg. Utilization', value: `${utilization}%`, metric: 'utilization', color: 'blue', subText: 'Rooms active' },
          { label: 'Cancellation', value: `${cancellationRate}%`, metric: 'cancellation', color: 'red', subText: 'Relative rate' },
          { label: 'Active Users', value: activeUsers, metric: 'users', color: 'green', subText: 'Registered users' },
        ].map(item => (
          <Card
            key={item.metric}
            className={`p-3 lg:p-4 cursor-pointer hover:shadow-lg transition-all group active:scale-[0.98] border-l-4 border-l-${item.color}-500`}
            onClick={() => setSelectedMetric(item.metric)}
          >
            <p className="text-[10px] lg:text-sm text-muted-foreground uppercase font-bold tracking-tight">{item.label}</p>
            <p className="text-xl lg:text-3xl font-black text-foreground mt-1">{item.value}</p>
            <p className="text-[9px] lg:text-xs text-muted-foreground mt-1">{item.subText}</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <Card className="p-4 lg:p-6">
          <h3 className="text-sm lg:text-lg font-semibold text-foreground mb-4">Usage by Department</h3>
          <div className="h-[250px] lg:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentUsage}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name }: any) => name}
                  outerRadius="80%"
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
          </div>
        </Card>

        <Card className="p-4 lg:p-6">
          <h3 className="text-sm lg:text-lg font-semibold text-foreground mb-4">Monthly Trend</h3>
          <div className="h-[250px] lg:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyBookings}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="users" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Room Popularity */}
      <Card className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm lg:text-lg font-semibold text-foreground">Room Popularity</h3>
          <p className="text-[10px] text-muted-foreground uppercase font-bold font-mono">Top Performance</p>
        </div>
        <div className="space-y-4">
          {roomPopularity.map((room, index) => (
            <div key={room.room}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs lg:text-sm font-medium text-foreground truncate max-w-[200px]">{room.room}</p>
                <p className="text-xs lg:text-sm font-bold text-foreground">{room.bookings}</p>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${index === 0
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
      <Card className="p-4 lg:p-6">
        <h3 className="text-sm lg:text-lg font-semibold text-foreground mb-4">Report Templates</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4">
          {[
            { name: 'Weekly Usage', icon: '📊' },
            { name: 'Analytics', icon: '📈' },
            { name: 'Utilization', icon: '🏢' },
            { name: 'User Activity', icon: '👥' },
            { name: 'Cancellations', icon: '❌' },
            { name: 'Dept Summary', icon: '📋' },
          ].map((template) => (
            <Card key={template.name} className="p-3 lg:p-4 border cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all bg-muted/10 group active:scale-[0.98]" onClick={() => handleGenerateReport(template.name)}>
              <div className="text-xl lg:text-3xl mb-2 group-hover:scale-110 transition-transform">{template.icon}</div>
              <p className="font-bold text-foreground text-[10px] lg:text-sm">{template.name}</p>
              <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-[10px] uppercase font-bold tracking-wider group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                Generate
              </Button>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
