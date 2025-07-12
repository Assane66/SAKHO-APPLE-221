
// src/components/layout/header.tsx
'use client';

import Link from "next/link";
import { Menu, UserCircle, ShoppingCart, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/context/CartContext";
import { Badge } from "../ui/badge";
import Image from "next/image";
import { ThemeToggle } from "../theme-toggle";

export function Header() {
  const { cart } = useCart();
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Image 
              src="https://res.cloudinary.com/dm6yuokre/image/upload/v1752163215/IMG-20250710-WA0000-removebg-preview_uunwq2.png"
              alt="Khalil Apple Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="font-bold font-headline">Khalil Apple</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Accueil
          </Link>
          <Link href="/exchange" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Échange
          </Link>
          <Link href="/products" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Produits
          </Link>
          <Link href="/about" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Qui sommes-nous
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
           <ThemeToggle />
            <Button asChild variant="ghost" size="icon">
              <Link href="/products">
                <Search className="h-6 w-6" />
                <span className="sr-only">Rechercher</span>
              </Link>
            </Button>
           <Link href="/cart" passHref>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-6 w-6" />
                {itemCount > 0 && (
                   <Badge variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center">
                    {itemCount}
                  </Badge>
                )}
                <span className="sr-only">Panier</span>
              </Button>
            </Link>
           <Link href="/admin/login">
            <Button variant="ghost" size="icon">
              <UserCircle className="h-6 w-6" />
              <span className="sr-only">Admin Login</span>
            </Button>
           </Link>
           <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
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
