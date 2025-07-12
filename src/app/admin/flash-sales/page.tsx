// src/app/admin/flash-sales/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

const flashSales = [
  { id: 1, product: "iPhone 14 Pro", discountPrice: "550,000 CFA", initialStock: 10, sold: 8, endDate: "Dans 2 heures", status: "Active" },
  { id: 2, product: "Coque Silicone", discountPrice: "10,000 CFA", initialStock: 50, sold: 15, endDate: "Se termine demain", status: "Active" },
  { id: 3, product: "AirPods Pro 2", discountPrice: "120,000 CFA", initialStock: 20, sold: 20, endDate: "2024-07-15", status: "Terminée" },
];

export default function FlashSalesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Ventes Flash</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Créer une vente flash
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
              {flashSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.product}</TableCell>
                  <TableCell className="font-semibold text-primary">{sale.discountPrice}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Progress value={(sale.sold / sale.initialStock) * 100} className="w-full h-2" />
                      <span className="text-xs text-muted-foreground">{sale.sold} / {sale.initialStock} vendus</span>
                    </div>
                  </TableCell>
                  <TableCell>{sale.endDate}</TableCell>
                  <TableCell>
                     <Badge variant={sale.status === 'Active' ? 'default' : 'outline'}>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
