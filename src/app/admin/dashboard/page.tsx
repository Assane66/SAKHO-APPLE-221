// src/app/admin/dashboard/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
            <p>Chargement...</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">
          Tableau de Bord Administrateur
        </h1>
        <p className="text-muted-foreground md:text-xl">
          Bienvenue, {user.email}!
        </p>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader>
                <CardTitle>Demandes d'échange</CardTitle>
                <CardDescription>Gérer les demandes de reprise d'iPhone.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">12</p>
                <p className="text-xs text-muted-foreground">en attente de révision</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Produits</CardTitle>
                <CardDescription>Gérer l'inventaire des produits.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">4</p>
                <p className="text-xs text-muted-foreground">modèles d'iPhone actifs</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Utilisateurs</CardTitle>
                <CardDescription>Gérer les utilisateurs administrateurs.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">1</p>
                <p className="text-xs text-muted-foreground">administrateur enregistré</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
