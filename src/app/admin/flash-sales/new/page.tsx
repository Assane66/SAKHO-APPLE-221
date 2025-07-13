// src/app/admin/flash-sales/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, FlashSale } from '@/types';
import { addHours, addDays } from 'date-fns';

export default function NewFlashSalePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedVariantStorage, setSelectedVariantStorage] = useState<string>('');
  const [discountPrice, setDiscountPrice] = useState<number | ''>('');
  const [initialStock, setInitialStock] = useState<number | ''>('');
  const [duration, setDuration] = useState<string>('');

  useEffect(() => {
    const fetchProducts = async () => {
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(
        doc => ({id: doc.id, ...doc.data()} as Product)
      );
      setProducts(productsData);
    };
    fetchProducts();
  }, []);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const selectedVariant = selectedProduct?.variants.find(v => v.storage === selectedVariantStorage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedProduct ||
      !selectedVariant ||
      !discountPrice ||
      !initialStock ||
      !duration
    ) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
        const now = new Date();
        let endDate: Date;

        switch (duration) {
            case '24h': endDate = addHours(now, 24); break;
            case '48h': endDate = addHours(now, 48); break;
            case '72h': endDate = addHours(now, 72); break;
            case '7j': endDate = addDays(now, 7); break;
            case '30j': endDate = addDays(now, 30); break;
            default: throw new Error('Durée invalide');
        }

        const saleData: Omit<FlashSale, 'id'> = {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            slug: selectedProduct.slug,
            thumbnail: selectedProduct.thumbnail,
            variantStorage: selectedVariant.storage,
            originalPrice: selectedVariant.price,
            discountPrice: Number(discountPrice),
            initialStock: Number(initialStock),
            sold: 0,
            status: 'Actif',
            createdAt: serverTimestamp(),
            endDate,
        };

      await addDoc(collection(db, 'flashSales'), saleData);
      toast({title: 'Succès', description: 'La vente flash a été créée.'});
      router.push('/admin/flash-sales');
      
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible de créer la vente flash.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
       <div>
        <Button variant="outline" asChild>
          <Link href="/admin/flash-sales">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Link>
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Créer une nouvelle vente flash</CardTitle>
          <CardDescription>Configurez les détails de votre vente à durée limitée.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
                 <div className="space-y-2">
                  <Label htmlFor="product">Produit</Label>
                  <Select
                    value={selectedProductId}
                    onValueChange={value => {
                      setSelectedProductId(value);
                      setSelectedVariantStorage(''); // Reset variant
                    }}
                  >
                    <SelectTrigger id="product">
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProduct && (
                  <div className="space-y-2">
                    <Label htmlFor="variant">Variante (Stockage)</Label>
                    <Select
                      value={selectedVariantStorage}
                      onValueChange={setSelectedVariantStorage}
                    >
                      <SelectTrigger id="variant">
                        <SelectValue placeholder="Sélectionner une variante" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProduct.variants.map(variant => (
                          <SelectItem
                            key={variant.storage}
                            value={variant.storage}
                          >
                            {variant.storage} (Prix original: {variant.price.toLocaleString('fr-FR')} CFA)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
            
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="discountPrice">Prix promotionnel (CFA)</Label>
                        <Input
                            id="discountPrice"
                            type="number"
                            value={discountPrice}
                            onChange={e => setDiscountPrice(Number(e.target.value))}
                            placeholder="Nouveau prix"
                            disabled={!selectedVariant}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="initialStock">Stock initial</Label>
                        <Input
                            id="initialStock"
                            type="number"
                            value={initialStock}
                            onChange={e => setInitialStock(Number(e.target.value))}
                            placeholder="Quantité"
                            disabled={!selectedVariant}
                        />
                    </div>
                </div>

                 <div className="space-y-2">
                  <Label htmlFor="duration">Durée de la vente</Label>
                  <Select
                    value={duration}
                    onValueChange={setDuration}
                  >
                    <SelectTrigger id="duration">
                      <SelectValue placeholder="Choisir une durée" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="24h">24 heures</SelectItem>
                        <SelectItem value="48h">48 heures</SelectItem>
                        <SelectItem value="72h">72 heures</SelectItem>
                        <SelectItem value="7j">7 jours</SelectItem>
                        <SelectItem value="30j">30 jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Enregistrer la vente flash
                </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
