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
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/types';

type Variant = {
  storage: string;
  price: string;
};

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'Actif' | 'Inactif'>('Actif');
  const [variants, setVariants] = useState<Variant[]>([{ storage: '', price: '' }]);
  const [isLoading, setIsLoading] = useState(false);

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
        name: productName,
        category,
        status,
        variants,
      };

      await addDoc(collection(db, 'products'), productData);

      toast({
        title: "Produit ajouté",
        description: `Le produit "${productName}" a été créé avec succès.`,
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
                <Input id="product-name" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Ex: iPhone 15 Pro" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iPhone">iPhone</SelectItem>
                    <SelectItem value="Accessoires">Accessoires</SelectItem>
                    <SelectItem value="MacBooks">MacBooks</SelectItem>
                    <SelectItem value="iPads">iPads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as 'Actif' | 'Inactif')}>
                <SelectTrigger id="status" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Actif">Actif</SelectItem>
                  <SelectItem value="Inactif">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-lg font-semibold">Variantes</Label>
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
                        <Label htmlFor={`price-${index}`}>Prix</Label>
                        <Input 
                          id={`price-${index}`} 
                          value={variant.price} 
                          onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                          placeholder="Ex: 750 000 CFA"
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