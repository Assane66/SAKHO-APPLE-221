// src/app/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, Clock, ChevronRight, Shield, Zap, Sparkles, Star, ArrowRight, CheckCircle2, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, DocumentData, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import type { Product } from '@/types';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';

import dynamic from 'next/dynamic';
import { MagneticButton } from '@/components/ui/MagneticButton';
const IPhone3DViewer = dynamic(() => import('@/components/3d/IPhone3DViewer').then(mod => mod.IPhone3DViewer), { ssr: false, loading: () => <div className="w-full h-full min-h-[400px] flex items-center justify-center"><div className="animate-pulse bg-zinc-900/50 rounded-full w-64 h-64 border border-white/5" /></div> });
import { BentoGridSection } from '@/components/home/BentoGridSection';
import { MarqueeBanner } from '@/components/home/MarqueeBanner';
import { FlipClockTimer } from '@/components/home/FlipClockTimer';
import { FastCheckoutDrawer } from '@/components/checkout/FastCheckoutDrawer';
import { cn } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/image-optimizer';
import { getCachedHomePageData, setCachedHomePageData } from '@/lib/product-cache';

/* ─── Data fetching ──────────────────────────────── */
async function getHomePageData() {
  try {
    const [bannerSnap, catSnap, prodSnap, promoSnap, settingsSnap] = await Promise.all([
      getDocs(query(collection(db, 'banners'), where('status', '==', 'Actif'))),
      getDocs(query(collection(db, 'categories'), orderBy('name', 'asc'))),
      getDocs(collection(db, 'products')),
      getDocs(query(collection(db, 'promotions'), where('endDate', '>', Timestamp.now()))),
      getDoc(doc(db, 'settings', 'general')),
    ]);

    const settings = settingsSnap.exists() ? settingsSnap.data() : {};

    const promotions = promoSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    let productList = prodSnap.docs
      .map(d => ({ id: d.id, ...d.data() } as Product))
      .filter(p => p.status === 'active' || (p.status as string) === 'Actif');

    productList = productList.map(p => {
      const matchingPromos = promotions.filter(promo => {
        if (promo.status === 'Inactif') return false;
        if (promo.endDate && promo.endDate.toMillis && promo.endDate.toMillis() <= Date.now()) return false;

        if (promo.targetType === 'all') return true;
        if (promo.targetType === 'category' && promo.targetCategories?.includes(p.categoryId)) return true;
        if (promo.targetType === 'products' && promo.targetProducts?.includes(p.id)) return true;
        if (promo.productId === p.id) return true;
        return false;
      });

      if (matchingPromos.length > 0) {
        const activePromo = matchingPromos[0];
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

    const bannerList = bannerSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const categoryList = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const activePromo = promotions.length > 0 ? promotions[0] : null;
    const contactPhone = settings.contactPhone || '221770000000';

    const result = {
      bannerList,
      categoryList,
      productList,
      activePromo,
      contactPhone,
    };

    // Mettre en cache pour affichage instantané (0 ms)
    setCachedHomePageData(result);

    return result;
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return { bannerList: [], categoryList: [], productList: [], activePromo: null, contactPhone: '221770000000' };
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
  const [activePromo, setActivePromo] = useState<DocumentData | null>(null);
  const [contactPhone, setContactPhone] = useState('221770000000');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [visibleCount, setVisibleCount] = useState(6);

  // Fast Checkout Drawer State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedCheckoutProduct, setSelectedCheckoutProduct] = useState<{
    name: string;
    price: string;
    storage: string;
    image?: string;
    variants?: any[];
  }>({
    name: 'iPhone 17 Pro Max',
    price: '890 000',
    storage: '256 GB',
  });

  useScrollReveal();

  useEffect(() => {
    // 1. Affichage immédiat depuis le cache local (0 ms)
    const cached = getCachedHomePageData();
    if (cached && cached.productList && cached.productList.length > 0) {
      setBanners(cached.bannerList || []);
      setCategories(cached.categoryList || []);
      setProducts(cached.productList || []);
      setActivePromo(cached.activePromo || null);
      setContactPhone(cached.contactPhone || '221770000000');
      setIsLoading(false);
    }

    // 2. Synchronisation transparente en arrière-plan
    const fetchData = async () => {
      const data = await getHomePageData();
      setBanners(data.bannerList);
      setCategories(data.categoryList);
      setProducts(data.productList);
      setActivePromo(data.activePromo);
      setContactPhone(data.contactPhone);
      setIsLoading(false);
    };
    fetchData();
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

  const getLowestPrice = useCallback((variants: Product['variants'] = []) => {
    const prices = variants.map(v => v.promoPrice || v.price).filter(p => p > 0);
    if (!prices.length) return '890 000';
    return Math.min(...prices).toLocaleString('fr-FR');
  }, []);

  const getPromoDetails = useCallback((variants: Product['variants'] = []) => {
      if (!variants) return null;
      const promoVariant = variants.find(v => v.isPromo && v.promoPrice && v.originalPrice);
      if (!promoVariant || !promoVariant.originalPrice || !promoVariant.promoPrice) return null;

      const discountPercentage = Math.round(((promoVariant.originalPrice - promoVariant.promoPrice) / promoVariant.originalPrice) * 100);
      return {
        promoPrice: promoVariant.promoPrice.toLocaleString('fr-FR'),
        originalPrice: promoVariant.originalPrice.toLocaleString('fr-FR'),
        discountPercentage
      };
  }, []);

  const handleOpenCheckout = (name: string, price: string, storage: string, image?: string, variants?: any[]) => {
    setSelectedCheckoutProduct({ name, price, storage, image, variants });
    setIsCheckoutOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen relative bg-black text-foreground overflow-x-hidden">

      {/* ═══ LUXURY AMBIENT BACKGROUND GLOW ORBS ═══ */}
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

          {/* Right 3D Interactive iPhone Model */}
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
          onQuickBuy={(name, price, storage, variants) => handleOpenCheckout(name, price, storage, undefined, variants)}
        />
      </section>

      {/* ═══ 4. VENTE FLASH & FLIP CLOCK SECTION ═══ */}
      {activePromo && (
        <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8 w-full">
          {(() => {
            const promoTitle = activePromo.title || "OFFRE FLASH EXCLUSIVE";
            const promoDiscount = activePromo.discountAmount ? `- ${activePromo.discountAmount} CFA` : 'Réductions exceptionnelles';
            const promoTargetText = activePromo.targetType === 'all' ? 'sur tous nos produits' : 'sur notre sélection';
            const promoSubtitle = `${promoDiscount} ${promoTargetText}`;
            const promoEndDate = activePromo.endDate ? (typeof activePromo.endDate.toMillis === 'function' ? activePromo.endDate.toMillis() : new Date(activePromo.endDate).getTime()) : undefined;

            return (
              <FlipClockTimer title={promoTitle} subtitle={promoSubtitle} targetDate={promoEndDate} />
            );
          })()}
        </section>
      )}

      {/* ═══ 5. CATALOGUE FILTER & SEARCH SECTION ═══ */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-12 w-full space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="section-label">Catalogue Khalil</span>
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
        <div className="flex flex-wrap gap-2 pb-2">
          {[{ id: 'all', name: 'Tous les modèles' }, ...categories].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'px-5 py-2 rounded-full text-xs font-bold transition-all duration-300 flex-shrink-0',
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
          ) : filteredProducts.length === 0 ? (
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
            <>
              {filteredProducts.slice(0, visibleCount).map((product, idx) => (
                <div
                  key={product.id}
                  className="group relative rounded-3xl p-5 bg-zinc-950/80 border border-white/10 hover:border-amber-500/40 transition-all duration-500 flex items-center gap-4 overflow-hidden"
                >
                  {/* Product Image */}
                  <div className="relative w-24 h-28 rounded-2xl bg-zinc-900 flex-shrink-0 overflow-hidden">
                    <Image
                      src={getOptimizedImageUrl(product.thumbnail, 300)}
                      alt={product.name}
                      fill
                      priority={idx < 4}
                      loading={idx < 4 ? undefined : "lazy"}
                      decoding="async"
                      sizes="(max-width: 768px) 100px, 120px"
                      className="object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-grow min-w-0 space-y-2">
                    <h3 className="font-extrabold text-base leading-tight truncate text-foreground group-hover:text-amber-300 transition-colors">
                      {product.name}
                    </h3>
                    
                    {(() => {
                      const promoDetails = getPromoDetails(product.variants);
                      return promoDetails ? (
                        <div className="flex flex-col">
                           <div className="flex items-baseline gap-1">
                             <span className="text-amber-400 font-extrabold text-xl">{promoDetails.promoPrice}</span>
                             <span className="text-xs font-bold text-zinc-400">CFA</span>
                           </div>
                           <span className="text-xs font-bold text-zinc-500 line-through">{promoDetails.originalPrice} CFA</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-amber-400 font-extrabold text-xl">{getLowestPrice(product.variants)}</span>
                          <span className="text-xs font-bold text-zinc-400">CFA</span>
                        </div>
                      );
                    })()}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleOpenCheckout(product.name, getLowestPrice(product.variants), product.variants[0]?.storage || '256 GB', product.thumbnail, product.variants)}
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
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Load More Button */}
        {filteredProducts.length > visibleCount && (
          <div className="flex justify-center pt-6 pb-2">
            <Button
              onClick={() => setVisibleCount(prev => prev + 6)}
              variant="outline"
              className="rounded-full px-8 py-6 border-white/10 bg-zinc-900/50 hover:bg-white/10 font-bold"
            >
              Afficher plus de modèles
            </Button>
          </div>
        )}
      </section>

      {/* ═══ FAST CHECKOUT GLASSMORPHISM DRAWER ═══ */}
      <FastCheckoutDrawer
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        productName={selectedCheckoutProduct.name}
        price={selectedCheckoutProduct.price}
        storage={selectedCheckoutProduct.storage}
        image={selectedCheckoutProduct.image}
        whatsappNumber={contactPhone}
        variants={selectedCheckoutProduct.variants}
      />

    </div>
  );
}
