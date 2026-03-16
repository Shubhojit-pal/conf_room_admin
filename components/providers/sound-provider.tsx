'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { soundManager } from '@/lib/sound-manager';

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // 1. Global Click Listener
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if target or parent is interactive
      const isInteractive = (el: HTMLElement | null): boolean => {
        if (!el) return false;
        const tag = el.tagName.toLowerCase();
        const role = el.getAttribute('role');
        const isClickable = tag === 'button' || tag === 'a' || role === 'button';
        
        if (isClickable) return true;
        if (el.parentElement) return isInteractive(el.parentElement);
        return false;
      };

      if (isInteractive(target)) {
        soundManager?.play('click');
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // 2. Route Change Sound
  useEffect(() => {
    // We play the click sound when the pathname changes (indicative of navigation)
    // Note: This won't play on initial load as per best practices, 
    // but on transitions it provides nice feedback.
    soundManager?.play('click');
  }, [pathname]);

  return <>{children}</>;
}
