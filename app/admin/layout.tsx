'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/admin/sidebar';
import { TopBar } from '@/components/admin/topbar';
import { SoundProvider } from '@/components/providers/sound-provider';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <SoundProvider>
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <div className="flex flex-col flex-1 min-w-0">
          <TopBar onMenuClick={() => setIsSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-muted/10">
            {children}
          </main>
        </div>
      </SoundProvider>
    </div>
  );
}
