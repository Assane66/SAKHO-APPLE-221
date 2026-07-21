'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { ChevronRight, CheckCircle, ShoppingCart } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SlideToBuyProps {
  onSuccess: () => void;
  text?: string;
  disabled?: boolean;
}

export function SlideToBuy({ onSuccess, text = 'GLISSER POUR COMMANDER', disabled = false }: SlideToBuyProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const handleDragEnd = () => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth - 56; // handle width
    if (x.get() >= width * 0.85) {
      setIsUnlocked(true);
      x.set(width);
      // Trigger Confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#c9a84c', '#f5d78e', '#ffffff'],
      });
      setTimeout(() => {
        onSuccess();
      }, 400);
    } else {
      x.set(0);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-14 md:h-16 rounded-full bg-zinc-900/90 border border-amber-500/30 p-1 flex items-center overflow-hidden select-none shadow-xl ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Background fill glow as user drags */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full"
        style={{ width: useTransform(x, (v) => `${v + 56}px`) }}
      />

      {/* Swipe Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-xs md:text-sm font-extrabold uppercase tracking-widest text-amber-300/80 animate-pulse">
          {isUnlocked ? 'COMMANDE CONFIRMÉE !' : text}
        </span>
      </div>

      {/* Draggable Knob */}
      <motion.div
        drag={isUnlocked ? false : 'x'}
        dragConstraints={containerRef}
        dragElastic={0.05}
        dragSnapToOrigin={false}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative z-10 w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-amber-400 to-yellow-200 text-black flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg"
      >
        {isUnlocked ? (
          <CheckCircle className="w-6 h-6 text-black" />
        ) : (
          <ChevronRight className="w-6 h-6 text-black animate-bounce-x" />
        )}
      </motion.div>
    </div>
  );
}
