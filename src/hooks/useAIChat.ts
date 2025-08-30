import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UsageInfo {
  monthlyUsage: number;
  maxCalls: number;
}

export const useAIChat = () => {
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm SportsBot, your AI betting assistant. I can help with strategy, odds analysis, bankroll management, and more. What would you like to discuss?",
      timestamp: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<UsageInfo>({ monthlyUsage: 0, maxCalls: 10 });
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string, streaming: boolean = true) => {
    if (!user || !content.trim() || loading) return;

    const userMessage: AIChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const conversationMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await supabase.functions.invoke('ai-chat', {
        body: { 
          messages: conversationMessages,
          stream: streaming 
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.error) throw response.error;

      if (streaming && response.data) {
        // Handle streaming response
        const assistantMessage: AIChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);

        // Parse the streaming response
        const reader = response.data.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                
                if (delta) {
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === assistantMessage.id 
                        ? { ...msg, content: msg.content + delta }
                        : msg
                    )
                  );
                }
              } catch (e) {
                console.error('Error parsing streaming chunk:', e);
              }
            }
          }
        }
        // Ensure we don't leave an empty assistant message
        setMessages(prev => prev.map(msg => msg.id === assistantMessage.id && (msg.content.trim() === '')
          ? { ...msg, content: "I'm having trouble generating a response right now. Could you try rephrasing your question or ask about something specific like odds analysis or betting strategies?" }
          : msg
        ));
      } else if (response.data?.message) {
        // Handle non-streaming response
        const assistantMessage: AIChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        
        if (response.data.usage) {
          setUsage(response.data.usage);
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      if (error.name === 'AbortError') return;

      const errorMessage: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.message || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [user, messages, loading]);

  const clearChat = useCallback(() => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm SportsBot, your AI betting assistant. I can help with strategy, odds analysis, bankroll management, and more. What would you like to discuss?",
      timestamp: new Date()
    }]);
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  }, []);

  return {
    messages,
    loading,
    usage,
    sendMessage,
    clearChat,
    stopGeneration
  };
};