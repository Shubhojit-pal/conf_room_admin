'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { fetchAllUsers, User } from '@/lib/api';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAllUsers()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.dept.toLowerCase().includes(q);
  });

  const getRoleColor = (role: string) => {
    if (role === 'admin' || role === 'ADMIN') return 'bg-purple-100 text-purple-800';
    return 'bg-blue-100 text-blue-800';
  };

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.userrole_id === 'admin' || u.userrole_id === 'ADMIN').length;
  const regularCount = totalUsers - adminCount;

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-[300px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground mt-1">View and manage system users</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-3 lg:p-4">
          <p className="text-[10px] lg:text-sm text-muted-foreground uppercase font-semibold">Total</p>
          <p className="text-xl lg:text-2xl font-bold text-foreground mt-1">{totalUsers}</p>
        </Card>
        <Card className="p-3 lg:p-4">
          <p className="text-[10px] lg:text-sm text-muted-foreground uppercase font-semibold">Admins</p>
          <p className="text-xl lg:text-2xl font-bold text-purple-600 mt-1">{adminCount}</p>
        </Card>
        <Card className="p-3 lg:p-4 col-span-2 lg:col-span-1">
          <p className="text-[10px] lg:text-sm text-muted-foreground uppercase font-semibold">Regular Users</p>
          <p className="text-xl lg:text-2xl font-bold text-blue-600 mt-1">{regularCount}</p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-xs lg:text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">UID</th>
                <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Name</th>
                <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Email</th>
                <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Dept</th>
                <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(u => (
                <tr key={u.uid} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-mono text-foreground whitespace-nowrap">{u.uid.slice(0, 8)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] lg:text-sm font-bold text-primary">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="font-medium text-foreground whitespace-nowrap">{u.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground whitespace-nowrap">{u.email}</td>
                  <td className="p-4 text-foreground whitespace-nowrap">{u.dept}</td>
                  <td className="p-4">
                    <Badge className={`${getRoleColor(u.userrole_id)} text-[10px] px-2 py-0.5 whitespace-nowrap`}>
                      {u.userrole_id === 'admin' || u.userrole_id === 'ADMIN' ? 'Admin' : 'User'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No users found</p>
          </div>
        )}
      </Card>
    </div>
  );
}
