import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InjuryInput {
  players?: string[];
  lookback_hours?: number;
}

interface InjuryResult {
  player: string;
  status: 'Out' | 'Doubtful' | 'Questionable' | 'Probable' | 'Active' | 'Unknown';
  headline: string;
  source: string;
  url: string;
  published_at: string;
  confidence: number;
}

// Normalize injury status from headlines
function normalizeStatus(headline: string, source: string): { status: string; confidence: number } {
  const text = headline.toLowerCase();
  
  // Status detection with confidence scoring
  if (text.match(/\b(out|ruled out|inactive|will not play|sidelined)\b/)) {
    return { status: 'Out', confidence: 0.95 };
  }
  if (text.match(/\bdoubtful\b/)) {
    return { status: 'Doubtful', confidence: 0.90 };
  }
  if (text.match(/\b(questionable|limited|gtd|game-time decision|game time decision)\b/)) {
    return { status: 'Questionable', confidence: 0.85 };
  }
  if (text.match(/\b(probable|cleared|expected to play|likely to play)\b/)) {
    return { status: 'Probable', confidence: 0.80 };
  }
  if (text.match(/\b(active|returns|full participant|practicing)\b/)) {
    return { status: 'Active', confidence: 0.75 };
  }
  
  // Source weighting
  const sourceText = source.toLowerCase();
  let baseConfidence = 0.50;
  if (sourceText.match(/\b(nfl|espn|team|official)\b/)) {
    baseConfidence = 0.65;
  } else if (sourceText.match(/\b(athletic|bleacher|yahoo)\b/)) {
    baseConfidence = 0.60;
  }
  
  return { status: 'Unknown', confidence: baseConfidence };
}

// Mock RSS/News fetcher (replace with real API in production)
async function fetchPlayerInjuryNews(player: string, lookbackHours: number): Promise<InjuryResult[]> {
  console.log(`Fetching injury news for ${player}...`);
  
  // In production, this would call a real news API or RSS feed
  // For now, return mock data based on common injury patterns
  const mockResults: InjuryResult[] = [];
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150));
  
  // Mock data - in production, parse real RSS/API responses
  const mockHeadlines = [
    { headline: `${player} limited in practice Friday`, source: 'Team Reporter', url: 'https://example.com/news1' },
    { headline: `${player} questionable for Sunday`, source: 'ESPN', url: 'https://example.com/news2' },
    { headline: `${player} injury update`, source: 'Beat Writer', url: 'https://example.com/news3' },
  ];
  
  for (const mock of mockHeadlines) {
    const { status, confidence } = normalizeStatus(mock.headline, mock.source);
    
    mockResults.push({
      player,
      status: status as any,
      headline: mock.headline,
      source: mock.source,
      url: mock.url,
      published_at: new Date(Date.now() - Math.random() * lookbackHours * 3600000).toISOString(),
      confidence: Math.min(confidence, 1.0),
    });
  }
  
  return mockResults.filter(r => r.status !== 'Unknown');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const input: InjuryInput = await req.json().catch(() => ({}));
    const lookbackHours = input.lookback_hours || 36;
    
    let players = input.players || [];
    
    // Auto-select top players from upcoming props if not specified
    if (players.length === 0) {
      console.log('Auto-selecting players from upcoming props...');
      const { data: propData } = await supabase
        .from('player_props_snapshots')
        .select('player')
        .gte('game_date', new Date().toISOString())
        .lte('game_date', new Date(Date.now() + 24 * 3600000).toISOString())
        .in('league', ['NFL', 'NCAAF'])
        .limit(50);
      
      if (propData) {
        players = [...new Set(propData.map(p => p.player))].slice(0, 50);
      }
    }
    
    console.log(`Scanning injury news for ${players.length} players...`);
    
    const allResults: InjuryResult[] = [];
    const startTime = Date.now();
    
    // Process players with rate limiting
    for (const player of players) {
      // Check cache first
      const { data: cached } = await supabase
        .from('injury_news_cache')
        .select('*')
        .eq('player', player)
        .gt('expires_at', new Date().toISOString())
        .order('published_at', { ascending: false })
        .limit(1)
        .single();
      
      if (cached) {
        console.log(`Cache hit for ${player}`);
        allResults.push({
          player: cached.player,
          status: cached.status,
          headline: cached.headline,
          source: cached.source || 'Unknown',
          url: cached.url || '',
          published_at: cached.published_at,
          confidence: parseFloat(cached.confidence),
        });
        continue;
      }
      
      // Fetch fresh news
      const newsResults = await fetchPlayerInjuryNews(player, lookbackHours);
      
      // Upsert to cache
      for (const result of newsResults) {
        const { error } = await supabase
          .from('injury_news_cache')
          .upsert({
            player: result.player,
            status: result.status,
            headline: result.headline,
            source: result.source,
            url: result.url,
            published_at: result.published_at,
            confidence: result.confidence,
            expires_at: new Date(Date.now() + 2 * 3600000).toISOString(), // 2h TTL
          }, {
            onConflict: 'player,published_at'
          });
        
        if (error) {
          console.error(`Cache upsert error for ${player}:`, error);
        }
      }
      
      allResults.push(...newsResults);
      
      // Rate limiting: 150ms delay between players
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    const duration = Date.now() - startTime;
    
    // Log run to ingest_runs
    await supabase
      .from('ingest_runs')
      .insert({
        function: 'injury-scan',
        sport: 'multi',
        success: true,
        rows_inserted: allResults.length,
        duration_ms: duration,
      });
    
    console.log(`Scanned ${players.length} players, found ${allResults.length} injury reports in ${duration}ms`);
    
    return new Response(JSON.stringify(allResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in injury-scan:', error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'INJURY_SCAN_ERROR',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
