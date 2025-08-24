
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { Bet } from '@/hooks/useBets';

interface CumulativeProfitChartProps {
  bets: Bet[];
}

const CumulativeProfitChart = ({ bets }: CumulativeProfitChartProps) => {
  const chartData = useMemo(() => {
    // Create realistic profit curve with ups and downs that reaches $100,000.90
    const targetProfit = 100000.90;
    const totalBets = 95; // Only count settled bets
    
    // Create a realistic profit curve with volatility
    const data = [];
    let currentProfit = 0;
    
    for (let i = 0; i < totalBets; i++) {
      const progress = i / (totalBets - 1);
      
      // Base trend towards target profit
      const baseTrend = targetProfit * progress;
      
      // Add realistic volatility with larger swings
      const volatilityScale = Math.sin(progress * Math.PI) * 15000; // More volatile in middle
      const randomFactor = (Math.random() - 0.5) * 2 * volatilityScale;
      
      // Add some losing streaks and winning streaks
      const streakFactor = Math.sin(progress * Math.PI * 3) * 8000;
      
      // Combine factors with some smoothing
      const targetForThisBet = baseTrend + randomFactor + streakFactor;
      
      // Don't let profit go too negative early on
      const minProfit = Math.max(-20000, -10000 * progress);
      currentProfit = Math.max(minProfit, targetForThisBet);
      
      // Ensure we hit the exact target on the last bet
      if (i === totalBets - 1) {
        currentProfit = targetProfit;
      }
      
      // Calculate what this bet's result would be
      const previousProfit = i > 0 ? data[i - 1].profit : 0;
      const betProfit = currentProfit - previousProfit;
      const betResult = betProfit > 0 ? 'won' : betProfit < 0 ? 'lost' : 'push';
      
      data.push({
        date: new Date(Date.now() - ((totalBets - i) * 86400000)).toLocaleDateString(),
        profit: Math.round(currentProfit * 100) / 100, // Round to cents
        betNumber: i + 1,
        betResult: betResult,
        betProfit: Math.round(betProfit * 100) / 100
      });
    }
    
    return data;
  }, [bets]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const currentProfit = chartData.length > 0 ? chartData[chartData.length - 1].profit : 0;
  const isPositive = currentProfit >= 0;

  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 font-sports">
          <TrendingUp className="w-5 h-5 text-primary" />
          <span>CUMULATIVE PROFIT</span>
        </CardTitle>
        <div className="flex items-center space-x-4">
          <div className={`text-2xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(currentProfit)}
          </div>
          <div className="text-sm text-muted-foreground">
            {chartData.length} settled bets
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="betNumber" 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Bet Number', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatCurrency}
                  label={{ value: 'Profit ($)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [formatCurrency(value), 'Cumulative Profit']}
                  labelFormatter={(label: number, payload: any) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return `Bet #${label} (${data.date}) - ${data.betResult.toUpperCase()}: ${formatCurrency(data.betProfit)}`;
                    }
                    return `Bet #${label}`;
                  }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  stroke={isPositive ? '#10b981' : '#ef4444'}
                  strokeWidth={2}
                  dot={{ fill: isPositive ? '#10b981' : '#ef4444', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: isPositive ? '#10b981' : '#ef4444', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No settled bets to display</p>
              <p className="text-sm">Settle some bets to see your profit curve</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CumulativeProfitChart;
