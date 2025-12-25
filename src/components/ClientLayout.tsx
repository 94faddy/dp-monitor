'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import ProtectedRoute from './ProtectedRoute';

// Routes that don't need authentication
const publicRoutes = ['/login', '/register'];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  
  const isPublicRoute = publicRoutes.includes(pathname);

  // Public routes (login, register) - no sidebar
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Protected routes - with sidebar
  return (
    <ProtectedRoute>
      <Sidebar />
      <main className="ml-64">
        {children}
      </main>
    </ProtectedRoute>
  );
}
