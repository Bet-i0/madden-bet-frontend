
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website_url?: string;
  banner_url?: string;
  auto_save_bets: boolean;
  default_sportsbook: string;
  odds_format: string;
  zapier_webhook_url?: string;
  public_profile: boolean;
  notification_preferences: {
    settlement_reminders: boolean;
    ai_picks_ready: boolean;
    bankroll_alerts: boolean;
  };
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        // Type assertion and transformation for notification_preferences
        const transformedProfile: Profile = {
          ...data,
          notification_preferences: typeof data.notification_preferences === 'object' && data.notification_preferences
            ? {
                settlement_reminders: (data.notification_preferences as any)?.settlement_reminders ?? true,
                ai_picks_ready: (data.notification_preferences as any)?.ai_picks_ready ?? true,
                bankroll_alerts: (data.notification_preferences as any)?.bankroll_alerts ?? true,
              }
            : {
                settlement_reminders: true,
                ai_picks_ready: true,
                bankroll_alerts: true,
              }
        };
        setProfile(transformedProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Omit<Profile, 'id' | 'user_id'>>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert([{
          user_id: user.id,
          ...updates
        }])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        // Same transformation for the updated data
        const transformedProfile: Profile = {
          ...data,
          notification_preferences: typeof data.notification_preferences === 'object' && data.notification_preferences
            ? {
                settlement_reminders: (data.notification_preferences as any)?.settlement_reminders ?? true,
                ai_picks_ready: (data.notification_preferences as any)?.ai_picks_ready ?? true,
                bankroll_alerts: (data.notification_preferences as any)?.bankroll_alerts ?? true,
              }
            : {
                settlement_reminders: true,
                ai_picks_ready: true,
                bankroll_alerts: true,
              }
        };
        setProfile(transformedProfile);
      }
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile
  };
};
