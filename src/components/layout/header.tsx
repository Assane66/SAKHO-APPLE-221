// src/components/layout/header.tsx
'use client';

import Link from "next/link";
import { Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import Image from "next/image";
import { ThemeToggle } from "../theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <div className="mr-auto flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/></svg>
            <span className="font-bold font-headline text-lg">Khalil Apple</span>
          </Link>
        </div>
        
        <div className="flex items-center justify-end space-x-1 md:space-x-2">
           <ThemeToggle />
           <Link href="/cart" passHref>
              <Button variant="ghost" size="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M7.5 12.5a5 5 0 0 1-5-5h19a5 5 0 0 1-5 5"/><path d="m16 7.5-4 9-4-9"/></svg>
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
