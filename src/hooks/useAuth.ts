import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabaseClient } from '../services/supabaseClient';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        // 세션 가져오기 에러 무시
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: authListener } = supabaseClient.auth.onAuthStateChange(
      (event, session) => {
        // Only update user state for legitimate auth events
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          setUser(session?.user || null);
        } else if (event === 'SIGNED_OUT') {
          // Only clear user if explicitly signed out
          setUser(null);
        } else if (event === 'INITIAL_SESSION') {
          // Handle initial session
          setUser(session?.user || null);
        }

        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      // 먼저 로컬 상태를 null로 설정
      setUser(null);

      // 그다음 Supabase 로그아웃 시도 (실패해도 상관없음)
      supabaseClient.auth.signOut().catch(() => {
        // Supabase 로그아웃 에러 무시
      });
    } catch (error) {
      // 에러가 나도 로컬 상태는 null로 설정
      setUser(null);
    }
  };

  return {
    user,
    loading,
    signOut,
  };
}