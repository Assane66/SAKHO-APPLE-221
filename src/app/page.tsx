// src/app/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Search, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, DocumentData, orderBy, limit, Timestamp } from 'firebase/firestore';
import type { Product } from '@/types';
import { useEffect, useState, useMemo } from 'react';
import { CountdownTimer } from '@/components/countdown-timer';
import { Badge } from '@/components/ui/badge';
import { HomeCarousel } from '@/components/home-carousel';
import { cn } from '@/lib/utils';

async function getHomePageData() {
  // Fetch Banners
  const bannersQuery = query(collection(db, "banners"), where("status", "==", "Actif"));
  const bannerSnapshot = await getDocs(bannersQuery);
  const bannerList = bannerSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Fetch Categories
  const categoriesQuery = query(collection(db, 'categories'), orderBy("name", "asc"));
  const categorySnapshot = await getDocs(categoriesQuery);
  const categoryList = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Fetch Products
  const productsQuery = query(collection(db, 'products'), where("status", "==", "active"));
  const productSnapshot = await getDocs(productsQuery);
  let productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));

  // Fetch and merge Promotions
  const now = Timestamp.now();
  const promoQuery = query(collection(db, 'promotions'), where("endDate", ">", now));
  const promoSnapshot = await getDocs(promoQuery);
  const promotions = promoSnapshot.docs.map(doc => doc.data());

  productList = productList.map(product => {
      const productPromos = promotions.filter(p => p.productId === product.id);
      if (productPromos.length > 0) {
          const mainPromo = productPromos.sort((a,b) => a.endDate.toMillis() - b.endDate.toMillis())[0];
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

export default function Home() {
  const [banners, setBanners] = useState<DocumentData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        getHomePageData().then(data => {
            setBanners(data.bannerList);
            setProducts(data.productList);
            setCategories(data.categoryList);
            setIsLoading(false);
        });
    };
    fetchData();
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
    const lowest = Math.min(...prices);
    return lowest.toLocaleString('fr-FR');
  };

  return (
    <div className="flex flex-col space-y-12 container px-4 md:px-6 py-6">
        
        <HomeCarousel banners={banners} />
        
        {/* Flash Sales Section */}
        {products.filter(p => p.promoEndDate && p.promoEndDate.toMillis() > Date.now()).length > 0 && (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold font-headline">Ventes Flash & Promotions</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {products.filter(p => p.promoEndDate && p.promoEndDate.toMillis() > Date.now()).slice(0, 4).map(product => (
                        <Card key={product.id} className="overflow-hidden group">
                           <Link href={`/products/${product.slug}`} className="block">
                                <CardContent className="p-4 flex flex-col items-center text-center">
                                    <div className="relative w-full aspect-square">
                                        <Image 
                                            src={product.thumbnail || "https://placehold.co/400x400.png"}
                                            alt={product.name}
                                            fill
                                            className="object-contain group-hover:scale-105 transition-transform duration-300"
                                        />
                                        {product.promoEndDate && (
                                            <Badge variant="destructive" className="absolute top-2 right-2">PROMO</Badge>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-lg mt-4 h-12">{product.name}</h3>
                                </CardContent>
                                <CardFooter className="flex-col items-center justify-center p-4 pt-0">
                                     <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold text-primary">{getLowestPrice(product.variants)} CFA</span>
                                    </div>
                                    {product.promoEndDate && (
                                        <div className="flex items-center gap-1 text-sm text-destructive font-mono">
                                            <Clock className="h-4 w-4" />
                                            <CountdownTimer endDate={product.promoEndDate} />
                                        </div>
                                    )}
                                    <Button className="mt-2 w-full">Voir l'offre</Button>
                                </CardFooter>
                            </Link>
                        </Card>
                    ))}
                </div>
            </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Rechercher un iPhone..." 
                    className="pl-10 h-12 rounded-full bg-secondary/50 border-transparent focus:bg-white focus:border-ring"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
                 <Button 
                    variant={selectedCategory === 'all' ? 'default' : 'secondary'} 
                    className="rounded-full"
                    onClick={() => setSelectedCategory('all')}>
                    Tous
                </Button>
                {categories.map(category => (
                    <Button 
                        key={category.id} 
                        variant={selectedCategory === category.id ? 'default' : 'secondary'} 
                        className="rounded-full"
                        onClick={() => setSelectedCategory(category.id)}>
                        {category.name}
                    </Button>
                ))}
            </div>
        </div>

        {/* Product List */}
        <div className="space-y-4">
            <h2 className="text-2xl font-bold font-headline">Nos iPhones</h2>
            <div className="flex flex-col gap-4">
                {isLoading && products.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Chargement des produits...</p>
                ) : filteredProducts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucun produit ne correspond à cette catégorie.</p>
                ) : (
                    filteredProducts.slice(0, 5).map(product => (
                        <Card key={product.id} className="overflow-hidden">
                            <Link href={`/products/${product.slug}`} className="block hover:bg-secondary/30 transition-colors">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="relative w-24 h-24 bg-secondary/50 rounded-lg flex-shrink-0">
                                        <Image 
                                            src={product.thumbnail || "https://placehold.co/400x400.png"}
                                            alt={product.name}
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-semibold text-lg">{product.name}</h3>
                                        <p className="text-primary font-bold text-lg">{getLowestPrice(product.variants)} CFA</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-semibold text-sm">Voir</span>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>
                    ))
                )}
                 {products.length > 5 && (
                    <div className="text-center mt-4">
                        <Button asChild variant="outline">
                            <Link href="/products">Voir tous les produits</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>

    </div>
  )
}
