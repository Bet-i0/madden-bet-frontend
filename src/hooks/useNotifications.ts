import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DEMO_MODE = true;

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (DEMO_MODE) {
        // Demo notifications for MVP presentation
        const demoNotifications = [
          {
            id: '1',
            user_id: user.id,
            type: 'new_follower',
            data: { follower_name: 'Mike Johnson' },
            read: false,
            created_at: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
          },
          {
            id: '2', 
            user_id: user.id,
            type: 'bet_tailed',
            data: { user_name: 'Sarah Wilson' },
            read: false,
            created_at: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
          },
          {
            id: '3',
            user_id: user.id,
            type: 'bet_reaction',
            data: { user_name: 'Alex Rodriguez' },
            read: true,
            created_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(), // 2 hours ago
          },
          {
            id: '4',
            user_id: user.id,
            type: 'bet_comment',
            data: { user_name: 'Emma Davis' },
            read: true,
            created_at: new Date(Date.now() - 6 * 60 * 60000).toISOString(), // 6 hours ago
          }
        ];
        
        setNotifications(demoNotifications);
        setUnreadCount(demoNotifications.filter(n => !n.read).length);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setNotifications((data || []).map(item => ({
        ...item,
        data: item.data as Record<string, any>
      })));
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      if (DEMO_MODE) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      if (DEMO_MODE) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const createNotification = async (userId: string, type: string, data: Record<string, any>) => {
    if (DEMO_MODE) return; // Skip in demo mode
    
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          data,
          read: false
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      if (DEMO_MODE) return; // Skip real-time subscription in demo mode

      // Set up real-time subscription for new notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev]);
            if (!newNotification.read) {
              setUnreadCount(prev => prev + 1);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    refetch: fetchNotifications
  };
};