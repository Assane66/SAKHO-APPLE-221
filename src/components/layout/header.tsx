import Link from "next/link";
import { Smartphone, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Smartphone className="h-6 w-6 text-primary" />
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
          <Link href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Produits
          </Link>
          <Link href="#" className="transition-colors hover:text-foreground/80 text-foreground/60">
            Contact
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
           <Button className="hidden md:inline-flex">Mon Compte</Button>
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
                <Link href="#" className="font-semibold">Produits</Link>
                <Link href="#" className="font-semibold">Contact</Link>
               </div>
            </SheetContent>
           </Sheet>
        </div>
      </div>
    </header>
  );
}
