import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCLV } from '@/hooks/useCLV';
import { useAuth } from '@/contexts/AuthContext';
import { TrendingUp, TrendingDown, Activity, BarChart } from 'lucide-react';

export default function ProDashboard() {
  const { user } = useAuth();
  const { data: clvData } = useCLV(user?.id);

  // Calculate stats from CLV data
  const positiveCLVCount = clvData?.filter(item => (item.clv_bps || 0) > 0).length ?? 0;
  const negativeCLVCount = clvData?.filter(item => (item.clv_bps || 0) < 0).length ?? 0;
  const averageCLV = clvData?.length 
    ? clvData.reduce((sum, item) => sum + (item.clv_bps || 0), 0) / clvData.length 
    : 0;

  return (
    <div className="container mx-auto p-6 pb-24 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Pro Dashboard</h1>
        <p className="text-muted-foreground">Advanced analytics and edge detection</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Avg CLV</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageCLV ? `${averageCLV > 0 ? '+' : ''}${averageCLV.toFixed(0)}` : '—'} bps
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Positive CLV</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {positiveCLVCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Beat closing line
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Negative CLV</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {negativeCLVCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Behind closing line
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Win Rate</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(positiveCLVCount + negativeCLVCount) > 0 ? 
                `${((positiveCLVCount / (positiveCLVCount + negativeCLVCount)) * 100).toFixed(1)}%` 
                : '—'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              CLV win rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Market Heatmap</CardTitle>
            <CardDescription>Price dispersion by market (coming soon)</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Heatmap visualization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CLV Distribution</CardTitle>
            <CardDescription>Your edge over time</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center">
            <p className="text-muted-foreground">Chart visualization</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Player Props Radar</CardTitle>
          <CardDescription>Fastest-moving props (last 2 hours)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming soon - Real-time prop movement tracking</p>
        </CardContent>
      </Card>
    </div>
  );
}
