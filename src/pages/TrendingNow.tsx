import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  TrendingUp, 
  MessageCircle, 
  Heart, 
  Eye, 
  Zap,
  Target,
  Brain,
  Users,
  Clock,
  Hash,
  Sparkles,
  TrendingDown,
  Minus
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTrendingData } from "@/hooks/useTrendingData";
import { useAIInsights, SuggestionPick } from "@/hooks/useAIInsights";
import BackToHome from "@/components/BackToHome";
import SuggestionDetailsDialog from "@/components/SuggestionDetailsDialog";

const TrendingNow = () => {
  const [selectedTrend, setSelectedTrend] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const navigate = useNavigate();
  
  // Suggestion dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogCategory, setDialogCategory] = useState<string | null>(null);
  const [dialogPicks, setDialogPicks] = useState<SuggestionPick[]>([]);
  const [dialogLoading, setDialogLoading] = useState(false);
  
  const { trendingTopics, loading: dataLoading, lastUpdated } = useTrendingData();
  const { loading: insightLoading, currentInsight, generateInsight, clearInsight, getSuggestionPicks } = useAIInsights();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTrendClick = async (trendId: number) => {
    if (selectedTrend === trendId) {
      setSelectedTrend(null);
      clearInsight();
      return;
    }
    
    setSelectedTrend(trendId);
    await generateInsight(trendId);
  };

  const handleSuggestionChipClick = async (e: React.MouseEvent, category: string) => {
    e.stopPropagation();
    if (!selectedTrend) return;
    
    setDialogCategory(category);
    setDialogOpen(true);
    setDialogLoading(true);
    
    try {
      const picks = await getSuggestionPicks(selectedTrend, category);
      setDialogPicks(picks);
    } catch (error) {
      console.error('Failed to get suggestion picks:', error);
      setDialogPicks([]);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleSuggestionConfirm = (selectedPicks: SuggestionPick[]) => {
    const trendData = trendingTopics.find(t => t.id === selectedTrend);
    
    navigate('/analyze-strategies', {
      state: {
        from: 'ai-suggestion',
        trendId: selectedTrend,
        hashtag: trendData?.hashtag,
        category: dialogCategory,
        picks: selectedPicks
      }
    });
    
    setDialogOpen(false);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-neon-green';
      case 'negative': return 'text-red-400';
      case 'excited': return 'text-neon-blue';
      case 'analytical': return 'text-purple-400';
      case 'passionate': return 'text-orange-400';
      case 'euphoric': return 'text-gold';
      default: return 'text-gray-300';
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-3 h-3 text-neon-green" />;
    if (change < 0) return <TrendingDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'STRONG ADD': return 'bg-neon-green/20 text-neon-green';
      case 'MODERATE ADD': return 'bg-neon-blue/20 text-neon-blue';
      case 'AVOID': return 'bg-red-400/20 text-red-400';
      case 'MONITOR': return 'bg-gold/20 text-gold';
      default: return 'bg-gray-400/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* HUD Header */}
      <div className="hud-element border-b border-primary/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackToHome variant="ghost" size="sm" className="hover:bg-primary/20" />
              <div className="h-6 w-px bg-primary/30" />
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-neon-green" />
                <span className="font-sports font-bold text-lg">TRENDING NOW</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                <span className="text-neon-green font-bold">LIVE</span>
              </div>
              <div className="text-sm font-mono">
                <Clock className="w-4 h-4 inline mr-1" />
                {currentTime}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-sports font-bold text-gradient-primary mb-4">
            SOCIAL INTELLIGENCE
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Real-time trend analysis from X (Twitter) to power your betting strategies
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <Badge variant="outline" className="border-neon-blue text-neon-blue">
              <Zap className="w-3 h-3 mr-1" />
              Live Data Feed
            </Badge>
            <Badge variant="outline" className="border-purple-400 text-purple-400">
              <Brain className="w-3 h-3 mr-1" />
              AI Insights
            </Badge>
            <Badge variant="outline" className="border-neon-green text-neon-green">
              <Target className="w-3 h-3 mr-1" />
              Strategy Builder
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Trending Topics Feed */}
          <div className="lg:col-span-2">
            <Card className="gaming-card h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-sports">
                  <Hash className="w-5 h-5 text-neon-blue" />
                  TRENDING TOPICS
                  <Badge className="ml-auto bg-neon-green/20 text-neon-green">
                    Updated 30s ago
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {dataLoading ? (
                    <div className="space-y-4">
                      {[...Array(6)].map((_, i) => (
                        <Card key={i} className="gaming-card">
                          <CardContent className="p-4">
                            <Skeleton className="h-6 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2 mb-4" />
                            <Skeleton className="h-16 w-full" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {trendingTopics.map((trend) => (
                        <Card 
                          key={trend.id}
                          className={`gaming-card cursor-pointer transition-all duration-300 hover:scale-102 hover:shadow-neon ${
                            selectedTrend === trend.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => handleTrendClick(trend.id)}
                        >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h3 className="font-sports font-bold text-lg text-primary">
                                {trend.hashtag}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {trend.category}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-neon-green">
                                {trend.relevance}% Relevant
                              </div>
                              <div className="text-xs text-gray-400">
                                {trend.volume}
                              </div>
                              {trend.change24h && (
                                <div className="flex items-center gap-1 text-xs mt-1">
                                  {getChangeIcon(trend.change24h)}
                                  <span className={trend.change24h > 0 ? 'text-neon-green' : trend.change24h < 0 ? 'text-red-400' : 'text-gray-400'}>
                                    {Math.abs(trend.change24h)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mb-3 text-sm text-gray-300">
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              {trend.tweets.toLocaleString()}
                            </div>
                            <div className={`flex items-center gap-1 ${getSentimentColor(trend.sentiment)}`}>
                              <Heart className="w-4 h-4" />
                              {trend.sentiment}
                            </div>
                          </div>

                          <div className="space-y-1">
                            {trend.keyInsights.map((insight, idx) => (
                              <div key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                                <div className="w-1 h-1 bg-neon-blue rounded-full mt-2 flex-shrink-0" />
                                {insight}
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button 
                              variant="gaming" 
                              size="sm" 
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTrendClick(trend.id);
                              }}
                              disabled={insightLoading && selectedTrend === trend.id}
                            >
                              <Brain className="w-3 h-3 mr-1" />
                              {insightLoading && selectedTrend === trend.id ? 'Analyzing...' : 'Get AI Insight'}
                            </Button>
                            <Button 
                              variant="neon" 
                              size="sm" 
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/analyze-strategies', { 
                                  state: { 
                                    from: 'trend', 
                                    trendId: trend.id, 
                                    hashtag: trend.hashtag, 
                                    category: trend.category 
                                  } 
                                });
                              }}
                              data-testid="trend-build-strategy-btn"
                            >
                              <Target className="w-3 h-3 mr-1" />
                              Build Strategy
                            </Button>
                          </div>
                        </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* AI Analysis Panel */}
          <div>
            <Card className="gaming-card sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-sports">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  AI TREND ANALYSIS
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedTrend ? (
                  <div className="text-center py-8">
                    <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">
                      Select a trending topic to get AI-powered betting insights
                    </p>
                  </div>
                ) : insightLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : currentInsight ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-sports font-bold mb-2 text-primary">
                        {trendingTopics.find(t => t.id === selectedTrend)?.hashtag}
                      </h3>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge className={getRecommendationColor(currentInsight.recommendation)}>
                          {currentInsight.recommendation}
                        </Badge>
                        <Badge variant="outline">
                          {currentInsight.confidence}% Confidence
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {currentInsight.riskLevel} Risk
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 text-neon-blue">AI Reasoning:</h4>
                      <ul className="space-y-2 text-sm text-gray-300">
                        {currentInsight.reasoning.map((reason, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <div className="w-1 h-1 bg-neon-green rounded-full mt-2 flex-shrink-0" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-purple-400">Parlay Fit:</h4>
                        <Badge className={`${currentInsight.parlayFit === 'HIGH' ? 'bg-neon-green/20 text-neon-green' : 
                          currentInsight.parlayFit === 'MEDIUM' ? 'bg-gold/20 text-gold' : 'bg-red-400/20 text-red-400'}`}>
                          {currentInsight.parlayFit}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2 text-gold">Expected Value:</h4>
                        <span className={`text-sm font-bold ${currentInsight.expectedValue > 0 ? 'text-neon-green' : 'text-red-400'}`}>
                          {currentInsight.expectedValue > 0 ? '+' : ''}{currentInsight.expectedValue.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 text-gold">Suggested Bets:</h4>
                      <div className="space-y-2">
                        {currentInsight.suggestedBets.map((bet, idx) => (
                          <Button 
                            key={idx}
                            variant="outline" 
                            size="sm" 
                            className="w-full justify-start hover:bg-primary/20 transition-colors"
                            onClick={(e) => handleSuggestionChipClick(e, bet)}
                            data-testid={`suggestion-chip-${bet}`}
                          >
                            <Target className="w-3 h-3 mr-2" />
                            {bet}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button 
                      variant="hero" 
                      className="w-full"
                      onClick={() => navigate('/analyze-strategies', { 
                        state: { 
                          from: 'ai-insight', 
                          trendId: selectedTrend 
                        } 
                      })}
                      data-testid="ai-add-to-strategy-btn"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Add to Strategy Builder
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Stats Footer */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Trends", value: "156", icon: TrendingUp, color: "text-neon-green" },
            { label: "AI Insights", value: "89", icon: Brain, color: "text-purple-400" },
            { label: "Success Rate", value: "73%", icon: Target, color: "text-neon-blue" },
            { label: "Live Updates", value: "24/7", icon: Zap, color: "text-gold" }
          ].map((stat, idx) => (
            <Card key={idx} className="gaming-card text-center">
              <CardContent className="p-4">
                <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-sports font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-400">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Suggestion Details Dialog */}
        <SuggestionDetailsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          categoryLabel={dialogCategory || ''}
          trendHashtag={selectedTrend ? trendingTopics.find(t => t.id === selectedTrend)?.hashtag : undefined}
          picks={dialogPicks}
          loading={dialogLoading}
          onConfirm={handleSuggestionConfirm}
        />
      </div>
    </div>
  );
};

export default TrendingNow;