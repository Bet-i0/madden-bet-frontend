
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Bankroll {
  id: string;
  user_id: string;
  name: string;
  starting_balance: number;
  currency: string;
  staking_strategy: 'fixed' | '%_bankroll' | 'kelly';
  unit_size?: number;
  kelly_fraction?: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankrollTransaction {
  id: string;
  bankroll_id: string;
  type: 'deposit' | 'withdrawal' | 'bet_win' | 'bet_loss';
  amount: number;
  notes?: string;
  reference_bet_id?: string;
  created_at: string;
  updated_at: string;
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type assertion to handle the database response
      const typedData = data?.map(bankroll => ({
        ...bankroll,
        staking_strategy: bankroll.staking_strategy as 'fixed' | '%_bankroll' | 'kelly'
      })) || [];

      setBankrolls(typedData);
      
      if (typedData.length > 0 && !activeBankroll) {
        const activeData = {
          ...typedData[0],
          staking_strategy: typedData[0].staking_strategy as 'fixed' | '%_bankroll' | 'kelly'
        };
        setActiveBankroll(activeData);
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
      return data;
    } catch (error) {
      console.error('Error creating bankroll:', error);
      throw error;
    }
  };

  const updateBankroll = async (id: string, updates: Partial<Omit<Bankroll, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('bankrolls')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating bankroll:', error);
      throw error;
    }
  };

  const addTransaction = async (transaction: Omit<BankrollTransaction, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('bankroll_transactions')
        .insert([transaction])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
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
    updateBankroll,
    addTransaction,
    refetch: fetchBankrolls
  };
};
