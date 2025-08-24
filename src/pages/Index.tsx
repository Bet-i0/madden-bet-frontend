import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Activity,
  Target,
  PlusCircle,
  Calendar,
  Trophy,
  Flame,
  User
} from 'lucide-react';
import BetHistoryTab from '@/components/BetHistoryTab';
import SaveBetDialog from '@/components/SaveBetDialog';
import SettingsDialog from '@/components/SettingsDialog';
import { useProfile } from '@/hooks/useProfile';

const Index = () => {
  const [showSaveBetDialog, setShowSaveBetDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();

  const handleNavigation = (path: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate(path);
  };

  if (!user) {
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
              onClick={() => navigate('/auth')} 
              size="lg" 
              className="bg-primary hover:bg-primary/90"
            >
              Get Started - It's Free
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.display_name || 'Bettor'}!</p>
          </div>
          <Button onClick={() => setShowSaveBetDialog(true)} className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            Add Bet
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Bets</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold text-green-600">67%</p>
                </div>
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">ROI</p>
                  <p className="text-2xl font-bold text-green-600">+12.4%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profit</p>
                  <p className="text-2xl font-bold text-green-600">+$2,450</p>
                </div>
                <Flame className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="bets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bets">Recent Bets</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="bets">
            <BetHistoryTab />
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Won bet on Lakers vs Warriors</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Placed new bet on Chiefs -7.5</p>
                      <p className="text-xs text-muted-foreground">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Lost parlay bet</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4">
          <div className="flex justify-around max-w-md mx-auto">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleNavigation('/analytics')}
              className="flex flex-col items-center gap-1"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs">Analytics</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleNavigation('/social')}
              className="flex flex-col items-center gap-1"
            >
              <Users className="w-4 h-4" />
              <span className="text-xs">Social</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleNavigation('/trending')}
              className="flex flex-col items-center gap-1"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Trending</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleNavigation('/profile/me')}
              className="flex flex-col items-center gap-1"
            >
              <User className="w-4 h-4" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <SaveBetDialog 
        isOpen={showSaveBetDialog} 
        onClose={() => setShowSaveBetDialog(false)} 
      />
      
      <SettingsDialog
        isOpen={showSettingsDialog}
        onClose={() => setShowSettingsDialog(false)}
      />
    </div>
  );
};

export default Index;
