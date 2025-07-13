// src/app/products/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, DocumentData } from 'firebase/firestore';
import type { Product } from '@/types';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Search } from 'lucide-react';
import Image from 'next/image';

// Fetch all active products and all categories
async function getProductsAndCategories() {
  const productsQuery = query(collection(db, 'products'), where("status", "==", "active"));
  const categoriesQuery = query(collection(db, 'categories'));

  const [productSnapshot, categorySnapshot] = await Promise.all([
    getDocs(productsQuery),
    getDocs(categoriesQuery)
  ]);

  const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  const categoryList = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DocumentData));

  // Fetch promotions and merge them
  const promoQuery = query(collection(db, 'promotions'));
  const promoSnapshot = await getDocs(promoQuery);
  const promotions = promoSnapshot.docs.map(doc => doc.data());

  const productListWithPromos = productList.map(product => {
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


  return { productList: productListWithPromos, categoryList };
}

const getLowestPrice = (variants: Product['variants'] = []) => {
    if (!variants || variants.length === 0) return null;
    const prices = variants.map(v => v.promoPrice || v.price);
    const lowest = Math.min(...prices);
    return lowest.toLocaleString('fr-FR');
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('default');

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

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.keywords?.join(' ').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }

    // Sort
    switch (sortOrder) {
      case 'price-asc':
        filtered.sort((a, b) => (getLowestPrice(a.variants) ? parseFloat(getLowestPrice(a.variants)!.replace(/\s/g, '')) : Infinity) - (getLowestPrice(b.variants) ? parseFloat(getLowestPrice(b.variants)!.replace(/\s/g, '')) : Infinity));
        break;
      case 'price-desc':
        filtered.sort((a, b) => (getLowestPrice(b.variants) ? parseFloat(getLowestPrice(b.variants)!.replace(/\s/g, '')) : -Infinity) - (getLowestPrice(a.variants) ? parseFloat(getLowestPrice(a.variants)!.replace(/\s/g, '')) : -Infinity));
        break;
      default:
        // Default sort (e.g., by name or creation date if available)
        filtered.sort((a,b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [products, searchTerm, selectedCategory, sortOrder]);
  
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
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
            <Select value={sortOrder} onValueChange={setSortOrder}>
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
        <div className="grid gap-6 lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2">
          {filteredAndSortedProducts.length > 0 ? (
            filteredAndSortedProducts.map(product => (
              <Card key={product.id} className="overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                <Link href={`/products/${product.slug}`} className="block">
                  <CardHeader className="p-0 relative">
                    {product.variants.some(v => v.isPromo) && (
                        <Badge className="absolute top-2 right-2 z-10 bg-accent text-accent-foreground">Promo</Badge>
                    )}
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
                  <CardTitle className="text-lg font-headline h-12">
                    <Link href={`/products/${product.slug}`}>{product.name}</Link>
                  </CardTitle>
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
          ) : (
            <div className="col-span-full text-center py-16">
                <p className="text-lg font-semibold">Aucun produit ne correspond à votre recherche.</p>
                <p className="text-muted-foreground">Essayez d'ajuster vos filtres.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
