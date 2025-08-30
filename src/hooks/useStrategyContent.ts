import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StrategyContent {
  id: string;
  strategy_id: string;
  strategy_name: string;
  content: any;
  picks: any;
  confidence: number;
  expected_roi: string;
  timeframe: string;
  valid_until: string;
  created_at: string;
  updated_at: string;
}

export const useStrategyContent = () => {
  const [strategyContent, setStrategyContent] = useState<Record<string, StrategyContent>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStrategyContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('strategy_content')
        .select('*')
        .gt('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Convert array to object keyed by strategy_id, taking most recent for each
      const contentMap: Record<string, StrategyContent> = {};
      data?.forEach((item) => {
        if (!contentMap[item.strategy_id] || 
            new Date(item.created_at) > new Date(contentMap[item.strategy_id].created_at)) {
          contentMap[item.strategy_id] = item;
        }
      });

      setStrategyContent(contentMap);
    } catch (err) {
      console.error('Error fetching strategy content:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch strategy content');
    } finally {
      setLoading(false);
    }
  };

  const generateNewContent = async () => {
    try {
      setError(null);
      
      const { data, error: invokeError } = await supabase.functions.invoke('strategy-content-generator');
      
      if (invokeError) {
        throw invokeError;
      }

      console.log('Strategy content generation triggered:', data);
      
      // Refresh content after generation
      await fetchStrategyContent();
      
      return data;
    } catch (err) {
      console.error('Error generating strategy content:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate strategy content');
      throw err;
    }
  };

  useEffect(() => {
    fetchStrategyContent();

    // Set up real-time subscription for strategy content updates
    const subscription = supabase
      .channel('strategy_content_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'strategy_content'
        },
        () => {
          console.log('Strategy content updated, refreshing...');
          fetchStrategyContent();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    strategyContent,
    loading,
    error,
    refetch: fetchStrategyContent,
    generateNewContent
  };
};