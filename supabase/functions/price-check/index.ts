// Edge Function: price-check
// Validates current odds vs user's last seen odds and flags drift

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BetLeg {
  sport: string;
  league: string;
  team1: string;
  team2: string;
  market: string;
  selection: string;
  player?: string;
  line?: number;
  lastSeenOdds: number;
}

interface PriceCheckRequest {
  legs: BetLeg[];
  thresholdBps?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { legs, thresholdBps = 50 }: PriceCheckRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = await Promise.all(
      legs.map(async (leg) => {
        // Query player_props_snapshots for latest odds
        let query = supabase
          .from('player_props_snapshots')
          .select('odds, bookmaker, last_updated')
          .eq('sport', leg.sport)
          .eq('league', leg.league)
          .eq('team1', leg.team1)
          .eq('team2', leg.team2)
          .eq('market', leg.market)
          .gte('game_date', new Date().toISOString())
          .order('last_updated', { ascending: false })
          .limit(20);

        if (leg.player) {
          query = query.eq('player', leg.player);
        }
        if (leg.line !== undefined) {
          query = query.eq('line', leg.line);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching odds:', error);
          return {
            ...leg,
            latestOdds: leg.lastSeenOdds,
            bpsDiff: 0,
            changed: false,
            error: 'Failed to fetch current odds',
          };
        }

        // Get best odds from recent snapshots
        const bestOdds = data && data.length > 0
          ? Math.max(...data.map(d => d.odds))
          : leg.lastSeenOdds;

        const bpsDiff = Math.round(((bestOdds - leg.lastSeenOdds) / leg.lastSeenOdds) * 10000);
        const changed = Math.abs(bpsDiff) > thresholdBps;

        return {
          ...leg,
          latestOdds: bestOdds,
          bpsDiff,
          changed,
          bookmakers: data?.slice(0, 3).map(d => ({ bookmaker: d.bookmaker, odds: d.odds })) || [],
        };
      })
    );

    const anyChanged = results.some(r => r.changed);

    return new Response(
      JSON.stringify({
        status: anyChanged ? 'changed' : 'ok',
        thresholdBps,
        legs: results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Price check error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
