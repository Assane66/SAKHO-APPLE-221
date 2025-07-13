
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, DocumentData } from 'firebase/firestore';
import type { Product } from '@/types';
import { HomeCarousel } from '@/components/home-carousel';

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


export default async function Home() {
  const products = await getProducts();
  const banners = await getActiveBanners();

  const getLowestPrice = (variants: Product['variants'] = []) => {
    if (!variants || variants.length === 0) {
      return null;
    }
    const lowest = Math.min(...variants.map(v => v.price));
    return lowest.toLocaleString('fr-FR');
  };

  return (
    <div className="flex flex-col">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
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
            <div className="mx-auto w-full lg:order-last">
                <HomeCarousel banners={banners} />
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
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
