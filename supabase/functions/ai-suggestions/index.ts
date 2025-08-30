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
  const mockSuggestions: SuggestionPick[] = [
    {
      id: `mock-${trendId}-1`,
      category: category,
      market: "Moneyline",
      title: "Chiefs to win vs Raiders",
      odds: -150,
      bookmaker: "draftkings",
      confidence: 78,
      rationale: "Strong home field advantage and recent performance trends favor the Chiefs",
      game: "Kansas City Chiefs vs Las Vegas Raiders",
      league: "NFL",
      startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `mock-${trendId}-2`,
      category: category,
      market: "Point Spread",
      title: "Lakers +3.5 vs Warriors",
      odds: -110,
      bookmaker: "fanduel",
      confidence: 65,
      rationale: "Lakers have covered the spread in 4 of their last 5 games against Golden State",
      game: "Los Angeles Lakers vs Golden State Warriors",
      league: "NBA",
      startTime: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `mock-${trendId}-3`,
      category: category,
      market: "Over/Under",
      title: "Over 52.5 total points - Bills vs Dolphins",
      odds: -105,
      bookmaker: "caesars",
      confidence: 82,
      rationale: "Both teams averaging high-scoring games this season, weather conditions favorable",
      game: "Buffalo Bills vs Miami Dolphins",
      league: "NFL",
      startTime: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    }
  ];

  return mockSuggestions;
}