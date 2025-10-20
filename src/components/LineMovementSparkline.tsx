import { useLineMovement } from '@/hooks/useLineMovement';
import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis } from 'recharts';
import { formatOdds } from '@/lib/oddsCalculations';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LineMovementSparklineProps {
  sport: string;
  league: string;
  team1: string;
  team2: string;
  market: string;
  player?: string;
  line?: number;
  height?: number;
}

export function LineMovementSparkline({
  sport,
  league,
  team1,
  team2,
  market,
  player,
  line,
  height = 40,
}: LineMovementSparklineProps) {
  const { data, isLoading } = useLineMovement({
    sport,
    league,
    team1,
    team2,
    market,
    player,
    line,
  });

  if (isLoading) {
    return <Skeleton className="h-10 w-20" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        No movement
      </div>
    );
  }

  // Calculate trend
  const firstOdds = data[0].avg_odds;
  const lastOdds = data[data.length - 1].avg_odds;
  const change = lastOdds - firstOdds;
  const changePercent = (change / firstOdds) * 100;

  const chartData = data.map((d) => ({
    time: new Date(d.minute_bucket).getTime(),
    odds: d.avg_odds,
  }));

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null;
                return (
                  <div className="bg-popover text-popover-foreground text-xs p-2 rounded-md border shadow-sm">
                    <div className="font-medium">{formatOdds(payload[0].value as number)}</div>
                    <div className="text-muted-foreground">
                      {new Date(payload[0].payload.time).toLocaleTimeString()}
                    </div>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="odds"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-1 text-xs">
        {change > 0 ? (
          <TrendingUp className="h-3 w-3 text-success" />
        ) : change < 0 ? (
          <TrendingDown className="h-3 w-3 text-destructive" />
        ) : (
          <Minus className="h-3 w-3 text-muted-foreground" />
        )}
        <span
          className={
            change > 0
              ? 'text-success'
              : change < 0
              ? 'text-destructive'
              : 'text-muted-foreground'
          }
        >
          {changePercent > 0 ? '+' : ''}
          {changePercent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
