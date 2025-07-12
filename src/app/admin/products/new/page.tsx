// src/app/admin/products/new/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash, PlusCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

type Variant = {
  storage: string;
  price: string;
};

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [categoryId, setCategoryId] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [description, setDescription] = useState('');
  const [isNew, setIsNew] = useState(true);
  const [hasWarranty, setHasWarranty] = useState(true);
  const [batteryHealth, setBatteryHealth] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState('');
  const [variants, setVariants] = useState<Variant[]>([{ storage: '', price: '' }]);
  const [isLoading, setIsLoading] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setSlug(newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
  };
  
  const handleAddVariant = () => {
    setVariants([...variants, { storage: '', price: '' }]);
  };

  const handleRemoveVariant = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
  };

  const handleVariantChange = (index: number, field: keyof Variant, value: string) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const productData: Omit<Product, 'id'> = {
        name,
        slug,
        basePrice: parseFloat(basePrice),
        status,
        categoryId,
        thumbnail,
        description,
        isNew,
        hasWarranty,
        batteryHealth,
        deliveryInfo,
        variants,
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
                <Input id="product-name" value={name} onChange={handleNameChange} placeholder="Ex: iPhone 15 Pro" required />
              </div>
               <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Ex: iphone-15-pro" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base-price">Prix de base (CFA)</Label>
                <Input id="base-price" type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="Ex: 450000" required />
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
                    <SelectItem value="accessoires">Accessoires</SelectItem>
                    <SelectItem value="macbooks">MacBooks</SelectItem>
                    <SelectItem value="ipads">iPads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                <Label htmlFor="thumbnail">URL de la miniature</Label>
                <Input id="thumbnail" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} placeholder="https://res.cloudinary.com/..." />
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
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description détaillée du produit..." />
            </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="battery-health">Santé de la batterie</Label>
                    <Input id="battery-health" value={batteryHealth} onChange={(e) => setBatteryHealth(e.target.value)} placeholder="Ex: 90-100%" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="delivery-info">Info livraison</Label>
                    <Input id="delivery-info" value={deliveryInfo} onChange={(e) => setDeliveryInfo(e.target.value)} placeholder="Ex: Livraison en 24-48h" />
                </div>
             </div>

             <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-2">
                    <Switch id="is-new" checked={isNew} onCheckedChange={setIsNew} />
                    <Label htmlFor="is-new">Produit neuf</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="has-warranty" checked={hasWarranty} onCheckedChange={setHasWarranty} />
                    <Label htmlFor="has-warranty">Avec garantie</Label>
                </div>
             </div>


            <div>
              <Label className="text-lg font-semibold">Variantes de stockage</Label>
              <div className="space-y-4 mt-2">
                {variants.map((variant, index) => (
                  <div key={index} className="flex items-end gap-4 p-4 border rounded-lg bg-muted/50">
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div className="space-y-2">
                        <Label htmlFor={`storage-${index}`}>Stockage</Label>
                        <Input 
                          id={`storage-${index}`} 
                          value={variant.storage} 
                          onChange={(e) => handleVariantChange(index, 'storage', e.target.value)}
                          placeholder="Ex: 128Go"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`price-${index}`}>Prix (CFA)</Label>
                        <Input 
                          id={`price-${index}`} 
                          value={variant.price} 
                          onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                          placeholder="Ex: 750000"
                          required
                        />
                      </div>
                    </div>
                    {variants.length > 1 && (
                      <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveVariant(index)}>
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Supprimer la variante</span>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-4" onClick={handleAddVariant}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Ajouter une variante
              </Button>
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
