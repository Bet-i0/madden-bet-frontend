import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ValueHunterPick {
  game_date: string;
  player: string;
  market: string;
  line: number;
  best_book: string;
  best_odds: number;
  consensus_odds: number;
  book_count: number;
  edge_prob: number;
  edge_bps: number;
  rationale?: string;
}

interface RationaleResponse {
  picks: ValueHunterPick[];
}

export const useValueHunter = (autoLoad = true) => {
  const [picks, setPicks] = useState<ValueHunterPick[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [rationalesLoading, setRationalesLoading] = useState(false);
  const { toast } = useToast();

  const fetchPicks = async (topN: number = 20) => {
    try {
      setLoading(true);
      setError(undefined);

      const { data, error: fetchError } = await supabase
        .rpc('fn_value_hunter', { top_n: topN });

      if (fetchError) {
        console.error('Error fetching value hunter picks:', fetchError);
        setError(fetchError.message);
        return;
      }

      setPicks(data || []);
    } catch (err) {
      console.error('Error in useValueHunter:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch value hunter picks');
    } finally {
      setLoading(false);
    }
  };

  const fetchRationales = async (picksToEnrich?: ValueHunterPick[]) => {
    const targetPicks = picksToEnrich || picks;
    if (targetPicks.length === 0) return;

    try {
      setRationalesLoading(true);

      const { data, error: rationaleError } = await supabase.functions.invoke(
        'ai-strategy-rationale',
        {
          body: {
            segment: 'value_hunter',
            picks: targetPicks.slice(0, 20) // Limit to 20 for cost control
          }
        }
      );

      if (rationaleError) {
        console.error('Error fetching rationales:', rationaleError);
        toast({
          title: "Rationales unavailable",
          description: "Showing picks without AI rationales",
          variant: "destructive"
        });
        return;
      }

      const enrichedPicks = (data as RationaleResponse).picks;
      setPicks(enrichedPicks);
    } catch (err) {
      console.error('Error fetching rationales:', err);
    } finally {
      setRationalesLoading(false);
    }
  };

  const refresh = async (withRationales = false) => {
    toast({
      title: "Refreshing Value Hunter picks",
      description: "Analyzing latest props data...",
    });
    
    await fetchPicks();
    
    if (withRationales) {
      // Wait for picks to be set before fetching rationales
      setTimeout(() => fetchRationales(), 100);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      fetchPicks();
    }
  }, [autoLoad]);

  return { 
    picks, 
    loading, 
    error, 
    refresh, 
    fetchRationales,
    rationalesLoading 
  };
};
