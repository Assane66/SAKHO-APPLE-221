// src/app/admin/flash-sales/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, DocumentData } from 'firebase/firestore';
import Link from 'next/link';

export default function FlashSalesPage() {
  const [flashSales, setFlashSales] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "flashSales"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const salesData: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        salesData.push({ id: doc.id, ...doc.data() });
      });
      setFlashSales(salesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Ventes Flash</h1>
        <Button asChild>
          <Link href="/admin/flash-sales/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Créer une vente flash
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des ventes flash</CardTitle>
          <CardDescription>Gérez vos ventes flash à durée et stock limités.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Prix réduit</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : flashSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Aucune vente flash en cours ou programmée.
                  </TableCell>
                </TableRow>
              ) : (
                flashSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.productName}</TableCell>
                    <TableCell className="font-semibold text-primary">{sale.discountPrice.toLocaleString('fr-FR')} CFA</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Progress value={(sale.sold / sale.initialStock) * 100} className="w-full h-2" />
                        <span className="text-xs text-muted-foreground">{sale.sold} / {sale.initialStock} vendus</span>
                      </div>
                    </TableCell>
                    <TableCell>{sale.endDate?.seconds ? new Date(sale.endDate.seconds * 1000).toLocaleString('fr-FR') : 'N/A'}</TableCell>
                    <TableCell>
                       <Badge variant={sale.status === 'Actif' ? 'default' : 'outline'}>
                        {sale.status}
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
                          <DropdownMenuItem>Modifier</DropdownMenuItem>
                          <DropdownMenuItem>Arrêter la vente</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Supprimer</DropdownMenuItem>
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
