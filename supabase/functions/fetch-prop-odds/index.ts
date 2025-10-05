import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Market normalization map: Odds API keys → Our standard codes
// Phase 1: Football markets only (US-only scope)
const MARKET_MAP: Record<string, string> = {
  'player_pass_yds': 'PA',
  'player_rush_yds': 'RY',
  'player_receptions': 'REC',
  'player_reception_yds': 'RECY',
  'player_pass_tds': 'PTD',
  'player_rush_tds': 'RTD',
  
  // Phase 2: Basketball markets (commented out for now)
  // 'player_points': 'PTS',
  // 'player_rebounds': 'REB',
  // 'player_assists': 'AST',
  // 'player_threes': '3PM',
};

// Throttle utility to avoid rate limits
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Convert American odds to Decimal odds
function americanToDecimal(americanOdds: number): number {
  if (americanOdds >= 0) {
    return 1 + (americanOdds / 100);
  } else {
    return 1 - (100 / americanOdds);
  }
}

// Normalize market key
function normalizeMarket(oddsApiMarket: string): string {
  return MARKET_MAP[oddsApiMarket] || oddsApiMarket.toUpperCase();
}

// Parse player name from outcome description
// Example: "Jalen Brunson Over 24.5 Points" → "Jalen Brunson"
function parsePlayerName(outcomeName: string): string {
  // Remove common suffixes like "Over", "Under", numbers, and market names
  const cleaned = outcomeName
    .replace(/\s+(Over|Under)\s+[\d.]+.*$/i, '')
    .trim();
  return cleaned;
}

serve(async (req) => {
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

    console.log('Starting player prop odds fetch...');

    // Sports to fetch player props for (Phase 1: Football only)
    const sports = [
      'americanfootball_nfl',
      'americanfootball_ncaaf',
    ];
    const regions = 'us';
    
    // Target bookmakers (US-only, williamhill_us is Caesars in the US)
    const targetBookmakers = ['draftkings', 'fanduel', 'betmgm', 'williamhill_us'];
    
    // Player prop markets to fetch
    const playerMarkets = Object.keys(MARKET_MAP).join(',');

    let totalPropsInserted = 0;
    const errors: string[] = [];

    for (const sport of sports) {
      try {
        console.log(`Fetching player props for ${sport}...`);
        
        // STEP 1: Fetch event list (metadata only, no bookmakers)
        const eventsResponse = await fetch(
          `https://api.the-odds-api.com/v4/sports/${sport}/events?apiKey=${oddsApiKey}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!eventsResponse.ok) {
          const errorMsg = `Failed to fetch events for ${sport}: ${eventsResponse.status}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          continue;
        }

        const events = await eventsResponse.json();
        console.log(`Retrieved ${events.length} events for ${sport}`);

        // Filter for games within next 24 hours
        const now = new Date();
        const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        const upcomingEvents = events.filter((event: any) => {
          const gameDate = new Date(event.commence_time);
          return gameDate >= now && gameDate <= oneDayFromNow;
        });

        console.log(`${upcomingEvents.length} games in next 24h for ${sport}`);

        // STEP 2: For each event, fetch odds with bookmakers
        for (const event of upcomingEvents) {
          // Throttle to avoid rate limits (120ms between calls)
          await sleep(120);

          const eventId = event.id;
          const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sport}/events/${eventId}/odds?regions=${regions}&oddsFormat=american&markets=${playerMarkets}&apiKey=${oddsApiKey}`;

          try {
            const oddsResponse = await fetch(oddsUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            // Log quota usage
            const requestsRemaining = oddsResponse.headers.get('x-requests-remaining');
            if (requestsRemaining) {
              console.log(`Quota remaining: ${requestsRemaining}`);
            }

            if (oddsResponse.status === 429) {
              console.warn(`Rate limited for event ${eventId}`);
              errors.push(`Rate limit for event ${eventId}`);
              continue;
            }

            if (!oddsResponse.ok) {
              console.warn(`Failed to fetch odds for event ${eventId}: ${oddsResponse.status}`);
              errors.push(`Event ${eventId}: ${oddsResponse.status}`);
              continue;
            }

            const oddsData = await oddsResponse.json();
            
            // Handle both response formats: {bookmakers: [...]} or [...] at root
            const bookmakers = Array.isArray(oddsData) ? oddsData : (oddsData?.bookmakers ?? []);
            
            if (!Array.isArray(bookmakers) || bookmakers.length === 0) {
              console.log(`No bookmakers for event ${eventId}`);
              continue;
            }

            const gameDate = new Date(event.commence_time);
            const league = sport === 'americanfootball_nfl' ? 'NFL' : 
                          sport === 'americanfootball_ncaaf' ? 'NCAAF' :
                          sport === 'basketball_nba' ? 'NBA' : sport;

            // Process bookmakers/markets/outcomes
            for (const bookmaker of bookmakers) {
              // Filter to target bookmakers only
              if (!targetBookmakers.includes(bookmaker.key)) {
                continue;
              }
              
              for (const market of (bookmaker.markets ?? [])) {
                // Skip _alternate markets (ladders)
                if (!market?.key || market.key.endsWith('_alternate')) {
                  continue;
                }
                
                // Skip unmapped markets
                if (!MARKET_MAP[market.key]) {
                  continue;
                }
                
                const normalizedMarket = normalizeMarket(market.key);
                
                for (const outcome of (market.outcomes ?? [])) {
                  try {
                    // Log the actual outcome data for debugging
                    console.log(`Outcome data: name="${outcome.name}", description="${outcome.description}", point=${outcome.point}`);
                    
                    // Extract player name and side from outcome.name
                    // Example: "Josh Allen Over 231.5" → player: "Josh Allen", side: "Over"
                    const nameMatch = (outcome.name || '').match(/^(.+?)\s+(Over|Under|Yes|No)\s+/i);
                    const playerName = nameMatch?.[1]?.trim() || '';
                    const side = nameMatch?.[2] || null;
                    
                    console.log(`Parsed: playerName="${playerName}", side="${side}"`);
                    
                    if (!playerName) {
                      console.log(`Skipping outcome - no player name parsed`);
                      continue;
                    }
                    
                    // Extract line (point, if present)
                    const line = outcome.point ?? null;
                    
                    // Convert American odds to Decimal
                    const americanOdds = Number(outcome.price);
                    if (!Number.isFinite(americanOdds)) {
                      continue;
                    }
                    
                    const decimalOdds = americanToDecimal(americanOdds);
                    
                    // Sanity check (both upper and lower bounds)
                    if (decimalOdds <= 1.01 || decimalOdds >= 1000) {
                      console.warn(`Invalid odds for ${playerName} ${normalizedMarket}: ${decimalOdds}`);
                      continue;
                    }
                    
                    const propSnapshot = {
                      sport: sport,
                      league: league,
                      team1: event.home_team,
                      team2: event.away_team,
                      game_date: gameDate.toISOString(),
                      player: playerName,
                      team: '', // Team affiliation not reliably available from API for player props
                      market: normalizedMarket,
                      line: line === null || typeof line === 'undefined' ? null : Number(line),
                      odds: Number(decimalOdds.toFixed(3)),
                      bookmaker: bookmaker.key,
                      side: side,
                    };

                    // UPSERT with conflict key
                    const { error: insertError } = await supabase
                      .from('player_props_snapshots')
                      .upsert(propSnapshot, { 
                        onConflict: 'player,market,line,bookmaker,game_date'
                      });

                    if (insertError) {
                      console.error('Error inserting prop:', insertError);
                      errors.push(`Insert error: ${insertError.message}`);
                    } else {
                      totalPropsInserted++;
                    }
                  } catch (parseError: any) {
                    console.error('Error parsing outcome:', parseError);
                    errors.push(`Parse error: ${parseError.message}`);
                  }
                }
              }
            }
          } catch (eventError: any) {
            console.error(`Error fetching odds for event ${eventId}:`, eventError);
            errors.push(`Event ${eventId}: ${eventError.message}`);
          }
        }
      } catch (sportError: any) {
        console.error(`Error processing ${sport}:`, sportError);
        errors.push(`Sport error (${sport}): ${sportError.message}`);
      }
    }

    console.log(`Player prop fetch complete. Inserted/updated ${totalPropsInserted} props`);
    if (errors.length > 0) {
      console.warn(`Encountered ${errors.length} errors:`, errors.slice(0, 5));
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        propsInserted: totalPropsInserted,
        errorsCount: errors.length,
        message: 'Player props fetched and stored successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-prop-odds function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
