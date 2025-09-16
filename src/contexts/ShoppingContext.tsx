import React, { createContext, useContext, useState, useEffect } from 'react';
import { ShoppingService } from '../services/ShoppingService';
import { supabaseClient } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';

interface ShoppingContextType {
  activeItemCount: number;
  refreshCount: () => Promise<void>;
}

const ShoppingContext = createContext<ShoppingContextType>({
  activeItemCount: 0,
  refreshCount: async () => {},
});

export const useShoppingCount = () => useContext(ShoppingContext);

export const ShoppingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeItemCount, setActiveItemCount] = useState(0);
  const { user } = useAuth();
  const shoppingService = new ShoppingService(supabaseClient);

  const refreshCount = async () => {
    if (!user?.id) {
      setActiveItemCount(0);
      return;
    }

    try {
      const count = await shoppingService.getActiveCount(user.id);
      setActiveItemCount(count);
    } catch (error) {
      console.error('Failed to get shopping count:', error);
      setActiveItemCount(0);
    }
  };

  // 초기 로드 및 user 변경 시 카운트 새로고침
  useEffect(() => {
    refreshCount();
  }, [user?.id]);

  // 실시간 구독 설정
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabaseClient
      .channel('shopping-count-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_list',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refreshCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  return (
    <ShoppingContext.Provider value={{ activeItemCount, refreshCount }}>
      {children}
    </ShoppingContext.Provider>
  );
};