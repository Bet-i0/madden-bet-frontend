import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert } from 'lucide-react';

interface Injury {
  playerName: string;
  playerImg: string;
  team: string;
  status: 'Out' | 'Questionable';
  description: string;
  impact: string;
}

const InjuryCard = ({ injury }: { injury: Injury }) => (
  <div className="glass-card p-4 flex gap-4 items-center">
    <img src={injury.playerImg} alt={injury.playerName} className="w-16 h-16 rounded-full object-cover border-2 border-border" />
    <div className="flex-grow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold">{injury.playerName}</h3>
          <p className="text-sm text-muted-foreground">{injury.team}</p>
        </div>
        <Badge variant="destructive" className={`${injury.status === 'Out' ? 'bg-red-500' : 'bg-yellow-500'} text-white`}>
          {injury.status}
        </Badge>
      </div>
      <p className="text-xs mt-2">{injury.description}</p>
      <p className="text-xs text-primary mt-1">Impact: {injury.impact}</p>
    </div>
  </div>
);

export default function Injuries() {
  const injuries: Injury[] = [
    { 
      playerName: 'LeBron James', 
      playerImg: 'https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/1966.png', 
      team: 'Los Angeles Lakers', 
      status: 'Questionable', 
      description: 'Ankle sprain', 
      impact: 'Decreased scoring, increased role for A. Davis.' 
    },
    { 
      playerName: 'Kevin De Bruyne', 
      playerImg: 'https://b.fssta.com/uploads/application/soccer/headshots/843.png', 
      team: 'Manchester City', 
      status: 'Out', 
      description: 'Hamstring surgery', 
      impact: 'Significant loss of creativity in midfield.' 
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6 pb-24 space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-8 h-8 text-primary"/>
        <h1 className="bebas-neue text-3xl">Injury Intelligence</h1>
      </div>
      <Tabs defaultValue="nba" className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass-card p-1 h-auto">
          <TabsTrigger value="nba">NBA</TabsTrigger>
          <TabsTrigger value="nfl">NFL</TabsTrigger>
          <TabsTrigger value="mlb">MLB</TabsTrigger>
          <TabsTrigger value="mls">MLS</TabsTrigger>
        </TabsList>
        <TabsContent value="nba" className="mt-4 space-y-4">
          {injuries.map((injury, i) => <InjuryCard key={i} injury={injury} />)}
        </TabsContent>
        <TabsContent value="nfl" className="mt-4">
          <p className="text-center p-8 glass-card">NFL injury data will be displayed here.</p>
        </TabsContent>
        <TabsContent value="mlb" className="mt-4">
          <p className="text-center p-8 glass-card">MLB injury data will be displayed here.</p>
        </TabsContent>
        <TabsContent value="mls" className="mt-4">
          <p className="text-center p-8 glass-card">MLS injury data will be displayed here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
