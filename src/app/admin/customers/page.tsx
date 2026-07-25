// src/app/admin/customers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { AdminTableFilters } from '@/components/admin/AdminTableFilters';
import { useAdminTableFilters, sortByString, sortByNumber } from '@/hooks/use-admin-table-filters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, DocumentData } from 'firebase/firestore';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalSpent: number;
  orderCount: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Customers are derived from orders. We aggregate them here.
    const q = query(collection(db, "orders"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const customerMap = new Map<string, Customer>();

      querySnapshot.forEach((doc) => {
        const order = doc.data() as DocumentData;
        const phone = order.customerPhone; // Assuming phone number is a unique identifier

        if (!phone) return;

        const total = order.total || 0;

        if (customerMap.has(phone)) {
          const existingCustomer = customerMap.get(phone)!;
          existingCustomer.totalSpent += total;
          existingCustomer.orderCount += 1;
        } else {
          customerMap.set(phone, {
            id: phone,
            name: order.customerName,
            phone: phone,
            address: order.customerAddress,
            totalSpent: total,
            orderCount: 1,
          });
        }
      });
      
      setCustomers(Array.from(customerMap.values()));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const {
    searchTerm, setSearchTerm, sortBy, setSortBy,
    filtered: filteredCustomers, resetFilters, resultCount, totalCount,
  } = useAdminTableFilters(customers, {
    searchFn: (c, term) =>
      c.name.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      (c.address?.toLowerCase().includes(term) ?? false),
    sortFn: (a, b, sort) => {
      switch (sort) {
        case 'name-asc': return sortByString(a.name, b.name, 'asc');
        case 'name-desc': return sortByString(a.name, b.name, 'desc');
        case 'spent-desc': return sortByNumber(a.totalSpent, b.totalSpent, 'desc');
        case 'spent-asc': return sortByNumber(a.totalSpent, b.totalSpent, 'asc');
        case 'orders-desc': return sortByNumber(a.orderCount, b.orderCount, 'desc');
        default: return 0;
      }
    },
  });

  const customerSortOptions = [
    { value: 'default', label: 'Par défaut' },
    { value: 'name-asc', label: 'Nom (A-Z)' },
    { value: 'name-desc', label: 'Nom (Z-A)' },
    { value: 'spent-desc', label: 'Total dépensé ↓' },
    { value: 'spent-asc', label: 'Total dépensé ↑' },
    { value: 'orders-desc', label: 'Plus de commandes' },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Clients</h1>

      <Card>
        <CardHeader>
          <CardTitle>Liste des clients</CardTitle>
          <CardDescription>Consultez les informations sur vos clients (basé sur les commandes).</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTableFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Rechercher un client..."
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOptions={customerSortOptions}
            resultCount={resultCount}
            totalCount={totalCount}
            onReset={resetFilters}
            className="mb-4"
          />
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Aucun client trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.address}</TableCell>
                    <TableCell className="font-semibold">{customer.totalSpent.toLocaleString('fr-FR')} CFA</TableCell>
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
