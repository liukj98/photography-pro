import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { isDemoMode, simulateNetworkDelay, createMockUser } from '../lib/demo-mode';
import type { User } from '../types';

interface UseUserResult {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUser(username: string | undefined): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!username) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Demo mode: return mock user
    if (isDemoMode()) {
      await simulateNetworkDelay(300);
      setUser(createMockUser(`${username}@example.com`, username));
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      setUser(data as User | null);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setError(err instanceof Error ? err.message : '获取用户信息失败');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, isLoading, error, refetch: fetchUser };
}
