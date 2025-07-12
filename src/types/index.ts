// src/types/index.ts

export type Variant = {
  storage: string;
  price: string;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  status: 'Actif' | 'Inactif';
  variants: Variant[];
};
