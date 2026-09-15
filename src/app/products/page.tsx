// src/app/products/page.tsx
'use client';

import { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, DocumentData, Timestamp } from 'firebase/firestore';
import type { Product } from '@/types';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getOptimizedImageUrl } from '@/lib/image-optimizer';
import { getCachedCatalog, setCachedCatalog } from '@/lib/product-cache';

// Fetch all active products and all categories with caching and parallel execution
async function getProductsAndCategories() {
  const cached = getCachedCatalog();
  if (cached) {
    return { productList: cached.products, categoryList: cached.categories };
  }

  const now = Timestamp.now();
  const productsQuery = query(collection(db, 'products'), where("status", "==", "active"));
  const categoriesQuery = query(collection(db, 'categories'));
  const promoQuery = query(collection(db, 'promotions'), where("endDate", ">", now));

  // Exécution 100% parallèle des 3 requêtes
  const [productSnapshot, categorySnapshot, promoSnapshot] = await Promise.all([
    getDocs(productsQuery),
    getDocs(categoriesQuery),
    getDocs(promoQuery)
  ]);

  let productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  const categoryList = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentData));
  const promotions = promoSnapshot.docs.map(doc => doc.data());

  const productListWithPromos = productList.map(product => {
    const productPromos = promotions.filter(p => p.productId === product.id);
    if (productPromos.length > 0) {
      const mainPromo = productPromos.sort((a,b) => a.endDate.toMillis() - b.endDate.toMillis())[0];
      product.promoEndDate = mainPromo.endDate;

      product.variants = product.variants?.map(variant => {
        const promo = productPromos.find(p => p.variantStorage === variant.storage);
        if (promo) {
          return { ...variant, isPromo: true, promoPrice: promo.discountPrice, originalPrice: variant.price };
        }
        return variant;
      }) || [];
    }
    return product;
  });

  // Sauvegarder dans le cache mémoire client
  setCachedCatalog(productListWithPromos, categoryList);

  return { productList: productListWithPromos, categoryList };
}

const getLowestPrice = (variants: Product['variants'] = []) => {
    if (!variants || variants.length === 0) return null;
    const prices = variants.map(v => v.promoPrice || v.price);
    const lowest = Math.min(...prices);
    return lowest.toLocaleString('fr-FR');
};

const getPromoDetails = (variants: Product['variants'] = []) => {
    if (!variants) return null;
    const promoVariant = variants.find(v => v.isPromo && v.promoPrice && v.originalPrice);
    if (!promoVariant || !promoVariant.originalPrice || !promoVariant.promoPrice) return null;

    const discountPercentage = Math.round(((promoVariant.originalPrice - promoVariant.promoPrice) / promoVariant.originalPrice) * 100);
    return {
      promoPrice: promoVariant.promoPrice.toLocaleString('fr-FR'),
      originalPrice: promoVariant.originalPrice.toLocaleString('fr-FR'),
      discountPercentage: discountPercentage
    };
};

function ProductsSkeletonGrid() {
  return (
    <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 animate-in fade-in duration-300">
      {Array.from({ length: 8 }).map((_, idx) => (
        <Card key={idx} className="overflow-hidden flex flex-col p-4 space-y-3">
          <Skeleton className="h-4 w-20 mx-auto" />
          <Skeleton className="h-6 w-3/4 mx-auto" />
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="pt-4 space-y-2">
            <Skeleton className="h-6 w-1/2 mx-auto" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialisation immédiate avec le cache si disponible (0ms de chargement)
  const cached = typeof window !== 'undefined' ? getCachedCatalog() : null;
  const [products, setProducts] = useState<Product[]>(cached?.products || []);
  const [categories, setCategories] = useState<DocumentData[]>(cached?.categories || []);
  const [isLoading, setIsLoading] = useState(!cached);
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort') || 'default');
  const [visibleCount, setVisibleCount] = useState(12);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((prev) => prev + 12);
      }
    }, { threshold: 0.5 });
    
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!cached) {
        setIsLoading(true);
      }
      const { productList, categoryList } = await getProductsAndCategories();
      setProducts(productList);
      setCategories(categoryList);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const updateURLParams = (key: string, value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (!value || value === 'all' || value === 'default') {
      current.delete(key);
    } else {
      current.set(key, value);
    }
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`/products${query}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    updateURLParams('q', newSearchTerm);
  };
  
  const handleCategoryChange = (value: string) => {
      setSelectedCategory(value);
      updateURLParams('category', value);
  };

  const handleSortChange = (value: string) => {
      setSortOrder(value);
      updateURLParams('sort', value);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.keywords?.join(' ').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }

    const getPrice = (product: Product): number => {
        if (!product.variants || product.variants.length === 0) return 0;
        const prices = product.variants.map(v => v.promoPrice || v.price);
        return Math.min(...prices);
    }

    if (sortOrder === 'price-asc') {
      filtered.sort((a, b) => getPrice(a) - getPrice(b));
    } else if (sortOrder === 'price-desc') {
      filtered.sort((a, b) => getPrice(b) - getPrice(a));
    }

    return filtered;
  }, [products, searchTerm, selectedCategory, sortOrder]);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Tous les Produits</h1>
        <p className="text-muted-foreground">Trouvez l&apos;appareil Apple parfait pour vous.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 sticky top-16 bg-background/95 backdrop-blur py-4 z-10">
        <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Rechercher par nom ou mot-clé..." 
                className="pl-10"
                value={searchTerm}
                onChange={handleSearchChange}
            />
        </div>
        <div>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
            <Select value={sortOrder} onValueChange={handleSortChange}>
                <SelectTrigger>
                    <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="default">Par défaut</SelectItem>
                    <SelectItem value="price-asc">Prix: Croissant</SelectItem>
                    <SelectItem value="price-desc">Prix: Décroissant</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      {isLoading ? (
        <ProductsSkeletonGrid />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2">
            {filteredAndSortedProducts.length > 0 ? (
              filteredAndSortedProducts.slice(0, visibleCount).map((product, idx) => {
                const promoDetails = getPromoDetails(product.variants);
                const optimizedImageUrl = getOptimizedImageUrl(product.thumbnail, 500);

                return (
                <Card key={product.id} className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col group">
                  <CardContent className="p-4 text-center flex-grow flex flex-col">
                      {getCategoryName(product.categoryId) && (
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{getCategoryName(product.categoryId)}</p>
                      )}
                      <CardTitle className="text-base font-headline text-foreground my-2 h-12 flex items-center justify-center">
                          <Link href={`/products/${product.slug}`} className="hover:text-primary transition-colors line-clamp-2">
                            {product.name}
                          </Link>
                      </CardTitle>
                      <Link href={`/products/${product.slug}`} className="block relative overflow-hidden rounded-xl bg-muted/20">
                          <Image
                            src={optimizedImageUrl}
                            width={400}
                            height={400}
                            alt={product.name}
                            priority={idx < 4}
                            loading={idx < 4 ? undefined : "lazy"}
                            decoding="async"
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                            className="aspect-square object-contain mx-auto p-2 group-hover:scale-105 transition-transform duration-300"
                          />
                          {promoDetails && (
                          <Badge className="absolute bottom-3 left-3 bg-emerald-600 text-white text-xs font-bold shadow-md">
                              -{promoDetails.discountPercentage}%
                          </Badge>
                          )}
                      </Link>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <div className="flex flex-col w-full text-center space-y-2">
                      {promoDetails ? (
                        <div className="flex flex-col items-center">
                            <span className="text-lg font-bold text-primary">
                              {promoDetails.promoPrice} CFA
                            </span>
                            <span className="text-xs text-muted-foreground line-through">
                              {promoDetails.originalPrice} CFA
                            </span>
                        </div>
                      ) : getLowestPrice(product.variants) ? (
                          <span className="text-lg font-bold text-primary">{getLowestPrice(product.variants)} CFA</span>
                      ) : (
                          <span className="text-sm text-muted-foreground">Prix sur demande</span>
                      )}
                      <Button asChild variant="outline" size="sm" className="w-full">
                          <Link href={`/products/${product.slug}`}>Voir les options</Link>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              )})
            ) : (
              <p className="col-span-full text-center text-muted-foreground py-12">
                Aucun produit ne correspond à votre recherche.
              </p>
            )}
          </div>
          <div ref={loadMoreRef} className="h-10 flex justify-center items-center mt-6">
            {visibleCount < filteredAndSortedProducts.length && (
              <span className="text-xs text-muted-foreground">Chargement d&apos;autres produits...</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="container mx-auto px-4 py-8"><ProductsSkeletonGrid /></div>}>
            <ProductsPageContent />
        </Suspense>
    )
}
