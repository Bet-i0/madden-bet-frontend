import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Reaction {
  id: string;
  shared_bet_id: string;
  user_id: string;
  type: 'like' | 'fire' | 'tail';
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
      setReactions((data || []).map(item => ({
        ...item,
        type: item.type as 'like' | 'fire' | 'tail'
      })));
    } catch (error) {
      console.error('Error fetching reactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addReaction = async (sharedBetId: string, type: 'like' | 'fire' | 'tail') => {
    if (!user) return;

    try {
      // Check if user already reacted with this type
      const existingReaction = reactions.find(
        r => r.shared_bet_id === sharedBetId && r.user_id === user.id && r.type === type
      );

      if (existingReaction) {
        // Remove existing reaction
        const { error } = await supabase
          .from('bet_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (error) throw error;
        setReactions(prev => prev.filter(r => r.id !== existingReaction.id));
      } else {
        // Add new reaction
        const { data, error } = await supabase
          .from('bet_reactions')
          .insert([{
            shared_bet_id: sharedBetId,
            user_id: user.id,
            type
          }])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const transformedData = {
            ...data,
            type: data.type as 'like' | 'fire' | 'tail'
          };
          setReactions(prev => [...prev, transformedData]);
        }
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      throw error;
    }
  };

  const getUserReaction = (sharedBetId: string, type: 'like' | 'fire' | 'tail') => {
    if (!user) return false;
    return reactions.some(
      r => r.shared_bet_id === sharedBetId && r.user_id === user.id && r.type === type
    );
  };

  const getReactionCount = (sharedBetId: string, type: 'like' | 'fire' | 'tail') => {
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