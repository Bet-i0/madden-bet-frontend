// Toggle emoji reaction on a shared bet with whitelist + rate limit
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReactRequest {
  sharedBetId: string;
  emoji: '👍' | '🔥' | '💯' | '😂' | '😮' | '😡';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ code: 'auth.required', message: 'Sign in required', requestId }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ code: 'auth.invalid', message: 'Invalid token', requestId }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { sharedBetId, emoji }: ReactRequest = await req.json();

    // Rate limit: ≤ 60 reactions in last hour
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('bet_reactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', hourAgo);

    if ((count ?? 0) >= 60) {
      return new Response(
        JSON.stringify({ code: 'rate.limit', message: 'Too many reactions this hour', requestId }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Toggle logic: if same emoji exists, delete; else upsert this emoji
    const { data: existing } = await supabase
      .from('bet_reactions')
      .select('id, type')
      .eq('shared_bet_id', sharedBetId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing && existing.type === emoji) {
      const { error } = await supabase
        .from('bet_reactions')
        .delete()
        .eq('id', existing.id);
      
      if (error) throw error;
      
      return new Response(
        JSON.stringify({ status: 'removed', requestId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove old reaction if exists
    if (existing) {
      await supabase.from('bet_reactions').delete().eq('id', existing.id);
    }

    // Add new reaction
    const { error: insErr } = await supabase
      .from('bet_reactions')
      .insert({ shared_bet_id: sharedBetId, user_id: user.id, type: emoji });
    
    if (insErr) throw insErr;

    return new Response(
      JSON.stringify({ status: 'added', emoji, requestId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        code: 'react.failed',
        message: 'Could not toggle reaction',
        details: { reason: String(e) },
        requestId
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
