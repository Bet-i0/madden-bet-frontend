import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Zap, Bot, Wrench, TrendingUp, Users, Activity } from 'lucide-react';

interface Game {
  id: number;
  league: string;
  teams: [string, string];
  scores: [number, number];
  odds: [number, number, number];
}

const GameCard = ({ game }: { game: Game }) => (
  <Link to={`/game-details?id=${game.id}`} className="block h-full">
    <motion.div whileHover={{ y: -5 }} className="glass-card overflow-hidden h-full">
      <CardContent className="p-4 flex flex-col justify-between h-full">
        <div>
          <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
            <span>{game.league}</span>
            <div className="flex items-center gap-1 text-red-500 animate-pulse">
              <Activity className="w-3 h-3" />
              <span>LIVE</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold">{game.teams[0]}</span>
              <span className="font-bold text-lg">{game.scores[0]}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">{game.teams[1]}</span>
              <span className="font-bold text-lg">{game.scores[1]}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-around mt-3 pt-3 border-t border-border text-xs">
          <div className="text-center">
            <div className="text-muted-foreground">1</div>
            <div className="font-semibold">{game.odds[0]}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">X</div>
            <div className="font-semibold">{game.odds[1]}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">2</div>
            <div className="font-semibold">{game.odds[2]}</div>
          </div>
        </div>
      </CardContent>
    </motion.div>
  </Link>
);

interface WidgetCardProps {
  title: string;
  icon: React.ElementType;
  to: string;
}

const WidgetCard = ({ title, icon: Icon, to }: WidgetCardProps) => (
  <Link to={to}>
    <motion.div whileHover={{ scale: 1.05 }} className="glass-card h-full">
      <CardContent className="p-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 primary-gradient rounded-lg flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-black" />
        </div>
        <h3 className="font-semibold bebas-neue text-xl">{title}</h3>
      </CardContent>
    </motion.div>
  </Link>
);

const Index = () => {
  const liveGames: Game[] = [
    { id: 1, league: 'NBA', teams: ['Lakers', 'Warriors'], scores: [102, 99], odds: [1.85, 3.50, 2.10] },
    { id: 2, league: 'Premier League', teams: ['Man United', 'Liverpool'], scores: [1, 1], odds: [2.50, 3.20, 2.80] },
    { id: 3, league: 'NFL', teams: ['Chiefs', '49ers'], scores: [21, 17], odds: [1.90, 4.00, 2.00] },
  ];

  return (
    <div className="container mx-auto px-4 py-8 pb-24 space-y-8">
      {/* Hero Section */}
      <div
        className="relative rounded-lg overflow-hidden p-8 md:p-16 flex flex-col items-center justify-center text-center min-h-[40vh]"
        style={{
          backgroundImage: `url(https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2940&auto=format&fit=crop)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center justify-center gap-4 mb-4">
              <Zap className="w-16 h-16 primary-gradient-text" />
              <h1 className="text-7xl md:text-8xl orbitron font-black">BET.IO</h1>
            </div>
            <p className="text-lg md:text-xl text-muted-foreground">The AI-Powered Sports Betting Platform</p>
          </motion.div>
        </div>
      </div>

      {/* Live Games */}
      <section>
        <h2 className="bebas-neue text-3xl mb-4">Live Games</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {liveGames.map(game => <GameCard key={game.id} game={game} />)}
        </div>
      </section>
      
      {/* AI Edge Recommendations */}
      <section className="primary-gradient p-6 rounded-lg">
        <h3 className="text-2xl bebas-neue text-black font-bold mb-3">AI Edge Recommendations</h3>
        <div className="glass-card bg-black/20 border-white/20 p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold">Lakers vs Warriors - Over 225.5 Points</p>
              <p className="text-sm text-muted-foreground">NBA</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">1.91</p>
              <div className="flex items-center justify-end gap-1 text-xs text-primary">
                <Zap className="w-3 h-3"/>
                <span>92% Confidence</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Widget Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <WidgetCard title="Strategy Builder" icon={Wrench} to="/strategies" />
        <WidgetCard title="Trending Now" icon={TrendingUp} to="/trending" />
        <WidgetCard title="Social Hub" icon={Users} to="/social" />
        <WidgetCard title="AI Coach" icon={Bot} to="/ai-coach" />
      </section>
    </div>
  );
};

export default Index;
