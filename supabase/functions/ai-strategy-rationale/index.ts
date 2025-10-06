import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Pick {
  game_date: string;
  player: string;
  market: string;
  line: number;
  best_book: string;
  best_odds: number;
  consensus_odds: number;
  book_count: number;
  edge_prob: number;
  edge_bps: number;
}

interface RequestBody {
  segment: 'value_hunter' | 'momentum_surge' | 'injury_intelligence' | 'injury_intel' | 'weather_warrior';
  picks: Pick[];
  context?: Record<string, any>;
}

interface PickWithRationale extends Pick {
  rationale: string;
}

// Hash function for cache keys
function fnv1aHash(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash.toString(36);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { segment, picks, context = {} }: RequestBody = await req.json();

    if (!picks || picks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No picks provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit to 20 picks max
    const limitedPicks = picks.slice(0, 20);
    const results: PickWithRationale[] = [];

    // Check cache for each pick
    for (const pick of limitedPicks) {
      const cacheKey = fnv1aHash(
        `${segment}|${pick.player}|${pick.market}|${pick.line}|${pick.best_book}|${pick.best_odds.toFixed(2)}`
      );

      const { data: cached } = await supabase
        .from('ai_suggestions_cache')
        .select('suggestions')
        .eq('trend_id', 0)
        .eq('category', `rationale_${cacheKey}`)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cached && cached.suggestions) {
        results.push({
          ...pick,
          rationale: (cached.suggestions as any)[0]?.rationale || ''
        });
      }
    }

    // If all cached, return immediately
    if (results.length === limitedPicks.length) {
      console.log(`All ${results.length} picks served from cache`);
      return new Response(
        JSON.stringify({ picks: results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate rationales for uncached picks
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      // Return picks with placeholder rationales
      const fallbackResults = limitedPicks.map(pick => ({
        ...pick,
        rationale: `${pick.player} • ${pick.market} ${pick.line} @ ${pick.best_book} (+${pick.edge_bps.toFixed(0)} bps)`
      }));
      return new Response(
        JSON.stringify({ picks: fallbackResults }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build prompt based on segment
    let systemPrompt = '';
    switch (segment) {
      case 'value_hunter':
        systemPrompt = `You are a sports betting analyst. For each pick, explain why the best price offers value vs consensus in 160 chars or less. Be factual and cite the edge in basis points. Mention the market and line clearly.`;
        break;
      case 'momentum_surge':
        systemPrompt = `You are a sports betting analyst. For each pick, explain the recent line movement and momentum in 160 chars or less. Reference the change windows provided in context.`;
        break;
      case 'injury_intelligence':
      case 'injury_intel':
        systemPrompt = `You are a sports betting analyst. For each pick, connect the injury status to the pricing opportunity in 160 chars or less. Reference the injury status and how the market hasn't fully adjusted. Be specific about tactical implications.`;
        break;
      case 'weather_warrior':
        systemPrompt = `You are a sports betting analyst. For each pick, explain how weather conditions create an edge in 160 chars or less. Reference wind, precipitation, and stadium type.`;
        break;
    }

    const userPrompt = `Generate concise rationales for these ${segment} picks:\n\n${
      limitedPicks.map((p, i) => 
        `${i + 1}. ${p.player} ${p.market} ${p.line} @ ${p.best_book} ${p.best_odds.toFixed(2)} (consensus: ${p.consensus_odds.toFixed(2)}, edge: +${p.edge_bps.toFixed(0)} bps, ${p.book_count} books)`
      ).join('\n')
    }\n\nContext: ${JSON.stringify(context)}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        tools: [{
          type: 'function',
          function: {
            name: 'provide_rationales',
            description: 'Provide betting rationales for picks',
            parameters: {
              type: 'object',
              properties: {
                rationales: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      index: { type: 'number' },
                      rationale: { type: 'string', maxLength: 160 }
                    },
                    required: ['index', 'rationale']
                  }
                }
              },
              required: ['rationales']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'provide_rationales' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API failed: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const parsedArgs = JSON.parse(toolCall.function.arguments);
    const rationales = parsedArgs.rationales || [];

    // Combine picks with rationales
    const enrichedPicks: PickWithRationale[] = limitedPicks.map((pick, idx) => {
      const rationaleObj = rationales.find((r: any) => r.index === idx + 1);
      const rationale = rationaleObj?.rationale || `${pick.player} • ${pick.market} ${pick.line} @ ${pick.best_book}`;
      
      // Cache this result
      const cacheKey = fnv1aHash(
        `${segment}|${pick.player}|${pick.market}|${pick.line}|${pick.best_book}|${pick.best_odds.toFixed(2)}`
      );
      
      supabase.from('ai_suggestions_cache').upsert({
        trend_id: 0,
        category: `rationale_${cacheKey}`,
        suggestions: [{ rationale }],
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2h TTL
      }).then();

      return { ...pick, rationale };
    });

    // Log usage
    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') || ''
    );

    if (user) {
      await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        endpoint: `ai-strategy-rationale/${segment}`,
        tokens_used: aiData.usage?.total_tokens || 0,
        cost: 0
      });
    }

    console.log(`Generated rationales for ${enrichedPicks.length} picks`);

    return new Response(
      JSON.stringify({ picks: enrichedPicks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-strategy-rationale:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
