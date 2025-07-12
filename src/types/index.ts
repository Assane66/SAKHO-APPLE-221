// src/types/index.ts

export type Variant = {
  storage: string;
  price: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  status: 'active' | 'inactive';
  categoryId: string;
  thumbnail: string;
  description: string;
  isNew: boolean;
  hasWarranty: boolean;
  batteryHealth: string;
  deliveryInfo: string;
  variants: Variant[];
  createdAt?: any; // To accommodate serverTimestamp
};
