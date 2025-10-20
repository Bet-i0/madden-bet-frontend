import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, TrendingUp, Clock } from 'lucide-react';

export default function DegenerateDashboard() {
  return (
    <div className="container mx-auto p-6 pb-24 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Degenerate Dashboard</h1>
        <p className="text-muted-foreground">High-velocity betting tools</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Live Movers</CardTitle>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
            <p className="text-sm text-muted-foreground mt-1">
              Last 10 minutes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Turbo Bets</CardTitle>
              <Zap className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">47</div>
            <p className="text-sm text-muted-foreground mt-1">
              Today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Hot Streak</CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
            <p className="text-sm text-muted-foreground mt-1">
              Consecutive wins
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Turbo Bet Builder</CardTitle>
          <CardDescription>Quick-add props with keyboard shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">
            Coming soon - Lightning-fast bet construction
          </p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Live Movers Ticker</CardTitle>
          <CardDescription>Real-time significant line movements</CardDescription>
        </CardHeader>
        <CardContent className="h-48 flex items-center justify-center">
          <p className="text-muted-foreground">
            Coming soon - Last 10 min line changes &gt; 20 bps
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Parlay Simulator</CardTitle>
          <CardDescription>Multi-leg EV estimator</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">
            Coming soon - Calculate expected value for parlays
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
