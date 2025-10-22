import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function GameDetails() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const gameId = searchParams.get('id');

  const placeholderGame = {
    teams: ['Team A', 'Team B'],
    league: 'Placeholder League'
  };

  return (
    <div className="container mx-auto p-6 pb-24 space-y-6">
      <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-5 h-5" />
        Back to Dashboard
      </Link>
      
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="bebas-neue text-3xl">
            {placeholderGame.teams[0]} vs {placeholderGame.teams[1]}
          </CardTitle>
          <p className="text-muted-foreground">{placeholderGame.league} - Game ID: {gameId}</p>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-20">
            <h3 className="text-xl font-bold mb-2">Coming Soon</h3>
            <p>Detailed stats, live odds, and betting filters for this game will be displayed here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
