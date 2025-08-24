import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

const MatchSpotlight = () => {
  const mockMatches = [
    {
      id: 1,
      homeTeam: 'Lakers',
      awayTeam: 'Warriors',
      homeScore: 112,
      awayScore: 108,
      status: 'LIVE',
      time: 'Q4 2:30'
    },
    {
      id: 2,
      homeTeam: 'Celtics',
      awayTeam: 'Heat',
      homeScore: 95,
      awayScore: 87,
      status: 'FINAL',
      time: 'Final'
    },
    {
      id: 3,
      homeTeam: 'Chiefs',
      awayTeam: 'Bills',
      homeScore: 21,
      awayScore: 14,
      status: 'LIVE',
      time: '3rd 8:45'
    },
    {
      id: 4,
      homeTeam: 'Cowboys',
      awayTeam: 'Giants',
      homeScore: 0,
      awayScore: 0,
      status: 'UPCOMING',
      time: '8:20 PM'
    }
  ];

  return (
    <div className="mb-6">
      <h2 className="text-lg font-sports mb-3 text-foreground">Live Games</h2>
      <ScrollArea className="w-full">
        <div className="flex space-x-4 pb-2">
          {mockMatches.map((match) => (
            <Card 
              key={match.id} 
              className="gaming-card min-w-[200px] cursor-pointer hover:animate-card-hover"
            >
              <CardContent className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    match.status === 'LIVE' 
                      ? 'bg-destructive/20 text-destructive' 
                      : match.status === 'FINAL'
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary/20 text-primary'
                  }`}>
                    {match.status}
                  </span>
                  <span className="text-xs text-muted-foreground">{match.time}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{match.homeTeam}</span>
                    <span className="text-sm font-mono">{match.homeScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{match.awayTeam}</span>
                    <span className="text-sm font-mono">{match.awayScore}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MatchSpotlight;