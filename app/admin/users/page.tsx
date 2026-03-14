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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-1">View and manage system users</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Users</p>
          <p className="text-2xl font-bold text-foreground mt-1">{totalUsers}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Admins</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{adminCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Regular Users</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{regularCount}</p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, email, or department..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">UID</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Name</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Email</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Department</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Phone</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.uid} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-sm font-mono text-foreground">{u.uid}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{u.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{u.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{u.email}</td>
                  <td className="p-4 text-sm text-foreground">{u.dept}</td>
                  <td className="p-4 text-sm text-foreground">{u.phone_no || '—'}</td>
                  <td className="p-4">
                    <Badge className={getRoleColor(u.userrole_id)}>
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
