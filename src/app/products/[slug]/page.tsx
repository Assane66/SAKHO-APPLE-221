// src/app/products/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, DocumentData } from 'firebase/firestore';
import type { Product, ProductVariant } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, BatteryCharging, CheckCircle, Info, Loader2, ShoppingCart, Truck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

async function getProductBySlug(slug: string): Promise<Product | null> {
  const productsRef = collection(db, 'products');
  const q = query(productsRef, where('slug', '==', slug), where('status', '==', 'active'));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const productDoc = querySnapshot.docs[0];
  return { id: productDoc.id, ...productDoc.data() } as Product;
}

export default function ProductDetailsPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      const fetchedProduct = await getProductBySlug(params.slug);
      setProduct(fetchedProduct);
      if (fetchedProduct && fetchedProduct.variants && fetchedProduct.variants.length > 0) {
        // Sort variants by price ascending and select the first one
        const sortedVariants = [...fetchedProduct.variants].sort((a, b) => a.price - b.price);
        setSelectedVariant(sortedVariants[0]);
      }
      setIsLoading(false);
    };

    fetchProduct();
  }, [params.slug]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  const handleAddToCart = () => {
    // This is where you would add logic to add the item to a shopping cart.
    // For now, we'll just show a toast notification.
    toast({
        title: "Ajouté au panier (Fonctionnalité à venir)",
        description: `${product.name} (${selectedVariant?.storage}) a été ajouté à votre panier.`,
    });
  };

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="flex items-center justify-center bg-secondary/30 rounded-lg p-4">
          <Image
            src={product.thumbnail || "https://placehold.co/600x600.png"}
            alt={product.name}
            width={500}
            height={500}
            className="aspect-square object-contain rounded-md"
          />
        </div>
        <div className="flex flex-col space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold font-headline">{product.name}</h1>
            <div className="flex items-center gap-2">
              {product.batteryHealth && (
                <Badge variant="secondary" className="flex items-center gap-2 py-1 px-3">
                  <BatteryCharging className="h-4 w-4" />
                  État de la batterie: {product.batteryHealth}
                </Badge>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h2 className="text-lg font-semibold mb-3 font-headline">Choisir le stockage :</h2>
            <RadioGroup
              value={selectedVariant?.storage}
              onValueChange={(storage) => {
                const variant = product.variants.find(v => v.storage === storage);
                if (variant) setSelectedVariant(variant);
              }}
              className="grid grid-cols-2 md:grid-cols-3 gap-3"
            >
              {product.variants.sort((a,b) => a.price - b.price).map((variant) => (
                <Label
                  key={variant.storage}
                  htmlFor={variant.storage}
                  className={`flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer transition-all ${selectedVariant?.storage === variant.storage ? 'border-primary ring-2 ring-primary' : 'border-muted hover:border-primary/50'}`}
                >
                  <RadioGroupItem value={variant.storage} id={variant.storage} className="sr-only" />
                  <span className="font-bold text-lg">{variant.storage}</span>
                  <span className="text-sm text-muted-foreground">{variant.price.toLocaleString('fr-FR')} CFA</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <p className="text-4xl font-bold text-primary">
              {selectedVariant ? `${selectedVariant.price.toLocaleString('fr-FR')} CFA` : 'Sélectionnez une option'}
            </p>
            <Button size="lg" className="w-full" onClick={handleAddToCart} disabled={!selectedVariant}>
              <ShoppingCart className="mr-2 h-5 w-5" />
              Ajouter au panier
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <Alert>
              <Truck className="h-4 w-4" />
              <AlertTitle className="font-headline">Livraison Rapide</AlertTitle>
              <AlertDescription>
                Livraison disponible sur Dakar et environs en moins de 24h.
              </AlertDescription>
            </Alert>
            <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="font-headline text-green-800 dark:text-green-300">Garantie incluse</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400">
                Nos appareils sont garantis pour votre tranquillité d'esprit.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}
