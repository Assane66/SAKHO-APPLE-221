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
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Le nom est requis."),
  customerPhone: z.string().min(9, "Le numéro de téléphone est requis."),
  customerAddress: z.string().min(5, "L'adresse est requise."),
});

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
    },
  });

  if (cart.length === 0 && typeof window !== 'undefined') {
    router.replace('/cart');
    return null;
  }

  async function onSubmit(values: z.infer<typeof checkoutSchema>) {
    setIsSubmitting(true);
    try {
      const result = await createOrder({
        ...values,
        items: cart,
        total: cartTotal,
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
        <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
                 <Card>
                    <CardHeader>
                        <CardTitle>Informations de livraison</CardTitle>
                    </CardHeader>
                    <CardContent>
                       <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                            <FormLabel>Adresse de livraison</FormLabel>
                                            <FormControl><Input placeholder="Ex: Cité Keur Gorgui, Villa 123" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Confirmer la commande
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                 </Card>
            </div>
            <div>
                <Card>
                    <CardHeader>
                        <CardTitle>Votre commande</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                    <CardFooter className="flex flex-col items-start space-y-2 border-t pt-4">
                         <div className="flex justify-between w-full">
                            <span>Sous-total</span>
                            <span>{cartTotal.toLocaleString('fr-FR')} CFA</span>
                        </div>
                        <div className="flex justify-between w-full">
                            <span>Livraison</span>
                            <span>Gratuite</span>
                        </div>
                        <div className="flex justify-between w-full text-lg font-bold">
                            <span>Total</span>
                            <span>{cartTotal.toLocaleString('fr-FR')} CFA</span>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    </div>
  );
}
