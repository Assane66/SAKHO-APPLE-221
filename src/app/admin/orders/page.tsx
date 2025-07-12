// src/app/admin/orders/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, MoreHorizontal, Loader2, Truck, CheckCircle, Package, Store, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, updateDoc, DocumentData, orderBy } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

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
  const [selectedOrder, setSelectedOrder] = useState<DocumentData | null>(null);
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

  const handleViewOrder = (order: DocumentData) => {
    setSelectedOrder(order);
  };

  return (
    <>
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
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Voir les détails
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Changer le statut</DropdownMenuLabel>
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

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la commande</DialogTitle>
            <DialogDescription>
              ID: <span className="font-mono">{selectedOrder?.id}</span>
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <h3 className="font-semibold">Informations Client</h3>
                    <p className="text-sm"><strong>Nom:</strong> {selectedOrder.customerName}</p>
                    <p className="text-sm"><strong>Téléphone:</strong> {selectedOrder.customerPhone}</p>
                    <p className="text-sm"><strong>Adresse:</strong> {selectedOrder.customerAddress}</p>
                </div>
                 <div className="space-y-2">
                    <h3 className="font-semibold">Informations Commande</h3>
                    <p className="text-sm"><strong>Date:</strong> {selectedOrder.date?.seconds ? new Date(selectedOrder.date.seconds * 1000).toLocaleString('fr-FR') : 'N/A'}</p>
                    <p className="text-sm"><strong>Livraison:</strong> {selectedOrder.deliveryMethod}</p>
                    <p className="text-sm"><strong>Statut:</strong> <Badge variant={statusColors[selectedOrder.status as OrderStatus] || 'outline'}>{selectedOrder.status}</Badge></p>
                    <p className="text-lg font-bold"><strong>Total:</strong> {selectedOrder.totalFormatted}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Articles commandés</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead className="text-right">Prix Unitaire</TableHead>
                      <TableHead className="text-right">Sous-total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items?.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Image src={item.thumbnail} alt={item.name} width={40} height={40} className="rounded-md object-cover" />
                            <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{item.storage}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-right">{item.price.toLocaleString('fr-FR')} CFA</TableCell>
                        <TableCell className="text-right">{(item.price * item.quantity).toLocaleString('fr-FR')} CFA</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
