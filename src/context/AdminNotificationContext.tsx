// src/context/AdminNotificationContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';

interface AdminNotificationContextType {
  newOrdersCount: number;
  newExchangesCount: number;
  clearNewOrders: () => void;
  clearNewExchanges: () => void;
}

const AdminNotificationContext = createContext<AdminNotificationContextType>({
  newOrdersCount: 0,
  newExchangesCount: 0,
  clearNewOrders: () => {},
  clearNewExchanges: () => {},
});

export const AdminNotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin } = useAuth();
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalExchanges, setTotalExchanges] = useState(0);

  const [seenOrdersCount, setSeenOrdersCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const stored = localStorage.getItem('seenOrdersCount');
    return stored ? parseInt(stored, 10) : 0;
  });

  const [seenExchangesCount, setSeenExchangesCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const stored = localStorage.getItem('seenExchangesCount');
    return stored ? parseInt(stored, 10) : 0;
  });

  useEffect(() => {
    if (!user || !isAdmin) return;

    // Listener for orders
    const ordersQuery = query(collection(db, "orders"));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      setTotalOrders(snapshot.size);
    });

    // Listener for exchanges
    const exchangesQuery = query(collection(db, "exchanges"));
    const unsubscribeExchanges = onSnapshot(exchangesQuery, (snapshot) => {
      setTotalExchanges(snapshot.size);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeExchanges();
    };
  }, [user, isAdmin]);

  const clearNewOrders = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('seenOrdersCount', totalOrders.toString());
      setSeenOrdersCount(totalOrders);
    }
  }, [totalOrders]);

  const clearNewExchanges = useCallback(() => {
     if (typeof window !== 'undefined') {
      localStorage.setItem('seenExchangesCount', totalExchanges.toString());
      setSeenExchangesCount(totalExchanges);
     }
  }, [totalExchanges]);

  const newOrdersCount = Math.max(0, totalOrders - seenOrdersCount);
  const newExchangesCount = Math.max(0, totalExchanges - seenExchangesCount);

  return (
    <AdminNotificationContext.Provider value={{ newOrdersCount, newExchangesCount, clearNewOrders, clearNewExchanges }}>
      {children}
    </AdminNotificationContext.Provider>
  );
};

export const useAdminNotifications = () => useContext(AdminNotificationContext);
