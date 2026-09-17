// src/components/admin/admin-sidebar.tsx
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingCart, Repeat, Tag, Percent, ImageIcon, Users, Settings, Zap, Database, HandCoins, Sparkles, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useAdminNotifications } from "@/context/AdminNotificationContext";

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Home, notificationKey: 'none' },
  { href: "/admin/products", label: "Produits", icon: Package, notificationKey: 'none' },
  { href: "/admin/hero", label: "Vitrine Hero 3D", icon: Box, notificationKey: 'none' },
  { href: "/admin/featured", label: "Mises en avant", icon: Sparkles, notificationKey: 'none' },
  { href: "/admin/stock", label: "Stock (IMEI)", icon: Database, notificationKey: 'none' },
  { href: "/admin/orders", label: "Commandes", icon: ShoppingCart, notificationKey: 'orders' },
  { href: "/admin/exchanges", label: "Échanges", icon: Repeat, notificationKey: 'exchanges' },
  { href: "/admin/categories", label: "Catégories", icon: Tag, notificationKey: 'none' },
  { href: "/admin/promo", label: "Promotions", icon: Percent, notificationKey: 'none' },
  { href: "/admin/flash-sales", label: "Ventes", icon: Zap, notificationKey: 'none' },
  { href: "/admin/banners", label: "Bannières", icon: ImageIcon, notificationKey: 'none' },
  { href: "/admin/customers", label: "Clients", icon: Users, notificationKey: 'none' },
  { href: "/admin/debts", label: "Dettes", icon: HandCoins, notificationKey: 'none' },
  { href: "/admin/settings", label: "Paramètres", icon: Settings, notificationKey: 'none' },
];

export function AdminSidebar({ isMobile = false }) {
  const pathname = usePathname();
  const { newOrdersCount, newExchangesCount } = useAdminNotifications();

  const getNotificationCount = (key: string) => {
    if (key === 'orders') return newOrdersCount;
    if (key === 'exchanges') return newExchangesCount;
    return 0;
  }

  return (
    <aside className={cn("fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-background md:flex", { "flex z-50": isMobile })}>
      <div className="flex h-14 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Image 
            src="https://res.cloudinary.com/dm6yuokre/image/upload/v1752163215/IMG-20250710-WA0000-removebg-preview_uunwq2.png"
            alt="Khalil Apple Logo"
            width={24}
            height={24}
            className="h-6 w-6"
          />
          <span className="">Khalil Apple</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-auto py-4">
        <div className="grid items-start px-4 text-sm font-medium">
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            const LinkIcon = link.icon;
            const notificationCount = getNotificationCount(link.notificationKey);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary relative",
                  isActive && "bg-muted text-primary"
                )}
              >
                <LinkIcon className="h-4 w-4" />
                <span>{link.label}</span>
                {notificationCount > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                    {notificationCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  );
}
