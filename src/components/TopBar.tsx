import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Bot, Clock, User } from 'lucide-react';

const TopBar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex items-center justify-between p-4 bg-card/50 backdrop-blur border-b border-border/30">
      <Button 
        onClick={() => navigate('/ai-coach')}
        className="bg-gradient-neon hover:shadow-neon font-sports text-sm px-4 py-2"
      >
        <Bot className="w-4 h-4 mr-2" />
        AI COACH
      </Button>

      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-1 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="font-mono">{formatTime(currentTime)}</span>
        </div>

        {user ? (
          <Button
            variant="ghost"
            onClick={() => navigate('/profile/me')}
            className="text-muted-foreground hover:text-foreground"
          >
            <User className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Profile</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            onClick={() => navigate('/auth')}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Sign In
          </Button>
        )}
      </div>
    </div>
  );
};

export default TopBar;