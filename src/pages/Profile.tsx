
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Globe, Calendar, Settings, TrendingUp, Target, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useFollows } from '@/hooks/useFollows';
import { useToast } from '@/hooks/use-toast';
import SettingsDialog from '@/components/SettingsDialog';
import BackToHome from '@/components/BackToHome';

interface UserProfile {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website_url?: string;
  banner_url?: string;
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

const Profile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { profile: currentUserProfile } = useProfile();
  const { followUser, unfollowUser, isFollowing } = useFollows();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentBets, setRecentBets] = useState<UserBet[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Determine if this is the current user's profile
  const isOwnProfile = !userId || userId === 'me' || userId === user?.id;
  const targetUserId = isOwnProfile ? user?.id : userId;

  useEffect(() => {
    if (targetUserId) {
      fetchProfileData();
    }
  }, [targetUserId]);

  const fetchProfileData = async () => {
    if (!targetUserId) return;
    
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (profileError) throw profileError;
      
      // Check if we can view this profile (public or own)
      if (!isOwnProfile && !profileData.public_profile) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch stats
      const { data: statsData, error: statsError } = await supabase
        .from('leaderboard_stats')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (statsError && statsError.code !== 'PGRST116') throw statsError;
      setStats(statsData);

      // Fetch recent bets (only public ones unless it's own profile)
      let betsQuery = supabase
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
        .eq('user_id', targetUserId);

      // Only filter by is_public for other users' profiles
      if (!isOwnProfile) {
        betsQuery = betsQuery.eq('is_public', true);
      }

      const { data: betsData, error: betsError } = await betsQuery
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
    if (!targetUserId || isOwnProfile) return;
    
    try {
      if (isFollowing(targetUserId)) {
        await unfollowUser(targetUserId);
        toast({
          title: "Unfollowed",
          description: `You unfollowed ${profile?.display_name}`,
        });
      } else {
        await followUser(targetUserId);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-muted-foreground">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground">
              This profile doesn't exist or is set to private.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back to Home Button */}
      <div className="mb-6">
        <BackToHome />
      </div>

      {/* Profile Header */}
      <Card className="mb-6">
        {profile.banner_url && (
          <div 
            className="h-32 bg-cover bg-center rounded-t-lg"
            style={{ backgroundImage: `url(${profile.banner_url})` }}
          />
        )}
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile.display_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                <div className="flex items-center space-x-4 text-muted-foreground mt-2">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                  {profile.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>
                {profile.bio && (
                  <p className="text-muted-foreground mt-2 max-w-md">{profile.bio}</p>
                )}
                {profile.website_url && (
                  <a 
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-primary hover:underline mt-2"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Website</span>
                  </a>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              {isOwnProfile ? (
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="outline"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <Button
                  onClick={handleFollowToggle}
                  variant={isFollowing(targetUserId!) ? "outline" : "default"}
                >
                  {isFollowing(targetUserId!) ? 'Unfollow' : 'Follow'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.bets_count}</div>
              <div className="text-sm text-muted-foreground">Total Bets</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${stats.roi_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
              <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${stats.profit >= 0 ? '+' : ''}{stats.profit.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Profit</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="bets" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bets">Recent Bets</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="bets" className="space-y-4">
          {recentBets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {isOwnProfile ? 'No bets to display' : 'No public bets to display'}
                </p>
              </CardContent>
            </Card>
          ) : (
            recentBets.map((bet) => (
              <Card key={bet.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        bet.status === 'won' ? 'default' : 
                        bet.status === 'lost' ? 'destructive' : 
                        'secondary'
                      }>
                        {bet.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(bet.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm">Stake: ${bet.stake}</div>
                      <div className="font-mono text-sm">
                        Odds: {bet.total_odds > 0 ? '+' : ''}{bet.total_odds}
                      </div>
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
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardContent className="text-center py-8">
              <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Activity feed coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      {isOwnProfile && (
        <SettingsDialog 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
};

export default Profile;
