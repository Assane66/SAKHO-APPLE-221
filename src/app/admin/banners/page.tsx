// src/app/admin/banners/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, MoreHorizontal, Link as LinkIcon, Loader2, Trash } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, addDoc, doc, updateDoc, deleteDoc, DocumentData } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

export default function BannersPage() {
  const [banners, setBanners] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newBannerName, setNewBannerName] = useState('');
  const [newBannerLink, setNewBannerLink] = useState('');
  const [newBannerImageUrl, setNewBannerImageUrl] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "banners"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const bannersData: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        bannersData.push({ id: doc.id, ...doc.data() });
      });
      setBanners(bannersData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerName || !newBannerLink || !newBannerImageUrl) {
      toast({ variant: "destructive", title: "Erreur", description: "Veuillez remplir tous les champs." });
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "banners"), {
        name: newBannerName,
        link: newBannerLink,
        imageUrl: newBannerImageUrl,
        status: "Actif"
      });
      toast({ title: "Succès", description: "La bannière a été ajoutée." });
      setIsDialogOpen(false);
      setNewBannerName('');
      setNewBannerLink('');
      setNewBannerImageUrl('');
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible d'ajouter la bannière." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "banners", id));
      toast({ title: "Succès", description: "Bannière supprimée." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de supprimer la bannière." });
    }
  };

  const handleToggleStatus = async (banner: DocumentData) => {
    try {
      const newStatus = banner.status === 'Actif' ? 'Inactif' : 'Actif';
      await updateDoc(doc(db, 'banners', banner.id), { status: newStatus });
      toast({ title: 'Succès', description: `Bannière mise à jour à ${newStatus}.` });
    } catch (error) {
       toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de mettre à jour le statut.' });
    }
  };


  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Bannières</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter une bannière
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddBanner}>
              <DialogHeader>
                <DialogTitle>Ajouter une nouvelle bannière</DialogTitle>
                <DialogDescription>Remplissez les informations ci-dessous.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Nom</Label>
                  <Input id="name" value={newBannerName} onChange={(e) => setNewBannerName(e.target.value)} className="col-span-3" placeholder="Promo Été" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="link" className="text-right">Lien</Label>
                  <Input id="link" value={newBannerLink} onChange={(e) => setNewBannerLink(e.target.value)} className="col-span-3" placeholder="/products/iphone-15" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="imageUrl" className="text-right">URL de l'image</Label>
                  <Input id="imageUrl" value={newBannerImageUrl} onChange={(e) => setNewBannerImageUrl(e.target.value)} className="col-span-3" placeholder="https://placehold.co/800x200.png" />
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
          <CardTitle>Gestion des bannières</CardTitle>
          <CardDescription>Ajoutez, supprimez et organisez les bannières promotionnelles de votre site.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aperçu</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Lien</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : banners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Aucune bannière trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                banners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <Image src={banner.imageUrl || 'https://placehold.co/150x75.png'} alt={banner.name} width={150} height={75} className="rounded-md object-cover" />
                    </TableCell>
                    <TableCell className="font-medium">{banner.name}</TableCell>
                    <TableCell>
                      <Link href={banner.link || '#'} className="flex items-center gap-2 text-primary hover:underline">
                        <LinkIcon className="h-4 w-4" />
                        {banner.link}
                      </Link>
                    </TableCell>
                    <TableCell>
                       <Badge variant={banner.status === 'Actif' ? 'default' : 'secondary'}>
                        {banner.status}
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
                          <DropdownMenuItem onClick={() => handleToggleStatus(banner)}>
                            {banner.status === 'Actif' ? 'Désactiver' : 'Activer'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(banner.id)}>
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
