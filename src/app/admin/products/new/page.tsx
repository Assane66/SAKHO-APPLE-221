// src/app/admin/products/new/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/types';
import { Textarea } from '@/components/ui/textarea';

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [categoryId, setCategoryId] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [batteryHealth, setBatteryHealth] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setSlug(newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!name || !slug || !categoryId) {
        toast({
            variant: 'destructive',
            title: "Erreur de validation",
            description: "Les champs Nom, Slug et Catégorie sont requis.",
        });
        setIsLoading(false);
        return;
    }
    
    try {
      const productData: Omit<Product, 'id'> = {
        name,
        slug,
        status,
        categoryId,
        thumbnail,
        batteryHealth,
        keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'products'), productData);

      toast({
        title: "Produit ajouté",
        description: `Le produit "${name}" a été créé avec succès.`,
      });
      router.push('/admin/products');
    } catch (error) {
      console.error("Erreur lors de l'ajout du produit:", error);
      toast({
        variant: 'destructive',
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du produit.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Button variant="outline" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Nouveau Produit</CardTitle>
            <CardDescription>Remplissez les informations ci-dessous pour créer un nouveau produit.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="product-name">Nom du produit</Label>
                <Input id="product-name" value={name} onChange={handleNameChange} placeholder="Ex: iPhone 11 Pro Max" required />
              </div>
               <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Ex: iphone-11-pro-max" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="iphone-15">iPhone 15 Series</SelectItem>
                    <SelectItem value="iphone-14">iPhone 14 Series</SelectItem>
                    <SelectItem value="iphone-13">iPhone 13 Series</SelectItem>
                    <SelectItem value="iphone-12">iPhone 12 Series</SelectItem>
                    <SelectItem value="iphone-11">iPhone 11 Series</SelectItem>
                    <SelectItem value="accessoires">Accessoires</SelectItem>
                    <SelectItem value="macbooks">MacBooks</SelectItem>
                    <SelectItem value="ipads">iPads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                <Label htmlFor="thumbnail">URL de la miniature</Label>
                <Input id="thumbnail" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="https://placehold.co/400x400.png" />
              </div>
              <div className="space-y-2">
                    <Label htmlFor="battery-health">Santé de la batterie</Label>
                    <Input id="battery-health" value={batteryHealth} onChange={(e) => setBatteryHealth(e.target.value)} placeholder="Ex: 90-100%" />
                </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as 'active' | 'inactive')}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="keywords">Mots-clés</Label>
                <Textarea id="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Séparez les mots-clés par une virgule. Ex: iphone, 11, pro, max" />
            </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer le produit
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
