import { useState } from 'react';
import { BarChart, TrendingUp, Download, Bot, Target, PieChart, LineChart, FileText, Share2, CheckCircle, XCircle, MinusCircle, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useBets } from '@/hooks/useBets';
import { useToast } from '@/hooks/use-toast';
import { exportBetsToCSV } from '@/utils/csvUtils';
import BetHistoryTab from '@/components/BetHistoryTab';
import CumulativeProfitChart from '@/components/CumulativeProfitChart';
import CSVImportDialog from '@/components/CSVImportDialog';
import BackToHome from '@/components/BackToHome';

const Analytics = () => {
  const navigate = useNavigate();
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const { bets: realBets, analytics: realAnalytics, updateBetStatus, loading } = useBets();
  const { toast } = useToast();


  // Use real data if available, otherwise empty state
  const bets = realBets || [];
  const analytics = realAnalytics || {
    totalPicks: 0,
    winRate: 0,
    profit: 0,
    roi: 0
  };

  const trends = [
    { category: 'NFL Spreads', winRate: 72.1, volume: 8 },
    { category: 'NBA Totals', winRate: 64.8, volume: 12 },
    { category: 'NFL Totals', winRate: 59.3, volume: 6 },
    { category: 'Parlays', winRate: 45.2, volume: 4 },
  ];

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    setTimeout(() => {
      setIsGeneratingPDF(false);
      console.log('PDF generated and downloaded');
    }, 2000);
  };

  const handleAskAI = (context: string) => {
    navigate('/ai-coach', { state: { context } });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'won':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'lost':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'push':
      case 'void':
        return <MinusCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-muted animate-pulse" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackToHome className="flex items-center space-x-2 transition-colors" />
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center space-x-2">
                <BarChart className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-sports text-primary">ANALYTICS CENTER</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowImportDialog(true)}
                variant="outline"
                className="font-sports"
              >
                <Upload className="w-4 h-4 mr-2" />
                IMPORT CSV
              </Button>
              <Button
                onClick={() => exportBetsToCSV(bets)}
                variant="outline"
                className="font-sports"
              >
                <Download className="w-4 h-4 mr-2" />
                EXPORT CSV
              </Button>
              <Button
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
                className="bg-gradient-primary hover:shadow-neon font-sports"
              >
                {isGeneratingPDF ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    GENERATING...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    EXPORT PDF
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleAskAI('analytics overview')}
                className="bg-neon-green text-primary hover:bg-neon-green/90 font-sports"
              >
                <Bot className="w-4 h-4 mr-2" />
                ASK AI COACH
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Picks</p>
                  <p className="text-2xl font-bold font-sports">{analytics.totalPicks}</p>
                </div>
                <Target className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Win Rate</p>
                  <p className="text-2xl font-bold font-sports text-neon-green">{analytics.winRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-neon-green" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Profit</p>
                  <p className="text-2xl font-bold font-sports text-neon-green">{formatCurrency(analytics.profit)}</p>
                </div>
                <PieChart className="w-8 h-8 text-neon-green" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">ROI</p>
                  <p className="text-2xl font-bold font-sports text-neon-green">{analytics.roi.toFixed(1)}%</p>
                </div>
                <LineChart className="w-8 h-8 text-neon-green" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-muted/50">
            <TabsTrigger value="overview" className="font-sports">OVERVIEW</TabsTrigger>
            <TabsTrigger value="history" className="font-sports">HISTORY</TabsTrigger>
            <TabsTrigger value="trends" className="font-sports">TRENDS</TabsTrigger>
            <TabsTrigger value="strategies" className="font-sports">STRATEGIES</TabsTrigger>
            <TabsTrigger value="charts" className="font-sports">CHARTS</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Performance */}
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 font-sports">
                    <BarChart className="w-5 h-5 text-primary" />
                    <span>RECENT PICKS</span>
                  </CardTitle>
                  <CardDescription>Last 4 betting picks and results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bets.slice(0, 4).map((bet, index) => (
                    <div key={bet.id || index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium">{bet.legs?.[0]?.team1} vs {bet.legs?.[0]?.team2}</p>
                        <p className="text-sm text-muted-foreground">{bet.legs?.[0]?.bet_selection}</p>
                        {bet.tags && bet.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {bet.tags.slice(0, 2).map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                          {getStatusIcon(bet.status)}
                          <Badge variant={bet.status === 'won' ? 'default' : bet.status === 'lost' ? 'destructive' : 'secondary'}>
                            {bet.status.toUpperCase()}
                          </Badge>
                        </div>
                         <p className={`text-sm font-bold ${bet.status === 'won' ? 'text-green-500' : bet.status === 'lost' ? 'text-red-500' : 'text-muted-foreground'}`}>
                           {bet.status === 'won' 
                             ? `+${formatCurrency(((bet.potential_payout || bet.stake) - bet.stake))}`
                             : bet.status === 'lost' 
                             ? `-${formatCurrency(bet.stake)}`
                             : 'Pending'
                           }
                         </p>
                      </div>
                    </div>
                  ))}
                  {bets.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No bets tracked yet</p>
                      <p className="text-sm">Start using AI Coach to build your betting history</p>
                    </div>
                  )}
                  <Button 
                    onClick={() => handleAskAI('recent picks analysis')}
                    className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-sports"
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    ANALYZE RECENT PERFORMANCE
                  </Button>
                </CardContent>
              </Card>

              {/* AI Insights Panel */}
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 font-sports">
                    <Bot className="w-5 h-5 text-neon-green" />
                    <span>AI INSIGHTS</span>
                  </CardTitle>
                  <CardDescription>Get detailed analysis and recommendations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm">
                      "Your NFL Over bets are performing exceptionally well at 72.1% win rate. 
                      Consider increasing allocation to this category during prime time games."
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Button 
                      onClick={() => handleAskAI('performance optimization')}
                      className="w-full bg-neon-green text-primary hover:bg-neon-green/90 font-sports"
                    >
                      OPTIMIZE PERFORMANCE
                    </Button>
                    <Button 
                      onClick={() => handleAskAI('risk assessment')}
                      className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-sports"
                    >
                      RISK ASSESSMENT
                    </Button>
                    <Button 
                      onClick={() => handleAskAI('market opportunities')}
                      className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 font-sports"
                    >
                      FIND OPPORTUNITIES
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <BetHistoryTab bets={bets} />
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            <CumulativeProfitChart bets={bets} />
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 font-sports">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span>BETTING TRENDS ANALYSIS</span>
                </CardTitle>
                <CardDescription>Category performance breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trends.map((trend, index) => (
                    <div key={index} className="p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors border border-border/50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium font-sports">{trend.category}</h3>
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-muted-foreground font-sports">{trend.volume} PICKS</span>
                          <Badge 
                            variant={trend.winRate > 65 ? 'default' : trend.winRate > 55 ? 'secondary' : 'destructive'}
                            className="font-sports text-xs"
                          >
                            {trend.winRate}%
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            trend.winRate > 65 ? 'bg-gradient-neon' : 
                            trend.winRate > 55 ? 'bg-gradient-primary' : 
                            'bg-destructive'
                          }`}
                          style={{ width: `${Math.min(trend.winRate, 100)}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Performance: {trend.winRate > 65 ? 'Excellent' : trend.winRate > 55 ? 'Good' : 'Needs Improvement'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-border">
                  <Button 
                    onClick={() => handleAskAI('trend analysis deep dive')}
                    className="w-full bg-neon-green text-primary hover:bg-neon-green/90 font-sports"
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    GET TREND INSIGHTS FROM AI
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 font-sports">
                  <Target className="w-5 h-5 text-primary" />
                  <span>CUSTOM STRATEGIES</span>
                </CardTitle>
                <CardDescription>Build strategies based on your analytics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto bg-gradient-primary rounded-full flex items-center justify-center mb-4 shadow-neon">
                    <Target className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <h3 className="font-sports text-xl mb-2">CREATE DATA-DRIVEN STRATEGIES</h3>
                  <p className="text-muted-foreground mb-6">Use your analytics to build winning betting strategies</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => handleAskAI('create NFL strategy based on my analytics')}
                    className="bg-gradient-primary hover:shadow-neon font-sports p-6 h-auto flex-col"
                  >
                    <FileText className="w-6 h-6 mb-2" />
                    NFL STRATEGY BUILDER
                  </Button>
                  <Button 
                    onClick={() => handleAskAI('create NBA strategy based on my analytics')}
                    className="bg-gradient-primary hover:shadow-neon font-sports p-6 h-auto flex-col"
                  >
                    <FileText className="w-6 h-6 mb-2" />
                    NBA STRATEGY BUILDER
                  </Button>
                  <Button 
                    onClick={() => handleAskAI('create parlay strategy based on my analytics')}
                    className="bg-gradient-primary hover:shadow-neon font-sports p-6 h-auto flex-col"
                  >
                    <FileText className="w-6 h-6 mb-2" />
                    PARLAY OPTIMIZER
                  </Button>
                  <Button 
                    onClick={() => handleAskAI('create bankroll management strategy')}
                    className="bg-gradient-primary hover:shadow-neon font-sports p-6 h-auto flex-col"
                  >
                    <FileText className="w-6 h-6 mb-2" />
                    BANKROLL MANAGER
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CSVImportDialog 
        open={showImportDialog} 
        onOpenChange={setShowImportDialog} 
      />
    </div>
  );
};

export default Analytics;
