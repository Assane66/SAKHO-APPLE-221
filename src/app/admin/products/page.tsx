// src/app/admin/products/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Loader2, Trash, Edit, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { AdminTableFilters } from "@/components/admin/AdminTableFilters";
import { useAdminTableFilters, searchInFields, sortByString, sortByNumber } from "@/hooks/use-admin-table-filters";
import Image from 'next/image';
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, doc, deleteDoc, DocumentData } from "firebase/firestore";
import type { Product } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Fetch categories and store them in a map for easy lookup
    const catQuery = query(collection(db, "categories"));
    const unsubCategories = onSnapshot(catQuery, (snapshot) => {
        const catMap = new Map<string, string>();
        snapshot.forEach((doc) => {
            catMap.set(doc.id, doc.data().name);
        });
        setCategories(catMap);
    });

    // Fetch products
    const prodQuery = query(collection(db, "products"));
    const unsubProducts = onSnapshot(prodQuery, (querySnapshot) => {
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

    return () => {
        unsubCategories();
        unsubProducts();
    };
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

  const {
    searchTerm, setSearchTerm, sortBy, setSortBy, filterBy, setFilterBy,
    filtered: filteredProducts, resetFilters, resultCount, totalCount,
  } = useAdminTableFilters(products, {
    searchFn: (p, term) =>
      searchInFields(p as unknown as Record<string, unknown>, term, ['name', 'slug']) ||
      (categories.get(p.categoryId)?.toLowerCase().includes(term) ?? false),
    filterFn: (p, filter) => {
      if (filter === 'all') return true;
      if (filter.startsWith('cat:')) return p.categoryId === filter.slice(4);
      return p.status === filter;
    },
    sortFn: (a, b, sort) => {
      switch (sort) {
        case 'name-asc': return sortByString(a.name, b.name, 'asc');
        case 'name-desc': return sortByString(a.name, b.name, 'desc');
        case 'price-asc': return sortByNumber(
          Math.min(...(a.variants?.map(v => v.price) ?? [0])),
          Math.min(...(b.variants?.map(v => v.price) ?? [0])),
          'asc'
        );
        case 'price-desc': return sortByNumber(
          Math.min(...(a.variants?.map(v => v.price) ?? [0])),
          Math.min(...(b.variants?.map(v => v.price) ?? [0])),
          'desc'
        );
        default: return 0;
      }
    },
  });

  const categoryFilterOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'active', label: 'Actifs' },
    { value: 'inactive', label: 'Inactifs' },
    ...Array.from(categories.entries()).map(([id, name]) => ({
      value: `cat:${id}`,
      label: name,
    })),
  ];

  const sortOptions = [
    { value: 'default', label: 'Par défaut' },
    { value: 'name-asc', label: 'Nom (A-Z)' },
    { value: 'name-desc', label: 'Nom (Z-A)' },
    { value: 'price-asc', label: 'Prix croissant' },
    { value: 'price-desc', label: 'Prix décroissant' },
  ];

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
        <TableCell>{categories.get(product.categoryId) || 'N/A'}</TableCell>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Produits</h1>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/featured">
            <Button variant="outline" className="border-amber-500/40 text-amber-400 hover:bg-amber-400/10">
              <Sparkles className="mr-2 h-4 w-4 text-amber-400" />
              Mises en avant (Bento Grid)
            </Button>
          </Link>
          <Link href="/admin/products/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter un produit
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des produits</CardTitle>
          <CardDescription>Gérez votre inventaire de produits.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTableFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Rechercher un produit..."
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOptions={sortOptions}
            filterBy={filterBy}
            onFilterChange={setFilterBy}
            filterOptions={categoryFilterOptions}
            filterLabel="Filtrer"
            resultCount={resultCount}
            totalCount={totalCount}
            onReset={resetFilters}
            className="mb-4"
          />

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
              {renderProductRows(filteredProducts)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
