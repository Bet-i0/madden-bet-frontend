// Create or edit text-only comment with rate limit and simple profanity guard
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const banned = ['http://', 'https://', 'www.'];

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

    const json = await req.json();
    const isEdit = 'commentId' in json;

    // Rate limit: ≤ 20 comments in last hour
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('bet_comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', hourAgo);

    if ((count ?? 0) >= 20) {
      return new Response(
        JSON.stringify({ code: 'rate.limit', message: 'Too many comments this hour', requestId }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isEdit) {
      const { sharedBetId, content } = json;
      
      if (!content || content.length < 1 || content.length > 1000) {
        return new Response(
          JSON.stringify({ code: 'content.invalid', message: 'Content must be 1-1000 characters', requestId }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (banned.some((t) => content.toLowerCase().includes(t))) {
        return new Response(
          JSON.stringify({ code: 'content.blocked', message: 'Links not allowed', requestId }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('bet_comments')
        .insert({ shared_bet_id: sharedBetId, user_id: user.id, content });
      
      if (error) throw error;

      return new Response(
        JSON.stringify({ status: 'created', requestId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const { commentId, content } = json;
      
      if (!content || content.length < 1 || content.length > 1000) {
        return new Response(
          JSON.stringify({ code: 'content.invalid', message: 'Content must be 1-1000 characters', requestId }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (banned.some((t) => content.toLowerCase().includes(t))) {
        return new Response(
          JSON.stringify({ code: 'content.blocked', message: 'Links not allowed', requestId }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // DB trigger enforces 5-minute window
      const { error } = await supabase
        .from('bet_comments')
        .update({ content })
        .eq('id', commentId)
        .eq('user_id', user.id);
      
      if (error) throw error;

      return new Response(
        JSON.stringify({ status: 'edited', requestId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (e) {
    return new Response(
      JSON.stringify({
        code: 'comment.failed',
        message: 'Could not process comment',
        details: { reason: String(e) },
        requestId
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
