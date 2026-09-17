// src/app/flash-sale/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import type { FlashSale, FlashSaleVariant } from '@/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Truck, Loader2, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/context/CartContext';
import { CountdownTimer } from '@/components/countdown-timer';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

async function getFlashSaleData(slug: string): Promise<FlashSale | null> {
    const flashSalesRef = collection(db, 'flashSales');
    const q = query(flashSalesRef, where('slug', '==', slug), where('status', '==', 'Actif'), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }

    const saleDoc = querySnapshot.docs[0];
    const sale = { id: saleDoc.id, ...saleDoc.data() } as FlashSale;

    // Check if sale has expired
    if (sale.endDate.toMillis() < Date.now()) {
        // Optionally, update status in DB to 'Terminé' here
        return null;
    }

    return sale;
}


export default function FlashSalePage({ params }: { params: Promise<{ slug: string }> }) {
    const [resolvedSlug, setResolvedSlug] = useState<string>('');
    const [sale, setSale] = useState<FlashSale | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<FlashSaleVariant | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { toast } = useToast();
    const { addToCart } = useCart();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
    }, []);

    useEffect(() => {
        if (params) {
            if (typeof (params as any).then === 'function') {
                params.then(p => {
                    if (p?.slug) setResolvedSlug(p.slug);
                });
            } else if ((params as any).slug) {
                setResolvedSlug((params as any).slug);
            }
        }
    }, [params]);

    useEffect(() => {
        if (!resolvedSlug) return;
        const fetchData = async () => {
            setIsLoading(true);
            const saleData = await getFlashSaleData(resolvedSlug);
            if (!saleData) {
                notFound();
                return;
            }
            setSale(saleData);

            if (saleData && saleData.variants && saleData.variants.length > 0) {
                const sortedVariants = [...saleData.variants].sort((a, b) => a.discountPrice - b.discountPrice);
                setSelectedVariant(sortedVariants[0]);
            }
            
            setIsLoading(false);
        };
        fetchData();
    }, [resolvedSlug]);

    const handleAddToCart = () => {
        if (!sale || !selectedVariant) return;

        addToCart({
            id: `${sale.id}-${selectedVariant.storage}`,
            productId: sale.id, // Using sale id as a unique identifier for this temporary product
            name: sale.productName,
            storage: selectedVariant.storage,
            price: selectedVariant.discountPrice,
            quantity: 1,
            thumbnail: sale.thumbnail,
            isSinglePiece: true,
            maxQuantity: 1,
        });

        toast({
            title: "Produit ajouté au panier",
            description: `${sale.productName} (${selectedVariant.storage}) a été ajouté à votre panier. (Pièce unique en vente flash)`,
        });
    };
    
    if (isLoading || !sale) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        )
    }

    const displayPrice = selectedVariant?.discountPrice;
    const originalPrice = selectedVariant?.originalPrice;

    return (
    <div className="container mx-auto max-w-6xl py-8 px-4 md:px-6">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="flex items-center justify-center bg-secondary/30 rounded-lg p-4">
          <Image
            src={sale.thumbnail || "https://placehold.co/600x600.png"}
            alt={sale.productName}
            width={500}
            height={500}
            className="aspect-square object-contain rounded-md"
          />
        </div>
        <div className="flex flex-col space-y-6">
          <div className="space-y-2">
             <Badge variant="destructive" className="text-base font-semibold">VENTE FLASH</Badge>
            <h1 className="text-3xl lg:text-4xl font-bold font-headline">{sale.productName}</h1>
            <div className="flex items-center gap-2 text-xl font-mono font-bold text-destructive p-2 bg-destructive/10 rounded-md">
               <Clock className="h-6 w-6" />
               <CountdownTimer endDate={sale.endDate} />
             </div>
          </div>
          
          <Separator />
          
          <div>
            <h2 className="text-lg font-semibold mb-3 font-headline">Choisir le stockage :</h2>
            <RadioGroup
              value={selectedVariant?.storage}
              onValueChange={(storage) => {
                const variant = sale.variants.find(v => v.storage === storage);
                if (variant) setSelectedVariant(variant);
              }}
              className="grid grid-cols-2 md:grid-cols-3 gap-3"
            >
              {sale.variants.sort((a,b) => a.discountPrice - b.discountPrice).map((variant) => (
                <Label
                  key={variant.storage}
                  htmlFor={variant.storage}
                  className={`flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer transition-all ${selectedVariant?.storage === variant.storage ? 'border-primary ring-2 ring-primary' : 'border-muted hover:border-primary/50'}`}
                >
                  <RadioGroupItem value={variant.storage} id={variant.storage} className="sr-only" />
                  <span className="font-bold text-lg">{variant.storage}</span>
                  <div className="flex items-baseline gap-2">
                      <span className="text-sm text-muted-foreground line-through">{variant.originalPrice.toLocaleString('fr-FR')} CFA</span>
                      <span className="text-sm text-primary">{variant.discountPrice?.toLocaleString('fr-FR')} CFA</span>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              {originalPrice && (
                  <span className="text-2xl font-medium text-muted-foreground line-through">{originalPrice.toLocaleString('fr-FR')} CFA</span>
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
              <AlertTitle className="font-headline text-green-800 dark:text-green-300">Produit Neuf Garanti</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400">
                Cet article est neuf et est couvert par la garantie standard.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  );
}
