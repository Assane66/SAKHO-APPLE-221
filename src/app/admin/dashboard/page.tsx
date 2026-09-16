// src/app/admin/dashboard/page.tsx
'use client';

import { BarChart, LineChart, PieChart, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Line, LineChart as RechartsLineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Stats {
    totalRevenue: number;
    totalSales: number;
    customerCount: number;
}
interface MonthlySales {
    month: string;
    sales: number;
}
interface TopProduct {
    name: string;
    sales: number;
}
interface RecentOrder {
    id: string;
    customer: string;
    total: string;
    status: string;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<Stats>({ totalRevenue: 0, totalSales: 0, customerCount: 0 });
    const [salesData, setSalesData] = useState<MonthlySales[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const ordersQuery = query(collection(db, "orders"), orderBy("date", "desc"));

        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            const orders: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            let totalRevenue = 0;
            const customerPhones = new Set<string>();
            const productSales = new Map<string, number>();
            const monthlySales: { [key: string]: number } = {};

            orders.forEach((order: any) => {
                if (order.total) {
                    totalRevenue += order.total;
                }
                if (order.customerPhone) {
                    customerPhones.add(order.customerPhone);
                }

                order.items?.forEach((item: any) => {
                    productSales.set(item.name, (productSales.get(item.name) || 0) + item.quantity);
                });
                
                if (order.date?.seconds) {
                    const month = format(new Date(order.date.seconds * 1000), 'MMM yyyy', { locale: fr });
                    monthlySales[month] = (monthlySales[month] || 0) + (order.total || 0);
                }
            });

            setStats({
                totalRevenue,
                totalSales: orders.length,
                customerCount: customerPhones.size,
            });

            const sortedTopProducts = Array.from(productSales.entries())
                .map(([name, sales]) => ({ name, sales }))
                .sort((a, b) => b.sales - a.sales)
                .slice(0, 5);
            setTopProducts(sortedTopProducts);

            const last6Months = Array.from({ length: 6 }, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                return format(d, 'MMM yyyy', { locale: fr });
            }).reverse();

            const chartData = last6Months.map(month => ({
                month: month.charAt(0).toUpperCase() + month.slice(1),
                sales: monthlySales[month] || 0
            }));
            setSalesData(chartData);
            
            const recent = orders.slice(0, 5).map(order => ({
                id: order.id.substring(0, 7),
                customer: order.customerName,
                total: order.totalFormatted || `${order.total?.toLocaleString('fr-FR')} CFA` || '0 CFA',
                status: order.status || 'En attente'
            }));
            setRecentOrders(recent);
            
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
  
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
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString('fr-FR')} CFA</div>
            <p className="text-xs text-muted-foreground">Basé sur toutes les commandes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.customerCount}</div>
            <p className="text-xs text-muted-foreground">Nombre de clients uniques</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventes</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">Nombre total de commandes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Ventes des 6 derniers mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {salesData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <p>Aucune donnée de vente disponible.</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={salesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                          <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value as number / 1000)}k`} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => [`${value.toLocaleString('fr-FR')} CFA`, "Ventes"]}/>
                          <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                      </RechartsLineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 des produits</CardTitle>
            <CardDescription>Les produits les plus vendus au total.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead className="text-right">Ventes (unités)</TableHead>
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
                        <TableRow key={product.name}>
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
