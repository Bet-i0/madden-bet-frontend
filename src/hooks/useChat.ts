import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DEMO_MODE = true;

export interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  display_name?: string;
}

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { user } = useAuth();

  // Fetch recent messages
  const fetchMessages = useCallback(async () => {
    try {
      if (DEMO_MODE) {
        // Demo chat messages for MVP presentation
        const demoMessages = [
          {
            id: '1',
            user_id: 'demo-user-1',
            content: 'Anyone else seeing value in the Chiefs game tonight?',
            created_at: new Date(Date.now() - 30 * 60000).toISOString(),
            display_name: 'SportsBettor23'
          },
          {
            id: '2', 
            user_id: user?.id || 'current-user',
            content: 'Yeah, the over looks good. Weather conditions are perfect',
            created_at: new Date(Date.now() - 25 * 60000).toISOString(),
            display_name: 'You'
          },
          {
            id: '3',
            user_id: 'demo-user-2', 
            content: 'I\'m staying away from that game. Too much uncertainty with Mahomes\' injury',
            created_at: new Date(Date.now() - 20 * 60000).toISOString(),
            display_name: 'AnalyticsKing'
          },
          {
            id: '4',
            user_id: 'demo-user-3',
            content: 'Just hit a 4-leg parlay! NBA is treating me well this week 🔥',
            created_at: new Date(Date.now() - 10 * 60000).toISOString(),
            display_name: 'ParlayPro'
          }
        ];
        
        setMessages(demoMessages);
        setOnlineUsers([
          'demo-user-1', 'demo-user-2', 'demo-user-3', user?.id || 'current-user'
        ]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          user_id,
          content,
          created_at,
          profiles(display_name)
        `)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      const formattedMessages = data.map(msg => ({
        id: msg.id,
        user_id: msg.user_id,
        content: msg.content,
        created_at: msg.created_at,
        display_name: (msg.profiles as any)?.display_name || 'Anonymous'
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          content: content.trim()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Fetch display name for the new message
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', newMessage.user_id)
            .single();

          const messageWithProfile = {
            ...newMessage,
            display_name: profileData?.display_name || 'Anonymous'
          };

          setMessages(prev => [...prev, messageWithProfile]);
        }
      )
      .subscribe();

    // Subscribe to presence for online users
    const presenceChannel = supabase
      .channel('global-chat-presence')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = Object.keys(state);
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => [...prev, key]);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => prev.filter(id => id !== key));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          });
        }
      });

    // Initial fetch
    fetchMessages();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [user, fetchMessages]);

  return {
    messages,
    loading,
    onlineUsers,
    sendMessage,
    refetch: fetchMessages
  };
};