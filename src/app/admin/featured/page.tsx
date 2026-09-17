// src/app/admin/featured/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import type { Product, FeaturedSlots } from '@/types';
import {
  Sparkles,
  Save,
  Crown,
  Flame,
  Star,
  Zap,
  RotateCcw,
  ExternalLink,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Package
} from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/image-optimizer';

interface SlotDefinition {
  key: keyof FeaturedSlots;
  title: string;
  badge: string;
  badgeClass: string;
  borderClass: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  gridHint: string;
}

const SLOTS: SlotDefinition[] = [
  {
    key: 'flagshipId',
    title: 'Flagship Principal',
    badge: 'Flagship',
    badgeClass: 'bg-amber-400 text-black font-extrabold shadow-sm',
    borderClass: 'border-amber-500/40 hover:border-amber-400',
    icon: Crown,
    description: 'Grande carte principale à gauche. Le modèle superstar et le plus haut de gamme.',
    gridHint: 'Emplacement 1 (Grande carte)',
  },
  {
    key: 'bestSellerId',
    title: 'Best-Seller',
    badge: 'Best-Seller',
    badgeClass: 'bg-zinc-800 text-amber-300 border border-amber-500/40 font-bold',
    borderClass: 'border-amber-500/30 hover:border-amber-400/70',
    icon: Star,
    description: 'Carte en haut à droite. Le modèle le plus demandé ou recommandé aux acheteurs.',
    gridHint: 'Emplacement 2 (Haut droite)',
  },
  {
    key: 'specialOfferId',
    title: 'Offre Spéciale',
    badge: 'Offre Spéciale',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold',
    borderClass: 'border-emerald-500/30 hover:border-emerald-400/70',
    icon: Flame,
    description: 'Carte au milieu à droite. La meilleure promo, réduction ou opportunité du moment.',
    gridHint: 'Emplacement 3 (Milieu droite)',
  },
  {
    key: 'newArrivalId',
    title: 'Nouveauté',
    badge: 'Nouveauté',
    badgeClass: 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold',
    borderClass: 'border-sky-500/30 hover:border-sky-400/70',
    icon: Zap,
    description: 'Carte en bas à gauche. Le dernier arrivage ou la dernière version disponible.',
    gridHint: 'Emplacement 4 (Bas gauche)',
  },
];

export default function FeaturedAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredSlots, setFeaturedSlots] = useState<FeaturedSlots>({
    flagshipId: '',
    bestSellerId: '',
    specialOfferId: '',
    newArrivalId: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Charger tous les produits
        const prodSnap = await getDocs(collection(db, 'products'));
        const loadedProducts: Product[] = prodSnap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Product)
        );
        // Trier par nom
        loadedProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setProducts(loadedProducts);

        // Charger la configuration actuelle depuis settings/general
        const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          if (data.featuredSlots) {
            setFeaturedSlots({
              flagshipId: data.featuredSlots.flagshipId || '',
              bestSellerId: data.featuredSlots.bestSellerId || '',
              specialOfferId: data.featuredSlots.specialOfferId || '',
              newArrivalId: data.featuredSlots.newArrivalId || '',
            });
          }
        }
      } catch (error) {
        console.error('Erreur chargement données mises en avant:', error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de charger la configuration des mises en avant.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleSlotChange = (key: keyof FeaturedSlots, value: string) => {
    setFeaturedSlots((prev) => ({
      ...prev,
      [key]: value === 'auto' ? '' : value,
    }));
  };

  const handleResetAll = () => {
    setFeaturedSlots({
      flagshipId: '',
      bestSellerId: '',
      specialOfferId: '',
      newArrivalId: '',
    });
    toast({
      title: 'Réinitialisé',
      description: 'Toutes les cases sont désormais en mode Automatique.',
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settingsRef = doc(db, 'settings', 'general');
      await setDoc(
        settingsRef,
        {
          featuredSlots: {
            flagshipId: featuredSlots.flagshipId || null,
            bestSellerId: featuredSlots.bestSellerId || null,
            specialOfferId: featuredSlots.specialOfferId || null,
            newArrivalId: featuredSlots.newArrivalId || null,
          },
        },
        { merge: true }
      );

      toast({
        title: 'Mises en avant enregistrées !',
        description: 'La page d’accueil a été mise à jour avec vos sélections.',
      });
    } catch (error) {
      console.error('Erreur enregistrement mises en avant:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de sauvegarder vos modifications.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getProductPrice = (p?: Product) => {
    if (!p) return '—';
    if (p.variants && p.variants.length > 0) {
      const min = Math.min(...p.variants.map((v) => v.promoPrice || v.price));
      return `${min.toLocaleString('fr-FR')} CFA`;
    }
    return p.unitPrice ? `${p.unitPrice.toLocaleString('fr-FR')} CFA` : 'Prix à définir';
  };

  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Page d'accueil Bento Grid
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Gestion des <span className="text-amber-400">Mises en Avant</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Sélectionnez directement les iPhones qui apparaîtront dans les 4 cases vedettes de la page d'accueil :
            <strong> Flagship</strong>, <strong>Best-Seller</strong>, <strong>Offre Spéciale</strong> et <strong>Nouveauté</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetAll}
            className="border-white/10 hover:bg-white/5 text-xs flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Tout en Automatique
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs flex items-center gap-1.5"
          >
            <Link href="/" target="_blank">
              <ExternalLink className="w-3.5 h-3.5" />
              Voir le site en direct
            </Link>
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-2 px-5 shadow-lg shadow-amber-400/20"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Grid of the 4 Bento Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {SLOTS.map((slot) => {
          const selectedId = featuredSlots[slot.key];
          const selectedProduct = products.find((p) => p.id === selectedId);
          const Icon = slot.icon;

          return (
            <Card
              key={slot.key}
              className={`bg-zinc-950/70 border backdrop-blur-xl transition-all duration-300 ${slot.borderClass} relative overflow-hidden`}
            >
              {/* Header card */}
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-amber-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        {slot.title}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${slot.badgeClass}`}>
                          {slot.badge}
                        </span>
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-0.5">
                        {slot.gridHint}
                      </CardDescription>
                    </div>
                  </div>

                  {selectedProduct && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Personnalisé
                    </span>
                  )}
                  {!selectedProduct && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-full">
                      Automatique
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 pt-2">{slot.description}</p>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* Select dropdown */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-300">
                    Choisir l'iPhone pour cet emplacement :
                  </Label>
                  <Select
                    value={selectedId || 'auto'}
                    onValueChange={(val) => handleSlotChange(slot.key, val)}
                  >
                    <SelectTrigger className="w-full bg-zinc-900 border-white/10 focus:ring-amber-400">
                      <SelectValue placeholder="Sélectionner un iPhone..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="auto" className="font-semibold text-amber-400">
                        ✨ Automatique (Sélection intelligente selon stock/badge)
                      </SelectItem>
                      {products.map((prod) => (
                        <SelectItem key={prod.id} value={prod.id} className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span>{prod.name}</span>
                            <span className="text-xs text-zinc-400">
                              ({getProductPrice(prod)})
                            </span>
                            {prod.customBadge && (
                              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1 rounded">
                                {prod.customBadge}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Live Preview Box */}
                <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/5 space-y-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                    Aperçu sur la page d'accueil
                  </span>

                  {selectedProduct ? (
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-xl bg-black/50 border border-white/10 flex-shrink-0 overflow-hidden flex items-center justify-center p-1">
                        {selectedProduct.thumbnail ? (
                          <Image
                            src={getOptimizedImageUrl(selectedProduct.thumbnail, 150)}
                            alt={selectedProduct.name}
                            fill
                            className="object-contain p-1"
                          />
                        ) : (
                          <Package className="w-6 h-6 text-zinc-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm truncate text-white">
                            {selectedProduct.name}
                          </h4>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${slot.badgeClass}`}>
                            {slot.badge}
                          </span>
                        </div>
                        <p className="text-xs text-amber-400 font-extrabold mt-0.5">
                          {getProductPrice(selectedProduct)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-zinc-400">
                            {selectedProduct.variants?.length || 0} déclinaison(s)
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-amber-400" />
                            {selectedProduct.isVenant ? 'Venant' : (selectedProduct.isSecondHand ? '2ème main' : 'En stock')}
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSlotChange(slot.key, 'auto')}
                        className="text-xs text-zinc-400 hover:text-red-400 h-8 px-2"
                      >
                        Retirer
                      </Button>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-zinc-500">
                      Mode automatique activé. Le site choisira le modèle le plus pertinent
                      (ex: un produit avec le badge "{slot.badge}" ou les meilleures ventes).
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Floating Save Footer for fast access */}
      <div className="sticky bottom-6 z-30 p-4 rounded-2xl bg-zinc-950/90 border border-amber-500/30 backdrop-blur-xl shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>
            N'oubliez pas d'enregistrer vos choix pour qu'ils s'affichent sur la page d'accueil.
          </span>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-amber-400/20"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              Sauvegarde en cours...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1.5" />
              Sauvegarder les 4 sélections
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
