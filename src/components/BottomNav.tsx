import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Home, 
  BarChart3, 
  Users, 
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      label: 'Home',
      icon: Home,
      path: '/',
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      path: '/analytics',
    },
    {
      label: 'Social',
      icon: Users,
      path: '/social',
    },
    {
      label: 'Profile',
      icon: User,
      path: '/profile/me',
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-card/95 backdrop-blur border-t border-border">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const active = isActive(item.path);
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center h-full rounded-none space-y-1 font-gaming text-xs",
                active 
                  ? "text-primary bg-primary/10" 
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
  );
};

export default BottomNav;