// src/app/admin/settings/page.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
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
            <Label htmlFor="shop-name">Nom de la boutique</Label>
            <Input id="shop-name" defaultValue="Khalil Apple" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shop-email">Email de contact</Label>
            <Input id="shop-email" type="email" defaultValue="khalilapple778@icloud.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shop-phone">Téléphone</Label>
            <Input id="shop-phone" type="tel" defaultValue="+221 78 451 36 33" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shop-address">Adresse</Label>
            <Input id="shop-address" defaultValue="Dakar, Sénégal" />
          </div>
        </CardContent>
        <CardFooter>
          <Button>Enregistrer les modifications</Button>
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
              <Label htmlFor="cash-on-delivery" className="text-base">Paiement à la livraison</Label>
              <p className="text-sm text-muted-foreground">
                Permettre aux clients de payer en espèces lors de la livraison.
              </p>
            </div>
            <Switch id="cash-on-delivery" defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="mobile-money" className="text-base">Paiement mobile</Label>
               <p className="text-sm text-muted-foreground">
                Accepter les paiements via Wave, Orange Money, etc.
              </p>
            </div>
            <Switch id="mobile-money" defaultChecked />
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
      </Card>
    </div>
  );
}
