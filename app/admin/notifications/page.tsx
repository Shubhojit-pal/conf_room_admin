'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { Bell, Mail, MessageSquare, Clock } from 'lucide-react';

const notificationChannels = [
  { id: 'email', name: 'Email', icon: Mail, enabled: true },
  { id: 'slack', name: 'Slack', icon: MessageSquare, enabled: true },
  { id: 'dashboard', name: 'Dashboard', icon: Bell, enabled: true },
];

const notificationEvents = [
  {
    id: 'booking_created',
    name: 'New Booking',
    description: 'When a new booking is created',
    channels: ['email', 'slack', 'dashboard'],
    enabled: true,
  },
  {
    id: 'booking_approved',
    name: 'Booking Approved',
    description: 'When a booking is approved',
    channels: ['email', 'slack'],
    enabled: true,
  },
  {
    id: 'booking_rejected',
    name: 'Booking Rejected',
    description: 'When a booking is rejected',
    channels: ['email'],
    enabled: true,
  },
  {
    id: 'cancellation_requested',
    name: 'Cancellation Request',
    description: 'When a cancellation is requested',
    channels: ['email', 'dashboard'],
    enabled: true,
  },
  {
    id: 'room_maintenance',
    name: 'Room Maintenance',
    description: 'When a room goes into maintenance',
    channels: ['slack', 'dashboard'],
    enabled: true,
  },
];

export default function NotificationsPage() {
  const [emailSettings, setEmailSettings] = useState({
    quietHoursEnabled: true,
    quietHoursStart: '18:00',
    quietHoursEnd: '09:00',
    digestFrequency: 'daily',
  });

  const [slackSettings, setSlackSettings] = useState({
    webhookUrl: '****************************',
    configured: true,
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Notification Settings</h1>
        <p className="text-muted-foreground mt-1">Configure email alerts and integrations</p>
      </div>

      {/* Channel Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Active Channels</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {notificationChannels.map((channel) => {
            const Icon = channel.icon;
            return (
              <div key={channel.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-foreground" />
                  <span className="font-medium text-foreground">{channel.name}</span>
                </div>
                <Toggle pressed={channel.enabled} onPressedChange={() => {}}>
                  {channel.enabled ? 'On' : 'Off'}
                </Toggle>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Email Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Settings
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground">Email Address</label>
            <input
              type="email"
              value="admin@company.com"
              className="w-full mt-2 px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              readOnly
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <input
                type="checkbox"
                checked={emailSettings.quietHoursEnabled}
                onChange={(e) =>
                  setEmailSettings({ ...emailSettings, quietHoursEnabled: e.target.checked })
                }
              />
              Enable Quiet Hours
            </label>
            {emailSettings.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="text-xs text-muted-foreground">Start Time</label>
                  <input
                    type="time"
                    value={emailSettings.quietHoursStart}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, quietHoursStart: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">End Time</label>
                  <input
                    type="time"
                    value={emailSettings.quietHoursEnd}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, quietHoursEnd: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground">Digest Frequency</label>
            <select
              value={emailSettings.digestFrequency}
              onChange={(e) =>
                setEmailSettings({ ...emailSettings, digestFrequency: e.target.value })
              }
              className="w-full mt-2 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="immediate">Immediate</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <Button className="w-full">Save Email Settings</Button>
        </div>
      </Card>

      {/* Slack Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Slack Integration
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground">Webhook URL</label>
            <input
              type="password"
              value={slackSettings.webhookUrl}
              className="w-full mt-2 px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              readOnly
            />
            <p className="text-xs text-muted-foreground mt-2">
              {slackSettings.configured && <Badge className="bg-green-100 text-green-800">Connected</Badge>}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Update Webhook
            </Button>
            <Button variant="outline" className="text-destructive hover:text-destructive">
              Disconnect
            </Button>
          </div>
        </div>
      </Card>

      {/* Calendar Sync */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Calendar Integrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-border rounded-lg">
            <h4 className="font-semibold text-foreground mb-2">Google Calendar</h4>
            <p className="text-sm text-muted-foreground mb-4">Sync bookings with Google Calendar</p>
            <Button variant="outline" className="w-full">
              Configure
            </Button>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <h4 className="font-semibold text-foreground mb-2">Microsoft Outlook</h4>
            <p className="text-sm text-muted-foreground mb-4">Sync bookings with Outlook calendar</p>
            <Badge className="bg-green-100 text-green-800 mb-4">Connected</Badge>
            <Button variant="outline" className="w-full">
              Manage
            </Button>
          </div>
        </div>
      </Card>

      {/* Event Notification Rules */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Event Notifications</h3>
        <div className="space-y-3">
          {notificationEvents.map((event) => (
            <div key={event.id} className="flex items-start justify-between p-4 border border-border rounded-lg">
              <div className="flex-1">
                <p className="font-semibold text-foreground">{event.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {event.channels.map((channel) => (
                    <Badge key={channel} variant="secondary" className="text-xs">
                      {channel === 'email' && '📧 Email'}
                      {channel === 'slack' && '💬 Slack'}
                      {channel === 'dashboard' && '🔔 Dashboard'}
                    </Badge>
                  ))}
                </div>
              </div>
              <Toggle pressed={event.enabled} onPressedChange={() => {}}>
                {event.enabled ? 'On' : 'Off'}
              </Toggle>
            </div>
          ))}
        </div>
      </Card>

      {/* Test Notification */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-foreground mb-2">Test Notifications</h3>
        <p className="text-sm text-muted-foreground mb-4">Send a test notification to verify your settings</p>
        <Button className="gap-2">
          <Bell className="w-4 h-4" />
          Send Test Email
        </Button>
      </Card>
    </div>
  );
}
