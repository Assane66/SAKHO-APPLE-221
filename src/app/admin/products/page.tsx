// src/app/admin/products/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Search, MoreHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import Link from "next/link";

const products: any[] = [];

export default function ProductsPage() {
  const [openVariants, setOpenVariants] = useState<number | null>(null);

  const toggleVariants = (productId: number) => {
    setOpenVariants(prev => (prev === productId ? null : productId));
  };

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
          <CardDescription>Gérez votre inventaire de produits et leurs variantes.</CardDescription>
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
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Nom du produit</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Aucun produit trouvé.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <Collapsible asChild key={product.id}>
                        <>
                          <TableRow>
                            <TableCell>
                               <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => toggleVariants(product.id)}>
                                  {openVariants === product.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                  <span className="sr-only">Toggle Variants</span>
                                </Button>
                               </CollapsibleTrigger>
                            </TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell>
                              <Badge variant={product.status === 'Actif' ? 'default' : 'secondary'}>
                                {product.status}
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
                                  <DropdownMenuItem>Désactiver</DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">Supprimer</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                          <CollapsibleContent asChild>
                             <TableRow>
                              <TableCell colSpan={5} className="p-0">
                                 <div className="p-4 bg-muted/50">
                                  <h4 className="font-semibold mb-2 ml-4">Variantes</h4>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="pl-8">Stockage</TableHead>
                                        <TableHead>Prix</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {product.variants.map((variant: any) => (
                                        <TableRow key={variant.storage}>
                                          <TableCell className="pl-8">{variant.storage}</TableCell>
                                          <TableCell>{variant.price}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                 </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
