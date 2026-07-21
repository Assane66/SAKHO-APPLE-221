// src/app/page.tsx
'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, Sparkles, RefreshCw, ChevronRight, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, DocumentData, orderBy, Timestamp, limit as firestoreLimit } from 'firebase/firestore';
import type { Product, Promotion } from '@/types';
import { useEffect, useState, useMemo, useCallback } from 'react';

import { MagneticButton } from '@/components/ui/MagneticButton';
import { BentoGridSection } from '@/components/home/BentoGridSection';
import { MarqueeBanner } from '@/components/home/MarqueeBanner';
import { FlipClockTimer } from '@/components/home/FlipClockTimer';
import { cn } from '@/lib/utils';

// Lazy loading du composant 3D Three.js et du Drawer pour alléger le bundle initial
const IPhone3DViewer = dynamic(
  () => import('@/components/3d/IPhone3DViewer').then(mod => mod.IPhone3DViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[450px] rounded-3xl bg-zinc-900/40 border border-white/10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
    ),
  }
);

const FastCheckoutDrawer = dynamic(
  () => import('@/components/checkout/FastCheckoutDrawer').then(mod => mod.FastCheckoutDrawer),
  { ssr: false }
);

/* ─── Data fetching optimisé ─────────────────────── */
async function getHomePageData(itemLimit = 12) {
  try {
    const [bannerSnap, catSnap, prodSnap, promoSnap] = await Promise.all([
      getDocs(query(collection(db, 'banners'), where('status', '==', 'Actif'))),
      getDocs(query(collection(db, 'categories'), orderBy('name', 'asc'))),
      getDocs(query(collection(db, 'products'), where('status', '==', 'active'), firestoreLimit(itemLimit))),
      getDocs(query(collection(db, 'promotions'), where('endDate', '>', Timestamp.now()))),
    ]);

    const promotions = promoSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    let productList = prodSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product));

    productList = productList.map(p => {
      const matchingPromos = promotions.filter((promo: any) => {
        if (promo.status === 'Inactif') return false;
        if (promo.endDate && promo.endDate.toMillis && promo.endDate.toMillis() <= Date.now()) return false;

        if (promo.targetType === 'all') return true;
        if (promo.targetType === 'category' && promo.targetCategories?.includes(p.categoryId)) return true;
        if (promo.targetType === 'products' && promo.targetProducts?.includes(p.id)) return true;
        if (promo.productId === p.id) return true;
        return false;
      });

      if (matchingPromos.length > 0) {
        const activePromo = matchingPromos[0] as any;
        p.promoEndDate = activePromo.endDate;
        const discount = Number(activePromo.discountAmount) || 0;

        p.variants = p.variants.map(v => {
          if (discount > 0) {
            const promoPrice = Math.max(0, v.price - discount);
            return { ...v, isPromo: true, promoPrice, originalPrice: v.price };
          } else if (activePromo.variantStorage === v.storage && activePromo.discountPrice) {
            return { ...v, isPromo: true, promoPrice: activePromo.discountPrice, originalPrice: v.price };
          }
          return v;
        });
      }
      return p;
    });

    return {
      bannerList: bannerSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      categoryList: catSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      productList,
      promotions: promotions as Promotion[],
    };
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return { bannerList: [], categoryList: [], productList: [], promotions: [] as Promotion[] };
  }
}

/* ─── Scroll Reveal Hook ─────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal, .reveal-scale').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ─── Main Page ──────────────────────────────────── */
export default function Home() {
  const [banners, setBanners] = useState<DocumentData[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(6);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activePromo, setActivePromo] = useState<Promotion | null>(null);

  // Fast Checkout Drawer State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedCheckoutProduct, setSelectedCheckoutProduct] = useState<{
    name: string;
    price: string;
    storage: string;
    image?: string;
  }>({
    name: 'iPhone 17 Pro Max',
    price: '890 000',
    storage: '256 GB',
  });

  useScrollReveal();

  useEffect(() => {
    getHomePageData(24).then(d => {
      setBanners(d.bannerList);
      setProducts(d.productList);
      setCategories(d.categoryList);
      setActivePromo(d.promotions && d.promotions.length > 0 ? d.promotions[0] : null);
      setIsLoading(false);
    });
  }, []);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (searchTerm) list = list.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.keywords && p.keywords.join(' ').toLowerCase().includes(searchTerm.toLowerCase()))
    );
    if (selectedCategory !== 'all') list = list.filter(p => p.categoryId === selectedCategory);
    return list;
  }, [products, searchTerm, selectedCategory]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, displayCount);
  }, [filteredProducts, displayCount]);

  const getPriceInfo = useCallback((variants: Product['variants'] = []) => {
    if (!variants || !variants.length) return { price: '890 000', isPromo: false };
    
    let lowestVariant = variants[0];
    let minPrice = lowestVariant.promoPrice || lowestVariant.price;

    for (const v of variants) {
      const p = v.promoPrice || v.price;
      if (p > 0 && p < minPrice) {
        minPrice = p;
        lowestVariant = v;
      }
    }

    if (!minPrice) return { price: '890 000', isPromo: false };

    const info = {
      price: minPrice.toLocaleString('fr-FR'),
      isPromo: false,
      originalPrice: '',
      discount: ''
    };

    if (lowestVariant.isPromo && lowestVariant.originalPrice && lowestVariant.originalPrice > minPrice) {
      info.isPromo = true;
      info.originalPrice = lowestVariant.originalPrice.toLocaleString('fr-FR');
      info.discount = (lowestVariant.originalPrice - minPrice).toLocaleString('fr-FR');
    }

    return info;
  }, []);

  const handleOpenCheckout = (name: string, price: string, storage: string, image?: string) => {
    setSelectedCheckoutProduct({ name, price, storage, image });
    setIsCheckoutOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen relative bg-black text-foreground overflow-x-hidden">

      {/* ═══ AMBIENT BACKGROUND GLOW ORBS ═══ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="orb w-[700px] h-[700px] bg-amber-500/15"
          style={{ top: '-250px', right: '-200px', animation: 'floatYSlow 16s ease-in-out infinite' }}
        />
        <div
          className="orb w-[600px] h-[600px] bg-amber-600/10"
          style={{ bottom: '15%', left: '-250px', animation: 'floatYSlow 20s ease-in-out infinite reverse' }}
        />
      </div>

      {/* ═══ 1. HERO SECTION : 3D IPHONE + TYPOGRAPHY + MAGNETIC CTA ═══ */}
      <section className="relative z-10 pt-8 pb-16 md:pt-16 md:pb-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">

            {/* Apple Intelligence Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-extrabold uppercase tracking-widest animate-fadeInUp">
              <Sparkles className="w-3.5 h-3.5" />
              L'Excellence Khalil Apple au Sénégal
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-white">
              iPhone 17 Pro Max.<br />
              <span className="gold-text">Design Titane Absolu.</span>
            </h1>

            {/* Sub-description */}
            <p className="text-muted-foreground text-base md:text-xl max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Découvrez la toute nouvelle génération d'iPhones scellés et reconditionnés premium. Garantie 1 mois, livraison express en 24h et estimation IA instantanée.
            </p>

            {/* Interactive Magnetic CTA Button */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <MagneticButton
                onClick={() => handleOpenCheckout('iPhone 17 Pro Max', '890 000', '256 GB')}
                badge="LIVRAISON 24H"
              >
                Acheter Maintenant
              </MagneticButton>

              <Link
                href="/exchange"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-bold text-zinc-300 hover:text-white transition-all duration-300"
              >
                <RefreshCw className="w-4 h-4 text-amber-400" />
                Échanger mon Ancien iPhone
              </Link>
            </div>

            {/* Key Trust Signals */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-white/10 max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
              <div>
                <p className="text-lg md:text-xl font-extrabold text-amber-400">100%</p>
                <p className="text-[11px] text-zinc-400 uppercase font-semibold">Authentique</p>
              </div>
              <div>
                <p className="text-lg md:text-xl font-extrabold text-amber-400">1 Mois</p>
                <p className="text-[11px] text-zinc-400 uppercase font-semibold">Garantie</p>
              </div>
              <div>
                <p className="text-lg md:text-xl font-extrabold text-amber-400">24h</p>
                <p className="text-[11px] text-zinc-400 uppercase font-semibold">Livraison Dakar</p>
              </div>
            </div>
          </div>

          {/* Right 3D Interactive iPhone Model (Lazy Loaded) */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <IPhone3DViewer
              onBuyClick={() => handleOpenCheckout('iPhone 17 Pro Max', '890 000', '256 GB')}
            />
          </div>
        </div>
      </section>

      {/* ═══ 2. INFINITE MARQUEE REASSURANCE BANNER ═══ */}
      <section className="relative z-10 my-4">
        <MarqueeBanner />
      </section>

      {/* ═══ 3. APPLE DESIGN BENTO GRID ═══ */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-12 w-full">
        <BentoGridSection
          products={products}
          onQuickBuy={(name, price, storage) => handleOpenCheckout(name, price, storage)}
        />
      </section>

      {/* ═══ 4. PROMOTIONS & FLIP CLOCK SECTION ═══ */}
      {activePromo && (
        <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8 w-full">
          <FlipClockTimer 
            targetDate={activePromo.endDate?.toMillis ? activePromo.endDate.toMillis() : activePromo.endDate}
            label={activePromo.title || "OFFRE PROMOTIONNELLE EXCLUSIVE KHALIL APPLE"} 
          />
        </section>
      )}

      {/* ═══ 5. CATALOGUE FILTER & SEARCH SECTION ═══ */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-12 w-full space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="section-label">Catalogue Khalil Apple</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Tous nos <span className="gold-text">iPhones Disponibles</span>
            </h2>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="product-search"
              placeholder="Rechercher un modèle..."
              className="pl-11 h-12 rounded-full border-white/10 bg-zinc-900/90 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {[{ id: 'all', name: 'Tous les modèles' }, ...categories].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 whitespace-nowrap',
                selectedCategory === cat.id
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/10'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-3xl bg-zinc-900/60 animate-pulse border border-white/5" />
            ))
          ) : visibleProducts.length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-base font-semibold">Aucun iPhone ne correspond à votre recherche.</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
                className="mt-3 text-xs text-amber-400 hover:underline font-bold"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            visibleProducts.map((product) => (
              <div
                key={product.id}
                className="group relative rounded-3xl p-5 bg-zinc-950/80 border border-white/10 hover:border-amber-500/40 transition-all duration-500 flex items-center gap-4 overflow-hidden"
              >
                {/* Product Image */}
                <div className="relative w-24 h-28 rounded-2xl bg-zinc-900 flex-shrink-0 overflow-hidden">
                  <Image
                    src={product.thumbnail || 'https://res.cloudinary.com/dm6yuokre/image/upload/v1784658568/apple-iphone-17-pro-max-256-go-ecran-69-puce-a19-pro-orange-removebg-preview_vmy8i6.png'}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 96px, 96px"
                    className="object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>

                {/* Info */}
                <div className="flex-grow min-w-0 space-y-2">
                  <h3 className="font-extrabold text-base leading-tight truncate text-foreground group-hover:text-amber-300 transition-colors">
                    {product.name}
                  </h3>
                  {(() => {
                    const priceInfo = getPriceInfo(product.variants);
                    return (
                      <>
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1">
                            <span className="text-amber-400 font-extrabold text-xl">{priceInfo.price}</span>
                            <span className="text-xs font-bold text-zinc-400">CFA</span>
                          </div>
                          {priceInfo.isPromo && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-zinc-500 line-through">
                                {priceInfo.originalPrice} CFA
                              </span>
                              <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                                - {priceInfo.discount} CFA
                              </span>
                            </div>
                          )}
                        </div>
      
                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleOpenCheckout(product.name, priceInfo.price, '256 GB', product.thumbnail)}
                            className="px-3.5 py-1.5 rounded-full bg-amber-400 text-black hover:bg-amber-300 font-bold text-[11px] uppercase tracking-wider transition-colors"
                          >
                            Achat 1-Clic
                          </button>
                          <Link
                            href={`/products/${product.slug}`}
                            className="text-xs text-zinc-400 hover:text-white font-semibold flex items-center"
                          >
                            Fiche <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button (Lazy Load Pagination) */}
        {filteredProducts.length > visibleProducts.length && (
          <div className="text-center pt-6">
            <Button
              onClick={() => setDisplayCount(prev => prev + 6)}
              variant="outline"
              className="rounded-full px-8 py-6 border-white/20 hover:border-amber-400 text-amber-400 hover:text-amber-300 bg-zinc-900/80 font-bold text-sm"
            >
              Charger plus de modèles ({filteredProducts.length - visibleProducts.length} restants)
            </Button>
          </div>
        )}
      </section>

      {/* ═══ FAST CHECKOUT GLASSMORPHISM DRAWER (Lazy Loaded) ═══ */}
      <FastCheckoutDrawer
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        productName={selectedCheckoutProduct.name}
        price={selectedCheckoutProduct.price}
        storage={selectedCheckoutProduct.storage}
        image={selectedCheckoutProduct.image}
      />

    </div>
  );
}
