import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Trophy
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-4">
              SportsBet Tracker
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Track your sports bets, analyze your performance, and improve your betting strategy with our comprehensive analytics platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <BarChart3 className="w-8 h-8 text-primary mx-auto" />
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track your ROI, win rate, and betting patterns with detailed analytics
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <Users className="w-8 h-8 text-primary mx-auto" />
                <CardTitle>Social Features</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Share bets, follow top bettors, and learn from the community
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-primary mx-auto" />
                <CardTitle>AI Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get AI-powered betting insights and strategy recommendations
                </p>
              </CardContent>
            </Card>
          </div>

          <Button 
            onClick={() => user ? navigate('/profile/me') : navigate('/auth')} 
            size="lg" 
            className="bg-primary hover:bg-primary/90"
          >
            {user ? 'Go to My Dashboard' : 'Get Started - It\'s Free'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
