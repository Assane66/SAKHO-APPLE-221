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
import { Loader2 } from "lucide-react";

interface SettingsData {
  shopName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  paymentCashOnDelivery: boolean;
  paymentMobileMoney: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>({
    shopName: 'Khalil Apple',
    contactEmail: 'baalhassane521@gmail.com',
    contactPhone: '+221781395893',
    address: 'Tivaouane Peulh',
    paymentCashOnDelivery: true,
    paymentMobileMoney: true,
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
          setSettings(docSnap.data() as SettingsData);
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
            <Label htmlFor="contactPhone">Téléphone</Label>
            <Input id="contactPhone" type="tel" value={settings.contactPhone} onChange={handleChange} />
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
    </div>
  );
}
