// src/app/admin/categories/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Loader2, Trash } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, addDoc, doc, deleteDoc, DocumentData } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) {
      toast({ variant: "destructive", title: "Erreur", description: "Le nom de la catégorie est requis." });
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "categories"), { name: newCategoryName, productCount: 0 });
      toast({ title: "Succès", description: "La catégorie a été ajoutée." });
      setIsDialogOpen(false);
      setNewCategoryName('');
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter la catégorie." });
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Catégories</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                        <DialogDescription>Entrez le nom de la nouvelle catégorie de produits.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nom</Label>
                            <Input id="name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="col-span-3" placeholder="Ex: iPhone 15 Series" />
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

      <Card>
        <CardHeader>
          <CardTitle>Liste des catégories</CardTitle>
          <CardDescription>Gérez les catégories de vos produits.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom de la catégorie</TableHead>
                <TableHead>Nombre de produits</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Aucune catégorie trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
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
                          {/* <DropdownMenuItem>Modifier</DropdownMenuItem> */}
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
    </div>
  );
}
