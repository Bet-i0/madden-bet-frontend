// Edge Function: compute-clv-on-kickoff
// Captures closing odds for games at kickoff time

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComputeCLVRequest {
  sport: string;
  league: string;
  team1: string;
  team2: string;
  gameDate: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sport, league, team1, team2, gameDate }: ComputeCLVRequest = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Computing CLV for ${sport} ${league}: ${team1} vs ${team2} on ${gameDate}`);

    // Call get_closing_prices function
    const { data: closingPrices, error: rpcError } = await supabase.rpc('get_closing_prices', {
      p_sport: sport,
      p_league: league,
      p_team1: team1,
      p_team2: team2,
      p_game_date: gameDate,
    });

    if (rpcError) {
      console.error('Error calling get_closing_prices:', rpcError);
      throw rpcError;
    }

    if (!closingPrices || closingPrices.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No closing prices found',
          game: { sport, league, team1, team2, gameDate },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert closing odds into odds_closing table
    const closingOddsRecords = closingPrices.map((price: any) => ({
      sport,
      league,
      team1,
      team2,
      game_date: gameDate,
      market: price.market,
      selection: price.selection,
      line: price.line,
      decimal_odds: price.decimal_odds,
      bookmaker: price.bookmaker,
      captured_at: price.captured_at,
    }));

    const { error: insertError } = await supabase
      .from('odds_closing')
      .upsert(closingOddsRecords, {
        onConflict: 'sport,league,team1,team2,game_date,market,selection,bookmaker',
      });

    if (insertError) {
      console.error('Error inserting closing odds:', insertError);
      throw insertError;
    }

    console.log(`Successfully stored ${closingOddsRecords.length} closing odds`);

    // Update bet_legs with closing odds
    const { error: updateError } = await supabase
      .from('bet_legs')
      .update({ closing_odds: supabase.rpc('ARRAY') }) // This would need proper logic
      .eq('sport', sport)
      .eq('league', league)
      .eq('team1', team1)
      .eq('team2', team2)
      .is('closing_odds', null);

    return new Response(
      JSON.stringify({
        success: true,
        closingOddsCount: closingOddsRecords.length,
        game: { sport, league, team1, team2, gameDate },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('CLV computation error:', error);
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
