import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseOddsLastUpdatedReturn {
  lastUpdated: Date | null;
  loading: boolean;
  error?: string;
  refresh: () => void;
}

export const useOddsLastUpdated = (): UseOddsLastUpdatedReturn => {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const fetchLastUpdated = async () => {
    try {
      setLoading(true);
      setError(undefined);

      const { data, error: fetchError } = await supabase
        .from('odds_snapshots')
        .select('last_updated')
        .order('last_updated', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        // Error fetching odds last updated
        setError(fetchError.message);
        setLastUpdated(null);
      } else if (data) {
        setLastUpdated(new Date(data.last_updated));
      } else {
        setLastUpdated(null);
      }
    } catch (err) {
      // Unexpected error fetching odds
      setError('Failed to fetch odds timestamp');
      setLastUpdated(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLastUpdated();

    // Poll every 60 seconds to keep the display current
    const interval = setInterval(fetchLastUpdated, 60000);

    return () => clearInterval(interval);
  }, []);

  return {
    lastUpdated,
    loading,
    error,
    refresh: fetchLastUpdated,
  };
};
