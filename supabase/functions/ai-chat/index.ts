
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

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

    const { messages, stream = true } = await req.json();

    console.log(`AI chat request from user: ${user.id}, streaming: ${stream}`);

    // Check if user is admin (admins have unlimited calls)
    const { data: isAdmin } = await supabase
      .rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

    let shouldCheckLimits = !isAdmin;
    console.log(`User ${user.id} admin status: ${isAdmin}, checking limits: ${shouldCheckLimits}`);

    // Check usage limits (unless admin)
    if (shouldCheckLimits) {
      // Get user's current subscription
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`
          subscription_plans(ai_calls_per_month)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      const monthlyLimit = subscription?.subscription_plans?.ai_calls_per_month || 10;

      // Check current month usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: usageData } = await supabase
        .from('ai_usage_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      const currentUsage = usageData?.length || 0;

      if (currentUsage >= monthlyLimit) {
        return new Response(
          JSON.stringify({ 
            error: 'Monthly AI chat limit exceeded',
            currentUsage,
            monthlyLimit
          }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Enhanced system prompt for advanced sports betting assistant
    const systemPrompt = `You are SportsBot, an elite AI sports betting assistant with extensive knowledge of:

CORE EXPERTISE:
- Advanced statistical analysis and line movement interpretation
- Bankroll management strategies and Kelly Criterion optimization
- Market inefficiencies and value identification across all major sports
- Real-time odds analysis from multiple sportsbooks
- Weather impact analysis for outdoor sports
- Injury report analysis and its market implications
- Public vs sharp money identification and contrarian strategies

CURRENT CONTEXT:
- You have access to live odds data updated frequently
- You understand betting market dynamics and can identify value
- You're familiar with all major sportsbooks and their characteristics
- You can analyze trends, patterns, and statistical edges

RESPONSE STYLE:
- Be conversational yet professional
- Provide specific, actionable insights when possible
- Always emphasize responsible gambling practices
- Include confidence levels and reasoning for recommendations
- Reference real data and market conditions when available
- Ask clarifying questions when context is needed

IMPORTANT: You provide analysis and insights for educational purposes. Always remind users that no bet is guaranteed and to only bet what they can afford to lose.

Current conversation context: The user is seeking betting advice, strategy help, or analysis.`;

    const requestMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    if (stream) {
      // Streaming response
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: requestMessages,
          max_tokens: 1000,
          temperature: 0.7,
          stream: true,
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('OpenAI API error:', errorText);
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      // Log usage (for both admins and regular users - admins get unlimited but we still track for analytics)
      await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        endpoint: 'ai-chat',
        tokens_used: 0, // We can't get exact tokens for streaming, but we track the call
        cost: 0
      });

      // Return the streaming response
      return new Response(openaiResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    } else {
      // Non-streaming response
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: requestMessages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error('OpenAI API error:', errorText);
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const aiData = await openaiResponse.json();
      const message = aiData.choices[0].message.content;

      // Log usage (for both admins and regular users - admins get unlimited but we still track for analytics)
      await supabase.from('ai_usage_logs').insert({
        user_id: user.id,
        endpoint: 'ai-chat',
        tokens_used: aiData.usage?.total_tokens || 0,
        cost: 0
      });

      // Get current usage for response
      const startOfMonth = new Date();
      startOfMonth.setDate(1); 
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: usageData } = await supabase
        .from('ai_usage_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select(`
          subscription_plans(ai_calls_per_month)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      const monthlyLimit = subscription?.subscription_plans?.ai_calls_per_month || 10;
      const currentUsage = usageData?.length || 0;

      return new Response(JSON.stringify({
        message,
        usage: {
          monthlyUsage: currentUsage,
          maxCalls: isAdmin ? 999999 : monthlyLimit // Show unlimited for admins
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
