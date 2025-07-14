// src/app/admin/products/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Search, MoreHorizontal, Loader2, Trash, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import Image from 'next/image';
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, doc, deleteDoc } from "firebase/firestore";
import type { Product } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, "products"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsData: Product[] = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(productsData);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching products: ", error);
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les produits." });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;
    
    try {
      await deleteDoc(doc(db, "products", id));
      toast({ title: "Succès", description: "Produit supprimé." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer le produit." });
    }
  };

  const filteredProducts = (status: 'active' | 'inactive' | 'all') => {
    if (status === 'all') return products;
    return products.filter(p => p.status === status);
  }

  const renderProductRows = (productList: Product[]) => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-24 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
            <p>Chargement des produits...</p>
          </TableCell>
        </TableRow>
      );
    }
    
    if (productList.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-24 text-center">
            Aucun produit trouvé.
          </TableCell>
        </TableRow>
      );
    }

    return productList.map((product) => (
      <TableRow key={product.id}>
         <TableCell>
          {product.thumbnail ? (
            <Image src={product.thumbnail} alt={product.name} width={40} height={40} className="rounded-md object-cover" />
          ) : (
            <div className="w-10 h-10 bg-muted rounded-md" />
          )}
        </TableCell>
        <TableCell className="font-medium">{product.name}</TableCell>
        <TableCell>{product.categoryId}</TableCell>
        <TableCell>
          {product.variants?.map(v => `${v.storage}`).join(', ') || 'N/A'}
        </TableCell>
        <TableCell>
          <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
            {product.status === 'active' ? 'Actif' : 'Inactif'}
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
              <DropdownMenuItem onSelect={() => router.push(`/admin/products/${product.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(product.id)}>
                <Trash className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ))
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Produits</h1>
        <Link href="/admin/products/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un produit
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des produits</CardTitle>
          <CardDescription>Gérez votre inventaire de produits.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="all">Tous</TabsTrigger>
                <TabsTrigger value="active">Actifs</TabsTrigger>
                <TabsTrigger value="inactive">Inactifs</TabsTrigger>
              </TabsList>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher un produit..." className="pl-10" />
              </div>
            </div>

            <TabsContent value="all" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Image</TableHead>
                    <TableHead>Nom du produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Stockage</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderProductRows(filteredProducts('all'))}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="active" className="mt-4">
              <Table>
                <TableHeader>
                   <TableRow>
                    <TableHead className="w-[60px]">Image</TableHead>
                    <TableHead>Nom du produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Stockage</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderProductRows(filteredProducts('active'))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="inactive" className="mt-4">
               <Table>
                <TableHeader>
                   <TableRow>
                    <TableHead className="w-[60px]">Image</TableHead>
                    <TableHead>Nom du produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Stockage</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderProductRows(filteredProducts('inactive'))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
