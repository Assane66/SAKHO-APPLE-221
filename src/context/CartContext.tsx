// src/context/CartContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string; // Combination of productId and storage
  productId: string;
  name: string;
  storage: string;
  price: number;
  quantity: number;
  thumbnail: string;
  isSinglePiece?: boolean; // Pièce unique (stock réel en boutique ou vente flash)
  maxQuantity?: number; // Quantité maximum autorisée
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem('cart');
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error("Failed to parse cart from localStorage", error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item: CartItem) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(i => i.id === item.id);
      if (existingItem) {
        // Si pièce unique ou maxQuantity = 1, ne pas dépasser 1
        if (existingItem.isSinglePiece || existingItem.maxQuantity === 1) {
          return prevCart;
        }
        const maxQ = existingItem.maxQuantity || Infinity;
        const newQ = Math.min(existingItem.quantity + 1, maxQ);
        return prevCart.map(i =>
          i.id === item.id ? { ...i, quantity: newQ } : i
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(prevCart =>
        prevCart.map(item => {
          if (item.id !== itemId) return item;
          // Si pièce unique ou maxQuantity = 1, forcer la quantité à 1
          if (item.isSinglePiece || item.maxQuantity === 1) {
            return { ...item, quantity: 1 };
          }
          const maxQ = item.maxQuantity || Infinity;
          return { ...item, quantity: Math.min(quantity, maxQ) };
        })
      );
    }
  };
  
  const clearCart = () => {
    setCart([]);
  }

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
