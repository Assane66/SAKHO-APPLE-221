'use client';

import React, { useRef } from 'react';
import { motion, useSpring } from 'framer-motion';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MagneticButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  badge?: string;
}

export function MagneticButton({
  children = 'Acheter Maintenant',
  onClick,
  className,
  badge = 'OFFRES 2026',
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);

  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const position = {
    x: useSpring(0, springConfig),
    y: useSpring(0, springConfig),
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    position.x.set(middleX * 0.35);
    position.y.set(middleY * 0.35);
  };

  const handleMouseLeave = () => {
    position.x.set(0);
    position.y.set(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="inline-block relative p-2"
    >
      <motion.button
        style={{ x: position.x, y: position.y }}
        onClick={onClick}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'group relative inline-flex items-center gap-3 px-8 py-4 text-base font-bold text-black rounded-full overflow-hidden shadow-2xl transition-all duration-300',
          'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:shadow-[0_0_40px_rgba(245,215,142,0.6)]',
          className
        )}
      >
        {/* Shimmer effect */}
        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

        {/* Outer aura glow */}
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-200 opacity-0 group-hover:opacity-60 blur-lg transition-opacity duration-500 pointer-events-none" />

        {/* Badge dot */}
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-40"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-black/80"></span>
        </span>

        {/* Text */}
        <span className="relative z-10 font-bold uppercase tracking-wider text-sm md:text-base flex items-center gap-2 text-zinc-950">
          {children}
          <ShoppingBag className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:rotate-12" />
        </span>

        {/* Sub-label badge */}
        {badge && (
          <span className="relative z-10 hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-black/10 text-zinc-900 border border-black/10">
            <Sparkles className="w-2.5 h-2.5" />
            {badge}
          </span>
        )}
      </motion.button>
    </div>
  );
}
