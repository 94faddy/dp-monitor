'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Wait for auth check to complete
    if (!isLoading) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to login
        window.location.href = '/login';
      } else {
        // Authenticated, allow render
        setShouldRender(true);
      }
    }
  }, [isLoading, isAuthenticated]);

  // Show loading while checking auth
  if (isLoading || !shouldRender) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto" />
          <p className="text-zinc-400 mt-4">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}