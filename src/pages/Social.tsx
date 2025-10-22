import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThumbsUp, MessageCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Bet {
  avatar: string;
  user: string;
  time: string;
  pick: string;
  odds: string;
  game: string;
  likes: number;
  comments: number;
}

interface LeaderUser {
  avatar: string;
  name: string;
  roi: number;
}

const BetCard = ({ bet }: { bet: Bet }) => (
  <div className="glass-card p-4 space-y-3">
    <div className="flex items-center gap-3">
      <img src={bet.avatar} alt="avatar" className="w-10 h-10 rounded-full"/>
      <div>
        <p className="font-semibold">{bet.user}</p>
        <p className="text-xs text-muted-foreground">{bet.time}</p>
      </div>
    </div>
    <div>
      <p><span className="font-bold">{bet.pick}</span> @ <span className="text-primary">{bet.odds}</span></p>
      <p className="text-sm text-muted-foreground">{bet.game}</p>
    </div>
    <div className="flex justify-between items-center">
      <div className="flex gap-4 text-muted-foreground text-sm">
        <span className="flex items-center gap-1"><ThumbsUp className="w-4 h-4"/> {bet.likes}</span>
        <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4"/> {bet.comments}</span>
      </div>
      <Button className="primary-gradient text-black" size="sm">
        <Copy className="w-4 h-4 mr-2"/>
        Tail Bet
      </Button>
    </div>
  </div>
);

const LeaderboardItem = ({ rank, user }: { rank: number; user: LeaderUser }) => (
  <div className="flex items-center justify-between glass-card p-2 rounded-md">
    <div className="flex items-center gap-3">
      <span className="font-bold text-lg w-6 text-center">{rank}</span>
      <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full"/>
      <p>{user.name}</p>
    </div>
    <div className="flex gap-4 items-center">
      <Badge className="bg-primary/20 text-primary border-primary/30 w-20 justify-center">ROI: {user.roi}%</Badge>
      <Button size="sm" variant="outline" className="glass-card">Follow</Button>
    </div>
  </div>
);

export default function Social() {
  const bets: Bet[] = [
    { avatar: 'https://i.pravatar.cc/150?img=1', user: 'John Doe', time: '2h ago', pick: 'Lakers ML', odds: '1.85', game: 'LAL vs. GSW', likes: 24, comments: 8 },
    { avatar: 'https://i.pravatar.cc/150?img=2', user: 'Jane Smith', time: '4h ago', pick: 'Over 225.5', odds: '1.91', game: 'MUN vs. LIV', likes: 18, comments: 5 },
  ];

  const leaderboard: LeaderUser[] = [
    { avatar: 'https://i.pravatar.cc/150?img=3', name: 'ProBettor123', roi: 25.3 },
    { avatar: 'https://i.pravatar.cc/150?img=4', name: 'SharpShooter', roi: 22.1 },
    { avatar: 'https://i.pravatar.cc/150?img=5', name: 'ValueHunter', roi: 19.8 },
  ];

  return (
    <div className="container mx-auto px-4 py-6 pb-24 space-y-6">
      <h1 className="bebas-neue text-3xl">Social Hub</h1>

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-3 glass-card p-1 h-auto">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="mt-4 space-y-4">
          {bets.map((bet, i) => <BetCard key={i} bet={bet} />)}
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4 space-y-2">
          {leaderboard.map((user, i) => <LeaderboardItem key={i} rank={i + 1} user={user} />)}
        </TabsContent>

        <TabsContent value="following" className="mt-4">
          <p className="text-center p-8 glass-card">Bets from people you follow will appear here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
