
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trophy, Users, TrendingUp, Flame, Target, Crown, ArrowLeft } from 'lucide-react';
import SharedBetCard from '@/components/social/SharedBetCard';
import { useSharedBets } from '@/hooks/useSharedBets';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useToast } from '@/hooks/use-toast';

const Social = () => {
  const [selectedTab, setSelectedTab] = useState('feed');
  const [leaderboardSort, setLeaderboardSort] = useState<'roi_percent' | 'win_rate_percent' | 'profit'>('roi_percent');
  const { sharedBets, loading: betsLoading, tailBet } = useSharedBets();
  const { entries: leaderboardEntries, loading: leaderboardLoading, refetch: refetchLeaderboard } = useLeaderboard();
  const { toast } = useToast();

  const handleTailBet = async (sharedBetId: string, stake: number) => {
    try {
      await tailBet(sharedBetId, stake);
      toast({
        title: "Success!",
        description: "Bet has been added to your betting history.",
      });
    } catch (error) {
      throw error; // Let SharedBetCard handle the error
    }
  };

  const handleLeaderboardSort = (sortBy: 'roi_percent' | 'win_rate_percent' | 'profit') => {
    setLeaderboardSort(sortBy);
    refetchLeaderboard(sortBy);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-4xl font-sports font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            SOCIAL HUB
          </h1>
          <p className="text-muted-foreground">
            Follow the best bettors, discover winning strategies, and join the community
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="feed" className="flex items-center space-x-2">
              <Flame className="w-4 h-4" />
              <span>Feed</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span>Leaderboard</span>
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Following</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-6">
            <div className="grid gap-6">
              {betsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-pulse text-muted-foreground">Loading shared bets...</div>
                </div>
              ) : sharedBets.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Shared Bets Yet</h3>
                    <p className="text-muted-foreground">
                      Be the first to share your winning strategies with the community!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                sharedBets.map((sharedBet) => (
                  <SharedBetCard
                    key={sharedBet.id}
                    sharedBet={sharedBet}
                    onTail={handleTailBet}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="w-6 h-6 text-gold-accent" />
                  <span>Community Leaderboard</span>
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant={leaderboardSort === 'roi_percent' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLeaderboardSort('roi_percent')}
                  >
                    ROI %
                  </Button>
                  <Button
                    variant={leaderboardSort === 'win_rate_percent' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLeaderboardSort('win_rate_percent')}
                  >
                    Win Rate %
                  </Button>
                  <Button
                    variant={leaderboardSort === 'profit' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleLeaderboardSort('profit')}
                  >
                    Profit
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-pulse text-muted-foreground">Loading leaderboard...</div>
                  </div>
                ) : leaderboardEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Public Profiles Yet</h3>
                    <p className="text-muted-foreground">
                      Leaderboard will show users with public profiles and at least 5 settled bets.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboardEntries.map((entry, index) => (
                      <div
                        key={entry.user_id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary/20 rounded-full">
                            <span className="font-bold text-sm">#{index + 1}</span>
                          </div>
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={entry.avatar_url || undefined} />
                            <AvatarFallback>
                              {entry.display_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{entry.display_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {entry.bets_count} bets • {entry.wins}W-{entry.losses}L
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {leaderboardSort === 'roi_percent' && (
                            <Badge 
                              variant={entry.roi_percent >= 0 ? 'default' : 'destructive'}
                              className="font-mono"
                            >
                              {entry.roi_percent >= 0 ? '+' : ''}{entry.roi_percent.toFixed(1)}%
                            </Badge>
                          )}
                          {leaderboardSort === 'win_rate_percent' && (
                            <Badge variant="secondary" className="font-mono">
                              {entry.win_rate_percent.toFixed(1)}%
                            </Badge>
                          )}
                          {leaderboardSort === 'profit' && (
                            <Badge 
                              variant={entry.profit >= 0 ? 'default' : 'destructive'}
                              className="font-mono"
                            >
                              ${entry.profit >= 0 ? '+' : ''}{entry.profit.toLocaleString()}
                            </Badge>
                          )}
                          <Button variant="outline" size="sm">
                            Follow
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="following" className="space-y-6">
            <Card className="text-center py-12">
              <CardContent>
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Following Feed</h3>
                <p className="text-muted-foreground">
                  Follow other users to see their latest shared bets and updates here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Social;
