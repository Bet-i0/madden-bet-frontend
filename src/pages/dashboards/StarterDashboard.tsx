import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUpcomingGames } from '@/hooks/useGames';
import { TrendingUp, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function StarterDashboard() {
  const { data: nflGames } = useUpcomingGames('NFL');
  const { data: ncaafGames } = useUpcomingGames('NCAAF');

  return (
    <div className="container mx-auto p-6 pb-24 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome to Bet.io</h1>
        <p className="text-muted-foreground">Your sports betting dashboard</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Today's Games</CardTitle>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {(nflGames?.length ?? 0) + (ncaafGames?.length ?? 0)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Next 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top Value</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">+12.5%</div>
            <p className="text-sm text-muted-foreground mt-1">
              Best edge today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Community</CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">247</div>
            <p className="text-sm text-muted-foreground mt-1">
              Active bettors
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upcoming NFL Games</CardTitle>
          <CardDescription>Next 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          {nflGames && nflGames.length > 0 ? (
            <div className="space-y-3">
              {nflGames.slice(0, 5).map((game) => (
                <div key={game.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <div className="font-semibold">{game.away_team} @ {game.home_team}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(game.starts_at), 'PPp')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No upcoming games</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Learn the basics of value betting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Find Value</h4>
            <p className="text-sm text-muted-foreground">
              Look for odds that are higher than they should be based on the true probability.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">2. Track CLV</h4>
            <p className="text-sm text-muted-foreground">
              Closing Line Value shows if you're beating the market by comparing your odds to closing odds.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">3. Manage Bankroll</h4>
            <p className="text-sm text-muted-foreground">
              Use proper staking strategies to protect your bankroll and maximize long-term profits.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
