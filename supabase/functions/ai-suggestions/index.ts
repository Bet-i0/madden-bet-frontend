import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuggestionPick {
  id: string;
  category: string;
  market: string;
  title: string;
  odds: number;
  bookmaker: string;
  confidence: number;
  rationale: string;
  game: string;
  league: string;
  startTime: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY_SUGGESTIONS');

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { trendId, category } = await req.json();

    console.log(`AI suggestions request - User: ${user.id}, Trend: ${trendId}, Category: ${category}`);

    // Check cache first
    const { data: cachedSuggestions } = await supabase
      .from('ai_suggestions_cache')
      .select('suggestions, expires_at')
      .eq('trend_id', trendId)
      .eq('category', category)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cachedSuggestions) {
      console.log('Returning cached suggestions');
      return new Response(
        JSON.stringify({ suggestions: cachedSuggestions.suggestions }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user's subscription and usage limits
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    // Get user's current subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        subscription_plans(ai_calls_per_month)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    const monthlyLimit = subscription?.subscription_plans?.ai_calls_per_month || 10; // Default to free plan

    // Check current month usage
    const { data: usageData } = await supabase
      .from('ai_usage_logs')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', `${currentMonth}-01T00:00:00Z`)
      .lt('created_at', `${currentMonth}-31T23:59:59Z`);

    const currentUsage = usageData?.length || 0;

    if (currentUsage >= monthlyLimit) {
      return new Response(
        JSON.stringify({ 
          error: 'Monthly AI usage limit exceeded',
          currentUsage,
          monthlyLimit,
          upgradeRequired: true
        }), 
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch recent odds data for context
    const { data: oddsData } = await supabase
      .from('odds_snapshots')
      .select('*')
      .gte('last_updated', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()) // Last 6 hours
      .limit(50);

    let suggestions: SuggestionPick[] = [];

    if (!openaiApiKey) {
      console.log('OpenAI API key not found, returning mock data');
      // Generate mock suggestions when OpenAI key is not available
      suggestions = generateMockSuggestions(trendId, category);
    } else {
      // Generate AI suggestions using OpenAI
      console.log('Generating AI suggestions with OpenAI...');
      
      const oddsContext = oddsData?.slice(0, 10).map(odds => 
        `${odds.team1} vs ${odds.team2} (${odds.league}) - ${odds.market}: ${odds.odds} (${odds.bookmaker})`
      ).join('\n');

      const prompt = `Based on trending topic #${trendId} and category "${category}", analyze these current sports betting odds and generate 3-5 betting suggestions:

${oddsContext}

For each suggestion, provide:
1. A clear betting recommendation
2. Confidence level (1-100)
3. Brief rationale
4. Relevant game and market

Respond in JSON format with array of objects containing: id, category, market, title, odds, bookmaker, confidence, rationale, game, league, startTime`;

      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are an expert sports betting analyst. Provide detailed, data-driven betting suggestions.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 2000,
            temperature: 0.7,
          }),
        });

        if (openaiResponse.ok) {
          const aiData = await openaiResponse.json();
          const aiSuggestions = JSON.parse(aiData.choices[0].message.content);
          suggestions = Array.isArray(aiSuggestions) ? aiSuggestions : aiSuggestions.suggestions || [];
          
          // Log usage
          await supabase.from('ai_usage_logs').insert({
            user_id: user.id,
            endpoint: 'ai-suggestions',
            tokens_used: aiData.usage?.total_tokens || 0,
            cost: 0 // Calculate based on your pricing model
          });
        } else {
          console.error('OpenAI API error:', await openaiResponse.text());
          suggestions = generateMockSuggestions(trendId, category);
        }
      } catch (error) {
        console.error('Error calling OpenAI API:', error);
        suggestions = generateMockSuggestions(trendId, category);
      }
    }

    // Cache the suggestions
    await supabase
      .from('ai_suggestions_cache')
      .upsert({
        trend_id: trendId,
        category: category,
        suggestions: suggestions,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour cache
      }, {
        onConflict: 'trend_id,category'
      });

    console.log(`Generated ${suggestions.length} suggestions for user ${user.id}`);

    return new Response(
      JSON.stringify({ suggestions }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-suggestions function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateMockSuggestions(trendId: number, category: string): SuggestionPick[] {
  const baseTime = Date.now();
  
  // Strategy-specific mock suggestions
  const strategyPicks: Record<string, SuggestionPick[]> = {
    'value-hunter': [
      {
        id: `mock-${trendId}-vh-1`,
        category: category,
        market: "Moneyline",
        title: "Fresno State ML vs Georgia Southern",
        odds: +105,
        bookmaker: "fanduel",
        confidence: 85,
        rationale: "Line discrepancy - FanDuel offering +105 while other books at +100. 5% value edge identified.",
        game: "Fresno State Bulldogs vs Georgia Southern Eagles",
        league: "NCAAF",
        startTime: new Date(baseTime + 23 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `mock-${trendId}-vh-2`,
        category: category,
        market: "Point Spread",
        title: "Texas A&M -24 vs UTSA",
        odds: -108,
        bookmaker: "betmgm",
        confidence: 72,
        rationale: "BetMGM has -108 while market consensus at -110. Sharp money on Texas A&M early.",
        game: "Texas A&M Aggies vs UTSA Roadrunners",
        league: "NCAAF",
        startTime: new Date(baseTime + 22 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `mock-${trendId}-vh-3`,
        category: category,
        market: "Over/Under",
        title: "Under 48.5 Fresno State vs Georgia Southern",
        odds: -105,
        bookmaker: "draftkings",
        confidence: 79,
        rationale: "DraftKings offering Under 48.5 at -105 vs market average of -110. Weather concerns driving value.",
        game: "Fresno State Bulldogs vs Georgia Southern Eagles",
        league: "NCAAF",
        startTime: new Date(baseTime + 23 * 60 * 60 * 1000).toISOString(),
      }
    ],
    'momentum-play': [
      {
        id: `mock-${trendId}-mp-1`,
        category: category,
        market: "Moneyline",
        title: "Georgia Southern +105 vs Fresno State",
        odds: +105,
        bookmaker: "caesars",
        confidence: 88,
        rationale: "Line moved from +115 to +105 in 2 hours. Reverse line movement indicates sharp action on underdog.",
        game: "Fresno State Bulldogs vs Georgia Southern Eagles",
        league: "NCAAF",
        startTime: new Date(baseTime + 23 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `mock-${trendId}-mp-2`,
        category: category,
        market: "Point Spread",
        title: "UTSA +24 vs Texas A&M",
        odds: -112,
        bookmaker: "williamhill_us",
        confidence: 74,
        rationale: "Public heavily on Texas A&M (89% tickets) but line hasn't moved. Contrarian opportunity.",
        game: "Texas A&M Aggies vs UTSA Roadrunners",
        league: "NCAAF",
        startTime: new Date(baseTime + 22 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `mock-${trendId}-mp-3`,
        category: category,
        market: "Over/Under",
        title: "Over 49 Fresno State vs Georgia Southern",
        odds: +102,
        bookmaker: "fanduel",
        confidence: 81,
        rationale: "Total dropped from 51 to 49. Steam on Over at reduced number - momentum building.",
        game: "Fresno State Bulldogs vs Georgia Southern Eagles",
        league: "NCAAF",
        startTime: new Date(baseTime + 23 * 60 * 60 * 1000).toISOString(),
      }
    ],
    'injury-impact': [
      {
        id: `mock-${trendId}-ii-1`,
        category: category,
        market: "Player Props",
        title: "Under 250.5 QB Passing Yards",
        odds: -115,
        bookmaker: "draftkings",
        confidence: 92,
        rationale: "Starting QB questionable with shoulder injury. Backup historically under 200 yards per game.",
        game: "Fresno State Bulldogs vs Georgia Southern Eagles",
        league: "NCAAF",
        startTime: new Date(baseTime + 23 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `mock-${trendId}-ii-2`,
        category: category,
        market: "Point Spread",
        title: "Texas A&M -23.5 (buy down)",
        odds: -130,
        bookmaker: "betmgm",
        confidence: 86,
        rationale: "UTSA key defensive player ruled out. Original line doesn't reflect this impact yet.",
        game: "Texas A&M Aggies vs UTSA Roadrunners",
        league: "NCAAF",
        startTime: new Date(baseTime + 22 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `mock-${trendId}-ii-3`,
        category: category,
        market: "Team Totals",
        title: "Under 28.5 Georgia Southern Team Total",
        odds: -108,
        bookmaker: "fanduel",
        confidence: 83,
        rationale: "Top WR injured in practice. Offense relies heavily on passing game - significant impact expected.",
        game: "Fresno State Bulldogs vs Georgia Southern Eagles",
        league: "NCAAF",
        startTime: new Date(baseTime + 23 * 60 * 60 * 1000).toISOString(),
      }
    ],
    'weather-edge': [
      {
        id: `mock-${trendId}-we-1`,
        category: category,
        market: "Over/Under",
        title: "Under 47.5 Fresno State vs Georgia Southern",
        odds: -102,
        bookmaker: "caesars",
        confidence: 89,
        rationale: "Heavy rain and 20+ mph winds forecasted. Passing games will struggle significantly.",
        game: "Fresno State Bulldogs vs Georgia Southern Eagles",
        league: "NCAAF",
        startTime: new Date(baseTime + 23 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `mock-${trendId}-we-2`,
        category: category,
        market: "Player Props",
        title: "Under 45.5 Longest Completion",
        odds: -110,
        bookmaker: "draftkings",
        confidence: 76,
        rationale: "Wind gusts up to 25 mph expected. Deep passing attempts will be limited.",
        game: "Texas A&M Aggies vs UTSA Roadrunners",
        league: "NCAAF",
        startTime: new Date(baseTime + 22 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `mock-${trendId}-we-3`,
        category: category,
        market: "Team Totals",
        title: "Over 185.5 Fresno State Rushing Yards",
        odds: +108,
        bookmaker: "betmgm",
        confidence: 84,
        rationale: "Weather favors ground game. Fresno State likely to lean heavily on rushing attack.",
        game: "Fresno State Bulldogs vs Georgia Southern Eagles",
        league: "NCAAF",
        startTime: new Date(baseTime + 23 * 60 * 60 * 1000).toISOString(),
      }
    ]
  };

  // Return strategy-specific picks or default to value-hunter
  return strategyPicks[category] || strategyPicks['value-hunter'];
}