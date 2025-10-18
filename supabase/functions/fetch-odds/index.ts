import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// The Odds API v4 - Canonical Configuration
const ODDS_API_BASE = 'https://api.the-odds-api.com';
const FEATURED_SPORTS = ['americanfootball_nfl', 'americanfootball_ncaaf'];
const FEATURED_MARKETS = ['h2h', 'spreads', 'totals'];
const TARGET_REGIONS = ['us'];
const TARGET_BOOKMAKERS = ['draftkings', 'betmgm', 'fanduel', 'williamhill_us'];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const oddsApiKey = Deno.env.get('ODDS_API_KEY');

    if (!oddsApiKey) {
      console.error('ODDS_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'ODDS_API_KEY not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if data fetching is enabled
    const { data: flagData, error: flagError } = await supabase
      .from('feature_flags')
      .select('enabled')
      .eq('key', 'data_fetching_enabled')
      .maybeSingle();

    if (flagError) {
      console.error('Error checking feature flag:', flagError);
    }

    if (flagData && !flagData.enabled) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Data fetching is currently disabled' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting odds fetch - The Odds API v4...');
    const startTime = Date.now();
    let totalInserted = 0;
    let quotaUsed = 0;
    let quotaRemaining = 0;

    for (const sport of FEATURED_SPORTS) {
      try {
        const params = new URLSearchParams({
          apiKey: oddsApiKey,
          regions: TARGET_REGIONS.join(','),
          markets: FEATURED_MARKETS.join(','),
          oddsFormat: 'decimal',
          dateFormat: 'iso',
          bookmakers: TARGET_BOOKMAKERS.join(',')
        });

        const apiUrl = `${ODDS_API_BASE}/v4/sports/${sport}/odds?${params}`;
        console.log(`Fetching ${sport}...`);

        const oddsResponse = await fetch(apiUrl);
        
        quotaUsed = parseInt(oddsResponse.headers.get('x-requests-used') || '0');
        quotaRemaining = parseInt(oddsResponse.headers.get('x-requests-remaining') || '0');
        console.log(`Quota: Used=${quotaUsed}, Remaining=${quotaRemaining}`);

        if (!oddsResponse.ok) {
          console.error(`API error for ${sport}: ${oddsResponse.status}`);
          continue;
        }

        const oddsData = await oddsResponse.json();
        console.log(`Received ${oddsData.length} events`);

        // Filter for live and upcoming games within 1 day
        const now = new Date();
        const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        // Process and insert odds data only for relevant games
        for (const game of oddsData) {
          const gameDate = new Date(game.commence_time);
          
          // Skip games outside our time window (live + upcoming within 1 day)
          if (gameDate < sixHoursAgo || gameDate > oneDayFromNow) {
            continue;
          }
          
          // Normalize league for consistent filtering
          const league = sport === 'americanfootball_nfl' ? 'NFL' : 'NCAAF';
          
            for (const bookmaker of game.bookmakers) {
            if (!TARGET_BOOKMAKERS.includes(bookmaker.key)) continue;
            
            for (const market of bookmaker.markets) {
              for (const outcome of market.outcomes) {
                const oddsToInsert = {
                  sport,
                  league,
                  team1: game.home_team,
                  team2: game.away_team,
                  market: `${market.key}_${outcome.name}`,
                  odds: outcome.price,
                  bookmaker: bookmaker.key,
                  game_date: gameDate.toISOString(),
                };

                const { error } = await supabase
                  .from('odds_snapshots')
                  .upsert(oddsToInsert, { onConflict: 'sport,league,team1,team2,market,bookmaker' });

                if (!error) totalInserted++;
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error processing ${sport}:`, error);
      }
    }

    // Clean up old odds snapshots (older than 24 hours)
    const { error: cleanupError } = await supabase
      .from('odds_snapshots')
      .delete()
      .lt('last_updated', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (cleanupError) {
      console.error('Error cleaning up old odds:', cleanupError);
    }

    const duration = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({ 
        success: true,
        odds_inserted: totalInserted,
        duration_ms: duration,
        quota_used: quotaUsed,
        quota_remaining: quotaRemaining,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-odds function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});