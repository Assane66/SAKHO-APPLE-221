// src/app/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, Clock, ChevronRight, Sparkles, Shield, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, DocumentData, orderBy, Timestamp } from 'firebase/firestore';
import type { Product } from '@/types';
import { useEffect, useState, useMemo } from 'react';
import { CountdownTimer } from '@/components/countdown-timer';
import { Badge } from '@/components/ui/badge';
import { HomeCarousel } from '@/components/home-carousel';
import { cn } from '@/lib/utils';

async function getHomePageData() {
  const bannersQuery = query(collection(db, "banners"), where("status", "==", "Actif"));
  const bannerSnapshot = await getDocs(bannersQuery);
  const bannerList = bannerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const categoriesQuery = query(collection(db, 'categories'), orderBy("name", "asc"));
  const categorySnapshot = await getDocs(categoriesQuery);
  const categoryList = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const productsQuery = query(collection(db, 'products'), where("status", "==", "active"));
  const productSnapshot = await getDocs(productsQuery);
  let productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

  const now = Timestamp.now();
  const promoQuery = query(collection(db, 'promotions'), where("endDate", ">", now));
  const promoSnapshot = await getDocs(promoQuery);
  const promotions = promoSnapshot.docs.map(doc => doc.data());

  productList = productList.map(product => {
    const productPromos = promotions.filter(p => p.productId === product.id);
    if (productPromos.length > 0) {
      const mainPromo = productPromos.sort((a, b) => a.endDate.toMillis() - b.endDate.toMillis())[0];
      product.promoEndDate = mainPromo.endDate;
      product.variants = product.variants.map(variant => {
        const promo = productPromos.find(p => p.variantStorage === variant.storage);
        if (promo) {
          return { ...variant, isPromo: true, promoPrice: promo.discountPrice, originalPrice: variant.price };
        }
        return variant;
      });
    }
    return product;
  });

  return { bannerList, categoryList, productList };
}

const features = [
  { icon: Shield, label: 'Produits Authentiques', desc: 'Garantis 100% originaux' },
  { icon: Zap, label: 'Livraison Rapide', desc: 'Partout au Sénégal' },
  { icon: Sparkles, label: 'Service Premium', desc: 'Assistance 7j/7' },
];

export default function Home() {
  const [banners, setBanners] = useState<DocumentData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    getHomePageData().then(data => {
      setBanners(data.bannerList);
      setProducts(data.productList);
      setCategories(data.categoryList);
      setIsLoading(false);
    });
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.keywords && product.keywords.join(' ').toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }
    return filtered;
  }, [products, searchTerm, selectedCategory]);

  const getLowestPrice = (variants: Product['variants'] = []) => {
    if (!variants || variants.length === 0) return null;
    const prices = variants.map(v => v.promoPrice || v.price).filter(p => p > 0);
    if (prices.length === 0) return null;
    return Math.min(...prices).toLocaleString('fr-FR');
  };

  const getOriginalPrice = (variants: Product['variants'] = []) => {
    if (!variants || variants.length === 0) return null;
    const hasPromo = variants.some(v => v.isPromo && v.originalPrice);
    if (!hasPromo) return null;
    const prices = variants.filter(v => v.isPromo && v.originalPrice).map(v => v.originalPrice!);
    return Math.min(...prices).toLocaleString('fr-FR');
  };

  const flashProducts = products.filter(p => p.promoEndDate && p.promoEndDate.toMillis() > Date.now());

  return (
    <div className="flex flex-col min-h-screen">

      {/* ═══ CAROUSEL / HERO ═══ */}
      {banners.length > 0 && (
        <section className="animate-fadeIn">
          <HomeCarousel banners={banners} />
        </section>
      )}

      {/* ═══ FEATURES BAR ═══ */}
      <section className="border-y border-border/50 bg-secondary/20">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-3 divide-x divide-border/50">
            {features.map(({ icon: Icon, label, desc }, i) => (
              <div
                key={label}
                className={cn(
                  "flex flex-col items-center text-center py-5 px-3 gap-1 animate-fadeInUp",
                  i === 0 && "delay-100",
                  i === 1 && "delay-200",
                  i === 2 && "delay-300",
                )}
              >
                <Icon className="h-5 w-5 text-primary mb-1" />
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground hidden sm:block">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container px-4 md:px-6 py-10 flex flex-col space-y-14">

        {/* ═══ VENTES FLASH ═══ */}
        {flashProducts.length > 0 && (
          <section className="space-y-6 animate-fadeInUp delay-200">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-1 w-8 rounded-full bg-primary" />
                  <span className="text-xs font-semibold tracking-widest uppercase text-primary">Offres Limitées</span>
                </div>
                <h2 className="font-headline text-2xl md:text-3xl font-bold">Ventes Flash</h2>
              </div>
              <Link href="/flash-sale" className="text-sm text-primary hover:underline flex items-center gap-1">
                Tout voir <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-5 grid-cols-2 md:grid-cols-4">
              {flashProducts.slice(0, 4).map((product, i) => (
                <Link
                  href={`/products/${product.slug}`}
                  key={product.id}
                  className={cn(
                    "group relative rounded-2xl border border-border bg-card overflow-hidden premium-card animate-fadeInUp",
                    i === 0 && "delay-100",
                    i === 1 && "delay-200",
                    i === 2 && "delay-300",
                    i === 3 && "delay-400",
                  )}
                >
                  <div className="absolute top-3 left-3 z-10">
                    <span className="badge-gold px-2 py-0.5 rounded-full text-xs">PROMO</span>
                  </div>
                  <div className="relative aspect-square bg-secondary/30 p-4">
                    <Image
                      src={product.thumbnail || "https://placehold.co/400x400.png"}
                      alt={product.name}
                      fill
                      className="object-contain p-2 transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2">{product.name}</h3>
                    <div>
                      <p className="font-bold text-primary text-base">{getLowestPrice(product.variants)} <span className="text-xs font-normal">CFA</span></p>
                      {getOriginalPrice(product.variants) && (
                        <p className="text-xs text-muted-foreground line-through">{getOriginalPrice(product.variants)} CFA</p>
                      )}
                    </div>
                    {product.promoEndDate && (
                      <div className="flex items-center gap-1 text-xs text-destructive font-mono bg-destructive/10 rounded-full px-2 py-0.5 w-fit">
                        <Clock className="h-3 w-3" />
                        <CountdownTimer endDate={product.promoEndDate} />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══ SEARCH & FILTERS ═══ */}
        <section className="space-y-4 animate-fadeInUp delay-300">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              id="product-search"
              placeholder="Rechercher un iPhone, accessoire..."
              className="pl-12 h-13 text-base rounded-2xl border-border/60 bg-secondary/30 focus:bg-background focus:border-primary/50 transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "rounded-full px-5 flex-shrink-0 transition-all duration-200",
                selectedCategory === 'all' && "btn-gold border-0"
              )}
              onClick={() => setSelectedCategory('all')}
            >
              Tous
            </Button>
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  "rounded-full px-5 flex-shrink-0 transition-all duration-200",
                  selectedCategory === category.id && "btn-gold border-0"
                )}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </section>

        {/* ═══ PRODUCTS LIST ═══ */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-1 w-8 rounded-full bg-primary" />
                <span className="text-xs font-semibold tracking-widest uppercase text-primary">Notre Catalogue</span>
              </div>
              <h2 className="font-headline text-2xl md:text-3xl font-bold">Nos iPhones</h2>
            </div>
            {products.length > 5 && (
              <Link href="/products" className="text-sm text-primary hover:underline flex items-center gap-1">
                Voir tout <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={cn("h-28 rounded-2xl bg-secondary/50 animate-pulse", i === 1 && "delay-100", i === 2 && "delay-200")} />
              ))
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16 space-y-2">
                <p className="text-muted-foreground">Aucun produit trouvé.</p>
                <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}>
                  Réinitialiser
                </Button>
              </div>
            ) : (
              filteredProducts.slice(0, 6).map((product, i) => (
                <Link
                  href={`/products/${product.slug}`}
                  key={product.id}
                  className={cn(
                    "group flex items-center gap-4 p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/30 hover:bg-secondary/30 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 animate-fadeInUp",
                    `delay-${Math.min(i * 100, 500)}`
                  )}
                >
                  {/* Product Image */}
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl bg-secondary/50 flex-shrink-0 overflow-hidden">
                    <Image
                      src={product.thumbnail || "https://placehold.co/400x400.png"}
                      alt={product.name}
                      fill
                      className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                    />
                    {product.promoEndDate && product.promoEndDate.toMillis() > Date.now() && (
                      <div className="absolute top-1 left-1">
                        <span className="badge-gold px-1.5 py-0.5 rounded-full text-[10px]">PROMO</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-base truncate">{product.name}</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-primary font-bold text-lg">{getLowestPrice(product.variants)}</span>
                      <span className="text-xs text-muted-foreground">CFA</span>
                      {getOriginalPrice(product.variants) && (
                        <span className="text-xs text-muted-foreground line-through">{getOriginalPrice(product.variants)}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {product.variants?.length || 0} option{(product.variants?.length || 0) > 1 ? 's' : ''} disponible{(product.variants?.length || 0) > 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0">
                    <div className="h-9 w-9 rounded-full bg-secondary/60 group-hover:bg-primary/10 flex items-center justify-center transition-all duration-300">
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {!isLoading && filteredProducts.length > 6 && (
            <div className="text-center pt-4">
              <Button asChild variant="outline" className="rounded-full px-8 border-primary/30 hover:bg-primary/5 hover:border-primary/60 transition-all duration-300">
                <Link href="/products">Voir tous les produits</Link>
              </Button>
            </div>
          )}
        </section>

        {/* ═══ CTA BANNER ═══ */}
        <section className="animate-fadeInUp delay-400">
          <div className="relative rounded-3xl overflow-hidden border border-primary/20 bg-gradient-to-br from-secondary/60 via-background to-secondary/30 p-8 md:p-12 text-center">
            <div className="absolute inset-0 shimmer pointer-events-none" />
            <div className="relative space-y-4">
              <p className="text-xs font-semibold tracking-widest uppercase text-primary">Service Premium</p>
              <h2 className="font-headline text-2xl md:text-4xl font-bold">
                Vous avez un iPhone à échanger ?
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Obtenez une estimation instantanée grâce à notre assistant IA et échangez en toute confiance.
              </p>
              <Button asChild className="btn-gold rounded-full px-8 py-6 text-base mt-2">
                <Link href="/exchange">Estimer mon iPhone</Link>
              </Button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
