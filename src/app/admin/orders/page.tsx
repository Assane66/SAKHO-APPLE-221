// src/app/admin/orders/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, MoreHorizontal, Loader2, Truck, CheckCircle, Package, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, updateDoc, DocumentData, orderBy } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

type OrderStatus = "En attente" | "En cours" | "Livrée" | "Annulée";

const statusColors: Record<OrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  "Livrée": "default",
  "En cours": "secondary",
  "En attente": "outline",
  "Annulée": "destructive",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() });
      });
      setOrders(ordersData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status });
      toast({ title: "Succès", description: "Le statut de la commande a été mis à jour." });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour le statut." });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Commandes</h1>
        <Button variant="outline" disabled>
          <Download className="mr-2 h-4 w-4" />
          Exporter (CSV)
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des commandes</CardTitle>
          <CardDescription>Suivez et gérez les commandes des clients.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Livraison</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Aucune commande trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">{order.id.substring(0, 7)}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{order.date?.seconds ? new Date(order.date.seconds * 1000).toLocaleDateString('fr-FR') : 'Date non disponible'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {order.deliveryMethod === 'Livraison à domicile' ? <Truck className="h-4 w-4" /> : <Store className="h-4 w-4" />}
                        {order.deliveryMethod}
                      </div>
                    </TableCell>
                    <TableCell>{order.totalFormatted || `${order.total.toLocaleString('fr-FR')} CFA`}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[order.status as OrderStatus] || 'outline'}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
                          {/* <DropdownMenuItem>Voir les détails</DropdownMenuItem> */}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'En attente')}>
                            <Package className="mr-2 h-4 w-4" /> En attente
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'En cours')}>
                            <Truck className="mr-2 h-4 w-4" /> En cours
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'Livrée')}>
                             <CheckCircle className="mr-2 h-4 w-4" /> Livrée
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
