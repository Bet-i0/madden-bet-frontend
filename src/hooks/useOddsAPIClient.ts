/**
 * React Hook for The Odds API v4 Client
 * Demonstrates usage patterns for featured vs non-featured markets
 */

import { useState, useCallback } from 'react';
import { getOddsAPIClient } from '@/lib/oddsApi';
import type { 
  Sport, Event, APIResponse, GetOddsParams, 
  GetEventOddsParams, MarketKey, RegionKey 
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
 * Hook for interacting with The Odds API v4
 * Automatically handles caching, rate limiting, and error management
 */
export function useOddsAPIClient(): UseOddsAPIReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState<{
    used: number;
    remaining: number;
    lastRequest: string;
  } | null>(null);

  const client = getOddsAPIClient();

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

  const updateQuota = useCallback((response: APIResponse<any>) => {
    setQuota({
      used: response.quota.requestsUsed,
      remaining: response.quota.requestsRemaining,
      lastRequest: response.quota.requestsLast,
    });
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
      const response = await client.getSports();
      updateQuota(response);
      return response.data;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, [client, handleError, updateQuota]);

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
      const params: GetOddsParams = {
        regions,
        markets,
        oddsFormat: 'american',
        dateFormat: 'iso',
      };
      
      const response = await client.getOdds(sport, params);
      updateQuota(response);
      
      console.log(`[OddsAPI] Estimated cost: ${response.estimatedCost} requests`);
      return response.data;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, [client, handleError, updateQuota]);

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
      // Determine sport-specific player prop markets
      let propMarkets: MarketKey[] = [];
      
      if (sport.includes('football')) {
        propMarkets = [
          'player_pass_yds', 'player_pass_tds',
          'player_rush_yds', 'player_receive_yds'
        ];
      } else if (sport.includes('basketball')) {
        propMarkets = [
          'player_points', 'player_assists', 
          'player_rebounds', 'player_threes'
        ];
      } else if (sport.includes('baseball')) {
        propMarkets = [
          'batter_hits', 'batter_home_runs',
          'pitcher_strikeouts'
        ];
      } else if (sport.includes('hockey')) {
        propMarkets = [
          'player_points', 'player_goals', 'player_assists'
        ];
      }
      
      const params: GetEventOddsParams = {
        regions,
        markets: propMarkets,
        oddsFormat: 'american',
        dateFormat: 'iso',
      };
      
      const response = await client.getEventOdds(sport, eventId, params);
      updateQuota(response);
      
      console.log(`[OddsAPI] Player props cost: ${response.estimatedCost} requests`);
      return response.data;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, [client, handleError, updateQuota]);

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
      const response = await client.getEventMarkets(sport, eventId, { regions });
      updateQuota(response);
      
      return response.data.markets.map(m => m.key);
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, [client, handleError, updateQuota]);

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
