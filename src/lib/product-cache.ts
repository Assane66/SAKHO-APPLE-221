import type { Product, HeroConfig, FeaturedSlots } from '@/types';
import type { DocumentData } from 'firebase/firestore';

export interface HomePageCachedData {
  bannerList: DocumentData[];
  categoryList: DocumentData[];
  productList: Product[];
  activePromo: DocumentData | null;
  flashSalesList?: DocumentData[];
  contactPhone: string;
  whatsappNumber?: string;
  featuredSlots?: FeaturedSlots | null;
  heroConfig?: HeroConfig | null;
}

interface StoredCache<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes de validité
const LOCAL_STORAGE_KEY = 'khalil_apple_home_cache';

let memoryHomeCache: StoredCache<HomePageCachedData> | null = null;

/**
 * Récupère les données de la page d'accueil depuis la mémoire ou le localStorage
 * pour un affichage instantané (0ms).
 */
export function getCachedHomePageData(): HomePageCachedData | null {
  // 1. Essai depuis le cache mémoire JS
  if (memoryHomeCache) {
    if (Date.now() - memoryHomeCache.timestamp < CACHE_TTL_MS) {
      return memoryHomeCache.data;
    }
  }

  // 2. Essai depuis le localStorage (persiste même après actualisation F5)
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed: StoredCache<HomePageCachedData> = JSON.parse(raw);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          memoryHomeCache = parsed; // hydrater la mémoire
          return parsed.data;
        }
      }
    } catch {
      // Ignorer si localStorage désactivé ou quota dépassé
    }
  }

  return null;
}

/**
 * Sauvegarde les données de la page d'accueil en mémoire et dans le localStorage
 */
export function setCachedHomePageData(data: HomePageCachedData) {
  const item: StoredCache<HomePageCachedData> = {
    data,
    timestamp: Date.now(),
  };

  memoryHomeCache = item;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(item));
    } catch {
      // Ignorer
    }
  }
}

/**
 * Fonctions de compatibilité pour le catalogue général
 */
export function getCachedCatalog(): { products: Product[]; categories: DocumentData[] } | null {
  const homeData = getCachedHomePageData();
  if (homeData && homeData.productList?.length > 0) {
    return { products: homeData.productList, categories: homeData.categoryList };
  }
  return null;
}

export function setCachedCatalog(products: Product[], categories: DocumentData[]) {
  const current = getCachedHomePageData();
  setCachedHomePageData({
    bannerList: current?.bannerList || [],
    categoryList: categories,
    productList: products,
    activePromo: current?.activePromo || null,
    contactPhone: current?.contactPhone || '221770000000',
  });
}

export function invalidateCatalogCache() {
  memoryHomeCache = null;
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // Ignorer
    }
  }
}
