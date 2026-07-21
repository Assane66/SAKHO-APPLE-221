// src/components/countdown-timer.tsx
'use client';

import { useState, useEffect } from 'react';
import type { Timestamp } from 'firebase/firestore';

interface CountdownTimerProps {
  endDate: Timestamp;
}

export function CountdownTimer({ endDate }: CountdownTimerProps) {
  const calculateTimeLeft = () => {
    const difference = endDate.toMillis() - new Date().getTime();
    let timeLeft: Record<string, number> = {};

    if (difference > 0) {
      timeLeft = {
        jours: Math.floor(difference / (1000 * 60 * 60 * 24)),
        heures: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        secondes: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  const timerComponents: JSX.Element[] = [];

  Object.entries(timeLeft).forEach(([interval, value]) => {
    if (value <= 0 && interval !== 'secondes') { // Toujours afficher les secondes si c'est le seul restant
      if(Object.values(timeLeft).slice(0, Object.keys(timeLeft).indexOf(interval)).every(v => v === 0)) {
         // ne rien faire, pour ne pas afficher les jours s'il n'y en a pas
      } else {
        return;
      }
    }
    
    // Add leading zero
    const paddedValue = String(value).padStart(2, '0');

    timerComponents.push(
      <span key={interval}>
        {paddedValue}{interval.charAt(0)}
      </span>
    );
  });
  
  return (
    <div>
      {timerComponents.length ? timerComponents.reduce((prev, curr) => <>{prev} : {curr}</>) : <span>Offre terminée !</span>}
    </div>
  );
}
