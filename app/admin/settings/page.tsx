'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Lock, Globe, Database } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
        <p className="text-muted-foreground mt-1">Configure system-wide preferences and integrations</p>
      </div>

      {/* General Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          General Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground">Organization Name</label>
            <input
              type="text"
              defaultValue="Acme Corporation"
              className="w-full mt-2 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground">Admin Email</label>
            <input
              type="email"
              defaultValue="admin@company.com"
              className="w-full mt-2 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground">Timezone</label>
              <select className="w-full mt-2 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option>UTC-5 (Eastern)</option>
                <option>UTC-6 (Central)</option>
                <option>UTC-7 (Mountain)</option>
                <option>UTC-8 (Pacific)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Date Format</label>
              <select className="w-full mt-2 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
          </div>

          <Button className="w-full">Save General Settings</Button>
        </div>
      </Card>

      {/* Room Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Room Management</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground">Default Booking Duration (minutes)</label>
            <input
              type="number"
              defaultValue="60"
              className="w-full mt-2 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground">Minimum Advance Booking (hours)</label>
            <input
              type="number"
              defaultValue="1"
              className="w-full mt-2 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground">Maximum Booking Duration (hours)</label>
            <input
              type="number"
              defaultValue="4"
              className="w-full mt-2 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              Require Approval for Bookings
            </label>
          </div>

          <Button className="w-full">Save Room Settings</Button>
        </div>
      </Card>

      {/* User Permissions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          User Permissions
        </h3>
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Role</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">View Bookings</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Create Booking</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Approve Booking</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Manage Rooms</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Manage Users</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { role: 'Admin', permissions: [true, true, true, true, true] },
                  { role: 'Manager', permissions: [true, true, true, false, false] },
                  { role: 'User', permissions: [true, true, false, false, false] },
                ].map((row) => (
                  <tr key={row.role} className="border-b border-border">
                    <td className="py-3 px-4 font-medium text-foreground">{row.role}</td>
                    {row.permissions.map((perm, idx) => (
                      <td key={idx} className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={perm}
                          className="w-4 h-4"
                          disabled
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* API & Integrations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">API Keys & Integrations</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-foreground">Google Calendar API</label>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <input
              type="password"
              value="****************************"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              readOnly
            />
            <p className="text-xs text-muted-foreground mt-2">Last updated: 2 days ago</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-foreground">Microsoft Graph API</label>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <input
              type="password"
              value="****************************"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              readOnly
            />
            <p className="text-xs text-muted-foreground mt-2">Last updated: 5 days ago</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Add New Integration
            </Button>
            <Button variant="outline" className="flex-1">
              View API Documentation
            </Button>
          </div>
        </div>
      </Card>

      {/* Backup & Data */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Management
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-foreground mb-2">
              <strong>Last Backup:</strong> Today at 2:30 AM
            </p>
            <p className="text-sm text-muted-foreground">
              Your data is automatically backed up daily. You can download backups at any time.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Download Backup
            </Button>
            <Button variant="outline" className="flex-1">
              Backup Now
            </Button>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-semibold text-red-900 mb-2">Danger Zone</p>
            <p className="text-sm text-red-800 mb-3">
              These actions cannot be undone. Please proceed with caution.
            </p>
            <Button variant="outline" className="text-destructive hover:text-destructive">
              Delete All Data
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
