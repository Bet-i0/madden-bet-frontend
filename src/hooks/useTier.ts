import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type Tier = 'starter' | 'pro' | 'degenerate' | 'admin' | 'unknown';

export const useTier = () => {
  const [tier, setTier] = useState<Tier>('unknown');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTier = async () => {
      if (!user) {
        setTier('starter');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_tiers')
          .select('tier')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching tier:', error);
          setTier('starter');
        } else {
          setTier((data?.tier as Tier) ?? 'starter');
        }
      } catch (error) {
        console.error('Error in tier fetch:', error);
        setTier('starter');
      } finally {
        setLoading(false);
      }
    };

    fetchTier();
  }, [user]);

  return { tier, loading };
};
