"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Building2,
  Users,
  Calendar,
  Bell,
  Settings,
  BarChart3,
  X,
} from 'lucide-react';
import { fetchAllBookings } from '@/lib/api';

const navigationItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutGrid },
  { label: 'Rooms', href: '/admin/rooms', icon: Building2 },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Bookings', href: '/admin/bookings', icon: Calendar },
  { label: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
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

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname, setIsOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Container */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-sidebar-border flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              BookRooms
            </h1>
            <p className="text-sm text-sidebar-foreground/60 mt-1">Admin Panel</p>
          </div>
          <button 
            className="lg:hidden p-2 hover:bg-sidebar-accent rounded-lg text-sidebar-foreground"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
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
    </>
  );
}
