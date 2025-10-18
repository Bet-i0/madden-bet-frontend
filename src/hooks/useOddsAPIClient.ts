/**
 * React Hook for The Odds API v4 Client
 * Demonstrates usage patterns for featured vs non-featured markets
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { 
  Sport, Event, MarketKey, RegionKey 
} from '@/lib/oddsApi/types';
import { OddsAPIError } from '@/lib/oddsApi';
import { toast } from '@/hooks/use-toast';

interface UseOddsAPIReturn {
  loading: boolean;
  error: string | null;
  quota: {
    used: number;
    remaining: number;
    lastRequest: string;
  } | null;
  getSports: () => Promise<Sport[] | null>;
  getFeaturedOdds: (sport: string, regions?: RegionKey[], markets?: MarketKey[]) => Promise<Event[] | null>;
  getPlayerProps: (sport: string, eventId: string, regions?: RegionKey[]) => Promise<Event | null>;
  discoverEventMarkets: (sport: string, eventId: string, regions?: RegionKey[]) => Promise<MarketKey[] | null>;
}

/**
 * Hook for interacting with The Odds API v4 through edge functions
 * NOTE: This hook calls edge functions, not the API directly
 * The API key is only available server-side for security
 */
export function useOddsAPIClient(): UseOddsAPIReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<{
    used: number;
    remaining: number;
    lastRequest: string;
  } | null>(null);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof OddsAPIError) {
      setError(err.userMessage);
      
      if (err.code !== 'EXCEEDED_FREQ_LIMIT') {
        toast({
          title: "API Error",
          description: err.userMessage,
          variant: "destructive",
        });
      }
      
      return null;
    }
    
    const message = err instanceof Error ? err.message : 'Unknown error occurred';
    setError(message);
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
    
    return null;
  }, []);


  /**
   * Get list of available sports
   * Cost: 0 (free)
   * Cache: 6 hours
   */
  const getSports = useCallback(async (): Promise<Sport[] | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // This would call an edge function that fetches sports
      // For now, return empty array as this is just a demo
      toast({
        title: "Demo Mode",
        description: "This would call an edge function to fetch sports. Use the 'Fetch Game Odds' button for real data.",
      });
      return [];
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  /**
   * Get featured markets (h2h, spreads, totals) for upcoming games
   * Cost: regions × markets
   * Cache: 60 seconds
   * 
   * Example: getFeaturedOdds('americanfootball_nfl', ['us'], ['h2h', 'spreads', 'totals'])
   */
  const getFeaturedOdds = useCallback(async (
    sport: string,
    regions: RegionKey[] = ['us'],
    markets: MarketKey[] = ['h2h', 'spreads', 'totals']
  ): Promise<Event[] | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // This calls the edge function that has access to the API key
      const { data, error: fnError } = await supabase.functions.invoke('fetch-odds', {
        body: { sport, regions, markets }
      });
      
      if (fnError) throw fnError;
      
      toast({
        title: "Odds Fetched",
        description: `Retrieved odds for ${sport}`,
      });
      
      return data || [];
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  /**
   * Get player props for a specific event
   * Cost: 10 × unique_markets × regions
   * Cache: 60 seconds
   * 
   * Example: getPlayerProps('basketball_nba', 'event123', ['us'])
   * This automatically fetches player_points, player_assists, player_rebounds
   */
  const getPlayerProps = useCallback(async (
    sport: string,
    eventId: string,
    regions: RegionKey[] = ['us']
  ): Promise<Event | null> => {
    setLoading(true);
    setError(null);
    
    try {
      // This calls the edge function that has access to the API key
      const { data, error: fnError } = await supabase.functions.invoke('fetch-prop-odds', {
        body: { sport, eventId, regions }
      });
      
      if (fnError) throw fnError;
      
      toast({
        title: "Player Props Fetched",
        description: `Retrieved props for event ${eventId}`,
      });
      
      return data || null;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  /**
   * Discover which markets are available for an event
   * Cost: 1
   * Cache: 5 minutes
   * 
   * Use this before calling getEventOdds to know which markets exist
   */
  const discoverEventMarkets = useCallback(async (
    sport: string,
    eventId: string,
    regions: RegionKey[] = ['us']
  ): Promise<MarketKey[] | null> => {
    setLoading(true);
    setError(null);
    
    try {
      toast({
        title: "Demo Mode",
        description: "Market discovery would call an edge function. See the Debug Panel for available markets.",
      });
      return [];
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  return {
    loading,
    error,
    quota,
    getSports,
    getFeaturedOdds,
    getPlayerProps,
    discoverEventMarkets,
  };
}
