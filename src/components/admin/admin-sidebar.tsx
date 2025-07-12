// src/components/admin/admin-sidebar.tsx
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Smartphone, Home, Package, ShoppingCart, Repeat, Tag, Percent, ImageIcon, Users, Settings, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";


const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Home },
  { href: "/admin/products", label: "Produits", icon: Package },
  { href: "/admin/orders", label: "Commandes", icon: ShoppingCart },
  { href: "/admin/exchanges", label: "Échanges", icon: Repeat },
  { href: "/admin/categories", label: "Catégories", icon: Tag },
  { href: "/admin/promo", label: "Promotions", icon: Percent },
  { href: "/admin/flash-sales", label: "Ventes Flash", icon: Zap },
  { href: "/admin/banners", label: "Bannières", icon: ImageIcon },
  { href: "/admin/customers", label: "Clients", icon: Users },
  { href: "/admin/settings", label: "Paramètres", icon: Settings },
];

export function AdminSidebar({ isMobile = false }) {
  const pathname = usePathname();

  return (
    <aside className={cn("fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-background md:flex", { "flex z-50": isMobile })}>
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Smartphone className="h-6 w-6 text-primary" />
          <span className="">Khalil Apple</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-auto py-4">
        <div className="grid items-start px-4 text-sm font-medium">
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            const LinkIcon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                  isActive && "bg-muted text-primary"
                )}
              >
                <LinkIcon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  );
}
