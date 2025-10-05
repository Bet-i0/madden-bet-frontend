import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AIEdgePick {
  gameId: string;
  league: string;
  home: string;
  away: string;
  market: string;
  side: string;
  book: string;
  odds: number;
  confidence: number;
  reason: string;
}

export const useAIEdges = () => {
  const [picks, setPicks] = useState<AIEdgePick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const { toast } = useToast();

  const fetchEdges = async () => {
    try {
      setLoading(true);
      setError(undefined);

      const { data, error: fetchError } = await supabase.functions.invoke('ai-edge-ranking', {
        body: {}
      });

      if (fetchError) {
        console.error('Error fetching AI edges:', fetchError);
        setError(fetchError.message);
        return;
      }

      setPicks(data?.picks || []);
    } catch (err) {
      console.error('Error in useAIEdges:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch AI edges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEdges();
  }, []);

  const refresh = () => {
    toast({
      title: "Refreshing AI Edges",
      description: "Analyzing latest odds data...",
    });
    fetchEdges();
  };

  return { picks, loading, error, refresh };
};