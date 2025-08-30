import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Sports utilities
const SPORTS_MAP = {
  NFL: 'americanfootball_nfl',
  NCAAF: 'americanfootball_ncaaf',
  NBA: 'basketball_nba',
  NCAAB: 'basketball_ncaab',
  MLB: 'baseball_mlb',
  NHL: 'icehockey_nhl',
} as const;

const REVERSE_SPORTS_MAP = {
  americanfootball_nfl: 'NFL',
  americanfootball_ncaaf: 'NCAAF', 
  basketball_nba: 'NBA',
  basketball_ncaab: 'NCAAB',
  baseball_mlb: 'MLB',
  icehockey_nhl: 'NHL',
} as const;

const LEAGUE_ALIASES = {
  'nfl': ['nfl', 'national football league', 'american football nfl', 'pro football'],
  'ncaaf': ['ncaaf', 'college football', 'ncaa football', 'american football ncaaf', 'college'],
  'nba': ['nba', 'national basketball association', 'pro basketball'],
  'ncaab': ['ncaab', 'college basketball', 'ncaa basketball', 'march madness'],
  'mlb': ['mlb', 'major league baseball', 'baseball'],
  'nhl': ['nhl', 'national hockey league', 'hockey', 'ice hockey'],
} as const;

function getDisplaySportName(dbKey: string): string {
  return REVERSE_SPORTS_MAP[dbKey as keyof typeof REVERSE_SPORTS_MAP] || dbKey;
}

function detectLeagueFromMessage(message: string): string[] {
  const lowerMessage = message.toLowerCase();
  const detectedLeagues: string[] = [];
  
  for (const [league, aliases] of Object.entries(LEAGUE_ALIASES)) {
    if (aliases.some(alias => lowerMessage.includes(alias))) {
      const dbKey = SPORTS_MAP[league.toUpperCase() as keyof typeof SPORTS_MAP];
      if (dbKey && !detectedLeagues.includes(dbKey)) {
        detectedLeagues.push(dbKey);
      }
    }
  }
  
  return detectedLeagues;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY_COACH');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SYSTEM_PROMPT = `You are SportsBot, an advanced AI assistant for sports betting enthusiasts. You have access to real-time odds data and help users with:

**Core Expertise:**
- Sports betting strategy and analysis using live odds data
- Real-time odds interpretation and value betting opportunities
- Bankroll management and staking plans
- Statistical analysis and current trends
- Live betting opportunities based on real market data
- Parlay construction using actual available odds

**Your Personality:**
- Professional yet approachable
- Data-driven using real odds and market information
- Encouraging but emphasizes responsible gambling
- Uses current sports betting terminology naturally
- Provides actionable insights based on live data

**Sports Data Information:**
- NFL refers to American Football NFL (database key: americanfootball_nfl)
- NCAAF refers to College Football (database key: americanfootball_ncaaf)
- When users mention "NFL", "pro football", "national football league" they mean NFL
- When users mention "NCAAF", "college football", "NCAA football" they mean NCAAF
- Other leagues: NBA (basketball_nba), NCAAB (basketball_ncaab), MLB (baseball_mlb), NHL (icehockey_nhl)

**Key Guidelines:**
- Always promote responsible gambling practices
- Use real odds data when providing betting suggestions
- Explain your reasoning behind suggestions using current market information
- Provide specific, actionable advice based on live odds
- Reference actual teams, games, and odds when available
- Never guarantee wins, always mention risk
- Keep responses concise but informative
- Ask clarifying questions when needed
- When users ask about specific leagues, focus your analysis on odds data from those leagues

**Sample Responses:**
- "Based on current NFL market odds and line movement, I see value in..."
- "Looking at today's NCAAF odds, the [team] at [odds] offers good value because..."
- "Your bankroll suggests a 2-3% stake here, which would be..."
- "The key factors I'm seeing in today's odds are..."

Remember: You have access to real odds data, so use it to provide current, relevant betting insights and opportunities. Focus on the specific leagues users mention.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages, stream = true } = await req.json();

    // Detect specific leagues from user message
    const userMessage = messages[messages.length - 1]?.content || '';
    const detectedLeagues = detectLeagueFromMessage(userMessage);

    // Check user subscription and usage limits
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select(`
        subscription_plans(ai_calls_per_month)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    // Count current month usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: usageData } = await supabase
      .from('ai_usage_logs')
      .select('id')
      .eq('user_id', user.id)
      .eq('endpoint', 'ai-chat')
      .gte('created_at', startOfMonth.toISOString());

    const monthlyUsage = usageData?.length || 0;
    const maxCalls = subscription?.subscription_plans?.ai_calls_per_month || 10; // Default free tier

    if (monthlyUsage >= maxCalls) {
      return new Response(JSON.stringify({ 
        error: 'Monthly AI usage limit exceeded. Upgrade your plan for more calls.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If no OpenAI API key, return mock response
    if (!OPENAI_API_KEY) {
      console.log('No OpenAI API key found, returning mock response');
      
      const mockResponses = [
        "I'm connected to live odds data and ready to help! However, I'm currently running in demo mode. Once the OpenAI integration is fully configured, I'll be able to provide detailed insights using the real-time odds data we're collecting.",
        "Great question about bankroll management! With access to live odds, I can help you identify value bets. Proper bankroll management typically involves betting 1-5% of your total bankroll per bet, depending on your confidence level and the odds value I detect.",
        "I can see current odds data in our system! While in demo mode, I'd generally suggest looking at line movement, injury reports, and historical matchup data. Once fully activated, I'll analyze these factors using real-time market data.",
        "Live betting opportunities are exciting! I'm tracking real odds updates every 30 minutes. In full mode, I'll help you spot momentum shifts, key player situations, and market inefficiencies as they happen.",
      ];

      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];

      // Log usage even for mock responses
      await supabase
        .from('ai_usage_logs')
        .insert({
          user_id: user.id,
          endpoint: 'ai-chat',
          tokens_used: 50, // Mock token count
          cost: 0.001 // Mock cost
        });

      return new Response(JSON.stringify({ 
        message: randomResponse,
        usage: { monthlyUsage: monthlyUsage + 1, maxCalls }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch recent odds data for context
    let oddsQuery = supabase
      .from('odds_snapshots')
      .select('*')
      .gte('last_updated', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()) // Last 6 hours
      .limit(20);

    // Filter by detected leagues if any
    if (detectedLeagues.length > 0) {
      console.log('Filtering odds for leagues:', detectedLeagues);
      oddsQuery = oddsQuery.in('sport', detectedLeagues);
    }

    const { data: oddsData } = await oddsQuery;

    // Prepare context with real odds data
    let oddsContext = '';
    if (oddsData && oddsData.length > 0) {
      const leagueFilter = detectedLeagues.length > 0 ? ` (filtered for: ${detectedLeagues.map(getDisplaySportName).join(', ')})` : '';
      oddsContext = `\n\nCurrent Live Odds Data (last 6 hours)${leagueFilter}:\n${oddsData.map(odds => 
        `• ${odds.team1} vs ${odds.team2} (${getDisplaySportName(odds.sport)}) - ${odds.market}: ${odds.odds} (${odds.bookmaker})`
      ).join('\n')}\n\nUse this real data when providing betting insights and recommendations.`;
    }

    // Prepare messages for OpenAI
    const openAIMessages = [
      { role: 'system', content: SYSTEM_PROMPT + oddsContext },
      ...messages
    ];

    console.log('Calling OpenAI API...');

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: openAIMessages,
        max_completion_tokens: 1000
      }),
    });

    if (!openAIResponse.ok) {
      const error = await openAIResponse.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    // Parse OpenAI JSON (non-streaming) and build response content
    const data = await openAIResponse.json();
    console.log('OpenAI response data:', JSON.stringify(data, null, 2));

    let responseContent: string = data.choices?.[0]?.message?.content || '';

    // Fallback if response is empty or missing
    if (!responseContent || responseContent.trim() === '') {
      console.log('Empty response from OpenAI, using fallback');
      responseContent = "I'm having trouble generating a response right now. Could you try rephrasing your question or ask about something specific like odds analysis or betting strategies?";
    }

    if (stream) {
      // Simulate SSE stream to the client from a non-streaming OpenAI response
      const sse = new TransformStream();
      const writer = sse.writable.getWriter();
      const encoder = new TextEncoder();

      (async () => {
        try {
          // Split content into small chunks to provide a smooth streaming experience
          const chunks = responseContent.match(/.{1,80}/g) || [responseContent];

          for (const chunk of chunks) {
            const payload = { choices: [{ delta: { content: chunk } }] };
            await writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          }

          // Optionally send a done marker (client already ignores it if present)
          // await writer.write(encoder.encode('data: [DONE]\n\n'));

          // Log usage
          await supabase
            .from('ai_usage_logs')
            .insert({
              user_id: user.id,
              endpoint: 'ai-chat',
              tokens_used: data.usage?.total_tokens || Math.ceil(responseContent.length / 4),
              cost: (data.usage?.total_tokens || Math.ceil(responseContent.length / 4)) * 0.0001
            });

          await writer.close();
        } catch (error) {
          console.error('SSE emit error:', error);
          await writer.abort(error);
        }
      })();

      return new Response(sse.readable, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming JSON response
      // Log usage
      await supabase
        .from('ai_usage_logs')
        .insert({
          user_id: user.id,
          endpoint: 'ai-chat',
          tokens_used: data.usage?.total_tokens || Math.ceil(responseContent.length / 4),
          cost: (data.usage?.total_tokens || Math.ceil(responseContent.length / 4)) * 0.0001
        });

      return new Response(JSON.stringify({
        message: responseContent,
        usage: { monthlyUsage: monthlyUsage + 1, maxCalls }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});