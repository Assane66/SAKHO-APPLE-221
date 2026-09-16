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

// Fetch all active products, inventory stock items, and categories with caching and parallel execution
async function getProductsAndCategories() {
  const cached = getCachedCatalog();
  if (cached && cached.products && cached.products.length > 0) {
    return { productList: cached.products, categoryList: cached.categories };
  }

  const now = Timestamp.now();
  const productsQuery = query(collection(db, 'products'));
  const categoriesQuery = query(collection(db, 'categories'));
  const promoQuery = query(collection(db, 'promotions'), where("endDate", ">", now));
  const inventoryQuery = query(collection(db, 'inventory'), where("status", "==", "disponible"));

  // Exécution 100% parallèle des requêtes
  const [productSnapshot, categorySnapshot, promoSnapshot, inventorySnapshot] = await Promise.all([
    getDocs(productsQuery),
    getDocs(categoriesQuery),
    getDocs(promoQuery),
    getDocs(inventoryQuery)
  ]);

  let rawProductList = productSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Product))
    .filter(p => p.status === 'active' || (p.status as string) === 'Actif');

  const categoryList = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentData));
  const promotions = promoSnapshot.docs.map(doc => doc.data());

  const productListWithPromos = rawProductList.map(product => {
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

  const availableInventory = inventorySnapshot.docs.map(doc => doc.data());

  const allProducts = productListWithPromos.map(product => {
    const matchingInv = availableInventory.filter(inv =>
      inv.productId === product.id ||
      (inv.productName && product.name && inv.productName.trim().toLowerCase() === product.name.trim().toLowerCase())
    );

    const inStockCount = matchingInv.length;
    product.inStock = inStockCount > 0;
    product.inStockCount = inStockCount;

    if (product.inStock) {
      const hasVenant = matchingInv.some(i => i.isVenant);
      const hasSecondHand = matchingInv.some(i => i.isSecondHand);
      if (hasVenant) product.isVenant = true;
      if (hasSecondHand && !hasVenant) product.isSecondHand = true;

      const customItems = matchingInv.filter(i => i.unitPrice && i.unitPrice > 0);
      if (customItems.length > 0) {
        const lowestCustom = Math.min(...customItems.map(i => i.unitPrice));
        product.unitPrice = lowestCustom;
        product.originalPrice = customItems[0].originalPrice || customItems[0].catalogPrice || product.variants?.[0]?.price;
      }
    }

    // Sécurité : ne jamais faire fuiter l'IMEI confidentiel côté client public
    delete (product as any).imei;
    delete (product as any).hasIMEI;

    return product;
  });

  // Priorité absolue : les produits avec stock physique disponible s'affichent en premier
  allProducts.sort((a, b) => {
    const aStock = a.inStock ? 1 : 0;
    const bStock = b.inStock ? 1 : 0;
    if (bStock !== aStock) return bStock - aStock;
    return 0;
  });

  // Sauvegarder dans le cache mémoire client
  setCachedCatalog(allProducts, categoryList);

  return { productList: allProducts, categoryList };
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
    let filtered = [...products];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.keywords?.join(' ').toLowerCase().includes(term)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }

    const getPrice = (product: Product): number => {
      if (product.unitPrice && product.unitPrice > 0) return product.unitPrice;
      if (!product.variants || product.variants.length === 0) return 0;
      const prices = product.variants.map(v => v.promoPrice || v.price);
      return Math.min(...prices);
    };

    filtered.sort((a, b) => {
      if (sortOrder === 'default') {
        const aStock = a.inStock ? 1 : 0;
        const bStock = b.inStock ? 1 : 0;
        if (bStock !== aStock) return bStock - aStock;
        return 0;
      }
      if (sortOrder === 'price-asc') return getPrice(a) - getPrice(b);
      if (sortOrder === 'price-desc') return getPrice(b) - getPrice(a);
      return 0;
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, sortOrder]);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Catalogue des iPhones</h1>
        <p className="text-muted-foreground">Trouvez l&apos;iPhone parfait pour vous — Modèles en stock immédiat et sur commande.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 sticky top-16 bg-background/95 backdrop-blur py-4 z-10">
        <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Rechercher par nom de modèle ou mot-clé..." 
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
                    <SelectItem value="default">Disponibilité (En stock en premier)</SelectItem>
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
                const storageDisplay = (product as any).storage || product.variants?.[0]?.storage;
                const productUrl = `/products/${product.slug || product.id}`;
                const optimizedImageUrl = getOptimizedImageUrl(product.thumbnail, 500);
                const initialPrice = product.originalPrice || product.variants?.[0]?.originalPrice || 0;
                const currentPrice = product.unitPrice || product.variants?.[0]?.promoPrice || product.variants?.[0]?.price || 0;
                const isLower = initialPrice > 0 && currentPrice < initialPrice;

                return (
                <Card key={product.id} className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col group relative">
                  {/* Badges top left: En stock / Custom Badge */}
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                    {product.inStock ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow">
                        ✓ En stock
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[10px] font-medium shadow">
                        Sur commande
                      </span>
                    )}
                    {product.customBadge && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-extrabold uppercase tracking-wider shadow">
                        {product.customBadge}
                      </span>
                    )}
                  </div>

                  {/* Badges top right: Condition */}
                  {((product as any).isVenant || (product as any).isSecondHand) && (
                    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                      {(product as any).isVenant && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-extrabold uppercase tracking-wider shadow">✦ Venant</span>
                      )}
                      {(product as any).isSecondHand && (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-700 text-white text-[10px] font-extrabold uppercase tracking-wider shadow">2ème main</span>
                      )}
                    </div>
                  )}

                  <CardContent className="p-4 text-center flex-grow flex flex-col">
                      {getCategoryName(product.categoryId) && (
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{getCategoryName(product.categoryId)}</p>
                      )}
                      <CardTitle className="text-base font-headline text-foreground my-2 flex items-center justify-center flex-col gap-1">
                          <Link href={productUrl} className="hover:text-primary transition-colors line-clamp-2">
                            {product.name}
                          </Link>
                          {storageDisplay && (
                            <span className="px-2 py-0.5 rounded-md bg-muted/40 text-[10px] font-mono font-bold text-muted-foreground border border-border/50">{storageDisplay}</span>
                          )}
                      </CardTitle>
                      <Link href={productUrl} className="block relative overflow-hidden rounded-xl bg-muted/20">
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
                      </Link>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <div className="flex flex-col w-full text-center space-y-2">
                      {isLower ? (
                        (product as any).isVenant ? (
                          <div className="flex flex-col items-center">
                            <span className="text-lg font-bold text-primary">{currentPrice.toLocaleString('fr-FR')} CFA</span>
                            <span className="text-xs text-muted-foreground line-through">{initialPrice.toLocaleString('fr-FR')} CFA</span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-primary">{currentPrice.toLocaleString('fr-FR')} CFA</span>
                        )
                      ) : (() => {
                        const promoDetails = getPromoDetails(product.variants);
                        if (promoDetails) return (
                          <div className="flex flex-col items-center">
                            <span className="text-lg font-bold text-primary">{promoDetails.promoPrice} CFA</span>
                            <span className="text-xs text-muted-foreground line-through">{promoDetails.originalPrice} CFA</span>
                          </div>
                        );
                        const displayPrice = currentPrice > 0
                          ? `${currentPrice.toLocaleString('fr-FR')} CFA`
                          : getLowestPrice(product.variants)
                            ? `${getLowestPrice(product.variants)} CFA`
                            : null;
                        return displayPrice
                          ? <span className="text-lg font-bold text-primary">{displayPrice}</span>
                          : <span className="text-sm text-muted-foreground">Prix sur demande</span>;
                      })()}
                      <Button asChild variant="outline" size="sm" className="w-full">
                          <Link href={productUrl}>Voir les options</Link>
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
