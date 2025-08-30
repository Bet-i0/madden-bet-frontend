import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StrategyTemplate {
  id: string;
  name: string;
  basePrompt: string;
  tags: string[];
}

const strategyTemplates: StrategyTemplate[] = [
  {
    id: 'value-hunter',
    name: 'Value Hunter Pro',
    basePrompt: 'Analyze value betting opportunities using line shopping and market inefficiencies. Focus on finding the best odds across multiple sportsbooks for maximum expected value.',
    tags: ['Line Shopping', 'Value Betting', 'AI Powered']
  },
  {
    id: 'momentum-play', 
    name: 'Momentum Surge',
    basePrompt: 'Capitalize on rapid line movements and public sentiment shifts. Target contrarian opportunities when the public overreacts.',
    tags: ['Line Movement', 'Public Betting', 'Contrarian']
  },
  {
    id: 'injury-impact',
    name: 'Injury Intelligence',
    basePrompt: 'React to late-breaking injury news before lines adjust. Focus on player props and game totals.',
    tags: ['Breaking News', 'Player Props', 'Fast Action']
  },
  {
    id: 'weather-edge',
    name: 'Weather Warrior', 
    basePrompt: 'Exploit weather-dependent betting opportunities in outdoor games. Focus on totals and game environment factors.',
    tags: ['Weather', 'Totals', 'Game Environment']
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY_STRATEGY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Strategy content generator started');

    // Get current game data from odds_snapshots
    const { data: gameData, error: gameError } = await supabase
      .from('odds_snapshots')
      .select('*')
      .gte('game_date', new Date().toISOString())
      .order('game_date', { ascending: true })
      .limit(20);

    if (gameError) {
      console.error('Error fetching game data:', gameError);
      throw gameError;
    }

    console.log(`Found ${gameData?.length || 0} upcoming games`);

    // Group games by matchup
    const gamesByMatchup = new Map();
    gameData?.forEach(game => {
      const key = `${game.team1}_vs_${game.team2}_${game.sport}_${game.league}`;
      if (!gamesByMatchup.has(key)) {
        gamesByMatchup.set(key, {
          team1: game.team1,
          team2: game.team2,
          sport: game.sport,
          league: game.league,
          game_date: game.game_date,
          markets: []
        });
      }
      gamesByMatchup.get(key).markets.push({
        market: game.market,
        bookmaker: game.bookmaker,
        odds: game.odds
      });
    });

    const games = Array.from(gamesByMatchup.values());
    
    // Generate content for each strategy
    for (const template of strategyTemplates) {
      try {
        console.log(`Generating content for strategy: ${template.id}`);

        // Build context with real game data
        const gameContext = games.map(game => {
          const marketData = game.markets.map(m => 
            `${m.market}: ${m.odds > 0 ? '+' : ''}${m.odds} (${m.bookmaker})`
          ).join(', ');
          
          return `${game.team1} vs ${game.team2} (${game.league}) - ${new Date(game.game_date).toLocaleDateString()}: ${marketData}`;
        }).join('\n');

        const fullPrompt = `${template.basePrompt}

Current Games and Odds:
${gameContext}

Generate 3-4 specific betting picks based on this strategy, including:
- Specific teams/games to bet on
- Recommended bet types (spread, moneyline, total, props)
- Confidence levels (70-95%)
- Brief rationale for each pick
- Expected ROI estimate
- Optimal timeframe for placing bets

Format as a JSON object with: confidence, expectedRoi, timeframe, picks (array of pick objects with id, title, odds, bookmaker, game, league, confidence, rationale, startTime).`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4.1-2025-04-14',
            messages: [
              {
                role: 'system',
                content: 'You are a professional sports betting analyst. Generate realistic betting strategies based on current market conditions and game data. Always respond with valid JSON.'
              },
              {
                role: 'user',
                content: fullPrompt
              }
            ],
            max_tokens: 2000,
            temperature: 0.7
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const aiResponse = await response.json();
        const content = aiResponse.choices[0].message.content;

        let parsedContent;
        try {
          parsedContent = JSON.parse(content);
        } catch (parseError) {
          console.error('Failed to parse AI response as JSON:', content);
          // Fallback content
          parsedContent = {
            confidence: 75 + Math.floor(Math.random() * 20),
            expectedRoi: `+${(Math.random() * 8 + 2).toFixed(1)}%`,
            timeframe: ['Live', '2h', '4h', '6h'][Math.floor(Math.random() * 4)],
            picks: []
          };
        }

        // Set valid_until to 5 hours from now
        const validUntil = new Date();
        validUntil.setHours(validUntil.getHours() + 5);

        // Delete existing content for this strategy
        await supabase
          .from('strategy_content')
          .delete()
          .eq('strategy_id', template.id);

        // Insert new content
        const { error: insertError } = await supabase
          .from('strategy_content')
          .insert({
            strategy_id: template.id,
            strategy_name: template.name,
            content: parsedContent,
            picks: parsedContent.picks || [],
            confidence: parsedContent.confidence || 85,
            expected_roi: parsedContent.expectedRoi || '+5.2%',
            timeframe: parsedContent.timeframe || '4h',
            valid_until: validUntil.toISOString()
          });

        if (insertError) {
          console.error(`Error inserting strategy content for ${template.id}:`, insertError);
        } else {
          console.log(`Successfully generated content for ${template.id}`);
        }

      } catch (error) {
        console.error(`Error generating content for strategy ${template.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Strategy content generation completed',
        strategiesUpdated: strategyTemplates.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in strategy-content-generator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});