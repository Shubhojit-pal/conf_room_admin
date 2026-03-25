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
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { fetchAllBookings, getAdminUser } from '@/lib/api';

// All possible nav items — filtered by role in component
const ALL_NAV_ITEMS = [
  { label: 'Dashboard',     href: '/admin',                icon: LayoutGrid,  roles: ['location_admin', 'super_admin'] },
  { label: 'Rooms',         href: '/admin/rooms',          icon: Building2,   roles: ['location_admin', 'super_admin'] },
  { label: 'Bookings',      href: '/admin/bookings',       icon: Calendar,    roles: ['location_admin', 'super_admin'] },
  { label: 'Users',         href: '/admin/users',          icon: Users,       roles: ['super_admin'] },
  { label: 'Reports',       href: '/admin/reports',        icon: BarChart3,   roles: ['super_admin'] },
  { label: 'Locations',     href: '/admin/locations',      icon: MapPin,      roles: ['super_admin'] },
  { label: 'Admins',        href: '/admin/admins',         icon: ShieldCheck, roles: ['super_admin'] },
  { label: 'Notifications', href: '/admin/notifications',  icon: Bell,        roles: ['location_admin', 'super_admin'] },
  { label: 'Settings',      href: '/admin/settings',       icon: Settings,    roles: ['location_admin', 'super_admin'] },
];


interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const [activeCount, setActiveCount] = useState<number>(0);
  const [adminRole, setAdminRole] = useState<string>('location_admin');

  useEffect(() => {
    const admin = getAdminUser();
    if (admin?.role) setAdminRole(admin.role);
  }, []);

  // Filter nav items by current admin's role
  const navigationItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(adminRole));

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
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 lg:w-72 bg-sidebar border-r border-sidebar-border flex flex-col z-50 transition-all duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 lg:p-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-sidebar-foreground flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary shadow-lg shadow-primary/20">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="tracking-tight">BookRooms</span>
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <p className="text-xs text-sidebar-foreground/50 font-medium uppercase tracking-widest">Admin System</p>
            </div>
          </div>
          <button 
            className="lg:hidden p-2 hover:bg-sidebar-accent rounded-xl text-sidebar-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between group px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-primary-foreground' : 'text-sidebar-foreground/50 group-hover:text-primary'}`} />
                  <span className="text-sm font-semibold tracking-tight">{item.label}</span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground/50" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 transition-transform group-hover:scale-110">
              <Calendar className="w-24 h-24 text-primary" />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">
                Active Bookings
              </p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-black text-sidebar-foreground">{activeCount}</p>
                <p className="text-xs text-sidebar-foreground/40 font-medium">confirmed</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
