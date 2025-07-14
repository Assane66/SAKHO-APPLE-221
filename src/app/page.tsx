// src/app/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, DocumentData, orderBy, limit } from 'firebase/firestore';
import type { Product } from '@/types';
import { useEffect, useState } from 'react';

async function getProducts(): Promise<Product[]> {
  const productsCol = collection(db, 'products');
  const q = query(productsCol, where("status", "==", "active"), limit(5));
  const productSnapshot = await getDocs(q);
  const productList = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  return productList;
}

async function getCategories(): Promise<DocumentData[]> {
    const categoriesCol = collection(db, 'categories');
    const q = query(categoriesCol, orderBy("name", "asc"), limit(4));
    const categorySnapshot = await getDocs(q);
    return categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}


export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<DocumentData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
        getCategories().then(setCategories);
        getProducts().then(setProducts);
    };
    fetchData();
  }, []);

  const getLowestPrice = (variants: Product['variants'] = []) => {
    if (!variants || variants.length === 0) return null;
    const prices = variants.map(v => v.promoPrice || v.price).filter(p => p > 0);
    if (prices.length === 0) return null;
    const lowest = Math.min(...prices);
    return lowest.toLocaleString('fr-FR');
  };

  return (
    <div className="flex flex-col space-y-6 container px-4 md:px-6 py-6">
        {/* Marketing Banner */}
        <Card className="bg-secondary/50 overflow-hidden">
            <CardContent className="p-6 md:p-8 grid md:grid-cols-2 gap-4 items-center">
                <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-bold font-headline">iPhone 15</h1>
                    <p className="text-lg text-muted-foreground">Une bannière marketing</p>
                </div>
                <div className="relative h-40 md:h-full w-full">
                     <Image 
                        src="https://res.cloudinary.com/dm6yuokre/image/upload/v1752175344/i-15-pro-and-15_b9xuns.png"
                        alt="iPhone 15 and 15 Pro"
                        fill
                        data-ai-hint="iphone 15 pro"
                        className="object-contain object-right"
                    />
                </div>
            </CardContent>
        </Card>

        {/* Search and Filters */}
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Sercher" className="pl-10 h-12 rounded-full bg-secondary/50 border-transparent focus:bg-white focus:border-ring" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
                 <Button variant="secondary" className="rounded-full bg-secondary text-secondary-foreground" asChild>
                    <Link href="/products">Tous</Link>
                </Button>
                {categories.map(category => (
                    <Button key={category.id} variant="secondary" className="rounded-full bg-secondary/50" asChild>
                         <Link href={`/products?category=${category.id}`}>{category.name}</Link>
                    </Button>
                ))}
            </div>
        </div>

        {/* Best Sellers */}
        <div className="space-y-4">
            <h2 className="text-2xl font-bold font-headline">Meilleures ventes</h2>
            <div className="flex flex-col gap-4">
                {products.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Chargement des produits...</p>
                ) : (
                    products.map(product => (
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
                                        <p className="text-accent font-bold text-lg">{getLowestPrice(product.variants)} CFA</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-semibold">Voir</span>
                                    </div>
                                </CardContent>
                            </Link>
                        </Card>
                    ))
                )}
            </div>
        </div>

    </div>
  )
}
