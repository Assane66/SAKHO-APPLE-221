// src/types/index.ts

export type ProductVariant = {
  storage: string;
  price: number;
  isPromo?: boolean;
  promoPrice?: number;
  originalPrice?: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName?: string;
  thumbnail: string;
  keywords: string[];
  batteryHealth: string;
  status: 'active' | 'inactive';
  variants: ProductVariant[];
  createdAt?: any; // To accommodate serverTimestamp
  promoEndDate?: any; // To accommodate serverTimestamp
  sales?: number; // Pour le suivi des produits les plus vendus
  hasIMEI?: boolean; // Indique si ce produit peut avoir des exemplaires avec IMEI
  imei?: string; // Numéro IMEI (strictement interne, pour traçabilité)
  isVenant?: boolean; // Appareil d'origine Venant
  isSecondHand?: boolean; // Appareil d'occasion / 2ème main
  originalPrice?: number; // Prix initial avant réduction éventuelle
  unitPrice?: number; // Prix de vente
  isUniqueItem?: boolean; // Indique un exemplaire issu du stock
  storage?: string; // Capacité mémoire principale
  customBadge?: string; // Badge administrable (ex: "Bestseller", "Nouveauté", "Offre Spéciale", "Populaire")
  isFeatured?: boolean; // Produit vedette pour mise en avant / Bento Grid
  isFlashSale?: boolean; // Activer la vente flash pour ce produit
  flashSalePrice?: number; // Prix promotionnel flash
  flashSaleEndDate?: any; // Date de fin de vente flash
  inStock?: boolean; // Indique si des unités physiques sont en stock
  inStockCount?: number; // Nombre d'unités physiques disponibles
};

export type StockItem = {
  id: string;
  productId: string;
  productName: string;
  imei: string;
  storage: string;
  status: 'disponible' | 'vendu';
  addedAt: any;
  soldAt?: any;
  customerName?: string;
  customerPhone?: string;
  catalogPrice?: number;
  unitPrice?: number;
  originalPrice?: number;
  hasCustomPrice?: boolean;
  isVenant?: boolean;
  isSecondHand?: boolean;
  note?: string;
  finalPrice?: number; // Prix de vente final (peut être différent du prix catalogue)
};

export type DebtStatus = 'À payer' | 'Partiellement payé' | 'Payé';

export interface DebtPayment {
  id: string;
  amount: number;
  date: any;
  note?: string;
}

export interface Debt {
  id: string;
  firstName: string;
  lastName: string;
  customerName: string;
  phone: string;
  item: string;
  quantity: number;
  amountDue: number;
  amountPaid: number;
  amountRemaining: number;
  date: any;
  dueDate?: any;
  note?: string;
  status: DebtStatus;
  payments?: DebtPayment[];
  createdAt?: any;
  updatedAt?: any;
}

export type FlashSaleVariant = {
  storage: string;
  originalPrice: number;
  discountPrice: number;
  initialStock: number;
  sold: number;
};

export type FlashSale = {
  id: string;
  productName: string;
  slug: string;
  thumbnail: string;
  variants: FlashSaleVariant[];
  endDate: any; // Firestore timestamp
  status: 'Actif' | 'Programmé' | 'Terminé';
  createdAt: any;
  discountPrice?: number;
  originalPrice?: number;
};


export interface CartItem {
  id: string;
  productId: string;
  name: string;
  storage: string;
  price: number;
  quantity: number;
  thumbnail: string;
}

export interface Order {
  id?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
  total: number;
  status: 'En attente' | 'En cours' | 'Livrée' | 'Annulée';
  date: any; // serverTimestamp
}

export interface Promotion {
  id: string;
  title: string;
  targetType: 'all' | 'category' | 'products';
  targetCategories?: string[];
  targetProducts?: string[];
  discountAmount: number; // Somme déduite (ex: 10 000 CFA)
  startDate?: any;
  endDate: any; // Firestore timestamp
  status: 'Actif' | 'Inactif';
  createdAt?: any;
  // Champs de rétrocompatibilité
  productId?: string;
  productName?: string;
  variantStorage?: string;
  originalPrice?: number;
  discountPrice?: number;
}
