// src/components/layout/header.tsx
'use client';

import Link from "next/link";
import { Menu, User, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Image from "next/image";
import { ThemeToggle } from "../theme-toggle";
import { useCart } from "@/context/CartContext";

export function Header() {
  const { cart } = useCart();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <div className="mr-auto flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Image 
                src="https://res.cloudinary.com/dm6yuokre/image/upload/v1752163215/IMG-20250710-WA0000-removebg-preview_uunwq2.png"
                alt="Sakho Apple Logo"
                width={24}
                height={24}
                className="h-6 w-6"
              />
            <span className="font-bold font-headline text-lg" translate="no">Sakho Apple</span>
          </Link>
        </div>
        
        <div className="flex items-center justify-end space-x-1 md:space-x-2">
           <ThemeToggle />
           <Link href="/cart" passHref>
              <Button variant="ghost" size="icon" className="relative">
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {itemCount}
                  </span>
                )}
                <ShoppingCart className="h-6 w-6" />
                <span className="sr-only">Panier</span>
              </Button>
            </Link>
           <Link href="/admin/login">
            <Button variant="ghost" size="icon">
              <User className="h-6 w-6" />
              <span className="sr-only">Admin Login</span>
            </Button>
           </Link>
           <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
               <SheetHeader>
                 <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
               </SheetHeader>
               <div className="flex flex-col p-6 space-y-4">
                <Link href="/" className="font-semibold">Accueil</Link>
                <Link href="/exchange" className="font-semibold">Échange</Link>
                <Link href="/products" className="font-semibold">Produits</Link>
                <Link href="/about" className="font-semibold">Qui sommes-nous</Link>
               </div>
            </SheetContent>
           </Sheet>
        </div>
      </div>
    </header>
  );
}
