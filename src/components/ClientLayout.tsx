'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import ProtectedRoute from './ProtectedRoute';

// Routes that don't need authentication
const publicRoutes = ['/login', '/register'];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isPublicRoute = publicRoutes.includes(pathname);

  // Public routes (login, register) - no sidebar, no auth check
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Protected routes - with sidebar and auth check
  return (
    <ProtectedRoute>
      <Sidebar />
      <main className="ml-64">
        {children}
      </main>
    </ProtectedRoute>
  );
}