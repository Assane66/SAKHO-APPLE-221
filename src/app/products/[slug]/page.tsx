// src/app/products/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, limit, doc, getDoc, DocumentData } from 'firebase/firestore';
import type { Product, ProductVariant, FlashSale } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BatteryCharging, CheckCircle, ShoppingCart, Truck, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

async function getProductData(slug: string): Promise<{ product: Product | null, similarProducts: Product[] }> {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('slug', '==', slug), where('status', '==', 'active'), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return { product: null, similarProducts: [] };
    }

    const productDoc = querySnapshot.docs[0];
    const product = { id: productDoc.id, ...productDoc.data() } as Product;

    // Fetch promotions for this product
    const promoQuery = query(collection(db, 'promotions'), where('productId', '==', product.id));
    const promoSnapshot = await getDocs(promoQuery);
    const promotions = promoSnapshot.docs.map(doc => doc.data());

    if (promotions.length > 0) {
        product.variants = product.variants.map(variant => {
            const promo = promotions.find(p => p.variantStorage === variant.storage);
            if (promo) {
                return {
                    ...variant,
                    isPromo: true,
                    promoPrice: promo.discountPrice
                };
            }
            return variant;
        });
    }

    let similarProducts: Product[] = [];
    if (product.categoryId) {
        const similarQuery = query(
            productsRef,
            where('categoryId', '==', product.categoryId),
            where('status', '==', 'active'),
            where('__name__', '!=', productDoc.ref.path.split('/').pop()), // exclude self by document ID
            limit(4)
        );
        const similarSnapshot = await getDocs(similarQuery);
        similarProducts = similarSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    }

    return { product, similarProducts };
}

const getLowestPrice = (variants: Product['variants'] = []) => {
    if (!variants || variants.length === 0) return null;
    const prices = variants.map(v => v.promoPrice || v.price);
    const lowest = Math.min(...prices);
    return lowest.toLocaleString('fr-FR');
};


export default function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
    const [product, setProduct] = useState<Product | null>(null);
    const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [flashSale, setFlashSale] = useState<FlashSale | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { toast } = useToast();
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const resolvedParams = await params;
            const { product, similarProducts } = await getProductData(resolvedParams.slug);
            if (!product) {
                notFound();
                return;
            }
            setProduct(product);
            setSimilarProducts(similarProducts);

            if (product && product.variants && product.variants.length > 0) {
                const sortedVariants = [...product.variants].sort((a, b) => (a.promoPrice || a.price) - (b.promoPrice || b.price));
                setSelectedVariant(sortedVariants[0]);
            }
            
            setIsLoading(false);
        };
        fetchData();
    }, [params]);

    useEffect(() => {
        if (product && selectedVariant) {
             const checkFlashSale = async () => {
                const q = query(
                    collection(db, "flashSales"), 
                    where("productId", "==", product.id),
                    where("variantStorage", "==", selectedVariant.storage),
                    where("status", "==", "Actif"),
                    limit(1)
                );
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    setFlashSale({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as FlashSale);
                } else {
                    setFlashSale(null);
                }
            };
            checkFlashSale();
        }
    }, [product, selectedVariant]);

    const handleAddToCart = () => {
        if (!product || !selectedVariant) return;

        const price = flashSale?.discountPrice || selectedVariant.promoPrice || selectedVariant.price;

        addToCart({
            id: `${product.id}-${selectedVariant.storage}`,
            productId: product.id,
            name: product.name,
            storage: selectedVariant.storage,
            price: price,
            quantity: 1,
            thumbnail: product.thumbnail,
        });

        toast({
            title: "Produit ajouté au panier",
            description: `${product.name} (${selectedVariant.storage}) a été ajouté à votre panier.`,
        });
    };
    
    if (isLoading || !product) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        )
    }

    const displayPrice = flashSale?.discountPrice || selectedVariant?.promoPrice || selectedVariant?.price;
    const originalPrice = flashSale ? flashSale.originalPrice : (selectedVariant?.isPromo ? selectedVariant.price : null);

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
              {product.variants.sort((a,b) => (a.promoPrice || a.price) - (b.promoPrice || b.price)).map((variant) => (
                <Label
                  key={variant.storage}
                  htmlFor={variant.storage}
                  className={`flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer transition-all ${selectedVariant?.storage === variant.storage ? 'border-primary ring-2 ring-primary' : 'border-muted hover:border-primary/50'}`}
                >
                  <RadioGroupItem value={variant.storage} id={variant.storage} className="sr-only" />
                  <span className="font-bold text-lg">{variant.storage}</span>
                    {variant.isPromo ? (
                        <div className="flex items-baseline gap-2">
                            <span className="text-sm text-muted-foreground line-through">{variant.price.toLocaleString('fr-FR')} CFA</span>
                            <span className="text-sm text-primary">{variant.promoPrice?.toLocaleString('fr-FR')} CFA</span>
                        </div>
                    ) : (
                        <span className="text-sm text-muted-foreground">{variant.price.toLocaleString('fr-FR')} CFA</span>
                    )}
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              {originalPrice && (
                  <div className="flex items-center gap-2">
                      <span className="text-2xl font-medium text-muted-foreground line-through">{originalPrice.toLocaleString('fr-FR')} CFA</span>
                      <span className="text-sm font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">
                        - {(originalPrice - (displayPrice || 0)).toLocaleString('fr-FR')} CFA
                      </span>
                  </div>
              )}
              <p className="text-4xl font-bold text-primary">
                {displayPrice ? `${displayPrice.toLocaleString('fr-FR')} CFA` : 'Sélectionnez une option'}
              </p>
            </div>
            <Button size="lg" className="w-full" onClick={handleAddToCart} disabled={!selectedVariant || isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ShoppingCart className="mr-2 h-5 w-5" />}
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
