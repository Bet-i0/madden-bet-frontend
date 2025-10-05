import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompactGame {
  gameId: string;
  league: string;
  startTime: string;
  home: string;
  away: string;
  markets: Array<{
    market: string;
    odds: Array<{
      side: string;
      book: string;
      odds: number;
    }>;
  }>;
}

interface AIEdgePick {
  gameId: string;
  league: string;
  home: string;
  away: string;
  market: string;
  side: string;
  book: string;
  odds: number;
  confidence: number;
  reason: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY_SUGGESTIONS')!;

    if (!openaiKey) {
      throw new Error('OPENAI_API_KEY_SUGGESTIONS not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get upcoming games (next 72 hours)
    const now = new Date();
    const endTime = new Date(now.getTime() + 72 * 60 * 60 * 1000);

    const { data: odds, error: oddsError } = await supabase
      .from('odds_snapshots')
      .select('*')
      .in('sport', ['americanfootball_nfl', 'americanfootball_ncaaf'])
      .gte('game_date', now.toISOString())
      .lte('game_date', endTime.toISOString())
      .order('game_date', { ascending: true })
      .limit(50);

    if (oddsError) {
      console.error('Error fetching odds:', oddsError);
      throw oddsError;
    }

    if (!odds || odds.length === 0) {
      return new Response(
        JSON.stringify({ picks: [], message: 'No upcoming games found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group by game
    const gamesMap = new Map<string, CompactGame>();
    
    odds.forEach((odd: any) => {
      const gameKey = `${odd.sport}-${odd.team1}-${odd.team2}-${odd.game_date}`;
      
      if (!gamesMap.has(gameKey)) {
        gamesMap.set(gameKey, {
          gameId: gameKey,
          league: odd.league || odd.sport,
          startTime: odd.game_date,
          home: odd.team1,
          away: odd.team2,
          markets: []
        });
      }

      const game = gamesMap.get(gameKey)!;
      let market = game.markets.find(m => m.market === odd.market);
      
      if (!market) {
        market = { market: odd.market, odds: [] };
        game.markets.push(market);
      }

      market.odds.push({
        side: odd.market.includes('h2h') ? (odd.team1 === odd.team1 ? 'home' : 'away') : 'unknown',
        book: odd.bookmaker,
        odds: Number(odd.odds)
      });
    });

    const games = Array.from(gamesMap.values()).slice(0, 12);

    // Call OpenAI for edge ranking
    const systemPrompt = `You are an expert sports betting analyst for NFL and NCAAF.
Analyze the odds data and identify 3-8 high-confidence betting edges based on:
- Line value vs market consensus
- Sharp book positioning
- Outlier pricing indicating information advantage

For each pick, provide a confidence score (70-95) and concise reasoning (max 100 chars).
Focus only on legitimate edges, not just favorites.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Upcoming games with best odds:\n${JSON.stringify(games, null, 2)}` }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'edge_picks',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                picks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      gameId: { type: 'string' },
                      league: { type: 'string' },
                      home: { type: 'string' },
                      away: { type: 'string' },
                      market: { type: 'string' },
                      side: { type: 'string' },
                      book: { type: 'string' },
                      odds: { type: 'number' },
                      confidence: { type: 'number' },
                      reason: { type: 'string' }
                    },
                    required: ['gameId', 'league', 'home', 'away', 'market', 'side', 'book', 'odds', 'confidence', 'reason'],
                    additionalProperties: false
                  }
                }
              },
              required: ['picks'],
              additionalProperties: false
            }
          }
        },
        max_tokens: 1000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const picks = JSON.parse(aiResult.choices[0].message.content);

    return new Response(
      JSON.stringify(picks),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-edge-ranking:', error);
    return new Response(
      JSON.stringify({ error: error.message, picks: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});