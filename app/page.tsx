'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRootRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      router.push('/admin');
    } else {
      // Redirect unauthenticated root access to the unified User Login page.
      const userUrl = process.env.NEXT_PUBLIC_USER_URL || 'http://localhost:5173';
      window.location.href = `${userUrl}/#login`;
    }
  }, [router]);

  return null;
}
