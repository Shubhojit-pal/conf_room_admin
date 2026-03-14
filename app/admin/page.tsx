'use client';

/**
 * @file page.tsx
 * @description Main admin dashboard page for the Next.js admin panel.
 *
 * This is the index route of the `/admin` segment. It assembles four key
 * dashboard widgets into a responsive two-column layout:
 *
 *  - `DashboardAnalytics`: High-level KPIs (total bookings, rooms, etc.).
 *  - `RecentBookings`:     A table of the latest booking activity.
 *  - `RealTimeAvailability`: Live room availability status.
 *  - `NotificationFeed`:  Recent system and booking notifications for admin.
 *
 * @module admin/page
 */

import { DashboardAnalytics } from '@/components/admin/dashboard/analytics';
import { RealTimeAvailability } from '@/components/admin/dashboard/availability';
import { RecentBookings } from '@/components/admin/dashboard/recent-bookings';
import { NotificationFeed } from '@/components/admin/dashboard/notification-feed';

/**
 * AdminDashboard — the primary overview page for system administrators.
 *
 * Renders a header section with a title and subtitle, followed by the
 * analytics widgets row, then a two-column grid for bookings and
 * side-panel widgets.
 *
 * @returns {JSX.Element} The rendered admin dashboard page.
 */
export default function AdminDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your conference room booking system</p>
      </div>

      <DashboardAnalytics />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentBookings />
        </div>
        <div>
          <div className="space-y-6">
            <RealTimeAvailability />
            <NotificationFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
