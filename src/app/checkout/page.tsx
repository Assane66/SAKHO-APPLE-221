// src/app/checkout/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createOrder } from './actions';
import { useState, useEffect } from 'react';
import { Loader2, Truck, Store } from 'lucide-react';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Le nom est requis."),
  customerPhone: z.string().min(9, "Le numéro de téléphone est requis."),
  customerAddress: z.string().min(5, "L'adresse est requise."),
  deliveryMethod: z.enum(['delivery', 'pickup'], {
    required_error: "Vous devez sélectionner un mode de livraison."
  }),
});

const DELIVERY_COST = 3000;

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      deliveryMethod: 'delivery',
    },
  });

  const deliveryMethod = form.watch('deliveryMethod');
  const deliveryCost = deliveryMethod === 'delivery' ? DELIVERY_COST : 0;
  const finalTotal = cartTotal + deliveryCost;

  useEffect(() => {
    if (cart.length === 0) {
      router.replace('/cart');
    }
  }, [cart, router]);

  if (cart.length === 0) {
    return null;
  }

  async function onSubmit(values: z.infer<typeof checkoutSchema>) {
    setIsSubmitting(true);
    try {
      const result = await createOrder({
        ...values,
        items: cart,
        subTotal: cartTotal,
        deliveryMethod: values.deliveryMethod === 'delivery' ? 'Livraison à domicile' : 'Retrait en magasin',
        deliveryCost,
        total: finalTotal,
      });

      if (result.success) {
        toast({
          title: "Commande passée avec succès!",
          description: "Merci pour votre confiance. Nous vous contacterons bientôt.",
        });
        clearCart();
        router.push('/');
      } else {
        throw new Error(result.error || 'Une erreur est survenue.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur lors de la commande',
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto max-w-6xl py-12 px-4 md:px-6">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline mb-8">Finaliser ma commande</h1>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-12 items-start">
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Informations de livraison</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="customerName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom complet</FormLabel>
                                        <FormControl><Input placeholder="Prénom Nom" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="customerPhone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Numéro de téléphone</FormLabel>
                                        <FormControl><Input type="tel" placeholder="Ex: 77 123 45 67" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="customerAddress"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adresse</FormLabel>
                                        <FormControl><Input placeholder="Ex: Cité Keur Gorgui, Villa 123" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>2. Mode de livraison</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <FormField
                                control={form.control}
                                name="deliveryMethod"
                                render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex flex-col space-y-2"
                                    >
                                        <FormItem>
                                            <FormControl>
                                                <Label htmlFor="delivery" className={cn("flex items-center gap-4 rounded-md border p-4 cursor-pointer hover:bg-accent/50 transition-colors", field.value === 'delivery' && 'bg-accent border-primary ring-2 ring-primary')}>
                                                    <RadioGroupItem value="delivery" id="delivery" />
                                                    <Truck className="h-6 w-6" />
                                                    <div className="flex-1">
                                                        <p className="font-semibold">Livraison à domicile</p>
                                                        <p className="text-sm text-muted-foreground">Frais de {DELIVERY_COST.toLocaleString('fr-FR')} CFA</p>
                                                    </div>
                                                </Label>
                                            </FormControl>
                                        </FormItem>
                                        <FormItem>
                                             <FormControl>
                                                <Label htmlFor="pickup" className={cn("flex items-center gap-4 rounded-md border p-4 cursor-pointer hover:bg-accent/50 transition-colors", field.value === 'pickup' && 'bg-accent border-primary ring-2 ring-primary')}>
                                                    <RadioGroupItem value="pickup" id="pickup" />
                                                    <Store className="h-6 w-6" />
                                                    <div className="flex-1">
                                                        <p className="font-semibold">Retrait en magasin</p>
                                                        <p className="text-sm text-muted-foreground">Gratuit - Dakar, Sénégal</p>
                                                    </div>
                                                </Label>
                                             </FormControl>
                                        </FormItem>
                                    </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                </div>
                <div>
                    <Card className="sticky top-20">
                        <CardHeader>
                            <CardTitle>Votre commande</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 max-h-64 overflow-y-auto">
                            {cart.map(item => (
                                <div key={item.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <Image src={item.thumbnail} alt={item.name} width={64} height={64} className="rounded-md object-cover" />
                                        <div>
                                            <p className="font-medium">{item.name} ({item.storage})</p>
                                            <p className="text-sm text-muted-foreground">Quantité: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <p className="font-medium">{(item.price * item.quantity).toLocaleString('fr-FR')} CFA</p>
                                </div>
                            ))}
                        </CardContent>
                        <Separator className="my-4" />
                        <CardFooter className="flex flex-col items-start space-y-2">
                            <div className="flex justify-between w-full">
                                <span>Sous-total</span>
                                <span>{cartTotal.toLocaleString('fr-FR')} CFA</span>
                            </div>
                            <div className="flex justify-between w-full">
                                <span>Livraison</span>
                                <span>{deliveryCost > 0 ? `${deliveryCost.toLocaleString('fr-FR')} CFA` : 'Gratuite'}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between w-full text-lg font-bold">
                                <span>Total</span>
                                <span>{finalTotal.toLocaleString('fr-FR')} CFA</span>
                            </div>

                             <Button type="submit" className="w-full mt-6" size="lg" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmer la commande
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </form>
        </Form>
    </div>
  );
}
