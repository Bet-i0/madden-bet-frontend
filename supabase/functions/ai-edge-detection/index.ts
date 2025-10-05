import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Compute consensus and best odds per prop in SQL
    const { data: edges, error: edgesError } = await supabase.rpc('compute_prop_edges');
    
    if (edgesError) {
      console.error('Error computing edges:', edgesError);
      return new Response(
        JSON.stringify({ success: false, error: edgesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter for positive edges and sort by magnitude
    const positiveEdges = (edges || [])
      .filter((e: any) => e.edge_percent > 0)
      .sort((a: any, b: any) => b.edge_percent - a.edge_percent)
      .slice(0, 20); // Top 20 edges

    if (positiveEdges.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          picks: [],
          message: 'No positive edges found',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Get AI rationales for top edges (batch processing)
    const picksWithRationale = [];

    for (const edge of positiveEdges) {
      try {
        const prompt = `You are a sports betting analyst. Provide a single concise sentence (max 15 words) explaining why ${edge.player} ${edge.market} ${edge.side} ${edge.line} has a +${edge.edge_percent.toFixed(1)}% edge at ${edge.best_book} (${edge.best_odds.toFixed(2)}).

Context:
- Consensus odds: ${edge.consensus_odds.toFixed(2)}
- Best available: ${edge.best_odds.toFixed(2)} at ${edge.best_book}
- Books offering: ${edge.book_count}

Keep it factual and specific.`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a concise sports betting analyst. Respond in 15 words or less.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 50,
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI error for ${edge.player}:`, await aiResponse.text());
          continue;
        }

        const aiData = await aiResponse.json();
        const rationale = aiData.choices?.[0]?.message?.content?.trim() || 'Strong value based on consensus.';

        picksWithRationale.push({
          gameId: edge.event_id || `${edge.team1}-${edge.team2}`,
          league: edge.league,
          home: edge.team1,
          away: edge.team2,
          market: edge.market,
          side: edge.side,
          line: edge.line,
          book: edge.best_book,
          odds: edge.best_odds,
          confidence: Math.min(95, 70 + edge.edge_percent), // Cap at 95%
          reason: rationale,
          edgePercent: edge.edge_percent,
          player: edge.player,
        });
      } catch (aiError) {
        console.error(`Error getting rationale for ${edge.player}:`, aiError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        picks: picksWithRationale,
        message: `Found ${picksWithRationale.length} edges`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-edge-detection:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
