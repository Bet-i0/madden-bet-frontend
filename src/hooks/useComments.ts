import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Comment {
  id: string;
  shared_bet_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_profile?: {
    display_name: string;
    avatar_url?: string;
  };
}

export const useComments = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchComments = async (sharedBetId: string) => {
    setLoading(true);
    try {
      // First fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('bet_comments')
        .select('*')
        .eq('shared_bet_id', sharedBetId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;
      
      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      
      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;
      
      // Create a profile map for quick lookup
      const profileMap = new Map();
      profilesData?.forEach(profile => {
        profileMap.set(profile.user_id, profile);
      });
      
      // Transform the data to match our interface
      const transformedData = commentsData.map(comment => ({
        ...comment,
        user_profile: profileMap.get(comment.user_id) || {
          display_name: 'Anonymous',
          avatar_url: undefined
        }
      }));
      
      setComments(transformedData);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (sharedBetId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { data: commentData, error: commentError } = await supabase
        .from('bet_comments')
        .insert([{
          shared_bet_id: sharedBetId,
          user_id: user.id,
          content: content.trim()
        }])
        .select()
        .single();

      if (commentError) throw commentError;
      
      if (commentData) {
        // Fetch the user's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;

        // Create the transformed comment
        const transformedComment = {
          ...commentData,
          user_profile: profileData || {
            display_name: 'Anonymous',
            avatar_url: undefined
          }
        };
        
        setComments(prev => [...prev, transformedComment]);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bet_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Ensure user can only delete their own comments

      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  };

  const getCommentCount = (sharedBetId: string) => {
    return comments.filter(c => c.shared_bet_id === sharedBetId).length;
  };

  return {
    comments,
    loading,
    fetchComments,
    addComment,
    deleteComment,
    getCommentCount
  };
};