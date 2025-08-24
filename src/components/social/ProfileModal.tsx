import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Users, Target, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useFollows } from '@/hooks/useFollows';
import { useToast } from '@/hooks/use-toast';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface UserProfile {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  public_profile: boolean;
  created_at: string;
}

interface UserStats {
  bets_count: number;
  wins: number;
  losses: number;
  pushes: number;
  profit: number;
  total_staked: number;
  roi_percent: number;
  win_rate_percent: number;
}

interface UserBet {
  id: string;
  total_odds: number;
  status: string;
  created_at: string;
  stake: number;
  potential_payout: number;
  bet_legs: Array<{
    team1: string;
    team2: string;
    bet_market: string;
    bet_selection: string;
    odds: number;
  }>;
}

const ProfileModal = ({ isOpen, onClose, userId }: ProfileModalProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentBets, setRecentBets] = useState<UserBet[]>([]);
  const [loading, setLoading] = useState(false);
  const { followUser, unfollowUser, isFollowing } = useFollows();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfileData();
    }
  }, [isOpen, userId]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('public_profile', true)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch stats
      const { data: statsData, error: statsError } = await supabase
        .from('leaderboard_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (statsError && statsError.code !== 'PGRST116') throw statsError;
      setStats(statsData);

      // Fetch recent public bets
      const { data: betsData, error: betsError } = await supabase
        .from('bets')
        .select(`
          id,
          total_odds,
          status,
          created_at,
          stake,
          potential_payout,
          bet_legs:bet_legs(
            team1,
            team2,
            bet_market,
            bet_selection,
            odds
          )
        `)
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (betsError) throw betsError;
      setRecentBets(betsData || []);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      if (isFollowing(userId)) {
        await unfollowUser(userId);
        toast({
          title: "Unfollowed",
          description: `You unfollowed ${profile?.display_name}`,
        });
      } else {
        await followUser(userId);
        toast({
          title: "Following",
          description: `You are now following ${profile?.display_name}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive"
      });
    }
  };

  if (!profile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-muted-foreground">Loading profile...</div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">User Profile</DialogTitle>
        </DialogHeader>

        {/* Profile Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="text-xl">
                {profile.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{profile.display_name}</h2>
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleFollowToggle}
            variant={isFollowing(userId) ? "outline" : "default"}
          >
            {isFollowing(userId) ? 'Unfollow' : 'Follow'}
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{stats.bets_count}</div>
                <div className="text-sm text-muted-foreground">Total Bets</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.roi_percent >= 0 ? '+' : ''}{stats.roi_percent.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">ROI</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{stats.win_rate_percent.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">
                  ${stats.profit >= 0 ? '+' : ''}{stats.profit.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Profit</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="bets" className="px-6 pb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bets">Recent Bets</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="bets" className="space-y-4 mt-4">
            {recentBets.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No public bets to display</p>
                </CardContent>
              </Card>
            ) : (
              recentBets.map((bet) => (
                <Card key={bet.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge variant={bet.status === 'won' ? 'default' : bet.status === 'lost' ? 'destructive' : 'secondary'}>
                        {bet.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(bet.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">Stake: ${bet.stake}</div>
                      <div className="font-mono text-sm">Odds: {bet.total_odds > 0 ? '+' : ''}{bet.total_odds}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {bet.bet_legs?.map((leg, index) => (
                      <div key={index} className="text-sm bg-muted/30 p-2 rounded">
                        <div className="font-medium">{leg.team1} vs {leg.team2}</div>
                        <div className="text-muted-foreground">
                          {leg.bet_market}: {leg.bet_selection} ({leg.odds > 0 ? '+' : ''}{leg.odds})
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardContent className="text-center py-8">
                <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Activity feed coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;