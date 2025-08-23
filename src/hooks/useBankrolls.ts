
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Bankroll {
  id: string;
  user_id: string;
  name: string;
  currency: string;
  starting_balance: number;
  unit_size?: number;
  staking_strategy: 'fixed' | '%_bankroll' | 'kelly';
  kelly_fraction?: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankrollTransaction {
  id: string;
  bankroll_id: string;
  created_at: string;
  updated_at: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win' | 'loss' | 'adjustment';
  reference_bet_id?: string;
  notes?: string;
}

export const useBankrolls = () => {
  const [bankrolls, setBankrolls] = useState<Bankroll[]>([]);
  const [activeBankroll, setActiveBankroll] = useState<Bankroll | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchBankrolls = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bankrolls')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBankrolls(data || []);
      
      // Set first bankroll as active if none selected
      if (data && data.length > 0 && !activeBankroll) {
        setActiveBankroll(data[0]);
      }
    } catch (error) {
      console.error('Error fetching bankrolls:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBankroll = async (bankroll: Omit<Bankroll, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('bankrolls')
        .insert([{
          user_id: user.id,
          ...bankroll
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchBankrolls();
      return data;
    } catch (error) {
      console.error('Error creating bankroll:', error);
      throw error;
    }
  };

  const getCurrentBalance = async (bankrollId: string): Promise<number> => {
    try {
      const { data: bankroll } = await supabase
        .from('bankrolls')
        .select('starting_balance')
        .eq('id', bankrollId)
        .single();

      const { data: transactions } = await supabase
        .from('bankroll_transactions')
        .select('amount')
        .eq('bankroll_id', bankrollId);

      const startingBalance = bankroll?.starting_balance || 0;
      const totalTransactions = transactions?.reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0) || 0;
      
      return startingBalance + totalTransactions;
    } catch (error) {
      console.error('Error calculating balance:', error);
      return 0;
    }
  };

  useEffect(() => {
    if (user) {
      fetchBankrolls();
    }
  }, [user]);

  return {
    bankrolls,
    activeBankroll,
    setActiveBankroll,
    loading,
    createBankroll,
    getCurrentBalance,
    refetch: fetchBankrolls
  };
};
