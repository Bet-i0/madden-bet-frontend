import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BetLeg {
  id?: string;
  sport: string;
  league: string;
  game_date?: string;
  team1: string;
  team2: string;
  bet_market: string;
  bet_selection: string;
  odds?: number;
  result?: 'pending' | 'won' | 'lost' | 'void' | 'push';
}

export interface Bet {
  id?: string;
  bet_type: 'single' | 'parlay' | 'teaser' | 'round_robin';
  stake: number;
  potential_payout?: number;
  total_odds?: number;
  status: 'pending' | 'won' | 'lost' | 'void' | 'push';
  sportsbook?: string;
  notes?: string;
  ai_suggested?: boolean;
  settled_at?: string;
  created_at?: string;
  legs: BetLeg[];
}

export const useBets = () => {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalPicks: 0,
    winRate: 0,
    profit: 0,
    roi: 0
  });
  const { user } = useAuth();

  const fetchBets = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select(`
          *,
          bet_legs (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (betsError) throw betsError;

      const formattedBets = betsData?.map(bet => ({
        ...bet,
        legs: bet.bet_legs || []
      })) || [];

      setBets(formattedBets);
      calculateAnalytics(formattedBets);
    } catch (error) {
      console.error('Error fetching bets:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (betsData: any[]) => {
    const settledBets = betsData.filter(bet => bet.status !== 'pending');
    const wonBets = settledBets.filter(bet => bet.status === 'won');
    
    const totalStaked = settledBets.reduce((sum, bet) => sum + parseFloat(bet.stake), 0);
    const totalWon = wonBets.reduce((sum, bet) => sum + parseFloat(bet.potential_payout || 0), 0);
    const profit = totalWon - totalStaked;
    
    setAnalytics({
      totalPicks: betsData.length,
      winRate: settledBets.length > 0 ? (wonBets.length / settledBets.length) * 100 : 0,
      profit: profit,
      roi: totalStaked > 0 ? (profit / totalStaked) * 100 : 0
    });
  };

  const saveBet = async (bet: Omit<Bet, 'id'>) => {
    if (!user) return null;

    try {
      const { data: betData, error: betError } = await supabase
        .from('bets')
        .insert([{
          user_id: user.id,
          bet_type: bet.bet_type,
          stake: bet.stake,
          potential_payout: bet.potential_payout,
          total_odds: bet.total_odds,
          status: bet.status,
          sportsbook: bet.sportsbook,
          notes: bet.notes,
          ai_suggested: bet.ai_suggested
        }])
        .select()
        .single();

      if (betError) throw betError;

      // Insert bet legs
      if (bet.legs.length > 0) {
        const { error: legsError } = await supabase
          .from('bet_legs')
          .insert(
            bet.legs.map(leg => ({
              bet_id: betData.id,
              sport: leg.sport,
              league: leg.league,
              game_date: leg.game_date,
              team1: leg.team1,
              team2: leg.team2,
              bet_market: leg.bet_market,
              bet_selection: leg.bet_selection,
              odds: leg.odds,
              result: leg.result || 'pending'
            }))
          );

        if (legsError) throw legsError;
      }

      // Refresh bets
      fetchBets();
      return betData;
    } catch (error) {
      console.error('Error saving bet:', error);
      throw error;
    }
  };

  const updateBetStatus = async (betId: string, status: 'won' | 'lost' | 'void' | 'push') => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bets')
        .update({ 
          status, 
          settled_at: new Date().toISOString() 
        })
        .eq('id', betId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Refresh bets
      fetchBets();
    } catch (error) {
      console.error('Error updating bet status:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBets();
    }
  }, [user]);

  return {
    bets,
    analytics,
    loading,
    saveBet,
    updateBetStatus,
    refetch: fetchBets
  };
};