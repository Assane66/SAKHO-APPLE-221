// src/app/products/[slug]/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { notFound, useParams, useSearchParams } from 'next/navigation';
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

async function getProductData(rawSlug: string): Promise<{ product: Product | null, similarProducts: Product[], stockItems: any[] }> {
    if (!rawSlug) return { product: null, similarProducts: [], stockItems: [] };
    const slug = decodeURIComponent(rawSlug);
    const productsRef = collection(db, 'products');

    let productDoc: any = null;

    // 1. Recherche directe par slug
    const qSlug = query(productsRef, where('slug', '==', slug), limit(1));
    const snapSlug = await getDocs(qSlug);
    if (!snapSlug.empty) {
        productDoc = snapSlug.docs[0];
    } else {
        // 2. Recherche par rawSlug
        const qRaw = query(productsRef, where('slug', '==', rawSlug), limit(1));
        const snapRaw = await getDocs(qRaw);
        if (!snapRaw.empty) {
            productDoc = snapRaw.docs[0];
        } else {
            // 3. Recherche par ID direct dans 'products'
            try {
                const docSnap = await getDoc(doc(db, 'products', slug));
                if (docSnap.exists()) {
                    productDoc = docSnap;
                }
            } catch (e) {
                // Non trouvé par doc id direct
            }
        }
    }

    // 4. Recherche si le slug est un ID d'exemplaire en stock ou préfixé 'imei-'
    if (!productDoc) {
        const cleanInvId = slug.replace(/^imei-/, '');
        try {
            const invSnap = await getDoc(doc(db, 'inventory', cleanInvId));
            if (invSnap.exists()) {
                const invData = invSnap.data();
                if (invData.productId) {
                    const linkedProductSnap = await getDoc(doc(db, 'products', invData.productId));
                    if (linkedProductSnap.exists()) {
                        productDoc = linkedProductSnap;
                    }
                }
                if (!productDoc && invData.productName) {
                    const qName = query(productsRef, where('name', '==', invData.productName), limit(1));
                    const snapName = await getDocs(qName);
                    if (!snapName.empty) {
                        productDoc = snapName.docs[0];
                    }
                }
            }
        } catch (e) {
            // ignore
        }
    }

    // 5. Fallback flexible : comparaison insensible à la casse ou par nom
    if (!productDoc) {
        try {
            const allProdsSnap = await getDocs(productsRef);
            const lowerSlug = slug.toLowerCase();
            for (const d of allProdsSnap.docs) {
                const data = d.data();
                const docSlug = (data.slug || '').toLowerCase();
                const docName = (data.name || '').toLowerCase().replace(/\s+/g, '-');
                if (docSlug === lowerSlug || docName === lowerSlug || d.id === slug) {
                    productDoc = d;
                    break;
                }
            }
        } catch (e) {
            // ignore
        }
    }

    if (!productDoc) {
        return { product: null, similarProducts: [], stockItems: [] };
    }

    const product = { id: productDoc.id, ...productDoc.data() } as Product;

    // Fetch promotions for this product
    const promoQuery = query(collection(db, 'promotions'), where('productId', '==', product.id));
    const promoSnapshot = await getDocs(promoQuery);
    const promotions = promoSnapshot.docs.map(doc => doc.data());

    if (promotions.length > 0 && product.variants) {
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

    // Fetch available unique stock items (IMEI) for this product
    let stockItems: any[] = [];
    try {
        const stockQuery = query(
            collection(db, 'inventory'),
            where('productId', '==', product.id),
            where('status', '==', 'disponible')
        );
        const stockSnap = await getDocs(stockQuery);
        stockItems = stockSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error('Error fetching inventory for product:', e);
    }

    let similarProducts: Product[] = [];
    if (product.categoryId) {
        const similarQuery = query(
            productsRef,
            where('categoryId', '==', product.categoryId),
            limit(5)
        );
        const similarSnapshot = await getDocs(similarQuery);
        similarProducts = similarSnapshot.docs
            .filter(d => d.id !== productDoc.id)
            .slice(0, 4)
            .map(doc => ({ id: doc.id, ...doc.data() } as Product));
    }

    return { product, similarProducts, stockItems };
}

const getLowestPrice = (variants: Product['variants'] = []) => {
    if (!variants || variants.length === 0) return null;
    const prices = variants.map(v => v.promoPrice || v.price);
    const lowest = Math.min(...prices);
    return lowest.toLocaleString('fr-FR');
};

function ProductDetailsContent({ params }: { params: Promise<{ slug: string }> }) {
    const routeParams = useParams();
    const searchParams = useSearchParams();
    const queryStorage = searchParams?.get('storage') || '';

    const [resolvedSlug, setResolvedSlug] = useState<string>((routeParams?.slug as string) || '');
    const [product, setProduct] = useState<Product | null>(null);
    const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
    const [stockItems, setStockItems] = useState<any[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [flashSale, setFlashSale] = useState<FlashSale | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { toast } = useToast();
    const { addToCart } = useCart();

    // Fix critique : toujours commencer en haut de la page produit immédiatement
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }
    }, []);

    useEffect(() => {
        if (routeParams?.slug) {
            setResolvedSlug(routeParams.slug as string);
        } else if (params) {
            if (typeof (params as any).then === 'function') {
                (params as Promise<{ slug: string }>).then(p => {
                    if (p?.slug) setResolvedSlug(p.slug);
                });
            } else if ((params as any).slug) {
                setResolvedSlug((params as any).slug);
            }
        }
    }, [routeParams, params]);

    useEffect(() => {
        if (!resolvedSlug) return;

        if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }

        const fetchData = async () => {
            setIsLoading(true);
            const { product, similarProducts, stockItems } = await getProductData(resolvedSlug);
            if (!product) {
                notFound();
                return;
            }
            setProduct(product);
            setSimilarProducts(similarProducts);
            setStockItems(stockItems);

            if (product && product.variants && product.variants.length > 0) {
                // Si des items en stock existent, pré-sélectionner le premier stockage en stock
                const inStockStorages = stockItems.map((s: any) => s.storage).filter(Boolean);
                const sortedVariants = [...product.variants].sort((a, b) => (a.promoPrice || a.price) - (b.promoPrice || b.price));
                
                let initialVariant = sortedVariants[0];

                if (queryStorage) {
                    const matched = product.variants.find(v => v.storage.toLowerCase() === queryStorage.toLowerCase());
                    if (matched) initialVariant = matched;
                } else if (inStockStorages.length > 0) {
                    // Forcer la sélection initiale sur la première variante disponible en stock
                    const stockVariant = product.variants.find(v => inStockStorages.includes(v.storage));
                    if (stockVariant) initialVariant = stockVariant;
                }

                setSelectedVariant(initialVariant);
            }
            
            setIsLoading(false);
        };
        fetchData();
    }, [resolvedSlug, queryStorage]);

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
        // Si le produit est en stock physique ou en vente flash, c'est une pièce unique limitée à 1
        const inStockStorages = stockItems.map((s: any) => s.storage).filter(Boolean);
        const isStockUnique = inStockStorages.includes(selectedVariant.storage) || stockItems.length > 0;
        const isSinglePiece = isStockUnique || !!flashSale;

        addToCart({
            id: `${product.id}-${selectedVariant.storage}`,
            productId: product.id,
            name: product.name,
            storage: selectedVariant.storage,
            price: price,
            quantity: 1,
            thumbnail: product.thumbnail,
            isSinglePiece: isSinglePiece,
            maxQuantity: isSinglePiece ? 1 : 99,
        });

        toast({
            title: "Produit ajouté au panier",
            description: `${product.name} (${selectedVariant.storage}) a été ajouté à votre panier.${isSinglePiece ? ' (Exemplaire unique en stock)' : ''}`,
        });
    };
    
    if (isLoading || !product) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin" />
            </div>
        )
    }

    // Prix à afficher : priorité au prix du stock (custom), puis flash sale, puis promo, puis catalogue
    const stockItemForVariant = stockItems.find((s: any) => s.storage === selectedVariant?.storage);
    const stockCustomPrice: number | null = stockItemForVariant?.unitPrice || stockItemForVariant?.sellingPrice || null;
    const displayPrice = stockCustomPrice || flashSale?.discountPrice || selectedVariant?.promoPrice || selectedVariant?.price;
    const originalPrice = stockCustomPrice
      ? null // Produit stock à prix fixe : pas de prix barré
      : flashSale
        ? flashSale.originalPrice
        : (selectedVariant?.isPromo ? selectedVariant.price : null);

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
            {(() => {
              // Si des items en stock existent, on ne montre QUE les variantes disponibles en stock
              const inStockStorages = stockItems.map((s: any) => s.storage).filter(Boolean);
              const hasRealStock = inStockStorages.length > 0;

              // Variantes à afficher : filtrées par stock ou toutes du catalogue
              const variantsToShow = hasRealStock
                ? product.variants.filter(v => inStockStorages.includes(v.storage))
                : [...product.variants].sort((a, b) => (a.promoPrice || a.price) - (b.promoPrice || b.price));

              // Pour chaque variante en stock, chercher si un prix custom a été défini dans l'inventaire
              const getStockPrice = (storage: string): number | null => {
                const item = stockItems.find((s: any) => s.storage === storage);
                return item?.unitPrice || item?.sellingPrice || null;
              };

              return (
                <>
                  <h2 className="text-lg font-semibold mb-3 font-headline">
                    {hasRealStock ? 'Stockage disponible en boutique :' : 'Choisir le stockage :'}
                  </h2>
                  {hasRealStock && (
                    <p className="text-xs text-zinc-400 mb-3">
                      Seuls les stockages actuellement disponibles en stock sont proposés à la commande.
                    </p>
                  )}
                  <RadioGroup
                    value={selectedVariant?.storage}
                    onValueChange={(storage) => {
                      const variant = product.variants.find(v => v.storage === storage);
                      if (variant) setSelectedVariant(variant);
                    }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-3"
                  >
                    {variantsToShow.map((variant) => {
                      const stockPrice = hasRealStock ? getStockPrice(variant.storage) : null;
                      const displayCatalogPrice = variant.isPromo
                        ? { promo: variant.promoPrice, original: variant.price }
                        : { promo: null, original: variant.price };
                      return (
                        <Label
                          key={variant.storage}
                          htmlFor={variant.storage}
                          className={`flex flex-col items-center justify-center rounded-md border-2 p-4 cursor-pointer transition-all ${
                            selectedVariant?.storage === variant.storage
                              ? 'border-primary ring-2 ring-primary'
                              : 'border-muted hover:border-primary/50'
                          }`}
                        >
                          <RadioGroupItem value={variant.storage} id={variant.storage} className="sr-only" />
                          <span className="font-bold text-lg">{variant.storage}</span>
                          {stockPrice ? (
                            // Prix du stock (custom) — prioritaire sur le catalogue
                            <span className="text-sm text-primary font-semibold">{stockPrice.toLocaleString('fr-FR')} CFA</span>
                          ) : displayCatalogPrice.promo ? (
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm text-muted-foreground line-through">{displayCatalogPrice.original.toLocaleString('fr-FR')} CFA</span>
                              <span className="text-sm text-primary">{displayCatalogPrice.promo?.toLocaleString('fr-FR')} CFA</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">{displayCatalogPrice.original.toLocaleString('fr-FR')} CFA</span>
                          )}
                        </Label>
                      );
                    })}
                  </RadioGroup>
                </>
              );
            })()}
          </div>

          {/* Stock Réel & Disponibilité (IMEI strictement masqué et sécurisé) */}
          {stockItems.length > 0 ? (
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  En stock immédiat à Dakar
                </span>
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                  {stockItems.length} disponible{stockItems.length > 1 ? 's' : ''}
                </Badge>
              </div>
              <p className="text-xs text-zinc-300">
                Cet appareil est physiquement présent dans notre magasin. Disponible pour retrait immédiat ou livraison expresse en 24h.
              </p>
              <div className="flex items-center gap-2 pt-1">
                {product.isVenant && (
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold uppercase">
                    ✦ Qualité Venant
                  </Badge>
                )}
                {product.isSecondHand && (
                  <Badge className="bg-zinc-800 text-zinc-300 border border-white/10 text-[10px] font-extrabold uppercase">
                    2ème main certifiée
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl border border-white/10 bg-zinc-900/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-amber-400" />
                  Disponible sur commande
                </span>
                <Badge variant="outline" className="text-[10px] border-white/20 text-zinc-400">
                  Sous 24h à 48h
                </Badge>
              </div>
              <p className="text-xs text-zinc-400">
                Ce modèle fait partie de notre catalogue officiel. Votre commande sera préparée auprès de notre centrale fournisseur.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              {originalPrice && !product.isSecondHand && (
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

export default function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
    return (
        <Suspense fallback={
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-amber-400" />
            </div>
        }>
            <ProductDetailsContent params={params} />
        </Suspense>
    );
}
