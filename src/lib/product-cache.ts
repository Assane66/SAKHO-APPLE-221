// src/lib/product-cache.ts
import type { Product } from '@/types';
import type { DocumentData } from 'firebase/firestore';

interface CachedCatalog {
  products: Product[];
  categories: DocumentData[];
  timestamp: number;
}

const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes de validité

let memoryCache: CachedCatalog | null = null;

export function getCachedCatalog(): { products: Product[]; categories: DocumentData[] } | null {
  if (!memoryCache) return null;
  const isExpired = Date.now() - memoryCache.timestamp > CACHE_TTL_MS;
  if (isExpired) {
    return null;
  }
  return { products: memoryCache.products, categories: memoryCache.categories };
}

export function setCachedCatalog(products: Product[], categories: DocumentData[]) {
  memoryCache = {
    products,
    categories,
    timestamp: Date.now(),
  };
}

export function invalidateCatalogCache() {
  memoryCache = null;
}
