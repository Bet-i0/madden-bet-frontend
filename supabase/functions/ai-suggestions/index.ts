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

    // Check if user is admin (admins have unlimited calls)
    const { data: isAdmin } = await supabase
      .rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

    let shouldCheckLimits = !isAdmin;
    console.log(`User ${user.id} admin status: ${isAdmin}, checking limits: ${shouldCheckLimits}`);

    // Check user's subscription and usage limits (unless admin)
    if (shouldCheckLimits) {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // Get user's current subscription with better error handling
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          subscription_plans(ai_calls_per_month)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      const monthlyLimit = subscription?.subscription_plans?.ai_calls_per_month || 50; // Default to 50 for free plan

      // Check current month usage with better date filtering
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data: usageData } = await supabase
        .from('ai_usage_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      const currentUsage = usageData?.length || 0;

      // More lenient rate limiting for development
      if (currentUsage >= monthlyLimit) {
        console.log(`Rate limit exceeded for user ${user.id}: ${currentUsage}/${monthlyLimit}`);
        // Instead of blocking, return suggestions from live odds
        const { data: oddsData } = await supabase
          .from('odds_snapshots')
          .select('*')
          .gte('last_updated', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()) // Last 6 hours
          .limit(50);

        const suggestions = buildSuggestionsFromOdds(oddsData || [], category);
        
        // Cache and return the live odds-based suggestions
        if (suggestions.length > 0) {
          await supabase
            .from('ai_suggestions_cache')
            .upsert({
              trend_id: trendId,
              category: category,
              suggestions: suggestions,
              expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            }, { onConflict: 'trend_id,category' });
            
          console.log(`Generated ${suggestions.length} suggestions from live odds for rate-limited user`);
          return new Response(
            JSON.stringify({ suggestions }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Fetch recent odds data for context
    const { data: oddsData } = await supabase
      .from('odds_snapshots')
      .select('*')
      .gte('last_updated', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()) // Last 6 hours
      .limit(50);

    let suggestions: SuggestionPick[] = [];

    if (!openaiApiKey) {
      console.log('OpenAI API key not found, building suggestions from live odds');
      // Build real suggestions from live odds when OpenAI key is not available
      suggestions = buildSuggestionsFromOdds(oddsData || [], category);
    } else {
      // Generate AI suggestions using OpenAI
      console.log('Generating AI suggestions with OpenAI...');
      
      const oddsContext = oddsData?.slice(0, 10).map(odds => 
        `${odds.team1} vs ${odds.team2} (${odds.league}) - ${odds.market}: ${odds.odds} (${odds.bookmaker})`
      ).join('\n');

      const prompt = `As an elite sports betting analyst with 15+ years of experience, analyze the trending topic "${trendId}" in category "${category}" alongside current sports betting market data.

CURRENT MARKET DATA:
${oddsContext}

ANALYSIS REQUIREMENTS:
1. Identify 3-5 high-value betting opportunities based on the trending topic and current odds
2. Consider line movement, public sentiment, and sharp money indicators
3. Account for the specific category focus: ${category}
4. Provide detailed reasoning for each recommendation
5. Include confidence levels based on data strength and market inefficiencies

STRATEGY CONTEXT:
- Value Hunter: Focus on line discrepancies and closing line value
- Momentum Play: Identify reverse line movement and public vs sharp money
- Injury Impact: React to late-breaking news affecting odds
- Weather Edge: Consider environmental factors for outdoor sports

For each betting suggestion, provide a JSON object with:
- id: unique identifier
- category: "${category}"
- market: specific betting market (Moneyline/Point Spread/Over-Under/Player Props)
- title: clear, concise bet description
- odds: American odds format (+/-)
- bookmaker: specific sportsbook offering best value
- confidence: percentage (60-95) based on data strength
- rationale: detailed explanation (2-3 sentences) of why this bet offers value
- game: full team names
- league: sport league
- startTime: ISO timestamp of game start

Respond with a JSON array of betting suggestions. Focus on actionable insights with clear value propositions.`;

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
              { 
                role: 'system', 
                content: 'You are a professional sports betting analyst with expertise in market inefficiencies, line movement analysis, and value identification. You have access to real-time odds data and understand how public sentiment affects betting markets. Always provide data-driven recommendations with clear reasoning.' 
              },
              { role: 'user', content: prompt }
            ],
            max_tokens: 2000,
            temperature: 0.7,
          }),
        });

        if (openaiResponse.ok) {
          const aiData = await openaiResponse.json();
          const raw = aiData?.choices?.[0]?.message?.content ?? '[]';
          const cleaned = String(raw).replace(/```json|```/g, '').trim();
          let aiSuggestionsParsed: any = [];
          try {
            aiSuggestionsParsed = JSON.parse(cleaned);
          } catch (e) {
            console.error('Failed to parse OpenAI JSON, falling back to live odds:', e);
          }
          suggestions = Array.isArray(aiSuggestionsParsed) ? aiSuggestionsParsed : (aiSuggestionsParsed?.suggestions || []);
          if (!suggestions || suggestions.length === 0) {
            suggestions = buildSuggestionsFromOdds(oddsData || [], category);
          }
          
          // Log usage (for both admins and regular users - admins get unlimited but we still track for analytics)
          await supabase.from('ai_usage_logs').insert({
            user_id: user.id,
            endpoint: 'ai-suggestions',
            tokens_used: aiData.usage?.total_tokens || 0,
            cost: 0 // Calculate based on your pricing model
          });
        } else {
          console.error('OpenAI API error:', await openaiResponse.text());
          suggestions = buildSuggestionsFromOdds(oddsData || [], category);
        }
      } catch (error) {
        console.error('Error calling OpenAI API:', error);
        suggestions = buildSuggestionsFromOdds(oddsData || [], category);
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

    console.log(`Generated ${suggestions.length} suggestions for user ${user.id} (admin: ${isAdmin})`);

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

// Build real suggestions from live odds
function toAmerican(decimal: number): number {
  if (!decimal || decimal <= 1) return 0;
  if (decimal >= 2) return Math.round((decimal - 1) * 100);
  return Math.round(-100 / (decimal - 1));
}

function marketInfo(market: string): { type: string; selection: string } {
  if (market.startsWith('h2h_')) return { type: 'Moneyline', selection: market.slice(4) };
  if (market.startsWith('spreads_')) return { type: 'Point Spread', selection: market.slice(8) };
  if (market.startsWith('totals_')) return { type: 'Over/Under', selection: market.slice(7) };
  return { type: 'Market', selection: market };
}

function buildTitle(row: any): string {
  const info = marketInfo(row.market);
  if (info.type === 'Moneyline') {
    const opponent = row.team1 === info.selection ? row.team2 : row.team1;
    return `${info.selection} ML vs ${opponent}`;
  }
  if (info.type === 'Point Spread') {
    return `${info.selection} Spread`;
  }
  if (info.type === 'Over/Under') {
    return `${info.selection} ${row.team1} vs ${row.team2}`;
  }
  return `${info.type} ${info.selection}`;
}

function buildSuggestionsFromOdds(oddsData: any[] = [], category: string): SuggestionPick[] {
  if (!oddsData || oddsData.length === 0) return [];

  const byKey = new Map<string, any[]>();
  for (const row of oddsData) {
    const key = `${row.team1}|${row.team2}|${row.market}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(row);
  }

  const groups = Array.from(byKey.values());

  function pickBestByDiscrepancy(filter: (r: any) => boolean): SuggestionPick[] {
    const candidates: { row: any; diffPct: number }[] = [];
    for (const group of groups) {
      const rows = group.filter(filter);
      if (rows.length < 2) continue;
      const avg = rows.reduce((s, r) => s + Number(r.odds), 0) / rows.length;
      const best = rows.reduce((a, b) => (Number(a.odds) > Number(b.odds) ? a : b));
      const diffPct = (Number(best.odds) - avg) / avg;
      candidates.push({ row: best, diffPct });
    }
    candidates.sort((a, b) => b.diffPct - a.diffPct);
    return candidates.slice(0, 4).map(({ row, diffPct }, i) => {
      const info = marketInfo(row.market);
      const american = toAmerican(Number(row.odds));
      const confidence = Math.min(92, Math.max(65, Math.round(70 + diffPct * 100)));
      return {
        id: `${category}-${row.id}`,
        category,
        market: info.type,
        title: buildTitle(row),
        odds: american,
        bookmaker: row.bookmaker,
        confidence,
        rationale: `Best price vs market average (+${(diffPct*100).toFixed(1)}%). Line value from live odds across books.`,
        game: `${row.team1} vs ${row.team2}`,
        league: row.league || row.sport,
        startTime: row.game_date || row.last_updated || new Date().toISOString(),
      } as SuggestionPick;
    });
  }

  if (category === 'value-hunter') {
    return pickBestByDiscrepancy(() => true).slice(0, 3);
  }

  if (category === 'momentum-play') {
    const recent = [...oddsData]
      .filter(r => String(r.market).startsWith('h2h_') || String(r.market).startsWith('spreads_'))
      .sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())
      .slice(0, 20);

    const seen = new Set<string>();
    const picks: SuggestionPick[] = [];
    for (const row of recent) {
      const key = `${row.team1}|${row.team2}|${row.market}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const info = marketInfo(row.market);
      picks.push({
        id: `${category}-${row.id}`,
        category,
        market: info.type,
        title: buildTitle(row),
        odds: toAmerican(Number(row.odds)),
        bookmaker: row.bookmaker,
        confidence: 75,
        rationale: `Recent line update detected (${new Date(row.last_updated).toLocaleTimeString()} UTC). Potential momentum opportunity.`,
        game: `${row.team1} vs ${row.team2}`,
        league: row.league || row.sport,
        startTime: row.game_date || row.last_updated || new Date().toISOString(),
      });
      if (picks.length >= 3) break;
    }
    if (picks.length) return picks;
    return pickBestByDiscrepancy(r => String(r.market).startsWith('h2h_') || String(r.market).startsWith('spreads_')).slice(0, 3);
  }

  if (category === 'injury-impact') {
    return pickBestByDiscrepancy(r => String(r.market).startsWith('spreads_')).slice(0, 3);
  }

  if (category === 'weather-edge') {
    const totals = pickBestByDiscrepancy(r => String(r.market).startsWith('totals_'));
    return totals.slice(0, 3);
  }

  // Default
  return pickBestByDiscrepancy(() => true).slice(0, 3);
}

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
