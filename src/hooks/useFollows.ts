
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Follow {
  id: string;
  follower_id: string;
  followed_id: string;
  created_at: string;
}

export const useFollows = () => {
  const [followers, setFollowers] = useState<Follow[]>([]);
  const [following, setFollowing] = useState<Follow[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchFollows = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get followers
      const { data: followersData, error: followersError } = await supabase
        .from('follows')
        .select('*')
        .eq('followed_id', user.id);

      if (followersError) throw followersError;

      // Get following
      const { data: followingData, error: followingError } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id);

      if (followingError) throw followingError;

      setFollowers(followersData || []);
      setFollowing(followingData || []);
    } catch (error) {
      console.error('Error fetching follows:', error);
    } finally {
      setLoading(false);
    }
  };

  const followUser = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('follows')
        .insert([{
          follower_id: user.id,
          followed_id: userId
        }]);

      if (error) throw error;
      await fetchFollows();
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  };

  const unfollowUser = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('followed_id', userId);

      if (error) throw error;
      await fetchFollows();
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  };

  const isFollowing = (userId: string) => {
    return following.some(follow => follow.followed_id === userId);
  };

  useEffect(() => {
    if (user) {
      fetchFollows();
    }
  }, [user]);

  return {
    followers,
    following,
    loading,
    followUser,
    unfollowUser,
    isFollowing,
    refetch: fetchFollows
  };
};
