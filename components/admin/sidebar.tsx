"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Building2,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Bell,
  Settings,
  BarChart3,
} from 'lucide-react';
import { fetchAllBookings } from '@/lib/api';

/**
 * ═══════════════════════════════════════════════════════════════
 *  ADMIN FRONTEND — NAVIGATION ROUTES (http://localhost:3001)
 * ═══════════════════════════════════════════════════════════════
 *
 *  Route                        Page               Description
 *  ─────────────────────────    ────────────────   ──────────────────────────────
 *  /                            Login Page          Admin login (email + password)
 *  /admin                       Dashboard           Overview: stats, recent bookings
 *  /admin/rooms                 Rooms               Add, view, delete conference rooms
 *  /admin/users                 Users               View registered users
 *  /admin/bookings              Bookings            View all bookings (all statuses)
 *  /admin/approvals             Approvals           Approve or reject pending bookings
 *  /admin/cancellations         Cancellations       View cancellation records
 *  /admin/reports               Reports             Booking analytics & reports
 *  /admin/notifications         Notifications       System notifications
 *  /admin/settings              Settings            System settings
 *
 *  NAVIGATION FLOW:
 *  ═══════════════════════════════════════════════════════════════
 *
 *  Login Page ('/')
 *    └── On successful admin login  → Dashboard ('/admin')
 *
 *  Sidebar (visible on all /admin/* pages):
 *    ├── Dashboard                  → /admin
 *    ├── Rooms                      → /admin/rooms
 *    ├── Users                      → /admin/users
 *    ├── Bookings                   → /admin/bookings
 *    ├── Approvals                  → /admin/approvals
 *    ├── Cancellations              → /admin/cancellations
 *    ├── Reports                    → /admin/reports
 *    ├── Notifications              → /admin/notifications
 *    └── Settings                   → /admin/settings
 *
 *  Approvals Page ('/admin/approvals')
 *    ├── "Approve" button           → Changes booking status to 'confirmed'
 *    └── "Reject" button            → Changes booking status to 'rejected'
 *
 *  Bookings Page ('/admin/bookings')
 *    ├── "Cancel" button            → Cancels booking → appears in /admin/cancellations
 *    └── "Delete" button            → Deletes booking permanently
 *
 * ═══════════════════════════════════════════════════════════════
 */
const navigationItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutGrid },               // Route: /admin
  { label: 'Rooms', href: '/admin/rooms', icon: Building2 },              // Route: /admin/rooms
  { label: 'Users', href: '/admin/users', icon: Users },                  // Route: /admin/users
  { label: 'Bookings', href: '/admin/bookings', icon: Calendar },         // Route: /admin/bookings
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },          // Route: /admin/reports
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },   // Route: /admin/notifications
  { label: 'Settings', href: '/admin/settings', icon: Settings },         // Route: /admin/settings
];

export function Sidebar() {
  const pathname = usePathname();
  const [activeCount, setActiveCount] = useState<number>(0);

  useEffect(() => {
    fetchAllBookings()
      .then(bookings => {
        const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
        setActiveCount(confirmedCount);
      })
      .catch(console.error);
  }, []);

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          BookRooms
        </h1>
        <p className="text-sm text-sidebar-foreground/60 mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${isActive
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent/50 rounded-lg p-3">
          <p className="text-xs text-sidebar-foreground font-semibold mb-1">
            Confirmed Bookings
          </p>
          <p className="text-2xl font-bold text-sidebar-foreground">{activeCount}</p>
          <p className="text-xs text-sidebar-foreground/60">Total active</p>
        </div>
      </div>
    </aside>
  );
}
