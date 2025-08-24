import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Home, 
  BarChart3, 
  Settings,
  Bell,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import SettingsDialog from '@/components/SettingsDialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const navItems = [
    {
      label: 'AI COACH',
      icon: Bot,
      path: '/ai-coach',
    },
    {
      label: 'INJURIES',
      icon: Target,  // Using Target as injury icon
      path: '/injuries',
    },
    {
      label: 'ANALYTICS',
      icon: BarChart3,
      path: '/analytics',
    },
    {
      label: 'DASHBOARD',
      icon: Home,
      path: '/',
    },
    {
      label: 'SETTINGS',
      icon: Settings,
      action: 'settings',
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleItemClick = (item: any) => {
    if (item.action === 'settings') {
      if (!user) {
        navigate('/auth');
      } else {
        setIsSettingsOpen(true);
      }
    } else {
      navigate(item.path);
    }
  };

  const getNotificationText = (notification: any) => {
    switch (notification.type) {
      case 'new_follower':
        return `${notification.data.follower_name} started following you`;
      case 'bet_tailed':
        return `${notification.data.user_name} tailed your bet`;
      case 'bet_reaction':
        return `${notification.data.user_name} reacted to your bet`;
      case 'bet_comment':
        return `${notification.data.user_name} commented on your bet`;
      default:
        return 'New notification';
    }
  };

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 bg-card/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const active = item.path ? isActive(item.path) : (item.action === 'settings' && isSettingsOpen);
            
            return (
              <Button
                key={item.path || item.action}
                variant="ghost"
                onClick={() => handleItemClick(item)}
                className={cn(
                  "flex flex-col items-center justify-center h-full rounded-none space-y-1 font-gaming text-xs font-semibold",
                  active 
                    ? "text-primary border-t-2 border-primary/70" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={active ? "page" : undefined}
              >
                <IconComponent className="w-5 h-5" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>


      {/* Settings Dialog */}
      <SettingsDialog 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
};

export default BottomNav;