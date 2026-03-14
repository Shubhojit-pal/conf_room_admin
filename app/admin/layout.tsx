import type { ReactNode } from 'react';
import { Sidebar } from '@/components/admin/sidebar';
import { TopBar } from '@/components/admin/topbar';

export const metadata = {
  title: 'Admin Dashboard - Conference Room Booking',
  description: 'Manage conference rooms, bookings, and user permissions',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
