// src/app/admin/flash-sales/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Loader2, Trash, PowerOff, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, deleteDoc, DocumentData, updateDoc } from 'firebase/firestore';
import Link from 'next/link';
import type { FlashSale } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function FlashSalesPage() {
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, "flashSales"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const salesData: FlashSale[] = [];
      querySnapshot.forEach((doc) => {
        salesData.push({ id: doc.id, ...doc.data() } as FlashSale);
      });
      setFlashSales(salesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getSaleProgress = (sale: FlashSale) => {
    if (!sale.variants || sale.variants.length === 0) return { totalInitial: 0, totalSold: 0, percentage: 0 };

    const totalInitial = sale.variants.reduce((acc, v) => acc + v.initialStock, 0);
    const totalSold = sale.variants.reduce((acc, v) => acc + v.sold, 0);
    const percentage = totalInitial > 0 ? (totalSold / totalInitial) * 100 : 0;
    
    return { totalInitial, totalSold, percentage };
  };
  
  const handleStopSale = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir arrêter cette vente flash ? Son statut passera à 'Terminé'.")) return;

    try {
        await updateDoc(doc(db, "flashSales", id), { status: 'Terminé' });
        toast({ title: "Succès", description: "La vente flash a été arrêtée." });
    } catch (error) {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible d'arrêter la vente flash." });
        console.error("Error stopping flash sale: ", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedSaleId) return;

    try {
      await deleteDoc(doc(db, "flashSales", selectedSaleId));
      toast({ title: "Succès", description: "La vente flash a été supprimée." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la vente flash." });
      console.error("Error deleting flash sale: ", error);
    } finally {
        setSelectedSaleId(null);
    }
  };

  return (
    <AlertDialog>
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
                  <TableHead>Prix (à partir de)</TableHead>
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
                  flashSales.map((sale) => {
                    const { totalInitial, totalSold, percentage } = getSaleProgress(sale);
                    const lowestPrice = sale.variants?.length > 0 ? Math.min(...sale.variants.map(v => v.discountPrice)) : 0;
                    return (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.productName}</TableCell>
                      <TableCell className="font-semibold text-primary">
                        {lowestPrice > 0 ? `${lowestPrice.toLocaleString('fr-FR')} CFA` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Progress value={percentage} className="w-full h-2" />
                          <span className="text-xs text-muted-foreground">{totalSold} / {totalInitial} vendus</span>
                        </div>
                      </TableCell>
                      <TableCell>{sale.endDate?.seconds ? new Date(sale.endDate.seconds * 1000).toLocaleString('fr-FR') : 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={sale.status === 'Actif' ? 'default' : sale.status === 'Terminé' ? 'secondary' : 'outline'}>
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
                            <DropdownMenuItem onSelect={() => router.push(`/admin/flash-sales/${sale.id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleStopSale(sale.id)} disabled={sale.status !== 'Actif'}>
                              <PowerOff className="mr-2 h-4 w-4" />
                              Arrêter la vente
                            </DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                               <DropdownMenuItem className="text-destructive" onSelect={(e) => {e.preventDefault(); setSelectedSaleId(sale.id)}}>
                                <Trash className="mr-2 h-4 w-4" />
                                  Supprimer
                               </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )})
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous absolument sûr?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. La vente flash sera définitivement supprimée de la base de données.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setSelectedSaleId(null)}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Oui, supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
