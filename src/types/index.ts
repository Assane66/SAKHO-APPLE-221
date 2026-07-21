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
  createdAt?: any;
  promoEndDate?: any;
  sales?: number;
  hasIMEI?: boolean;
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
  finalPrice?: number;
};

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
  endDate: any;
  status: 'Actif' | 'Programmé' | 'Terminé';
  createdAt: any;
  // Champs optionnels de rétrocompatibilité
  productId?: string;
  variantStorage?: string;
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
  date: any;
}

export interface Promotion {
  id: string;
  title: string;
  targetType: 'all' | 'category' | 'products';
  targetCategories?: string[];
  targetProducts?: string[];
  discountAmount: number;
  startDate?: any;
  endDate: any;
  status: 'Actif' | 'Inactif';
  createdAt?: any;
  productId?: string;
  productName?: string;
  variantStorage?: string;
  originalPrice?: number;
  discountPrice?: number;
}
