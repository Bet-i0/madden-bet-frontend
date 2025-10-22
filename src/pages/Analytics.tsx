import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, TrendingUp, PieChart, LineChart, Bot, CheckCircle, XCircle } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  colorClass: string;
}

const StatCard = ({ title, value, icon: Icon, colorClass }: StatCardProps) => (
  <div className="glass-card p-4">
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">{title}</p>
      <Icon className={`w-5 h-5 ${colorClass}`} />
    </div>
    <p className={`text-2xl font-bold orbitron ${colorClass}`}>{value}</p>
  </div>
);

export default function Analytics() {
  return (
    <div className="container mx-auto px-4 py-6 pb-24 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="bebas-neue text-3xl">Analytics Center</h1>
        <Button className="primary-gradient text-black font-bold">
          <Bot className="w-4 h-4 mr-2"/>
          Ask AI Coach
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Picks" value="128" icon={Target} colorClass="text-foreground" />
        <StatCard title="Win Rate" value="68.2%" icon={TrendingUp} colorClass="text-primary" />
        <StatCard title="Total Profit" value="$1,482" icon={PieChart} colorClass="text-primary" />
        <StatCard title="ROI" value="+15.3%" icon={LineChart} colorClass="text-primary" />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 glass-card p-1 h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardContent className="p-4">
                <h3 className="bebas-neue text-xl mb-3">Recent Picks</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm p-2 bg-zinc-800/50 rounded-md">
                    <span>LAL vs. GSW - O 225.5</span>
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex justify-between items-center text-sm p-2 bg-zinc-800/50 rounded-md">
                    <span>MUN vs. LIV - MUN +0.5</span>
                    <XCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex justify-between items-center text-sm p-2 bg-zinc-800/50 rounded-md">
                    <span>KC Chiefs - ML</span>
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4">
                <h3 className="bebas-neue text-xl mb-3">AI Insights</h3>
                <p className="text-sm text-muted-foreground mb-4">You have a high win rate on NBA Over/Under bets. Consider increasing your unit size for these picks.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="glass-card">View Trend</Button>
                  <Button variant="outline" size="sm" className="glass-card">Find Picks</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="history">
          <p className="text-center p-8 glass-card">Full bet history table would be displayed here.</p>
        </TabsContent>
        <TabsContent value="trends">
          <p className="text-center p-8 glass-card">Trend analysis charts would be displayed here.</p>
        </TabsContent>
        <TabsContent value="strategies">
          <p className="text-center p-8 glass-card">Strategy performance metrics would be displayed here.</p>
        </TabsContent>
        <TabsContent value="charts">
          <p className="text-center p-8 glass-card">Detailed charts and graphs would be displayed here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
