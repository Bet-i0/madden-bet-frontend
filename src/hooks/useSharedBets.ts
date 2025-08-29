
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DEMO_MODE = true;

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
      if (DEMO_MODE) {
        // Demo shared bets for MVP presentation
        const demoSharedBets: SharedBet[] = [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            original_bet_id: 'demo-bet-1',
            owner_user_id: 'demo-user-1',
            title: 'Sunday Night Parlay',
            comment: 'Love these picks for tonight. All systems go! 🔥',
            is_active: true,
            created_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
            updated_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
            legs: [
              {
                id: '550e8400-e29b-41d4-a716-446655440011',
                sport: 'NFL',
                league: 'NFL',
                team1: 'Chiefs',
                team2: 'Bills',
                bet_market: 'spread',
                bet_selection: 'Chiefs -3.5',
                odds: -110
              },
              {
                id: '550e8400-e29b-41d4-a716-446655440012',
                sport: 'NFL', 
                league: 'NFL',
                team1: 'Chiefs',
                team2: 'Bills',
                bet_market: 'total',
                bet_selection: 'Over 47.5',
                odds: -105
              }
            ],
            owner_profile: {
              display_name: 'BettingKing92',
              avatar_url: null
            },
            reactions_count: {
              likes: 12,
              tails: 8,
              fires: 6,
              fades: 2
            }
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            original_bet_id: 'demo-bet-2',
            owner_user_id: 'demo-user-2',
            title: 'NBA Lock of the Day',
            comment: 'Warriors at home are unstoppable. Easy money!',
            is_active: true,
            created_at: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
            updated_at: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
            legs: [
              {
                id: '550e8400-e29b-41d4-a716-446655440013',
                sport: 'NBA',
                league: 'NBA',
                team1: 'Warriors',
                team2: 'Lakers',
                bet_market: 'moneyline',
                bet_selection: 'Warriors ML',
                odds: -150
              }
            ],
            owner_profile: {
              display_name: 'AnalyticsAce',
              avatar_url: null
            },
            reactions_count: {
              likes: 18,
              tails: 14,
              fires: 10,
              fades: 1
            }
          }
        ];
        
        setSharedBets(demoSharedBets);
        return;
      }

      // First, get the shared bets
      const { data: sharedBetsData, error } = await supabase
        .from('shared_bets')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!sharedBetsData) {
        setSharedBets([]);
        return;
      }

      const formattedBets = await Promise.all(
        sharedBetsData.map(async (bet) => {
          // Fetch bet legs separately
          const { data: legsData } = await supabase
            .from('shared_bet_legs')
            .select('*')
            .eq('shared_bet_id', bet.id);

          // Fetch owner profile separately
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', bet.owner_user_id)
            .single();

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
            legs: legsData || [],
            owner_profile: profileData,
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
        .select('*')
        .eq('id', betId)
        .eq('user_id', user.id)
        .single();

      if (betError) throw betError;

      // Get bet legs separately
      const { data: betLegsData } = await supabase
        .from('bet_legs')
        .select('*')
        .eq('bet_id', betId);

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
      if (betLegsData && betLegsData.length > 0) {
        const { error: legsError } = await supabase
          .from('shared_bet_legs')
          .insert(
            betLegsData.map(leg => ({
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
        .select('*')
        .eq('id', sharedBetId)
        .single();

      if (sharedBetError) throw sharedBetError;

      // Get shared bet legs separately
      const { data: sharedBetLegs } = await supabase
        .from('shared_bet_legs')
        .select('*')
        .eq('shared_bet_id', sharedBetId);

      if (!sharedBetLegs || sharedBetLegs.length === 0) {
        throw new Error('No bet legs found for shared bet');
      }

      // Calculate total odds for the bet
      const totalOdds = sharedBetLegs.reduce((acc, leg) => {
        return acc * (leg.odds || 1);
      }, 1);

      const potentialPayout = stake * totalOdds;

      // Create new bet based on shared bet
      const { data: newBet, error: newBetError } = await supabase
        .from('bets')
        .insert([{
          user_id: user.id,
          bet_type: sharedBetLegs.length === 1 ? 'single' : 'parlay',
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
          sharedBetLegs.map(leg => ({
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
