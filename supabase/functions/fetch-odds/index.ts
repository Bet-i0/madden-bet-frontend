import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Starting odds fetch process...');

    // Sports to fetch odds for - focusing on football only
    const sports = [
      'americanfootball_nfl', 
      'americanfootball_ncaaf'
    ];
    const regions = 'us';
    const markets = 'h2h,spreads,totals';
    
    // Target bookmakers to reduce data load
    const targetBookmakers = ['draftkings', 'betmgm', 'fanduel', 'caesars', 'williamhill_us'];

    let totalOddsInserted = 0;

    for (const sport of sports) {
      try {
        console.log(`Fetching odds for ${sport}...`);
        
        const oddsResponse = await fetch(
          `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${oddsApiKey}&regions=${regions}&markets=${markets}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!oddsResponse.ok) {
          console.error(`Failed to fetch odds for ${sport}: ${oddsResponse.status}`);
          continue;
        }

        const oddsData = await oddsResponse.json();
        console.log(`Retrieved ${oddsData.length} games for ${sport}`);

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
            // Filter to only target bookmakers
            if (!targetBookmakers.includes(bookmaker.key)) {
              continue;
            }
            
            for (const market of bookmaker.markets) {
              for (const outcome of market.outcomes) {
                const oddsSnapshot = {
                  sport: sport,
                  league: league,
                  team1: game.home_team,
                  team2: game.away_team,
                  market: `${market.key}_${outcome.name}`,
                  odds: parseFloat(outcome.price),
                  bookmaker: bookmaker.key,
                  game_date: gameDate.toISOString(),
                };

                // Insert odds snapshot
                const { error: insertError } = await supabase
                  .from('odds_snapshots')
                  .upsert(oddsSnapshot, { 
                    onConflict: 'sport,league,team1,team2,market,bookmaker' 
                  });

                if (insertError) {
                  console.error('Error inserting odds:', insertError);
                } else {
                  totalOddsInserted++;
                }
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

    console.log(`Odds fetch complete. Inserted ${totalOddsInserted} odds snapshots`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        oddsInserted: totalOddsInserted,
        message: 'Odds fetched and stored successfully'
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