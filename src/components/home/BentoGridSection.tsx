'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Cpu, HardDrive, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface BentoGridSectionProps {
  products?: Product[];
  onQuickBuy?: (productName: string, price: string, storage: string) => void;
}

export function BentoGridSection({ products = [], onQuickBuy }: BentoGridSectionProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Mouse position inside active card for interactive liquid gradient
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const tradeInCard = {
    id: 'trade-in-ai',
    title: 'Programme Échange IA',
    subtitle: 'Faites estimer et revendez votre ancien iPhone au meilleur prix',
    price: 'Estimation Instantanée',
    storageOptions: ['Tous modèles acceptés'],
    condition: 'Service Gratuit 7j/7',
    badge: 'IA Exclusif',
    badgeColor: 'bg-gradient-to-r from-amber-400 to-yellow-200 text-black font-extrabold',
    isTradeIn: true,
    gridSpan: 'md:col-span-6 lg:col-span-6',
    accentColor: 'rgba(245, 215, 142, 0.25)',
  };

  const bentoLayouts = [
    {
      gridSpan: 'md:col-span-8 lg:col-span-8 md:row-span-2',
      badgeColor: 'bg-amber-400 text-black',
      accentColor: 'rgba(234, 179, 8, 0.18)',
      badge: 'Flagship',
    },
    {
      gridSpan: 'md:col-span-4 lg:col-span-4',
      badgeColor: 'bg-zinc-800 text-amber-300 border border-amber-500/30',
      accentColor: 'rgba(217, 119, 6, 0.18)',
      badge: 'Best-Seller',
    },
    {
      gridSpan: 'md:col-span-4 lg:col-span-4',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
      accentColor: 'rgba(16, 185, 129, 0.15)',
      badge: 'Offre Spéciale',
    },
    {
      gridSpan: 'md:col-span-6 lg:col-span-6',
      badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/40',
      accentColor: 'rgba(56, 189, 248, 0.15)',
      badge: 'Nouveauté',
    }
  ];

  const dynamicBentoItems = products.slice(0, 4).map((product, index) => {
    const layout = bentoLayouts[index];
    let minPrice = 0;
    let isPromo = false;
    let originalPrice = '';
    let discount = '';

    if (product.variants?.length) {
       const lowestVariant = product.variants.reduce((prev, curr) => {
           const pPrev = prev.promoPrice || prev.price;
           const pCurr = curr.promoPrice || curr.price;
           return (pPrev > 0 && pPrev < pCurr) ? prev : curr;
       }, product.variants[0]);
       
       minPrice = lowestVariant.promoPrice || lowestVariant.price;
       
       if (lowestVariant.isPromo && lowestVariant.originalPrice && lowestVariant.originalPrice > minPrice) {
          isPromo = true;
          originalPrice = lowestVariant.originalPrice.toLocaleString('fr-FR');
          discount = (lowestVariant.originalPrice - minPrice).toLocaleString('fr-FR');
       }
    }

    return {
      id: product.id,
      slug: product.slug,
      title: product.name,
      subtitle: product.categoryName || 'Design premium & performances inédites',
      price: minPrice ? minPrice.toLocaleString('fr-FR') : '890 000',
      isPromo,
      originalPrice,
      discount,
      storageOptions: product.variants?.map(v => v.storage).slice(0, 3) || [],
      condition: 'Premium',
      badge: layout.badge,
      badgeColor: layout.badgeColor,
      image: product.thumbnail || 'https://res.cloudinary.com/dm6yuokre/image/upload/v1784658568/apple-iphone-17-pro-max-256-go-ecran-69-puce-a19-pro-orange-removebg-preview_vmy8i6.png',
      gridSpan: layout.gridSpan,
      accentColor: layout.accentColor,
      isTradeIn: false,
    };
  });

  const bentoItems = [...dynamicBentoItems, tradeInCard];

  return (
    <section className="relative space-y-10 py-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold uppercase tracking-widest text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            Apple Design Bento Grid
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            La Gamme <span className="gold-text">iPhone 2026</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl">
            Découvrez nos modèles certifiés scellés ou reconditionnés avec garantie 1 mois.
          </p>
        </div>

        <Link
          href="/products"
          className="inline-flex items-center gap-2 font-semibold text-amber-400 hover:text-amber-300 transition-colors group text-sm"
        >
          Explorer tout le catalogue
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {bentoItems.map((item) => {
          const isHovered = hoveredCard === item.id;
          return (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredCard(item.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onMouseMove={handleMouseMove}
              className={cn(
                'bento-card group rounded-3xl p-6 md:p-8 bg-zinc-950/80 backdrop-blur-xl border border-white/10 flex flex-col justify-between overflow-hidden relative min-h-[340px]',
                item.gridSpan
              )}
            >
              {/* Dynamic Interactive Liquid Gradient following cursor */}
              {isHovered && (
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-0"
                  style={{
                    background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, ${item.accentColor}, transparent 60%)`,
                  }}
                />
              )}

              {/* Background Ambient Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Top Badge & Condition */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className={cn('px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider', item.badgeColor)}>
                  {item.badge}
                </span>

                <span className="inline-flex items-center gap-1 text-xs text-zinc-400 font-medium bg-black/40 px-3 py-1 rounded-full border border-white/5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  {item.condition}
                </span>
              </div>

              {/* Central Phone Image or Content */}
              {item.isTradeIn ? (
                <div className="relative z-10 my-auto py-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                    <Cpu className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-foreground">{item.title}</h3>
                  <p className="text-muted-foreground text-sm max-w-md">{item.subtitle}</p>
                </div>
              ) : (
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 items-center my-4">
                  {/* Text details */}
                  <div className="space-y-3">
                    <h3 className="text-2xl md:text-4xl font-extrabold text-foreground group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs md:text-sm text-zinc-400 line-clamp-2">{item.subtitle}</p>

                    {/* Storage Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.storageOptions.map((stg) => (
                        <span
                          key={stg}
                          className="px-2.5 py-0.5 rounded-md bg-white/5 text-[11px] font-mono text-zinc-300 border border-white/10"
                        >
                          {stg}
                        </span>
                      ))}
                    </div>

                    {/* Price */}
                    <div className="pt-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl md:text-3xl font-black text-amber-400">{item.price}</span>
                        {item.price !== 'Estimation Instantanée' && <span className="text-xs font-bold text-zinc-400">CFA</span>}
                      </div>
                      {item.isPromo && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-zinc-500 line-through">
                            {item.originalPrice} CFA
                          </span>
                          <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                            - {item.discount} CFA
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Phone Image Showcase Box */}
                  {item.image && (
                    <div className="relative w-full h-48 md:h-60 rounded-2xl bg-gradient-to-b from-white/10 via-white/5 to-transparent border border-white/10 p-3 flex items-center justify-center shadow-inner overflow-hidden group-hover:border-amber-400/30 transition-all duration-500">
                      {/* Inner studio glow */}
                      <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 to-transparent pointer-events-none" />
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-contain p-3 transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-translate-y-1 drop-shadow-[0_15px_25px_rgba(0,0,0,0.5)]"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Action Footer */}
              <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between">
                {item.isTradeIn ? (
                  <Link
                    href="/exchange"
                    className="btn-gold rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2"
                  >
                    Estimer mon iPhone avec IA
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => onQuickBuy?.(item.title, item.price, item.storageOptions[0])}
                      className="px-5 py-2.5 rounded-full bg-amber-400 text-black hover:bg-amber-300 font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 shadow-lg shadow-amber-400/20"
                    >
                      <Zap className="w-3.5 h-3.5 fill-black" />
                      Achat Rapide
                    </button>

                    <Link
                      href={`/products?search=${encodeURIComponent(item.title)}`}
                      className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      Détails <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
