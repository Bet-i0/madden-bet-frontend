import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Reaction {
  id: string;
  shared_bet_id: string;
  user_id: string;
  type: '👍' | '🔥' | '💯' | '😂' | '😮' | '😡';
  created_at: string;
}

export const useReactions = () => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchReactions = async (sharedBetId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bet_reactions')
        .select('*')
        .eq('shared_bet_id', sharedBetId);

      if (error) throw error;
      setReactions((data || []) as Reaction[]);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addReaction = async (sharedBetId: string, type: '👍' | '🔥' | '💯' | '😂' | '😮' | '😡') => {
    if (!user) return;

    try {
      // Use edge function for rate limiting and emoji validation
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`https://avyqvcvalvtuqncexnbf.supabase.co/functions/v1/react-bet`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sharedBetId, emoji: type }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to toggle reaction');
      }

      // Refetch reactions to get updated state
      await fetchReactions(sharedBetId);
    } catch (error) {
      console.error('Error toggling reaction:', error);
      throw error;
    }
  };

  const getUserReaction = (sharedBetId: string, type: '👍' | '🔥' | '💯' | '😂' | '😮' | '😡') => {
    if (!user) return false;
    return reactions.some(
      r => r.shared_bet_id === sharedBetId && r.user_id === user.id && r.type === type
    );
  };

  const getReactionCount = (sharedBetId: string, type: '👍' | '🔥' | '💯' | '😂' | '😮' | '😡') => {
    return reactions.filter(r => r.shared_bet_id === sharedBetId && r.type === type).length;
  };

  return {
    reactions,
    loading,
    fetchReactions,
    addReaction,
    getUserReaction,
    getReactionCount
  };
};