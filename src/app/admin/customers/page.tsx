// src/app/admin/customers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { AdminTableFilters } from '@/components/admin/AdminTableFilters';
import { useAdminTableFilters, sortByString, sortByNumber, sortByDate } from '@/hooks/use-admin-table-filters';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, DocumentData } from 'firebase/firestore';
import { Loader2, History, ShoppingBag, Phone, MapPin, Calendar, CreditCard } from "lucide-react";

interface CustomerOrder {
  id: string;
  total: number;
  status: string;
  date: any;
  items: any[];
}

interface Customer {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: any;
  orders: CustomerOrder[];
}

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  "Livrée": "default",
  "En cours": "secondary",
  "En attente": "outline",
  "Annulée": "destructive",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    // Customers are derived from orders. We aggregate them here.
    const q = query(collection(db, "orders"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const customerMap = new Map<string, Customer>();

      querySnapshot.forEach((doc) => {
        const order = doc.data() as DocumentData;
        const rawPhone = order.customerPhone ? String(order.customerPhone).trim() : '';
        if (!rawPhone) return;

        const total = Number(order.total) || 0;
        const rawName = (order.customerName || '').trim();
        const nameParts = rawName.split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const orderObj: CustomerOrder = {
          id: doc.id,
          total,
          status: order.status || 'En attente',
          date: order.date,
          items: order.items || [],
        };

        if (customerMap.has(rawPhone)) {
          const existing = customerMap.get(rawPhone)!;
          existing.totalSpent += total;
          existing.orderCount += 1;
          existing.orders.push(orderObj);
          if (!existing.lastOrderDate && order.date) {
            existing.lastOrderDate = order.date;
          }
          if (order.customerAddress && !existing.address) {
            existing.address = order.customerAddress;
          }
        } else {
          customerMap.set(rawPhone, {
            id: rawPhone,
            name: rawName || rawPhone,
            firstName: firstName || 'Client',
            lastName: lastName,
            phone: rawPhone,
            address: order.customerAddress || '',
            totalSpent: total,
            orderCount: 1,
            lastOrderDate: order.date,
            orders: [orderObj],
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
      c.firstName.toLowerCase().includes(term) ||
      c.lastName.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      (c.address?.toLowerCase().includes(term) ?? false),
    sortFn: (a, b, sort) => {
      switch (sort) {
        case 'name-asc': return sortByString(a.name, b.name, 'asc');
        case 'name-desc': return sortByString(a.name, b.name, 'desc');
        case 'spent-desc': return sortByNumber(a.totalSpent, b.totalSpent, 'desc');
        case 'spent-asc': return sortByNumber(a.totalSpent, b.totalSpent, 'asc');
        case 'orders-desc': return sortByNumber(a.orderCount, b.orderCount, 'desc');
        case 'date-desc': return sortByDate(a.lastOrderDate, b.lastOrderDate, 'desc');
        default: return 0;
      }
    },
  });

  const customerSortOptions = [
    { value: 'default', label: 'Par défaut' },
    { value: 'date-desc', label: 'Dernière commande récente' },
    { value: 'name-asc', label: 'Nom (A-Z)' },
    { value: 'name-desc', label: 'Nom (Z-A)' },
    { value: 'spent-desc', label: 'Total dépensé ↓' },
    { value: 'spent-asc', label: 'Total dépensé ↑' },
    { value: 'orders-desc', label: 'Plus de commandes' },
  ];

  const formatDate = (date: any) => {
    if (!date) return 'Date inconnue';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Date inconnue';
    }
  };

  const openCustomerHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsHistoryOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestion, coordonnées et historique complet des commandes de vos clients.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des clients</CardTitle>
          <CardDescription>
            Données consolidées à partir de l&apos;ensemble des commandes enregistrées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTableFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Rechercher par prénom, nom, téléphone..."
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
                <TableHead>Prénom</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead className="text-center">Commandes</TableHead>
                <TableHead>Dernière commande</TableHead>
                <TableHead>Total dépensé</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="text-xs text-muted-foreground mt-2">Chargement des clients...</p>
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    Aucun client trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-semibold text-primary">
                      {customer.firstName}
                    </TableCell>
                    <TableCell className="font-medium">
                      {customer.lastName || '-'}
                    </TableCell>
                    <TableCell>
                      <a 
                        href={`tel:${customer.phone}`}
                        className="hover:underline flex items-center gap-1.5 font-mono text-sm"
                      >
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {customer.phone}
                      </a>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-medium">
                        {customer.orderCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(customer.lastOrderDate)}
                    </TableCell>
                    <TableCell className="font-semibold text-green-600 dark:text-green-400">
                      {customer.totalSpent.toLocaleString('fr-FR')} CFA
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCustomerHistory(customer)}
                        className="gap-1.5 text-xs"
                      >
                        <History className="h-3.5 w-3.5" />
                        Historique
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Historique du client */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  Historique de {selectedCustomer.firstName} {selectedCustomer.lastName}
                </DialogTitle>
                <DialogDescription>
                  Fiche récapitulative et détail de toutes les commandes passées.
                </DialogDescription>
              </DialogHeader>

              {/* Résumé du client */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-muted/40 rounded-lg border text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Téléphone</span>
                  <span className="font-semibold">{selectedCustomer.phone}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Commandes passées</span>
                  <span className="font-semibold">{selectedCustomer.orderCount} commande(s)</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Total cumulé</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {selectedCustomer.totalSpent.toLocaleString('fr-FR')} CFA
                  </span>
                </div>
                {selectedCustomer.address && (
                  <div className="sm:col-span-3 pt-1 border-t text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    Adresse connue : {selectedCustomer.address}
                  </div>
                )}
              </div>

              <Separator className="my-2" />

              {/* Liste des commandes */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Commandes ({selectedCustomer.orders.length})
                </h3>

                {selectedCustomer.orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune commande trouvée.
                  </p>
                ) : (
                  selectedCustomer.orders.map((order, idx) => (
                    <div 
                      key={order.id || idx} 
                      className="p-3.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">
                            #{order.id.slice(0, 7)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(order.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusColors[order.status] || "outline"} className="text-xs">
                            {order.status}
                          </Badge>
                          <span className="font-bold text-sm text-green-600 dark:text-green-400">
                            {order.total.toLocaleString('fr-FR')} CFA
                          </span>
                        </div>
                      </div>

                      {/* Articles de la commande */}
                      {order.items && order.items.length > 0 && (
                        <div className="text-xs space-y-1.5 pt-2 border-t border-border/50">
                          <span className="text-muted-foreground font-medium block">Articles :</span>
                          <ul className="divide-y divide-border/30">
                            {order.items.map((item: any, iIdx: number) => (
                              <li key={iIdx} className="py-1 flex items-center justify-between">
                                <span className="font-medium">
                                  {item.name} {item.storage ? `(${item.storage})` : ''} × {item.quantity || 1}
                                </span>
                                <span className="text-muted-foreground">
                                  {((item.price || 0) * (item.quantity || 1)).toLocaleString('fr-FR')} CFA
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
