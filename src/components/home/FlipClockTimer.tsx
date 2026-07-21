'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Flame, Sparkles } from 'lucide-react';

interface FlipClockTimerProps {
  targetDate?: Date | number;
  label?: string;
}

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

function FlipUnit({ value, unit }: { value: number; unit: string }) {
  const formattedValue = value.toString().padStart(2, '0');

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* 3D Flip Card Container */}
      <div className="relative w-14 h-16 md:w-20 md:h-24 rounded-2xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-amber-500/30 shadow-[0_10px_25px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden">
        {/* Horizontal center divider line */}
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/80 z-20" />
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-amber-500/20 z-20" />

        {/* Animated Digit */}
        <AnimatePresence mode="popLayout">
          <motion.span
            key={formattedValue}
            initial={{ rotateX: -90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: 90, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="font-mono font-extrabold text-2xl md:text-4xl text-amber-400 tracking-wider z-10"
          >
            {formattedValue}
          </motion.span>
        </AnimatePresence>

        {/* Card gloss sheen */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
      </div>

      {/* Unit Label */}
      <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {unit}
      </span>
    </div>
  );
}

export function FlipClockTimer({
  targetDate,
  label = 'PROMOTION EXCLUSIVE KHALIL APPLE',
}: FlipClockTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 14, minutes: 35, seconds: 22 });

  useEffect(() => {
    // End time 18 hours from now if no targetDate passed
    const endTime = targetDate
      ? new Date(targetDate).getTime()
      : Date.now() + (14 * 3600 + 35 * 60 + 22) * 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      const difference = endTime - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-r from-zinc-950 via-black to-zinc-950 border border-amber-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Title & Urgent Badge */}
      <div className="space-y-2 text-center md:text-left z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-extrabold uppercase tracking-widest animate-pulse">
          <Flame className="w-3.5 h-3.5 fill-amber-400" />
          {label}
        </div>
        <h3 className="text-2xl md:text-3xl font-extrabold text-foreground">
          Fin de la Promotion dans :
        </h3>
        <p className="text-xs md:text-sm text-zinc-400">
          Profitez de nos réductions exceptionnelles sur les iPhones certifiés avec livraison express à Dakar.
        </p>
      </div>

      {/* 3D Flip Clock Counter */}
      <div className="flex items-center gap-3 md:gap-5 z-10">
        <FlipUnit value={timeLeft.hours} unit="Heures" />
        <span className="text-2xl font-mono font-bold text-amber-500 pb-6">:</span>
        <FlipUnit value={timeLeft.minutes} unit="Minutes" />
        <span className="text-2xl font-mono font-bold text-amber-500 pb-6">:</span>
        <FlipUnit value={timeLeft.seconds} unit="Secondes" />
      </div>
    </div>
  );
}
