// src/app/admin/dashboard/page.tsx
'use client';

import { BarChart, LineChart, PieChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Line, LineChart as RechartsLineChart, ResponsiveContainer } from 'recharts';
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const salesData: any[] = [];
const topProducts: any[] = [];
const recentOrders: any[] = [];

export default function AdminDashboardPage() {
  
  // La logique de garde est maintenant dans AdminLayout.tsx
  // Ce composant ne s'affichera que si l'utilisateur est un admin connecté.

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Tableau de Bord</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires (CA)</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 CFA</div>
            <p className="text-xs text-muted-foreground">Aucune donnée pour le mois dernier</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+0</div>
            <p className="text-xs text-muted-foreground">0 nouveau ce mois-ci</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+0</div>
            <p className="text-xs text-muted-foreground">Aucune donnée pour le mois dernier</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Ventes des 6 derniers mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
                {salesData.length === 0 ? (
                  <p>Aucune donnée de vente disponible.</p>
                ) : (
                  <ChartContainer config={{}} className="h-[300px] w-full">
                      <RechartsLineChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" />
                      </RechartsLineChart>
                  </ChartContainer>
                )}
              </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 des produits</CardTitle>
            <CardDescription>Les produits les plus vendus ce mois-ci.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead className="text-right">Ventes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        Aucun produit vendu.
                      </TableCell>
                    </TableRow>
                  ) : (
                    topProducts.map(product => (
                        <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-right">{product.sales}</TableCell>
                        </TableRow>
                    ))
                  )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Commandes récentes</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ID Commande</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Statut</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {recentOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                          Aucune commande récente.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentOrders.map(order => (
                          <TableRow key={order.id}>
                              <TableCell className="font-mono">{order.id}</TableCell>
                              <TableCell>{order.customer}</TableCell>
                              <TableCell>{order.total}</TableCell>
                              <TableCell>
                                  <Badge variant={order.status === "Livrée" ? "default" : order.status === "En cours" ? "secondary" : "outline"}>
                                      {order.status}
                                  </Badge>
                              </TableCell>
                          </TableRow>
                      ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}