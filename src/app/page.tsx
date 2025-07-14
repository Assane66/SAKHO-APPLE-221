
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, DocumentData, Timestamp, orderBy, limit } from 'firebase/firestore';
import type { Product, FlashSale } from '@/types';
import { HomeCarousel } from '@/components/home-carousel';
import { useEffect, useState } from 'react';
import { CountdownTimer } from '@/components/countdown-timer';

async function getProducts(): Promise<Product[]> {
  const productsCol = collection(db, 'products');
  const q = query(productsCol, where("status", "==", "active"));
  const productSnapshot = await getDocs(q);
  const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  return productList;
}

async function getActiveBanners(): Promise<DocumentData[]> {
    const bannersCol = collection(db, 'banners');
    const q = query(bannersCol, where("status", "==", "Actif"));
    const bannerSnapshot = await getDocs(q);
    return bannerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getActiveFlashSales(): Promise<FlashSale[]> {
  const now = Timestamp.now();
  const q = query(
    collection(db, "flashSales"),
    where("status", "==", "Actif"),
    where("endDate", ">", now),
    orderBy("endDate", "asc"),
    limit(1) // On affiche la plus proche de se terminer
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FlashSale));
}

async function getActivePromotions(): Promise<Product[]> {
  // 1. Get active promotion details
  const now = Timestamp.now();
  const promoQuery = query(
      collection(db, "promotions"),
      where("status", "==", "Actif"),
      where("endDate", ">", now),
      limit(4)
  );
  const promoSnapshot = await getDocs(promoQuery);
  const promotions = promoSnapshot.docs.map(doc => doc.data());

  if (promotions.length === 0) return [];

  // 2. Get the product details for these promotions
  const productIds = [...new Set(promotions.map(p => p.productId))];
  const productsQuery = query(collection(db, 'products'), where('__name__', 'in', productIds));
  const productSnapshot = await getDocs(productsQuery);
  let products = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

  // 3. Merge promotion prices into product variants
  products = products.map(product => {
    const productPromos = promotions.filter(p => p.productId === product.id);
    if (productPromos.length > 0) {
      product.variants = product.variants.map(variant => {
        const promo = productPromos.find(p => p.variantStorage === variant.storage);
        if (promo) {
          return { ...variant, isPromo: true, promoPrice: promo.discountPrice };
        }
        return variant;
      });
    }
    return product;
  });

  return products;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<DocumentData[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [promotions, setPromotions] = useState<Product[]>([]);


  useEffect(() => {
    getProducts().then(setProducts);
    getActiveBanners().then(setBanners);
    getActiveFlashSales().then(setFlashSales);
    getActivePromotions().then(setPromotions);
  }, []);


  const getLowestPrice = (variants: Product['variants'] = []) => {
    if (!variants || variants.length === 0) return null;
    const prices = variants.map(v => v.promoPrice || v.price).filter(p => p > 0);
    if (prices.length === 0) return null;
    const lowest = Math.min(...prices);
    return lowest.toLocaleString('fr-FR');
  };

  const getLowestPriceFromFlashSale = (variants: FlashSale['variants'] = []) => {
     if (!variants || variants.length === 0) return null;
     const lowest = Math.min(...variants.map(v => v.discountPrice));
     return lowest.toLocaleString('fr-FR');
  }

  return (
    <div className="flex flex-col">
      <section className="w-full py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col justify-center items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                Bienvenue chez Khalil Apple
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Votre destination N°1 pour les iPhones neufs et reconditionnés au Sénégal. Découvrez nos offres et estimez la valeur de votre ancien appareil.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/exchange">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Échanger mon iPhone
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full">
        <HomeCarousel banners={banners} />
      </section>

      {flashSales.length > 0 && flashSales.map(sale => (
        <section key={sale.id} className="w-full py-12 md:py-24 bg-primary/5 text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline text-foreground">Vente Flash !</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Offre à durée limitée, ne la manquez pas !
                </p>
            </div>
            <Card className="grid md:grid-cols-2 overflow-hidden border-2 border-primary/20 shadow-xl">
               <div className="relative aspect-square md:aspect-auto">
                    <Image
                        src={sale.thumbnail}
                        alt={sale.productName}
                        fill
                        className="object-cover"
                    />
               </div>
               <div className="flex flex-col p-6 md:p-8">
                  <h3 className="text-2xl md:text-3xl font-bold font-headline text-foreground">{sale.productName}</h3>
                  <div className="my-4">
                     <p className="text-lg text-muted-foreground">À partir de</p>
                     <p className="text-4xl md:text-5xl font-extrabold text-primary">{getLowestPriceFromFlashSale(sale.variants)} CFA</p>
                  </div>
                  <div className="my-4 space-y-2">
                     <p className="font-semibold text-foreground">Se termine dans :</p>
                     <div className="flex items-center gap-2 text-2xl font-mono font-bold text-destructive">
                       <Clock className="h-6 w-6" />
                       <CountdownTimer endDate={sale.endDate} />
                     </div>
                  </div>
                  <Button asChild size="lg" className="mt-auto">
                    <Link href={`/flash-sale/${sale.slug}`}>Voir l'offre</Link>
                  </Button>
               </div>
            </Card>
          </div>
        </section>
      ))}

      {promotions.length > 0 && (
         <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-8">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Nos Promotions</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Profitez de nos meilleures offres sur une sélection de produits.
                </p>
            </div>
             <div className="mx-auto grid max-w-5xl items-start gap-6 lg:grid-cols-4 md:grid-cols-2">
              {promotions.map((product) => (
                  <Card key={product.id} className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                    <Link href={`/products/${product.slug}`} className="block">
                      <CardHeader className="p-0 relative">
                         <Badge className="absolute top-2 right-2 z-10 bg-accent text-accent-foreground">Promo</Badge>
                        <Image
                          src={product.thumbnail || "https://placehold.co/600x600.png"}
                          width={600}
                          height={600}
                          alt={product.name}
                          data-ai-hint="iphone front"
                          className="aspect-square object-cover"
                        />
                      </CardHeader>
                    </Link>
                    <CardContent className="p-4">
                      <CardTitle className="text-lg font-headline">
                        <Link href={`/products/${product.slug}`}>{product.name}</Link>
                      </CardTitle>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <div className="flex flex-col w-full">
                        {getLowestPrice(product.variants) ? (
                          <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground line-through">
                                {product.variants.find(v => v.isPromo)?.price.toLocaleString('fr-FR')} CFA
                              </span>
                              <span className="text-md font-semibold text-destructive">
                                {product.variants.find(v => v.isPromo)?.promoPrice?.toLocaleString('fr-FR')} CFA
                              </span>
                          </div>
                        ) : (
                           <span className="text-md font-semibold text-muted-foreground">Prix non disponible</span>
                        )}
                         <Link href={`/products/${product.slug}`} className="w-full mt-2" passHref>
                            <Button className="w-full">
                              Voir les options
                            </Button>
                         </Link>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
             </div>
          </div>
        </section>
      )}


      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Nos iPhones</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Découvrez notre sélection des meilleurs modèles Apple, disponibles en plusieurs configurations pour répondre à tous vos besoins.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-4 md:grid-cols-2">
             {products.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground">Aucun produit disponible pour le moment.</p>
            ) : (
              products.map((product) => (
                <Card key={product.id} className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                  <Link href={`/products/${product.slug}`} className="block">
                    <CardHeader className="p-0">
                      <Image
                        src={product.thumbnail || "https://placehold.co/600x600.png"}
                        width={600}
                        height={600}
                        alt={product.name}
                        data-ai-hint="iphone front"
                        className="aspect-square object-cover"
                      />
                    </CardHeader>
                  </Link>
                  <CardContent className="p-4">
                    <CardTitle className="text-lg font-headline">
                      <Link href={`/products/${product.slug}`}>{product.name}</Link>
                    </CardTitle>
                    <CardDescription className="text-sm h-10">{product.batteryHealth ? `Batterie: ${product.batteryHealth}` : ''}</CardDescription>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <div className="flex flex-col w-full">
                       {getLowestPrice(product.variants) ? (
                        <span className="text-md font-semibold text-primary">à partir de {getLowestPrice(product.variants)} CFA</span>
                      ) : (
                         <span className="text-md font-semibold text-muted-foreground">Prix non disponible</span>
                      )}
                       <Link href={`/products/${product.slug}`} className="w-full mt-2" passHref>
                          <Button className="w-full">
                            Voir les options
                          </Button>
                       </Link>
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
