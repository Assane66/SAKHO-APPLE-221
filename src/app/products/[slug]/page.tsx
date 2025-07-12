// src/app/products/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import type { Product, ProductVariant } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BatteryCharging, CheckCircle, Loader2, ShoppingCart, Truck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';


async function getProductData(slug: string): Promise<{ product: Product | null, similarProducts: Product[] }> {
  const productsRef = collection(db, 'products');
  const q = query(productsRef, where('slug', '==', slug), where('status', '==', 'active'), limit(1));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return { product: null, similarProducts: [] };
  }

  const productDoc = querySnapshot.docs[0];
  const product = { id: productDoc.id, ...productDoc.data() } as Product;
  
  let similarProducts: Product[] = [];
  if (product.categoryId) {
      const similarQuery = query(
          productsRef,
          where('categoryId', '==', product.categoryId),
          where('status', '==', 'active'),
          where('id', '!=', product.id),
          limit(4)
      );
      const similarSnapshot = await getDocs(similarQuery);
      similarProducts = similarSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  }

  return { product, similarProducts };
}

export default function ProductDetailsPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const { toast } = useToast();
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      const { product: fetchedProduct, similarProducts: fetchedSimilar } = await getProductData(params.slug);
      
      setProduct(fetchedProduct);
      setSimilarProducts(fetchedSimilar);

      if (fetchedProduct && fetchedProduct.variants && fetchedProduct.variants.length > 0) {
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
    if (!product || !selectedVariant) return;
    
    addToCart({
      id: `${product.id}-${selectedVariant.storage}`,
      productId: product.id,
      name: product.name,
      storage: selectedVariant.storage,
      price: selectedVariant.price,
      quantity: 1,
      thumbnail: product.thumbnail,
    });
    
    toast({
        title: "Produit ajouté au panier",
        description: `${product.name} (${selectedVariant.storage}) a été ajouté à votre panier.`,
    });
  };

  const getLowestPrice = (variants: Product['variants'] = []) => {
    if (!variants || variants.length === 0) return null;
    const lowest = Math.min(...variants.map(v => v.price));
    return lowest.toLocaleString('fr-FR');
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
      
      {similarProducts.length > 0 && (
          <div className="mt-16">
              <Separator className="my-8" />
              <h2 className="text-2xl font-bold text-center mb-8 font-headline">Vous pourriez aussi aimer</h2>
              <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-2">
                  {similarProducts.map((p) => (
                      <Card key={p.id} className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                          <Link href={`/products/${p.slug}`} className="block">
                              <CardHeader className="p-0">
                              <Image
                                  src={p.thumbnail || "https://placehold.co/600x600.png"}
                                  width={600}
                                  height={600}
                                  alt={p.name}
                                  data-ai-hint="iphone front"
                                  className="aspect-square object-cover"
                              />
                              </CardHeader>
                          </Link>
                          <CardContent className="p-4">
                              <CardTitle className="text-lg font-headline h-12">
                                  <Link href={`/products/${p.slug}`}>{p.name}</Link>
                              </CardTitle>
                          </CardContent>
                          <CardFooter className="p-4 pt-0">
                            <div className="flex flex-col w-full">
                              {getLowestPrice(p.variants) ? (
                                  <span className="text-md font-semibold text-primary">à partir de {getLowestPrice(p.variants)} CFA</span>
                              ) : (
                                  <span className="text-md font-semibold text-muted-foreground">Prix non disponible</span>
                              )}
                              <Link href={`/products/${p.slug}`} className="w-full mt-2" passHref>
                                  <Button className="w-full">Voir les options</Button>
                              </Link>
                            </div>
                          </CardFooter>
                      </Card>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
}