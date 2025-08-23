import { useState } from "react";
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
  ArrowLeft,
  Zap,
  Target,
  Brain,
  Users,
  Clock,
  Hash,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

const TrendingNow = () => {
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [currentTime] = useState(new Date().toLocaleTimeString());

  // Mock trending data from X/Twitter API
  const trendingTopics = [
    {
      id: 1,
      hashtag: "#MondayNightFootball",
      tweets: 145600,
      category: "Sports",
      volume: "Trending in Sports",
      sentiment: "positive",
      relevance: 95,
      keyInsights: [
        "Chiefs vs Ravens expected to be high-scoring",
        "Weather conditions favorable for passing game",
        "Key players injury status trending"
      ]
    },
    {
      id: 2,
      hashtag: "#NBAPlayoffs",
      tweets: 89400,
      category: "Sports",
      volume: "234K Tweets",
      sentiment: "mixed",
      relevance: 88,
      keyInsights: [
        "Underdog teams performing better than expected",
        "Home court advantage less significant this season",
        "Player prop bets gaining massive attention"
      ]
    },
    {
      id: 3,
      hashtag: "#MarchMadness",
      tweets: 267800,
      category: "Sports",
      volume: "500K+ Tweets",
      sentiment: "excited",
      relevance: 92,
      keyInsights: [
        "Bracket busters creating massive upsets",
        "Low-seeded teams covering spreads consistently",
        "Total points trending lower than projected"
      ]
    },
    {
      id: 4,
      hashtag: "#SuperBowlOdds",
      tweets: 78200,
      category: "Betting",
      volume: "Rising fast",
      sentiment: "analytical",
      relevance: 85,
      keyInsights: [
        "Early season odds showing major shifts",
        "Public money heavily on favorites",
        "Sharp money identifying value in underdogs"
      ]
    },
    {
      id: 5,
      hashtag: "#FantasyFootball",
      tweets: 156900,
      category: "Sports",
      volume: "Trending worldwide",
      sentiment: "passionate",
      relevance: 90,
      keyInsights: [
        "Waiver wire pickups creating huge impacts",
        "Injury reports affecting multiple lineups",
        "Stack strategies proving most profitable"
      ]
    },
    {
      id: 6,
      hashtag: "#WorldCup2024",
      tweets: 445600,
      category: "Sports",
      volume: "1M+ Tweets",
      sentiment: "euphoric",
      relevance: 98,
      keyInsights: [
        "Underdog nations drawing massive support",
        "Goal totals exceeding expectations globally",
        "Live betting volume at record highs"
      ]
    }
  ];

  const generateGPTInsight = async (trend: any) => {
    setLoadingInsight(true);
    // Simulate API call to GPT
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoadingInsight(false);
    return {
      recommendation: Math.random() > 0.3 ? "STRONG ADD" : "AVOID",
      confidence: Math.floor(Math.random() * 30) + 70,
      reasoning: [
        "Trend momentum shows sustained interest over 48 hours",
        "Historical data suggests positive correlation with betting outcomes",
        "Social sentiment analysis indicates strong public backing",
        "Key influencer engagement rate above average threshold"
      ],
      parlayFit: Math.random() > 0.4 ? "HIGH" : "MEDIUM",
      suggestedBets: [
        "Over/Under Total Points",
        "Spread Coverage",
        "Player Performance Props"
      ]
    };
  };

  const handleTrendClick = async (trend: any) => {
    setSelectedTrend(trend.hashtag);
    const insight = await generateGPTInsight(trend);
    // Store insight for display
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* HUD Header */}
      <div className="hud-element border-b border-primary/20 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="hover:bg-primary/20">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
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
                  <div className="space-y-4">
                    {trendingTopics.map((trend) => (
                      <Card 
                        key={trend.id}
                        className={`gaming-card cursor-pointer transition-all duration-300 hover:scale-102 hover:shadow-neon ${
                          selectedTrend === trend.hashtag ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleTrendClick(trend)}
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
                                handleTrendClick(trend);
                              }}
                            >
                              <Brain className="w-3 h-3 mr-1" />
                              Get AI Insight
                            </Button>
                            <Button 
                              variant="neon" 
                              size="sm" 
                              className="flex-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Target className="w-3 h-3 mr-1" />
                              Build Strategy
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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
                ) : loadingInsight ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-sports font-bold mb-2 text-primary">
                        {selectedTrend}
                      </h3>
                      <div className="flex items-center gap-2 mb-4">
                        <Badge className="bg-neon-green/20 text-neon-green">
                          STRONG ADD
                        </Badge>
                        <Badge variant="outline">
                          87% Confidence
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 text-neon-blue">AI Reasoning:</h4>
                      <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-neon-green rounded-full mt-2 flex-shrink-0" />
                          Trend momentum shows sustained interest over 48 hours
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-neon-green rounded-full mt-2 flex-shrink-0" />
                          Historical data suggests positive correlation with betting outcomes
                        </li>
                        <li className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-neon-green rounded-full mt-2 flex-shrink-0" />
                          Social sentiment analysis indicates strong public backing
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 text-purple-400">Parlay Fit:</h4>
                      <Badge className="bg-neon-green/20 text-neon-green">HIGH</Badge>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 text-gold">Suggested Bets:</h4>
                      <div className="space-y-2">
                        {["Over/Under Total Points", "Spread Coverage", "Player Performance Props"].map((bet, idx) => (
                          <Button 
                            key={idx}
                            variant="outline" 
                            size="sm" 
                            className="w-full justify-start"
                          >
                            <Target className="w-3 h-3 mr-2" />
                            {bet}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button variant="hero" className="w-full">
                      <Users className="w-4 h-4 mr-2" />
                      Add to Strategy Builder
                    </Button>
                  </div>
                )}
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
      </div>
    </div>
  );
};

export default TrendingNow;