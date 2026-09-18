// src/app/admin/settings/page.tsx
'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { Loader2, Sparkles, ChevronRight, Truck } from "lucide-react";

interface SettingsData {
  shopName: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  address?: string;
  paymentCashOnDelivery: boolean;
  paymentMobileMoney: boolean;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  deliveryFee?: number;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    shopName: 'Khalil Apple',
    contactEmail: 'baalhassane521@gmail.com',
    contactPhone: '+221781395893',
    whatsappNumber: '221781395893',
    address: 'Tivaouane Peulh',
    paymentCashOnDelivery: true,
    paymentMobileMoney: true,
    facebookUrl: '',
    instagramUrl: '',
    tiktokUrl: 'https://vm.tiktok.com/ZMHgBjJwjqgsS-ysH6R/',
    deliveryFee: 5000,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const settingsRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<SettingsData>;
          setSettings(prev => ({
            ...prev,
            ...data,
            whatsappNumber: data.whatsappNumber || data.contactPhone?.split('/')[0] || prev.whatsappNumber,
          }));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          variant: 'destructive',
          title: "Erreur",
          description: "Impossible de charger les paramètres."
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const settingsRef = doc(db, 'settings', 'general');
      await setDoc(settingsRef, settings, { merge: true });
      toast({
        title: "Succès",
        description: "Les paramètres ont été mis à jour."
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        variant: 'destructive',
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({...prev, [id]: value }));
  }

  const handleSwitchChange = (id: keyof SettingsData, checked: boolean) => {
    setSettings(prev => ({...prev, [id]: checked }));
  }

  if (isLoading) {
    return (
       <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Paramètres</h1>

      {/* Bento Grid Featured Card */}
      <Card className="border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-zinc-950 to-zinc-900">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Mises en avant Accueil
              </div>
              <CardTitle className="text-xl">Bento Grid (Flagship, Best-Seller, Offre Spéciale, Nouveauté)</CardTitle>
              <CardDescription>
                Sélectionnez vous-même les 4 modèles d'iPhone affichés sur les grandes cartes vedettes.
              </CardDescription>
            </div>
            <Link href="/admin/featured" className="flex-shrink-0">
              <Button className="bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs gap-1.5">
                Gérer les sélections
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>Mettez à jour les informations de contact de votre boutique.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shopName">Nom de la boutique</Label>
            <Input id="shopName" value={settings.shopName} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email de contact</Label>
            <Input id="contactEmail" type="email" value={settings.contactEmail} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Numéros de téléphone</Label>
            <Input id="contactPhone" type="text" placeholder="+221781395893 / +221770000000" value={settings.contactPhone} onChange={handleChange} />
            <p className="text-xs text-muted-foreground">
              Vous pouvez saisir plusieurs numéros en les séparant par un slash (/).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">Numéro WhatsApp</Label>
            <Input id="whatsappNumber" type="tel" placeholder="+221781395893" value={settings.whatsappNumber || ''} onChange={handleChange} />
            <p className="text-xs text-muted-foreground">
              Ce numéro sera utilisé par le bouton WhatsApp et pour recevoir les commandes.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" value={settings.address} onChange={handleChange} />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer les modifications
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Réseaux Sociaux</CardTitle>
          <CardDescription>Gérez les liens vers vos pages sociales.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facebookUrl">Facebook URL</Label>
            <Input id="facebookUrl" type="url" placeholder="https://facebook.com/..." value={settings.facebookUrl || ''} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instagramUrl">Instagram URL</Label>
            <Input id="instagramUrl" type="url" placeholder="https://instagram.com/..." value={settings.instagramUrl || ''} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tiktokUrl">TikTok URL</Label>
            <Input id="tiktokUrl" type="url" placeholder="https://tiktok.com/..." value={settings.tiktokUrl || ''} onChange={handleChange} />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer les modifications
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Modes de paiement</CardTitle>
          <CardDescription>Activez ou désactivez les méthodes de paiement disponibles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="paymentCashOnDelivery" className="text-base">Paiement à la livraison</Label>
              <p className="text-sm text-muted-foreground">
                Permettre aux clients de payer en espèces lors de la livraison.
              </p>
            </div>
            <Switch id="paymentCashOnDelivery" checked={settings.paymentCashOnDelivery} onCheckedChange={(checked) => handleSwitchChange('paymentCashOnDelivery', checked)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="paymentMobileMoney" className="text-base">Paiement mobile</Label>
              <p className="text-sm text-muted-foreground">
                Accepter les paiements via Wave, Orange Money, etc.
              </p>
            </div>
            <Switch id="paymentMobileMoney" checked={settings.paymentMobileMoney} onCheckedChange={(checked) => handleSwitchChange('paymentMobileMoney', checked)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="card-payment" className="text-base">Carte bancaire</Label>
              <p className="text-sm text-muted-foreground">
                Accepter les paiements par carte de crédit/débit (Indisponible).
              </p>
            </div>
            <Switch id="card-payment" disabled />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer les modifications
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-400" />
            <CardTitle>Livraison</CardTitle>
          </div>
          <CardDescription>
            Définissez le montant des frais de livraison à domicile à Dakar. Le retrait en boutique est toujours gratuit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deliveryFee">Frais de livraison à domicile (CFA)</Label>
            <Input
              id="deliveryFee"
              type="number"
              min={0}
              step={500}
              placeholder="ex: 5000"
              value={settings.deliveryFee ?? 5000}
              onChange={(e) => setSettings(prev => ({ ...prev, deliveryFee: Number(e.target.value) }))}
            />
            <p className="text-xs text-muted-foreground">
              Ce montant sera affiché et ajouté automatiquement lors d'une commande en livraison à domicile (Dakar). Pour toute livraison hors Dakar, le client devra contacter la boutique.
            </p>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4 bg-zinc-900/50">
            <div className="space-y-0.5">
              <Label className="text-base">Retrait en boutique</Label>
              <p className="text-sm text-muted-foreground">Toujours gratuit — le client vient chercher son produit directement à la boutique.</p>
            </div>
            <span className="text-emerald-400 font-bold text-sm">0 CFA</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer les modifications
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
