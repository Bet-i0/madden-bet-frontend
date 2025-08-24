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
  Zap
} from 'lucide-react';
import stadiumBg from '@/assets/stadium-bg.jpg';
import BottomNav from '@/components/BottomNav';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const widgets = [
    {
      title: 'Analyze Strategies',
      description: 'Deep dive into betting patterns and optimize your approach',
      icon: BarChart3,
      path: '/strategies',
      gradient: 'bg-gradient-primary'
    },
    {
      title: 'Trending Now',
      description: 'Stay on top of the hottest betting trends and insights',
      icon: TrendingUp,
      path: '/trending',
      gradient: 'bg-gradient-neon'
    },
    {
      title: 'Social Hub',
      description: 'Connect with fellow bettors and share your wins',
      icon: Users,
      path: '/social',
      gradient: 'bg-gradient-card'
    },
    {
      title: 'AI Coach',
      description: 'Get personalized betting insights from our AI',
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
      <div className="relative z-10 container mx-auto px-4 py-16 pb-24">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Zap className="w-12 h-12 text-neon-blue animate-glow-pulse" />
              <h1 className="text-5xl md:text-7xl font-sports bg-gradient-primary bg-clip-text text-transparent">
                BET.IO
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              The ultimate sports betting platform powered by AI insights and community wisdom
            </p>
          </div>

          {/* Widget Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {widgets.map((widget) => {
              const IconComponent = widget.icon;
              return (
                <Card 
                  key={widget.title}
                  className="gaming-card cursor-pointer group hover:animate-card-hover transition-all duration-300"
                  onClick={() => navigate(widget.path)}
                >
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-lg ${widget.gradient} flex items-center justify-center`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-lg font-sports group-hover:text-primary transition-colors">
                      {widget.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center">
                      {widget.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {user ? (
              <>
                <Button 
                  onClick={() => navigate('/profile/me')} 
                  size="lg" 
                  className="bg-gradient-primary hover:shadow-neon font-sports text-lg px-8"
                >
                  Go to My Dashboard
                </Button>
                <Button 
                  onClick={() => navigate('/analytics')} 
                  variant="outline"
                  size="lg" 
                  className="bg-background/20 border-border/50 backdrop-blur-sm hover:bg-background/30 font-sports text-lg px-8"
                >
                  Open Analytics
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => navigate('/auth')} 
                  size="lg" 
                  className="bg-gradient-primary hover:shadow-neon font-sports text-lg px-8"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate('/auth')} 
                  variant="outline"
                  size="lg" 
                  className="bg-background/20 border-border/50 backdrop-blur-sm hover:bg-background/30 font-sports text-lg px-8"
                >
                  Create Account
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNav />
    </div>
  );
};

export default Index;