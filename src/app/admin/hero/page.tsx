// src/app/admin/hero/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import type { Product, HeroConfig } from '@/types';
import {
  Sparkles,
  Save,
  RotateCcw,
  ExternalLink,
  Loader2,
  UploadCloud,
  Box,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  ShoppingBag,
  Zap,
  Info
} from 'lucide-react';

const IPhone3DViewer = dynamic(
  () => import('@/components/3d/IPhone3DViewer').then(mod => mod.IPhone3DViewer),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" />
      </div>
    )
  }
);

const CLOUDINARY_CLOUD_NAME = 'dm6yuokre';
const CLOUDINARY_UPLOAD_PRESET = 'khalil_apple';

const DEFAULT_HERO_CONFIG: HeroConfig = {
  badge: "L'Excellence Khalil Apple au Sénégal",
  title: "iPhone 17 Pro Max.",
  subtitle: "Design Titane Absolu.",
  description: "Découvrez la toute nouvelle génération d'iPhones scellés et reconditionnés premium. Garantie 1 mois, livraison express en 24h et estimation IA instantanée.",
  productId: '',
  buttonText: "Acheter Maintenant",
  buttonPrice: "890 000",
  buttonStorage: "256 GB",
  mediaType: '3d',
  modelUrl: "https://res.cloudinary.com/dm6yuokre/image/upload/v1785360868/iphone_17_pro_max_1_vznyvo.glb",
  imageUrl: "https://res.cloudinary.com/dm6yuokre/image/upload/v1784658568/apple-iphone-17-pro-max-256-go-ecran-69-puce-a19-pro-orange-removebg-preview_vmy8i6.png",
  stat1Value: "100%",
  stat1Label: "Authentique",
  stat2Value: "1 Mois",
  stat2Label: "Garantie",
  stat3Value: "24h",
  stat3Label: "Livraison Dakar",
};

export default function AdminHeroPage() {
  const [config, setConfig] = useState<HeroConfig>(DEFAULT_HERO_CONFIG);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTarget, setUploadTarget] = useState<'3d' | 'image'>('3d');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  // Chargement des produits et de la configuration actuelle
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [prodSnap, settingsSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDoc(doc(db, 'settings', 'general')),
        ]);

        const loadedProducts: Product[] = prodSnap.docs.map(
          d => ({ id: d.id, ...d.data() } as Product)
        );
        loadedProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setProducts(loadedProducts);

        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          if (data.heroConfig) {
            setConfig({
              ...DEFAULT_HERO_CONFIG,
              ...data.heroConfig,
            });
          }
        }
      } catch (error) {
        console.error('Erreur chargement Hero settings:', error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de charger la configuration de la vitrine Hero.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Préremplissage automatique lors de la sélection d'un produit
  const handleProductSelect = (productId: string) => {
    const selected = products.find(p => p.id === productId);
    if (!selected) {
      setConfig(prev => ({ ...prev, productId: '' }));
      return;
    }

    const lowestPrice = selected.variants?.length
      ? Math.min(...selected.variants.map(v => v.promoPrice || v.price)).toLocaleString('fr-FR')
      : config.buttonPrice;

    const firstStorage = selected.variants?.[0]?.storage || '128 GB';

    setConfig(prev => ({
      ...prev,
      productId: selected.id,
      title: `${selected.name}.`,
      buttonPrice: lowestPrice || prev.buttonPrice,
      buttonStorage: firstStorage,
      imageUrl: selected.thumbnail || prev.imageUrl,
    }));

    toast({
      title: 'Produit lié',
      description: `Le produit "${selected.name}" a prérempli les informations du Hero.`,
    });
  };

  // Gestion de l'upload Cloudinary (support 3D .glb / .gltf et images .png, .jpg, .webp)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const xhr = new XMLHttpRequest();
      // On utilise l'endpoint /auto/upload pour accepter indifféremment 3D raw (.glb) et images
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          const uploadedUrl = response.secure_url;

          if (uploadTarget === '3d') {
            setConfig(prev => ({
              ...prev,
              modelUrl: uploadedUrl,
              mediaType: '3d',
            }));
            toast({
              title: 'Modèle 3D téléversé !',
              description: 'Le fichier 3D a été envoyé sur Cloudinary et configuré.',
            });
          } else {
            setConfig(prev => ({
              ...prev,
              imageUrl: uploadedUrl,
              mediaType: 'image',
            }));
            toast({
              title: 'Image téléversée !',
              description: 'L\'image a été envoyée sur Cloudinary et configurée.',
            });
          }
        } else {
          throw new Error(`Upload échoué: HTTP ${xhr.status}`);
        }
        setIsUploading(false);
      };

      xhr.onerror = () => {
        setIsUploading(false);
        toast({
          variant: 'destructive',
          title: 'Erreur téléversement',
          description: "Échec de l'envoi sur Cloudinary. Vérifiez votre connexion.",
        });
      };

      xhr.send(formData);
    } catch (err) {
      setIsUploading(false);
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible d'initier le téléversement.",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Déclencher l'upload
  const triggerUpload = (target: '3d' | 'image') => {
    setUploadTarget(target);
    fileInputRef.current?.click();
  };

  // Enregistrement dans Firestore
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settingsRef = doc(db, 'settings', 'general');
      await setDoc(settingsRef, { heroConfig: config }, { merge: true });

      // Invalider le cache local pour actualisation immédiate
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('khalil_apple_home_cache');
        } catch {
          // ignore
        }
      }

      toast({
        title: 'Vitrine Hero mise à jour !',
        description: 'Les modifications sont maintenant en ligne sur la page d\'accueil.',
      });
    } catch (error) {
      console.error('Erreur sauvegarde Hero:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: "Impossible d'enregistrer les paramètres du Hero.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Réinitialiser aux valeurs d'origine
  const handleResetDefaults = () => {
    setConfig(DEFAULT_HERO_CONFIG);
    toast({
      title: 'Valeurs par défaut restaurées',
      description: 'Cliquez sur "Enregistrer les modifications" pour valider.',
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-zinc-400 text-sm">Chargement des paramètres de la vitrine Hero...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* ── Entête & Actions Supérieures ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Vitrine Principale & Objet 3D
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Configuration du Hero & Objet 3D
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Modifiez le titre vedette (ex: iPhone 17 Pro Max ou iPhone 18), le sous-titre doré, le produit sélectionné ainsi que le modèle 3D ou l'image Cloudinary.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Voir l'accueil
          </Link>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold shadow-lg shadow-amber-500/20"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Input de fichier caché pour Cloudinary */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept={uploadTarget === '3d' ? '.glb,.gltf' : 'image/*'}
      />

      {/* ── Grille Principale : Formulaire à Gauche / Live Preview à Droite ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Colonne Formulaire (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. Rattachement à un Produit du Catalogue */}
          <Card className="border-border/60 bg-zinc-950/80 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                1. Lier à un Produit du Catalogue (Optionnel)
              </CardTitle>
              <CardDescription className="text-xs">
                Sélectionnez un iPhone existant pour synchroniser le bouton "Acheter Maintenant" avec son stock et son tiroir de commande rapide.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="product-select" className="text-xs text-zinc-300">
                  Produit Phare Associé
                </Label>
                <Select
                  value={config.productId || 'none'}
                  onValueChange={(val) => handleProductSelect(val === 'none' ? '' : val)}
                >
                  <SelectTrigger id="product-select" className="mt-1.5 bg-zinc-900 border-zinc-800">
                    <SelectValue placeholder="-- Aucun (Personnalisé) --" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 max-h-64">
                    <SelectItem value="none">-- Aucun (Texte et prix libres) --</SelectItem>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.variants?.[0]?.price ? `${p.variants[0].price.toLocaleString('fr-FR')} CFA` : 'Prix libre'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {config.productId && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                  <span>Produit lié : <strong>{products.find(p => p.id === config.productId)?.name}</strong></span>
                  <button
                    type="button"
                    onClick={() => handleProductSelect(config.productId!)}
                    className="text-[11px] underline font-bold hover:text-white"
                  >
                    Réappliquer les infos produit
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Textes & Typographie du Hero */}
          <Card className="border-border/60 bg-zinc-950/80 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                <Sparkles className="w-4 h-4 text-amber-400" />
                2. Textes & Titres Vedettes
              </CardTitle>
              <CardDescription className="text-xs">
                Définissez exactement ce qui s'affiche sur la page d'accueil (titre, sous-titre doré, etc.).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Badge supérieur */}
              <div>
                <Label htmlFor="badge-input" className="text-xs text-zinc-300">
                  Badge Supérieur
                </Label>
                <Input
                  id="badge-input"
                  value={config.badge || ''}
                  onChange={(e) => setConfig({ ...config, badge: e.target.value })}
                  placeholder="L'Excellence Khalil Apple au Sénégal"
                  className="mt-1 bg-zinc-900 border-zinc-800"
                />
              </div>

              {/* Titre Principal (Ligne 1) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title-input" className="text-xs text-zinc-300">
                    Titre Principal (Ligne 1)
                  </Label>
                  <Input
                    id="title-input"
                    value={config.title || ''}
                    onChange={(e) => setConfig({ ...config, title: e.target.value })}
                    placeholder="iPhone 17 Pro Max."
                    className="mt-1 bg-zinc-900 border-zinc-800 font-bold"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">Ex: iPhone 17 Pro Max. ou iPhone 18.</p>
                </div>

                {/* Sous-titre Doré (Ligne 2) */}
                <div>
                  <Label htmlFor="subtitle-input" className="text-xs text-amber-300">
                    Sous-titre Doré (Ligne 2)
                  </Label>
                  <Input
                    id="subtitle-input"
                    value={config.subtitle || ''}
                    onChange={(e) => setConfig({ ...config, subtitle: e.target.value })}
                    placeholder="Design Titane Absolu."
                    className="mt-1 bg-zinc-900 border-amber-500/30 text-amber-300 font-bold"
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">S'affiche avec l'effet doré luxueux.</p>
                </div>
              </div>

              {/* Description marketing */}
              <div>
                <Label htmlFor="desc-input" className="text-xs text-zinc-300">
                  Description Marketing
                </Label>
                <Textarea
                  id="desc-input"
                  rows={3}
                  value={config.description || ''}
                  onChange={(e) => setConfig({ ...config, description: e.target.value })}
                  placeholder="Découvrez la toute nouvelle génération d'iPhones..."
                  className="mt-1 bg-zinc-900 border-zinc-800 text-sm"
                />
              </div>

              {/* Bouton CTA & Prix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <Label htmlFor="btn-text" className="text-xs text-zinc-300">
                    Texte du Bouton
                  </Label>
                  <Input
                    id="btn-text"
                    value={config.buttonText || ''}
                    onChange={(e) => setConfig({ ...config, buttonText: e.target.value })}
                    placeholder="Acheter Maintenant"
                    className="mt-1 bg-zinc-900 border-zinc-800"
                  />
                </div>
                <div>
                  <Label htmlFor="btn-price" className="text-xs text-zinc-300">
                    Prix affiché (CFA)
                  </Label>
                  <Input
                    id="btn-price"
                    value={config.buttonPrice || ''}
                    onChange={(e) => setConfig({ ...config, buttonPrice: e.target.value })}
                    placeholder="890 000"
                    className="mt-1 bg-zinc-900 border-zinc-800"
                  />
                </div>
                <div>
                  <Label htmlFor="btn-storage" className="text-xs text-zinc-300">
                    Capacité (Go)
                  </Label>
                  <Input
                    id="btn-storage"
                    value={config.buttonStorage || ''}
                    onChange={(e) => setConfig({ ...config, buttonStorage: e.target.value })}
                    placeholder="256 GB"
                    className="mt-1 bg-zinc-900 border-zinc-800"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Média : Objet 3D (.glb) ou Image Cloudinary */}
          <Card className="border-border/60 bg-zinc-950/80 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                <Box className="w-4 h-4 text-amber-400" />
                3. Objet 3D & Visuel Cloudinary
              </CardTitle>
              <CardDescription className="text-xs">
                Importez votre propre modèle 3D (.glb) directement sur Cloudinary ou collez un lien d'une image/3D existant.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Choix du mode média */}
              <div className="flex items-center gap-4 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800">
                <Label className="text-xs font-semibold text-zinc-300 mr-2">Type d'affichage :</Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, mediaType: '3d' })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      config.mediaType === '3d'
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5" />
                    Objet 3D Interactif (.glb)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, mediaType: 'image' })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      config.mediaType === 'image'
                        ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Image Haute Résolution
                  </button>
                </div>
              </div>

              {/* Barre de progression pendant l'upload */}
              {isUploading && (
                <div className="space-y-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                  <div className="flex items-center justify-between text-xs text-amber-300">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Téléversement vers Cloudinary en cours...
                    </span>
                    <span className="font-bold">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2 bg-amber-950" />
                </div>
              )}

              {/* Configuration Objet 3D */}
              {config.mediaType === '3d' && (
                <div className="space-y-3 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <Label htmlFor="model-url" className="text-xs text-zinc-200 font-semibold flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5 text-amber-400" />
                        URL du Modèle 3D (.glb / .gltf)
                      </Label>
                      <p className="text-[11px] text-zinc-400">
                        Hébergé sur Cloudinary ou importez un nouveau fichier .glb
                      </p>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => triggerUpload('3d')}
                      disabled={isUploading}
                      className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs border border-zinc-700"
                    >
                      <UploadCloud className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                      Importer un fichier 3D (.glb)
                    </Button>
                  </div>

                  <Input
                    id="model-url"
                    value={config.modelUrl || ''}
                    onChange={(e) => setConfig({ ...config, modelUrl: e.target.value })}
                    placeholder="https://res.cloudinary.com/dm6yuokre/image/upload/.../iphone.glb"
                    className="bg-zinc-900 border-zinc-800 text-xs font-mono"
                  />
                </div>
              )}

              {/* Configuration Image */}
              <div className="space-y-3 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <Label htmlFor="image-url" className="text-xs text-zinc-200 font-semibold flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                      URL de l'Image Cloudinary
                    </Label>
                    <p className="text-[11px] text-zinc-400">
                      Sert pour le mode Image ou comme image de secours si la 3D ne charge pas.
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => triggerUpload('image')}
                    disabled={isUploading}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs border border-zinc-700"
                  >
                    <UploadCloud className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                    Importer une image
                  </Button>
                </div>

                <Input
                  id="image-url"
                  value={config.imageUrl || ''}
                  onChange={(e) => setConfig({ ...config, imageUrl: e.target.value })}
                  placeholder="https://res.cloudinary.com/dm6yuokre/image/upload/.../iphone.png"
                  className="bg-zinc-900 border-zinc-800 text-xs font-mono"
                />
              </div>
            </CardContent>
          </Card>

          {/* 4. Points de Réassurance */}
          <Card className="border-border/60 bg-zinc-950/80 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-white">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                4. Signaux de Confiance (Statistiques)
              </CardTitle>
              <CardDescription className="text-xs">
                Les 3 colonnes sous le bouton d'achat.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-zinc-400">Colonne 1 (Ex: 100%)</Label>
                  <Input
                    value={config.stat1Value || ''}
                    onChange={(e) => setConfig({ ...config, stat1Value: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-sm font-bold text-amber-400"
                  />
                  <Input
                    value={config.stat1Label || ''}
                    onChange={(e) => setConfig({ ...config, stat1Label: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-xs"
                    placeholder="Authentique"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-zinc-400">Colonne 2 (Ex: 1 Mois)</Label>
                  <Input
                    value={config.stat2Value || ''}
                    onChange={(e) => setConfig({ ...config, stat2Value: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-sm font-bold text-amber-400"
                  />
                  <Input
                    value={config.stat2Label || ''}
                    onChange={(e) => setConfig({ ...config, stat2Label: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-xs"
                    placeholder="Garantie"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-zinc-400">Colonne 3 (Ex: 24h)</Label>
                  <Input
                    value={config.stat3Value || ''}
                    onChange={(e) => setConfig({ ...config, stat3Value: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-sm font-bold text-amber-400"
                  />
                  <Input
                    value={config.stat3Label || ''}
                    onChange={(e) => setConfig({ ...config, stat3Label: e.target.value })}
                    className="bg-zinc-900 border-zinc-800 text-xs"
                    placeholder="Livraison Dakar"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Boutons d'action du bas */}
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetDefaults}
              className="text-xs text-zinc-400 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-2" />
              Réinitialiser par défaut (iPhone 17 Pro Max)
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold shadow-lg shadow-amber-500/20"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer les modifications
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Colonne Aperçu en Direct (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                <Eye className="w-4 h-4 text-amber-400" />
                Aperçu en Direct de la Vitrine
              </div>
              <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-300">
                Temps réel
              </Badge>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/90 p-6 shadow-2xl relative overflow-hidden space-y-6">
              {/* Glow backdrop */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-[70px] pointer-events-none" />

              {/* Badge */}
              {config.badge && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" />
                  {config.badge}
                </div>
              )}

              {/* Titre & Sous-titre */}
              <div className="space-y-1">
                <h3 className="text-2xl font-extrabold text-white tracking-tight leading-tight">
                  {config.title || 'iPhone 17 Pro Max.'}
                </h3>
                <h4 className="text-xl font-extrabold gold-text leading-tight">
                  {config.subtitle || 'Design Titane Absolu.'}
                </h4>
              </div>

              {/* Description */}
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">
                {config.description || 'Découvrez la toute nouvelle génération...'}
              </p>

              {/* Visualiseur 3D ou Image */}
              <div className="relative rounded-2xl bg-zinc-950/60 border border-white/5 overflow-hidden min-h-[320px] flex items-center justify-center">
                <IPhone3DViewer
                  modelUrl={config.modelUrl}
                  mediaType={config.mediaType}
                  imageUrl={config.imageUrl}
                  title={config.title}
                />
              </div>

              {/* Bouton CTA Aperçu */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div>
                  <div className="text-[10px] uppercase font-bold text-zinc-400">À partir de</div>
                  <div className="text-base font-black text-amber-400">
                    {config.buttonPrice} CFA <span className="text-[10px] text-zinc-500 font-normal">({config.buttonStorage})</span>
                  </div>
                </div>

                <div className="px-4 py-2 rounded-full bg-amber-500 text-black text-xs font-black shadow-md pointer-events-none">
                  {config.buttonText || 'Acheter Maintenant'}
                </div>
              </div>

              {/* Stats Réassurance */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
                <div>
                  <p className="text-xs font-extrabold text-amber-400">{config.stat1Value || '100%'}</p>
                  <p className="text-[9px] text-zinc-500 uppercase">{config.stat1Label || 'Authentique'}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold text-amber-400">{config.stat2Value || '1 Mois'}</p>
                  <p className="text-[9px] text-zinc-500 uppercase">{config.stat2Label || 'Garantie'}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold text-amber-400">{config.stat3Value || '24h'}</p>
                  <p className="text-[9px] text-zinc-500 uppercase">{config.stat3Label || 'Livraison Dakar'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
