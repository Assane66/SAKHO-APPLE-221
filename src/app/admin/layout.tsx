// src/app/admin/layout.tsx
import { AuthProvider } from '@/context/AuthContext';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-secondary/50">
        <AdminSidebar />
        <div className="md:pl-64">
          <AdminHeader />
          <main className="p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
