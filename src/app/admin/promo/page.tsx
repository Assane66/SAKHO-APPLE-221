// src/app/admin/promo/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const promotions: any[] = [];

export default function PromotionsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Promotions</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter une promotion
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des promotions</CardTitle>
          <CardDescription>Gérez les offres spéciales et les réductions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Date de début</TableHead>
                <TableHead>Date de fin</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Aucune promotion trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                promotions.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-medium">{promo.name}</TableCell>
                    <TableCell>{promo.type}</TableCell>
                    <TableCell>{promo.value}</TableCell>
                    <TableCell>{promo.startDate}</TableCell>
                    <TableCell>{promo.endDate}</TableCell>
                    <TableCell>
                      <Badge variant={promo.status === 'Active' ? 'default' : promo.status === 'Programmée' ? 'secondary' : 'outline'}>
                        {promo.status}
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
