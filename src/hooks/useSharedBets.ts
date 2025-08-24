
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SharedBetLeg {
  id: string;
  sport: string;
  league: string;
  team1: string;
  team2: string;
  bet_market: string;
  bet_selection: string;
  odds?: number;
}

export interface SharedBet {
  id: string;
  original_bet_id: string;
  owner_user_id: string;
  title?: string;
  comment?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  legs: SharedBetLeg[];
  owner_profile?: {
    display_name: string;
    avatar_url?: string;
  };
  reactions_count?: {
    likes: number;
    tails: number;
    fires: number;
    fades: number;
  };
}

export const useSharedBets = () => {
  const [sharedBets, setSharedBets] = useState<SharedBet[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchSharedBets = async () => {
    setLoading(true);
    try {
      const { data: sharedBetsData, error } = await supabase
        .from('shared_bets')
        .select(`
          *,
          shared_bet_legs (*),
          profiles!owner_user_id (display_name, avatar_url)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedBets = await Promise.all(
        (sharedBetsData || []).map(async (bet) => {
          // Fetch reaction counts
          const { data: reactionsData } = await supabase
            .from('bet_reactions')
            .select('type')
            .eq('shared_bet_id', bet.id);

          const reactions = reactionsData?.reduce((acc, reaction) => {
            acc[reaction.type + 's'] = (acc[reaction.type + 's'] || 0) + 1;
            return acc;
          }, { likes: 0, tails: 0, fires: 0, fades: 0 }) || { likes: 0, tails: 0, fires: 0, fades: 0 };

          return {
            ...bet,
            legs: bet.shared_bet_legs || [],
            owner_profile: bet.profiles,
            reactions_count: reactions
          };
        })
      );

      setSharedBets(formattedBets);
    } catch (error) {
      console.error('Error fetching shared bets:', error);
    } finally {
      setLoading(false);
    }
  };

  const shareOriginalBet = async (betId: string, title?: string, comment?: string) => {
    if (!user) return null;

    try {
      // Get the original bet and its legs
      const { data: betData, error: betError } = await supabase
        .from('bets')
        .select(`
          *,
          bet_legs (*)
        `)
        .eq('id', betId)
        .eq('user_id', user.id)
        .single();

      if (betError) throw betError;

      // Create shared bet
      const { data: sharedBetData, error: sharedBetError } = await supabase
        .from('shared_bets')
        .insert([{
          original_bet_id: betId,
          owner_user_id: user.id,
          title: title || `${betData.bet_type.charAt(0).toUpperCase() + betData.bet_type.slice(1)} Bet`,
          comment
        }])
        .select()
        .single();

      if (sharedBetError) throw sharedBetError;

      // Create shared bet legs
      if (betData.bet_legs?.length > 0) {
        const { error: legsError } = await supabase
          .from('shared_bet_legs')
          .insert(
            betData.bet_legs.map(leg => ({
              shared_bet_id: sharedBetData.id,
              sport: leg.sport,
              league: leg.league,
              team1: leg.team1,
              team2: leg.team2,
              bet_market: leg.bet_market,
              bet_selection: leg.bet_selection,
              odds: leg.odds
            }))
          );

        if (legsError) throw legsError;
      }

      return sharedBetData;
    } catch (error) {
      console.error('Error sharing bet:', error);
      throw error;
    }
  };

  const tailBet = async (sharedBetId: string, stake: number) => {
    if (!user) return null;

    try {
      // Get shared bet details
      const { data: sharedBet, error: sharedBetError } = await supabase
        .from('shared_bets')
        .select(`
          *,
          shared_bet_legs (*)
        `)
        .eq('id', sharedBetId)
        .single();

      if (sharedBetError) throw sharedBetError;

      // Calculate total odds for the bet
      const totalOdds = sharedBet.shared_bet_legs.reduce((acc, leg) => {
        return acc * (leg.odds || 1);
      }, 1);

      const potentialPayout = stake * totalOdds;

      // Create new bet based on shared bet
      const { data: newBet, error: newBetError } = await supabase
        .from('bets')
        .insert([{
          user_id: user.id,
          bet_type: sharedBet.shared_bet_legs.length === 1 ? 'single' : 'parlay',
          stake,
          potential_payout: potentialPayout,
          total_odds: totalOdds,
          status: 'pending',
          tailed_from_shared_bet_id: sharedBetId,
          notes: `Tailed from ${sharedBet.title || 'shared bet'}`
        }])
        .select()
        .single();

      if (newBetError) throw newBetError;

      // Create bet legs
      const { error: legsError } = await supabase
        .from('bet_legs')
        .insert(
          sharedBet.shared_bet_legs.map(leg => ({
            bet_id: newBet.id,
            sport: leg.sport,
            league: leg.league,
            team1: leg.team1,
            team2: leg.team2,
            bet_market: leg.bet_market,
            bet_selection: leg.bet_selection,
            odds: leg.odds
          }))
        );

      if (legsError) throw legsError;

      return newBet;
    } catch (error) {
      console.error('Error tailing bet:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchSharedBets();
  }, []);

  return {
    sharedBets,
    loading,
    shareOriginalBet,
    tailBet,
    refetch: fetchSharedBets
  };
};
