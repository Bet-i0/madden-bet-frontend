import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Home, 
  BarChart3, 
  Settings,
  Bell
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
      label: 'GAMES',
      icon: Home,
      path: '/',
    },
    {
      label: 'ANALYTICS',
      icon: BarChart3,
      path: '/analytics',
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
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-card/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-4 h-16">
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

      {/* Floating Notification Button */}
      {user && (
        <div className="md:hidden fixed bottom-20 right-4 z-50">
          <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                className="h-12 w-12 rounded-full bg-gradient-to-br from-destructive to-orange-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                <Bell className="w-6 h-6 text-white" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-background text-foreground border"
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" side="top">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Mark all read
                    </Button>
                  )}
                </div>
              </div>
              
              <ScrollArea className="h-80">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No notifications yet
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 hover:bg-muted/50 border-b cursor-pointer ${
                          !notification.read ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{getNotificationText(notification)}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full ml-2 mt-1 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Settings Dialog */}
      <SettingsDialog 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
};

export default BottomNav;