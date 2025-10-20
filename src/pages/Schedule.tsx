import { useState } from 'react';
import { useUpcomingGames } from '@/hooks/useGames';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import LoadingFallback from '@/components/LoadingFallback';
import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import BackToHome from '@/components/BackToHome';

export default function Schedule() {
  const [selectedLeague, setSelectedLeague] = useState<string>('NFL');
  const { data: games, isLoading } = useUpcomingGames(selectedLeague);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      scheduled: 'default',
      live: 'destructive',
      final: 'secondary',
      postponed: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status.toUpperCase()}</Badge>;
  };

  if (isLoading) {
    return <LoadingFallback />;
  }

  return (
    <div className="container mx-auto p-6 pb-24 max-w-6xl">
      <BackToHome />
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Game Schedule</h1>
        <p className="text-muted-foreground">Upcoming games in the next 24 hours</p>
      </div>

      <Tabs value={selectedLeague} onValueChange={setSelectedLeague} className="mb-6">
        <TabsList>
          <TabsTrigger value="NFL">NFL</TabsTrigger>
          <TabsTrigger value="NCAAF">NCAAF</TabsTrigger>
        </TabsList>

        <TabsContent value="NFL" className="space-y-4 mt-6">
          {games && games.length > 0 ? (
            games.map((game) => (
              <Card key={game.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      {game.away_team} @ {game.home_team}
                    </CardTitle>
                    {getStatusBadge(game.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(game.starts_at), 'PPp')}
                    </div>
                    {game.venue && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {game.venue}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No upcoming {selectedLeague} games in the next 24 hours
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="NCAAF" className="space-y-4 mt-6">
          {games && games.length > 0 ? (
            games.map((game) => (
              <Card key={game.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      {game.away_team} @ {game.home_team}
                    </CardTitle>
                    {getStatusBadge(game.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(game.starts_at), 'PPp')}
                    </div>
                    {game.venue && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {game.venue}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No upcoming {selectedLeague} games in the next 24 hours
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
