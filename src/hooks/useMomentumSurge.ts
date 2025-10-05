import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MomentumSurgePick {
  game_date: string;
  player: string;
  market: string;
  line: number;
  bookmaker: string;
  odds_now: number;
  consensus_prob_now: number;
  consensus_prob_15m: number;
  consensus_prob_60m: number;
  consensus_change_15m: number;
  consensus_change_60m: number;
  book_prob_now: number;
  book_prob_15m: number;
  book_change_15m: number;
  lag_prob: number;
  momentum_score: number;
  book_count: number;
  rationale?: string;
}

interface RationaleResponse {
  picks: MomentumSurgePick[];
}

export const useMomentumSurge = (autoLoad = true) => {
  const [picks, setPicks] = useState<MomentumSurgePick[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [rationalesLoading, setRationalesLoading] = useState(false);
  const { toast } = useToast();

  const fetchPicks = async (limit: number = 20) => {
    try {
      setLoading(true);
      setError(undefined);

      const { data, error: fetchError } = await supabase
        .rpc('fn_momentum_surge', { 
          as_of: new Date().toISOString(),
          lookback_mins_1: 15,
          lookback_mins_2: 60,
          top_n: limit 
        });

      if (fetchError) {
        console.error('Error fetching momentum surge picks:', fetchError);
        setError(fetchError.message);
        return;
      }

      setPicks(data || []);
    } catch (err) {
      console.error('Error in useMomentumSurge:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch momentum surge picks');
    } finally {
      setLoading(false);
    }
  };

  const fetchRationales = async (picksToEnrich?: MomentumSurgePick[]) => {
    const targetPicks = picksToEnrich || picks;
    if (targetPicks.length === 0) return;

    try {
      setRationalesLoading(true);

      const { data, error: rationaleError } = await supabase.functions.invoke(
        'ai-strategy-rationale',
        {
          body: {
            segment: 'momentum_surge',
            picks: targetPicks.slice(0, 20),
            context: {
              windows: ['15m', '60m']
            }
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
      title: "Refreshing Momentum Surge picks",
      description: "Analyzing recent line movements...",
    });
    
    await fetchPicks();
    
    if (withRationales) {
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
