'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchAdminProfile } from '@/lib/api';

function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Authenticating and securing session...');

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('Authentication failed. No secure token provided. Redirecting to login...');
        setTimeout(() => {
          const userUrl = process.env.NEXT_PUBLIC_USER_URL || 'http://localhost:5173';
          window.location.href = `${userUrl}/#login`;
        }, 1500);
        return;
      }

      // Temporarily store the token so the AuthHeaders can pick it up
      localStorage.setItem('admin_token', token);

      try {
        // Fetch the profile utilizing the newly issued unified token
        const adminProfile = await fetchAdminProfile();
        
        // Fully authenticate the local session
        localStorage.setItem('admin_user', JSON.stringify(adminProfile));
        
        setStatus('Authenticated successfully! Entering Dashboard...');
        
        // Redirect to admin dashboard
        router.push('/admin');
      } catch (err) {
        console.error('Failed to verify token:', err);
        setStatus('Session expired or invalid. Redirecting to login...');
        localStorage.removeItem('admin_token');
        setTimeout(() => {
          const userUrl = process.env.NEXT_PUBLIC_USER_URL || 'http://localhost:5173';
          window.location.href = `${userUrl}/#login`;
        }, 1500);
      }
    };

    processCallback();
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-200">
      <div className="text-center p-8 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl">
        <div className="w-10 h-10 border-4 border-slate-600 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-medium text-lg text-slate-300">{status}</p>
        <p className="text-sm text-slate-500 mt-2">BookRooms Secure SSO</p>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Loading...</div>}>
      <AuthCallbackHandler />
    </Suspense>
  );
}
