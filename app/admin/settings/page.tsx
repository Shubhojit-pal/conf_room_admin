'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Lock, Globe, Database, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '@/lib/sound-manager';
import { useUISound } from '@/hooks/use-ui-sound';
export default function SettingsPage() {
  const { playSuccess } = useUISound();
  const [soundsEnabled, setSoundsEnabled] = useState(true);

  useEffect(() => {
    if (soundManager) {
      setSoundsEnabled(soundManager.isEnabled());
    }
  }, []);

  const toggleSounds = () => {
    const newState = !soundsEnabled;
    setSoundsEnabled(newState);
    soundManager?.setEnabled(newState);
    if (newState) {
      soundManager?.play('click');
    }
  };

  const handleSave = () => {
    playSuccess();
    // In a real app, this would call an API
    alert('Settings saved successfully!');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure system-wide preferences and integrations</p>
      </div>

      {/* General Settings */}
      <Card className="p-4 lg:p-6">
        <h3 className="text-base lg:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 lg:w-5 lg:h-5" />
          General Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-xl mb-4 transition-all">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${soundsEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {soundsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Interactive Audio</p>
                <p className="text-xs text-muted-foreground">Enable or disable UI sound effects</p>
              </div>
            </div>
            <button
              onClick={toggleSounds}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                soundsEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  soundsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="text-xs lg:text-sm font-semibold text-foreground">Organization Name</label>
            <input
              type="text"
              defaultValue="Acme Corporation"
              className="w-full mt-1.5 px-3 lg:px-4 py-2 border border-border rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs lg:text-sm font-semibold text-foreground">Admin Email</label>
            <input
              type="email"
              defaultValue="admin@company.com"
              className="w-full mt-1.5 px-3 lg:px-4 py-2 border border-border rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs lg:text-sm font-semibold text-foreground">Timezone</label>
              <select className="w-full mt-1.5 px-3 lg:px-4 py-2 border border-border rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option>UTC-5 (Eastern)</option>
                <option>UTC-6 (Central)</option>
                <option>UTC-7 (Mountain)</option>
                <option>UTC-8 (Pacific)</option>
              </select>
            </div>
            <div>
              <label className="text-xs lg:text-sm font-semibold text-foreground">Date Format</label>
              <select className="w-full mt-1.5 px-3 lg:px-4 py-2 border border-border rounded-lg bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full text-sm h-10">Save General Settings</Button>
        </div>
      </Card>

      {/* Room Settings */}
      <Card className="p-4 lg:p-6">
        <h3 className="text-base lg:text-lg font-semibold text-foreground mb-4">Room Management</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs lg:text-sm font-semibold text-foreground">Default Duration (min)</label>
              <input
                type="number"
                defaultValue="60"
                className="w-full mt-1.5 px-3 lg:px-4 py-2 border border-border rounded-lg bg-background text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs lg:text-sm font-semibold text-foreground">Min Advance (hrs)</label>
              <input
                type="number"
                defaultValue="1"
                className="w-full mt-1.5 px-3 lg:px-4 py-2 border border-border rounded-lg bg-background text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs lg:text-sm font-semibold text-foreground">Max Duration (hrs)</label>
              <input
                type="number"
                defaultValue="4"
                className="w-full mt-1.5 px-3 lg:px-4 py-2 border border-border rounded-lg bg-background text-sm text-foreground"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border" id="require-approval" />
            <label htmlFor="require-approval" className="text-xs lg:text-sm font-medium text-foreground cursor-pointer">
              Require Approval for Bookings
            </label>
          </div>

          <Button className="w-full text-sm h-10">Save Room Settings</Button>
        </div>
      </Card>

      {/* User Permissions */}
      <Card className="p-4 lg:p-6 overflow-hidden">
        <h3 className="text-base lg:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 lg:w-5 lg:h-5" />
          User Permissions
        </h3>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="min-w-full divide-y divide-border text-xs lg:text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Role</th>
                <th className="text-center p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">View</th>
                <th className="text-center p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Create</th>
                <th className="text-center p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Approve</th>
                <th className="text-center p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Rooms</th>
                <th className="text-center p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Users</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { role: 'Admin', permissions: [true, true, true, true, true] },
                { role: 'Manager', permissions: [true, true, true, false, false] },
                { role: 'User', permissions: [true, true, false, false, false] },
              ].map((row) => (
                <tr key={row.role} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-bold text-foreground">{row.role}</td>
                  {row.permissions.map((perm, idx) => (
                    <td key={idx} className="p-4 text-center">
                      <div className={`w-3 h-3 rounded-full mx-auto ${perm ? 'bg-green-500' : 'bg-slate-200'}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* API & Integrations */}
      <Card className="p-4 lg:p-6">
        <h3 className="text-base lg:text-lg font-semibold text-foreground mb-4">API Keys & Integrations</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs lg:text-sm font-semibold text-foreground">Google Calendar API</label>
              <Badge className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0">Active</Badge>
            </div>
            <input
              type="password"
              value="****************************"
              className="w-full px-3 lg:px-4 py-2 border border-border rounded-lg bg-background text-sm text-foreground"
              readOnly
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">Last updated: 2 days ago</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs lg:text-sm font-semibold text-foreground">MS Graph API</label>
              <Badge className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0">Active</Badge>
            </div>
            <input
              type="password"
              value="****************************"
              className="w-full px-3 lg:px-4 py-2 border border-border rounded-lg bg-background text-sm text-foreground"
              readOnly
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">Last updated: 5 days ago</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" className="flex-1 text-xs h-9">
              Add Integration
            </Button>
            <Button variant="outline" className="flex-1 text-xs h-9">
              API Documentation
            </Button>
          </div>
        </div>
      </Card>

      {/* Backup & Data */}
      <Card className="p-4 lg:p-6">
        <h3 className="text-base lg:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 lg:w-5 lg:h-5" />
          Data Management
        </h3>
        <div className="space-y-4">
          <div className="p-3 lg:p-4 bg-muted/30 border border-border rounded-lg">
            <p className="text-xs lg:text-sm text-foreground mb-1">
              <strong>Last Backup:</strong> Today at 2:30 AM
            </p>
            <p className="text-[10px] lg:text-xs text-muted-foreground">
              Automatic daily backups. Manual downloads available.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex-1 text-xs h-9">
              Download Backup
            </Button>
            <Button variant="outline" className="flex-1 text-xs h-9">
              Backup Now
            </Button>
          </div>

          <div className="p-3 lg:p-4 bg-red-50/50 border border-red-100 rounded-lg">
            <p className="text-xs lg:text-sm font-bold text-red-700 mb-1 uppercase tracking-tight">Danger Zone</p>
            <p className="text-[10px] lg:text-xs text-red-600/80 mb-3">
              Permanent deletions. Proceed with absolute caution.
            </p>
            <Button variant="outline" className="w-full sm:w-auto text-destructive hover:text-destructive text-xs h-9 px-6 border-red-200 hover:bg-red-50">
              Delete All Data
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
