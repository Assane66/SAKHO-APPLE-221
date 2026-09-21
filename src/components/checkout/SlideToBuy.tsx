'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';

interface SlideToBuyProps {
  onSuccess: () => void;
  text?: string;
  disabled?: boolean;
}

export function SlideToBuy({ onSuccess, text = 'COMMANDER', disabled = false }: SlideToBuyProps) {
  return (
    <button
      type="button"
      onClick={onSuccess}
      disabled={disabled}
      className="w-full h-14 md:h-16 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-black flex items-center justify-center gap-2 font-extrabold uppercase tracking-widest shadow-xl transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <ShoppingCart className="w-5 h-5" />
      <span>{disabled ? 'ENREGISTREMENT...' : text}</span>
    </button>
  );
}
