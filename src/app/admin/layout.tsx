// src/app/admin/layout.tsx
'use client';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AdminNotificationProvider } from '@/context/AdminNotificationContext';

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user || !isAdmin) {
        router.push('/admin/login');
      }
    }
  }, [user, isAdmin, loading, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  return (
    <AuthProvider>
      {isLoginPage ? (
        <div className="min-h-screen bg-secondary/50">{children}</div>
      ) : (
        <AdminNotificationProvider>
            <AdminGuard>
              <div className="min-h-screen bg-secondary/50">
                <AdminSidebar />
                <div className="md:pl-64">
                  <AdminHeader />
                  <main className="p-4 md:p-8">
                    {children}
                  </main>
                </div>
              </div>
            </AdminGuard>
        </AdminNotificationProvider>
      )}
    </AuthProvider>
  );
}
