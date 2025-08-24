import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Bot,
  Zap,
  Wrench
} from 'lucide-react';
import stadiumBg from '@/assets/stadium-bg.jpg';
import TopBar from '@/components/TopBar';
import MatchSpotlight from '@/components/MatchSpotlight';
import AIInsightsPreview from '@/components/AIInsightsPreview';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const widgets = [
    {
      title: 'Strategy Builder',
      description: 'Build and optimize your betting strategies',
      icon: Wrench,
      path: '/strategies',
      gradient: 'bg-gradient-primary'
    },
    {
      title: 'Trending Now',
      description: 'Hot trends and market insights',
      icon: TrendingUp,
      path: '/trending',
      gradient: 'bg-gradient-neon'
    },
    {
      title: 'Social Hub',
      description: 'Connect and share with the community',
      icon: Users,
      path: '/social',
      gradient: 'bg-gradient-card'
    },
    {
      title: 'AI Coach',
      description: 'Get AI-powered betting insights',
      icon: Bot,
      path: '/ai-coach',
      gradient: 'bg-gradient-primary'
    }
  ];

  return (
    <div className="min-h-screen bg-background font-gaming relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${stadiumBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-hero" />
      
      {/* Content */}
      <div className="relative z-10">
        <TopBar />
        
        <div className="px-6 md:px-8 lg:px-12 py-6 pb-24">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Zap className="w-10 h-10 text-neon-blue animate-glow-pulse" />
                <h1 className="text-4xl md:text-6xl font-sports bg-gradient-primary bg-clip-text text-transparent">
                  BET.IO
                </h1>
              </div>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                AI-powered sports betting platform
              </p>
            </div>

            {/* Live Games */}
            <MatchSpotlight />

            {/* AI Insights Preview */}
            <AIInsightsPreview />

            {/* Widget Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {widgets.map((widget) => {
                const IconComponent = widget.icon;
                return (
                  <Card 
                    key={widget.title}
                    className="gaming-card cursor-pointer group hover:animate-card-hover transition-all duration-300"
                    onClick={() => navigate(widget.path)}
                  >
                    <CardHeader className="text-center pb-3">
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-lg ${widget.gradient} flex items-center justify-center`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-base font-sports group-hover:text-primary transition-colors">
                        {widget.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground text-center">
                        {widget.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              {user ? (
                <>
                  <Button 
                    onClick={() => navigate('/profile/me')} 
                    size="lg" 
                    className="bg-gradient-primary hover:shadow-neon font-sports px-6"
                  >
                    Go to Dashboard
                  </Button>
                  <Button 
                    onClick={() => navigate('/analytics')} 
                    variant="outline"
                    size="lg" 
                    className="bg-background/20 border-border/50 backdrop-blur-sm hover:bg-background/30 font-sports px-6"
                  >
                    Analytics
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => navigate('/auth')} 
                    size="lg" 
                    className="bg-gradient-primary hover:shadow-neon font-sports px-6"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => navigate('/auth')} 
                    variant="outline"
                    size="lg" 
                    className="bg-background/20 border-border/50 backdrop-blur-sm hover:bg-background/30 font-sports px-6"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;