// src/app/admin/categories/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { AdminTableFilters } from '@/components/admin/AdminTableFilters';
import { useAdminTableFilters, searchInFields, sortByString, sortByNumber } from '@/hooks/use-admin-table-filters';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Loader2, Trash, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, addDoc, doc, deleteDoc, updateDoc, DocumentData } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for Add Dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');

  // State for Edit Dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DocumentData | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingCategorySlug, setEditingCategorySlug] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "categories"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const categoriesData: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        categoriesData.push({ id: doc.id, ...doc.data() });
      });
      setCategories(categoriesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleNewNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setNewCategoryName(name);
    setNewCategorySlug(generateSlug(name));
  };
  
  const handleEditingNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setEditingCategoryName(name);
    setEditingCategorySlug(generateSlug(name));
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) {
      toast({ variant: "destructive", title: "Erreur", description: "Le nom de la catégorie est requis." });
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "categories"), { 
          name: newCategoryName,
          slug: newCategorySlug, 
          productCount: 0 
      });
      toast({ title: "Succès", description: "La catégorie a été ajoutée." });
      setIsAddDialogOpen(false);
      setNewCategoryName('');
      setNewCategorySlug('');
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter la catégorie." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (category: DocumentData) => {
    setEditingCategory(category);
    setEditingCategoryName(category.name);
    setEditingCategorySlug(category.slug || generateSlug(category.name));
    setIsEditDialogOpen(true);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategoryName) {
      toast({ variant: "destructive", title: "Erreur", description: "Le nom ne peut pas être vide." });
      return;
    }
    setIsSubmitting(true);
    try {
        const docRef = doc(db, "categories", editingCategory.id);
        await updateDoc(docRef, {
            name: editingCategoryName,
            slug: editingCategorySlug,
        });
        toast({ title: "Succès", description: "La catégorie a été mise à jour." });
        setIsEditDialogOpen(false);
        setEditingCategory(null);
    } catch (error) {
        console.error(error);
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de mettre à jour la catégorie." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "categories", id));
      toast({ title: "Succès", description: "Catégorie supprimée." });
    } catch (error) {
       toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la catégorie." });
    }
  };

  const {
    searchTerm, setSearchTerm, sortBy, setSortBy,
    filtered: filteredCategories, resetFilters, resultCount, totalCount,
  } = useAdminTableFilters(categories, {
    searchFn: (cat, term) =>
      searchInFields(cat as Record<string, unknown>, term, ['name', 'slug']),
    sortFn: (a, b, sort) => {
      switch (sort) {
        case 'name-asc': return sortByString(a.name ?? '', b.name ?? '', 'asc');
        case 'name-desc': return sortByString(a.name ?? '', b.name ?? '', 'desc');
        case 'count-desc': return sortByNumber(a.productCount ?? 0, b.productCount ?? 0, 'desc');
        case 'count-asc': return sortByNumber(a.productCount ?? 0, b.productCount ?? 0, 'asc');
        default: return 0;
      }
    },
  });

  const categorySortOptions = [
    { value: 'default', label: 'Par défaut' },
    { value: 'name-asc', label: 'Nom (A-Z)' },
    { value: 'name-desc', label: 'Nom (Z-A)' },
    { value: 'count-desc', label: 'Plus de produits' },
    { value: 'count-asc', label: 'Moins de produits' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Catégories</h1>
        {/* Add Dialog Trigger */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Ajouter une catégorie
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleAddCategory}>
                    <DialogHeader>
                        <DialogTitle>Ajouter une nouvelle catégorie</DialogTitle>
                        <DialogDescription>Entrez le nom de la nouvelle catégorie. Le slug sera généré automatiquement.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="add-name">Nom</Label>
                            <Input id="add-name" value={newCategoryName} onChange={handleNewNameChange} placeholder="Ex: iPhone 15 Series" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="add-slug">Slug</Label>
                            <Input id="add-slug" value={newCategorySlug} readOnly disabled placeholder="Sera généré automatiquement" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary" onClick={() => { setNewCategoryName(''); setNewCategorySlug(''); }}>Annuler</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des catégories</CardTitle>
          <CardDescription>Gérez les catégories de vos produits.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminTableFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Rechercher une catégorie..."
            sortBy={sortBy}
            onSortChange={setSortBy}
            sortOptions={categorySortOptions}
            resultCount={resultCount}
            totalCount={totalCount}
            onReset={resetFilters}
            className="mb-4"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom de la catégorie</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Nombre de produits</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Aucune catégorie trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">{category.slug}</TableCell>
                    <TableCell>{category.productCount || 0}</TableCell>
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
                          <DropdownMenuItem onClick={() => openEditDialog(category)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(category.id)}>
                            <Trash className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
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

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
                <form onSubmit={handleUpdateCategory}>
                    <DialogHeader>
                        <DialogTitle>Modifier la catégorie</DialogTitle>
                        <DialogDescription>Mettez à jour le nom de la catégorie. Le slug sera mis à jour automatiquement.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nom</Label>
                            <Input id="edit-name" value={editingCategoryName} onChange={handleEditingNameChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="edit-slug">Slug</Label>
                            <Input id="edit-slug" value={editingCategorySlug} readOnly disabled />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Annuler</Button></DialogClose>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </div>
  );
}
