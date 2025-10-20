// Batched first-party analytics event capture with validation
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsEvent {
  event: string;
  props?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
    }

    const { events, sessionId }: { events: AnalyticsEvent[]; sessionId: string } = await req.json();

    if (!Array.isArray(events) || events.length === 0) {
      return new Response(
        JSON.stringify({ code: 'invalid.events', message: 'Events must be a non-empty array', requestId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!sessionId) {
      return new Response(
        JSON.stringify({ code: 'invalid.session', message: 'Session ID required', requestId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and prepare events
    const validEvents = events
      .filter(e => e.event && typeof e.event === 'string')
      .map(e => ({
        user_id: userId,
        session_id: sessionId,
        event: e.event,
        props: e.props || {},
      }));

    if (validEvents.length === 0) {
      return new Response(
        JSON.stringify({ code: 'no.valid.events', message: 'No valid events provided', requestId }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert events
    const { error } = await supabase
      .from('events_analytics')
      .insert(validEvents);

    if (error) throw error;

    const duration = Date.now() - startTime;

    return new Response(
      JSON.stringify({ 
        status: 'captured', 
        count: validEvents.length, 
        requestId,
        duration_ms: duration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    const duration = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({
        code: 'capture.failed',
        message: 'Could not capture analytics',
        details: { reason: String(e) },
        requestId,
        duration_ms: duration
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
