// src/app/cart/page.tsx
'use client';

import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

  return (
    <div className="public-surface cart-shell py-10 px-4 md:px-8 md:py-16">
      <p className="section-kicker mb-3">Votre sélection</p>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline mb-10">Un dernier regard.</h1>
      
      {cart.length === 0 ? (
        <Card className="product-card border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            <p className="text-xl font-medium">Votre panier est vide.</p>
            <p className="text-muted-foreground">Parcourez nos produits pour commencer vos achats.</p>
            <Button asChild>
              <Link href="/">Voir les produits</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-[2fr_1fr] gap-8 items-start">
          <Card className="product-card overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Produit</TableHead>
                    <TableHead>Détails</TableHead>
                    <TableHead className="w-[100px]">Quantité</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Image src={item.thumbnail} alt={item.name} width={80} height={80} className="rounded-md object-cover" />
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.storage}</p>
                        <p className="text-sm">{item.price.toLocaleString('fr-FR')} CFA</p>
                      </TableCell>
                      <TableCell>
                        {item.isSinglePiece || item.maxQuantity === 1 ? (
                          <div className="flex flex-col gap-1">
                            <span className="w-10 text-center py-1 font-bold text-sm bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md">
                              1
                            </span>
                            <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                              Pièce unique
                            </span>
                          </div>
                        ) : (
                          <Input
                            type="number"
                            min="1"
                            max={item.maxQuantity || 99}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-20"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(item.price * item.quantity).toLocaleString('fr-FR')} CFA
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Supprimer</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="product-card sticky top-24">
            <CardHeader>
              <CardTitle>Résumé de la commande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span>{cartTotal.toLocaleString('fr-FR')} CFA</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{cartTotal.toLocaleString('fr-FR')} CFA</span>
              </div>
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full">
                    <Link href="/checkout">
                        Passer la commande
                    </Link>
                </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
