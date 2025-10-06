import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InjuryCandidate {
  game_date: string;
  player: string;
  market: string;
  line: number;
  bookmaker: string;
  odds: number;
  status: 'Out' | 'Doubtful' | 'Questionable';
  published_at: string;
  consensus_prob_now: number;
  consensus_prob_60m: number;
  consensus_change_60m: number;
  lag_prob: number;
  pick_score: number;
}

export interface InjuryScanResult {
  player: string;
  status: string;
  headline: string;
  source: string;
  url: string;
  published_at: string;
  confidence: number;
}

export const useInjuryIntelligence = () => {
  const [candidates, setCandidates] = useState<InjuryCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string>();
  const { toast } = useToast();

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError(undefined);

      const { data, error: fetchError } = await supabase.rpc('fn_injury_candidates', {
        as_of: new Date().toISOString(),
        top_n: 20
      });

      if (fetchError) {
        console.error('Error fetching injury candidates:', fetchError);
        setError(fetchError.message);
        return;
      }

      setCandidates((data || []) as InjuryCandidate[]);
    } catch (err) {
      console.error('Error in useInjuryIntelligence:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch injury candidates');
    } finally {
      setLoading(false);
    }
  };

  const scanInjuries = async (players?: string[]) => {
    try {
      setScanning(true);
      toast({
        title: "Scanning Injuries",
        description: "Fetching latest injury news from multiple sources...",
      });

      const { data, error: scanError } = await supabase.functions.invoke('injury-scan', {
        body: players ? { players } : {}
      });

      if (scanError) {
        console.error('Error scanning injuries:', scanError);
        toast({
          title: "Scan Failed",
          description: scanError.message,
          variant: "destructive",
        });
        return;
      }

      const results = data as InjuryScanResult[];
      toast({
        title: "Scan Complete",
        description: `Found ${results.length} injury reports. Refreshing candidates...`,
      });

      // Refresh candidates after scan
      await fetchCandidates();
    } catch (err) {
      console.error('Error in scanInjuries:', err);
      toast({
        title: "Scan Error",
        description: err instanceof Error ? err.message : 'Failed to scan injuries',
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchCandidates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    candidates,
    loading,
    scanning,
    error,
    refresh: fetchCandidates,
    scanInjuries,
  };
};
