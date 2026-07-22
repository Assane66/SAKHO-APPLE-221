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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

// Fetch all active products and all categories
async function getProductsAndCategories() {
  const productsQuery = query(collection(db, 'products'), where("status", "==", "active"));
  const categoriesQuery = query(collection(db, 'categories'));

  const [productSnapshot, categorySnapshot] = await Promise.all([
    getDocs(productsQuery),
    getDocs(categoriesQuery)
  ]);

  let productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  const categoryList = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentData));

  // Fetch promotions and merge them
  const now = Timestamp.now();
  const promoQuery = query(collection(db, 'promotions'), where("endDate", ">", now));
  const promoSnapshot = await getDocs(promoQuery);
  const promotions = promoSnapshot.docs.map(doc => doc.data());

  const productListWithPromos = productList.map(product => {
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

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
      setIsLoading(true);
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

    switch (sortOrder) {
      case 'price-asc':
        filtered.sort((a, b) => (getLowestPrice(a.variants) ? parseFloat(getLowestPrice(a.variants)!.replace(/\s/g, '')) : Infinity) - (getLowestPrice(b.variants) ? parseFloat(getLowestPrice(b.variants)!.replace(/\s/g, '')) : Infinity));
        break;
      case 'price-desc':
        filtered.sort((a, b) => (getLowestPrice(b.variants) ? parseFloat(getLowestPrice(b.variants)!.replace(/\s/g, '')) : -Infinity) - (getLowestPrice(a.variants) ? parseFloat(getLowestPrice(a.variants)!.replace(/\s/g, '')) : -Infinity));
        break;
      default:
        filtered.sort((a,b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [products, searchTerm, selectedCategory, sortOrder]);

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || categoryId;
  };
  
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Tous les Produits</h1>
        <p className="text-muted-foreground">Trouvez l'appareil Apple parfait pour vous.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 sticky top-16 bg-background/95 py-4 z-10">
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
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2">
            {filteredAndSortedProducts.length > 0 ? (
              filteredAndSortedProducts.slice(0, visibleCount).map(product => {
                const promoDetails = getPromoDetails(product.variants);
                return (
                <Card key={product.id} className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 flex flex-col">
                  <CardContent className="p-4 text-center flex-grow flex flex-col">
                      {getCategoryName(product.categoryId) && (
                          <p className="text-sm text-muted-foreground">{getCategoryName(product.categoryId)}</p>
                      )}
                      <CardTitle className="text-lg font-headline text-blue-800 dark:text-blue-400 my-2 h-12 flex-grow">
                          <Link href={`/products/${product.slug}`}>{product.name}</Link>
                      </CardTitle>
                      <Link href={`/products/${product.slug}`} className="block relative">
                          <Image
                          src={product.thumbnail || "https://placehold.co/600x600.png"}
                          width={400}
                          height={400}
                          alt={product.name}
                          data-ai-hint="iphone front"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                          className="aspect-square object-cover mx-auto"
                          />
                          {promoDetails && (
                          <Badge className="absolute bottom-4 left-4 bg-green-600 text-white text-lg">
                              -{promoDetails.discountPercentage}%
                          </Badge>
                          )}
                      </Link>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <div className="flex flex-col w-full text-center">
                      {promoDetails ? (
                        <div className="flex flex-col items-center">
                            <span className="text-xl font-bold text-primary">
                              {promoDetails.promoPrice} CFA
                            </span>
                            <span className="text-md text-muted-foreground line-through">
                              {promoDetails.originalPrice} CFA
                            </span>
                        </div>
                      ) : getLowestPrice(product.variants) ? (
                          <span className="text-xl font-bold text-primary">{getLowestPrice(product.variants)} CFA</span>
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
              )})
            ) : (
              <div className="col-span-full text-center py-16">
                  <p className="text-lg font-semibold">Aucun produit ne correspond à votre recherche.</p>
                  <p className="text-muted-foreground">Essayez d'ajuster vos filtres.</p>
              </div>
            )}
          </div>
          
          {filteredAndSortedProducts.length > visibleCount && (
            <div ref={loadMoreRef} className="py-8 flex justify-center">
               <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <ProductsPageContent />
    </Suspense>
  );
}
