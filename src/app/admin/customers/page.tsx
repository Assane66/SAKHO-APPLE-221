// src/app/admin/customers/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const customers: any[] = [];

export default function CustomersPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Clients</h1>

      <Card>
        <CardHeader>
          <CardTitle>Liste des clients</CardTitle>
          <CardDescription>Consultez les informations sur vos clients.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-end mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un client..." className="pl-10" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead>Total dépensé</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Aucun client trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.address}</TableCell>
                    <TableCell className="font-semibold">{customer.totalSpent}</TableCell>
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
