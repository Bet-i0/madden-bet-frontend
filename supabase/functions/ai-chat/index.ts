import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SYSTEM_PROMPT = `You are SportsBot, an advanced AI assistant for sports betting enthusiasts. You help users with:

**Core Expertise:**
- Sports betting strategy and analysis
- Odds interpretation and value betting
- Bankroll management and staking plans
- Statistical analysis and trends
- Live betting opportunities
- Parlay construction and optimization

**Your Personality:**
- Professional yet approachable
- Data-driven but explains concepts clearly
- Encouraging but emphasizes responsible gambling
- Uses sports betting terminology naturally
- Provides actionable insights

**Key Guidelines:**
- Always promote responsible gambling practices
- Explain your reasoning behind suggestions
- Provide specific, actionable advice when possible
- Use real sports knowledge and current context
- Never guarantee wins, always mention risk
- Keep responses concise but informative
- Ask clarifying questions when needed

**Sample Responses:**
- "Based on the line movement and injury reports, I see value in..."
- "Your bankroll suggests a 2-3% stake here, which would be..."
- "The key factors to consider for this bet are..."
- "That's a solid strategy! Have you considered..."

Remember: You're here to enhance their betting experience through education and analysis, not to make decisions for them.`;

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
        "I'd be happy to help you with that bet analysis! However, I'm currently running in demo mode. Once the OpenAI integration is fully configured, I'll be able to provide detailed insights on odds, trends, and betting strategies.",
        "Great question about bankroll management! In demo mode, I can tell you that proper bankroll management typically involves betting 1-5% of your total bankroll per bet, depending on your confidence level and risk tolerance.",
        "That's an interesting line you're looking at! While I'm in demo mode, I'd generally suggest looking at line movement, injury reports, and historical matchup data before making your decision.",
        "Live betting can be exciting! In demo mode, I can share that successful live betting often involves watching for momentum shifts, key player situations, and in-game adjustments that the books might be slow to react to.",
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

    // Prepare messages for OpenAI
    const openAIMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
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
        max_completion_tokens: 1000,
        stream,
      }),
    });

    if (!openAIResponse.ok) {
      const error = await openAIResponse.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    if (stream) {
      // Handle streaming response
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      const encoder = new TextEncoder();

      // Process the streaming response
      (async () => {
        try {
          const reader = openAIResponse.body?.getReader();
          if (!reader) return;

          let totalTokens = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n').filter(line => line.trim());

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.choices?.[0]?.delta?.content) {
                    totalTokens += 1; // Approximate token counting
                    await writer.write(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`));
                  }
                } catch (e) {
                  console.error('Error parsing chunk:', e);
                }
              }
            }
          }

          // Log usage
          await supabase
            .from('ai_usage_logs')
            .insert({
              user_id: user.id,
              endpoint: 'ai-chat',
              tokens_used: totalTokens,
              cost: totalTokens * 0.0001 // Approximate cost calculation
            });

          await writer.close();
        } catch (error) {
          console.error('Streaming error:', error);
          await writer.abort(error);
        }
      })();

      return new Response(stream.readable, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Handle non-streaming response
      const data = await openAIResponse.json();
      const responseContent = data.choices[0].message.content;

      // Log usage
      await supabase
        .from('ai_usage_logs')
        .insert({
          user_id: user.id,
          endpoint: 'ai-chat',
          tokens_used: data.usage?.total_tokens || 0,
          cost: (data.usage?.total_tokens || 0) * 0.0001
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