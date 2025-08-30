import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, TrendingUp, Target, Zap, Brain, DollarSign, Users, Clock, CheckCircle, AlertTriangle, TrendingDown, BarChart3, Trophy, Timer, X, RefreshCw } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useStrategyAnalysis } from "@/hooks/useStrategyAnalysis";
import { SuggestionPick, useAIInsights } from "@/hooks/useAIInsights";
import { useOddsForStrategies } from "@/hooks/useOddsForStrategies";

const AnalyzeStrategies = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("gpt-strategies");
  const [importedPicks, setImportedPicks] = useState<SuggestionPick[]>([]);
  const [includePicksInAnalysis, setIncludePicksInAnalysis] = useState(true);
  const location = useLocation();
  
  const { isAnalyzing, currentAnalysis, analyzeStrategy, clearAnalysis } = useStrategyAnalysis();
  const { getSuggestionPicks } = useAIInsights();
  const { odds: liveOdds, loading: oddsLoading, error: oddsError, refreshing, refreshOdds } = useOddsForStrategies();

  // Handle navigation context from trending or other pages
  useEffect(() => {
    if (location.state?.from === 'trend') {
      const { hashtag, category } = location.state;
      setCustomPrompt(`Create a betting strategy based on trending topic: ${hashtag} (${category})`);
      setActiveTab("custom-builder");
    } else if (location.state?.from === 'ai-insight') {
      setActiveTab("gpt-strategies");
    } else if (location.state?.from === 'ai-suggestion') {
      const { hashtag, category, picks } = location.state;
      setActiveTab("custom-builder");
      setImportedPicks(picks || []);
      
      // Generate prefilled prompt with pick details
      const picksList = picks?.map((pick: SuggestionPick) => 
        `• ${pick.title} (${pick.odds}, ${pick.bookmaker}) — ${pick.confidence}% conf. ${pick.rationale}`
      ).join('\n') || '';
      
      setCustomPrompt(
        `AI suggestion import for ${hashtag} (${category}):\n\nPicks:\n${picksList}\n\nAnalyze this combination and suggest optimal betting strategy.`
      );
    }
  }, [location.state]);

  // Live odds data from Supabase - will be populated by useOddsForStrategies hook

  // AI-powered strategies connected to real odds data
  const [strategyPicks, setStrategyPicks] = useState<Record<string, SuggestionPick[]>>({});
  const [refreshingPicks, setRefreshingPicks] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    // Fetch real AI suggestions for each strategy
    const fetchStrategyPicks = async () => {
      const strategies = ['value-hunter', 'momentum-play', 'injury-impact', 'weather-edge'];
      const picksPromises = strategies.map(async (strategyId) => {
        try {
          const picks = await getSuggestionPicks(1, strategyId);
          return { strategyId, picks };
        } catch (error) {
          console.error(`Error fetching picks for ${strategyId}:`, error);
          return { strategyId, picks: [] };
        }
      });
      
      const results = await Promise.all(picksPromises);
      const picksMap = results.reduce((acc, { strategyId, picks }) => {
        acc[strategyId] = picks;
        return acc;
      }, {} as Record<string, SuggestionPick[]>);
      
      setStrategyPicks(picksMap);
    };

    fetchStrategyPicks();
  }, [getSuggestionPicks]);

  // Calculate dynamic ROI based on AI picks
  const calculateExpectedROI = (picks: SuggestionPick[]) => {
    if (!picks.length) return "+0.0%";
    
    const avgConfidence = picks.reduce((sum, pick) => sum + pick.confidence, 0) / picks.length;
    const highConfidencePicks = picks.filter(pick => pick.confidence >= 80).length;
    
    // Base ROI calculation on confidence and number of high-confidence picks
    const baseROI = (avgConfidence - 50) * 0.3 + (highConfidencePicks * 2.5);
    const adjustedROI = Math.max(baseROI, 0);
    
    return `+${adjustedROI.toFixed(1)}%`;
  };

  // Calculate dynamic timeframe based on AI picks
  const calculateTimeframe = (picks: SuggestionPick[], strategyId: string) => {
    if (!picks.length) return "TBD";
    
    const now = new Date();
    const upcomingGames = picks.filter(pick => {
      if (!pick.startTime) return false;
      const gameTime = new Date(pick.startTime);
      return gameTime > now;
    });

    if (upcomingGames.length === 0) return "Live";

    const nearestGame = upcomingGames.reduce((nearest, pick) => {
      const gameTime = new Date(pick.startTime!);
      const nearestTime = new Date(nearest.startTime!);
      return gameTime < nearestTime ? pick : nearest;
    });

    const timeDiff = new Date(nearestGame.startTime!).getTime() - now.getTime();
    const hoursUntil = Math.round(timeDiff / (1000 * 60 * 60));

    if (strategyId === 'value-hunter') {
      return hoursUntil <= 2 ? "Live" : `${hoursUntil}h`;
    }
    if (strategyId === 'momentum-play') {
      return hoursUntil <= 4 ? `${Math.max(hoursUntil, 1)}h` : "4+ hours";
    }
    
    return `${hoursUntil}h`;
  };

  // Generate tailored prompt for strategy
  const generateStrategyPrompt = (strategyId: string, picks: SuggestionPick[]) => {
    const basePrompts: Record<string, string> = {
      'value-hunter': `Analyze value betting opportunities using line shopping and market inefficiencies. Focus on finding the best odds across multiple sportsbooks for maximum expected value.`,
      'momentum-play': `Develop a momentum-based betting strategy that capitalizes on rapid line movements and public sentiment shifts. Target contrarian opportunities when the public overreacts.`,
      'injury-impact': `Create an injury news reaction strategy for immediate betting opportunities when player status changes affect game lines.`,
      'weather-edge': `Design a weather-dependent betting strategy for outdoor games, focusing on total bets and game environment factors.`
    };

    let prompt = basePrompts[strategyId] || "Analyze this betting strategy.";
    
    if (picks.length > 0) {
      const picksList = picks.map(pick => 
        `• ${pick.title} (${pick.odds} at ${pick.bookmaker}) - ${pick.confidence}% confidence: ${pick.rationale}`
      ).join('\n');
      
      prompt += `\n\nCurrent AI Picks:\n${picksList}\n\nAnalyze these picks and provide strategic recommendations.`;
    }

    return prompt;
  };

  // Refresh picks for specific strategy
  const refreshStrategyPicks = async (strategyId: string) => {
    setRefreshingPicks(prev => ({ ...prev, [strategyId]: true }));
    
    try {
      const picks = await getSuggestionPicks(1, strategyId);
      setStrategyPicks(prev => ({ ...prev, [strategyId]: picks }));
    } catch (error) {
      console.error(`Error refreshing picks for ${strategyId}:`, error);
    } finally {
      setRefreshingPicks(prev => ({ ...prev, [strategyId]: false }));
    }
  };

  // Copy strategy prompt to custom builder
  const copyStrategyToBuilder = (strategyId: string, strategyTitle: string) => {
    const picks = strategyPicks[strategyId] || [];
    const prompt = generateStrategyPrompt(strategyId, picks);
    
    setCustomPrompt(prompt);
    setImportedPicks(picks);
    setActiveTab("custom-builder");
  };

  const gptStrategies = [
    {
      id: "value-hunter",
      title: "Value Hunter Pro",
      description: "AI identifies line discrepancies across books for maximum value",
      confidence: 87,
      expectedRoi: calculateExpectedROI(strategyPicks['value-hunter'] || []),
      timeframe: calculateTimeframe(strategyPicks['value-hunter'] || [], 'value-hunter'),
      tags: ["Line Shopping", "Value Betting", "AI Powered"],
      picks: strategyPicks['value-hunter'] || []
    },
    {
      id: "momentum-play",
      title: "Momentum Surge",
      description: "Capitalize on rapid line movements and public sentiment shifts",
      confidence: 92,
      expectedRoi: calculateExpectedROI(strategyPicks['momentum-play'] || []),
      timeframe: calculateTimeframe(strategyPicks['momentum-play'] || [], 'momentum-play'),
      tags: ["Line Movement", "Public Betting", "Contrarian"],
      picks: strategyPicks['momentum-play'] || []
    },
    {
      id: "injury-impact",
      title: "Injury Intelligence", 
      description: "React to late-breaking injury news before lines adjust",
      confidence: 78,
      expectedRoi: "+9.4%",
      timeframe: "30 mins",
      tags: ["Breaking News", "Player Props", "Fast Action"],
      picks: strategyPicks['injury-impact'] || []
    },
    {
      id: "weather-edge",
      title: "Weather Warrior",
      description: "Exploit weather-dependent betting opportunities in outdoor games",
      confidence: 85,
      expectedRoi: "+14.2%",
      timeframe: "24 hours",
      tags: ["Weather", "Totals", "Game Environment"],
      picks: strategyPicks['weather-edge'] || []
    }
  ];

  const handleAnalyzeStrategy = async (strategyId: string, strategyName: string) => {
    await analyzeStrategy(strategyId, strategyName);
    setActiveTab("analysis-results");
  };

  const handleAnalyzeCustom = async () => {
    if (!customPrompt.trim()) return;
    
    let finalPrompt = customPrompt;
    
    // Append imported picks if enabled
    if (includePicksInAnalysis && importedPicks.length > 0) {
      const picksText = importedPicks.map(pick => 
        `• ${pick.title} (${pick.odds}, ${pick.bookmaker}) — ${pick.confidence}% confidence: ${pick.rationale}`
      ).join('\n');
      finalPrompt = `${customPrompt}\n\nImported AI Picks:\n${picksText}`;
    }
    
    await analyzeStrategy("custom", "Custom Strategy");
    setActiveTab("analysis-results");
  };

  const handleRemoveImportedPick = (pickId: string) => {
    setImportedPicks(prev => prev.filter(p => p.id !== pickId));
  };

  const handleClearAllImportedPicks = () => {
    setImportedPicks([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gaming-dark via-gaming-primary to-gaming-dark">
      {/* Gaming HUD Header */}
      <div className="gaming-hud border-b border-neon-blue/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="gaming" size="sm" className="hover-glow">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Hub
                </Button>
              </Link>
              <div className="text-neon-green font-gaming text-lg">
                STRATEGY ANALYZER
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="gaming-stat-card">
                <span className="text-neon-blue text-sm">ACTIVE STRATEGIES</span>
                <span className="text-white font-bold ml-2">4</span>
              </div>
              <div className="gaming-stat-card">
                <span className="text-neon-green text-sm">SUCCESS RATE</span>
                <span className="text-white font-bold ml-2">84.2%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 gaming-tabs">
            <TabsTrigger value="gpt-strategies" className="gaming-tab">
              <Brain className="w-4 h-4 mr-2" />
              GPT Strategies
            </TabsTrigger>
            <TabsTrigger value="live-odds" className="gaming-tab">
              <TrendingUp className="w-4 h-4 mr-2" />
              Live Odds
            </TabsTrigger>
            <TabsTrigger value="custom-builder" className="gaming-tab">
              <Target className="w-4 h-4 mr-2" />
              Custom Builder
            </TabsTrigger>
            <TabsTrigger value="analysis-results" className="gaming-tab" disabled={!currentAnalysis}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Analysis Results
            </TabsTrigger>
          </TabsList>

          {/* GPT Strategies Tab */}
          <TabsContent value="gpt-strategies" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-gaming text-neon-blue mb-2">
                AI-POWERED STRATEGIES
              </h2>
              <p className="text-gray-300">
                Machine learning algorithms analyze thousands of data points to identify profitable betting patterns
              </p>
              <div className="mt-4 p-3 bg-neon-blue/10 border border-neon-blue/30 rounded-lg">
                <p className="text-neon-blue text-sm text-center">
                  📊 Analysis Only - No actual betting or sportsbook connections
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gptStrategies.map((strategy) => (
                <Card
                  key={strategy.id}
                  className={`gaming-card cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedStrategy === strategy.id ? 'ring-2 ring-neon-green' : ''
                  }`}
                  onClick={() => setSelectedStrategy(strategy.id)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-gaming text-neon-blue">
                        {strategy.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {(strategy.id === 'value-hunter' || strategy.id === 'momentum-play') && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                refreshStrategyPicks(strategy.id);
                              }}
                              disabled={refreshingPicks[strategy.id]}
                              className="h-6 w-6 p-0 border-neon-blue/50 hover:border-neon-blue"
                            >
                              <RefreshCw className={`w-3 h-3 text-neon-blue ${refreshingPicks[strategy.id] ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyStrategyToBuilder(strategy.id, strategy.title);
                              }}
                              className="h-6 px-2 text-xs border-neon-green/50 hover:border-neon-green text-neon-green"
                            >
                              Copy
                            </Button>
                          </div>
                        )}
                        <Zap className="w-4 h-4 text-neon-green" />
                        <span className="text-neon-green font-bold">
                          {strategy.confidence}%
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 mb-4">
                      {strategy.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="gaming-stat-card">
                        <DollarSign className="w-4 h-4 text-neon-green mb-1" />
                        <span className="text-xs text-gray-400">Expected ROI</span>
                        <span className="text-neon-green font-bold block">
                          {strategy.expectedRoi}
                        </span>
                      </div>
                      <div className="gaming-stat-card">
                        <Clock className="w-4 h-4 text-neon-blue mb-1" />
                        <span className="text-xs text-gray-400">Timeframe</span>
                        <span className="text-white font-bold block">
                          {strategy.timeframe}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {strategy.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-neon-blue/20 text-neon-blue text-xs rounded-full border border-neon-blue/30"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* AI Picks Section */}
                    <div className="mb-4">
                      <h4 className="text-sm font-gaming text-neon-green mb-2 flex items-center">
                        <Trophy className="w-3 h-3 mr-1" />
                        AI PICKS ({strategy.picks.length})
                      </h4>
                      <div className="space-y-2">
                        {strategy.picks.length > 0 ? strategy.picks.slice(0, 3).map((pick, idx) => (
                          <div key={idx} className="p-2 bg-gray-800/50 rounded border border-gray-700">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-bold text-neon-blue">{pick.title}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-neon-green">{pick.odds}</span>
                                <span className="text-xs text-gray-400">{pick.bookmaker}</span>
                                <span className="text-xs px-1 rounded bg-neon-green/20 text-neon-green">
                                  {pick.confidence}%
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-300 mb-1">
                              {pick.game} - {pick.league}
                            </div>
                            <div className="text-xs text-purple-400 italic">
                              {pick.rationale}
                            </div>
                          </div>
                        )) : (
                          <div className="text-xs text-gray-400 text-center py-2">
                            Loading AI picks...
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="gaming"
                      className="w-full hover-glow"
                      onClick={() => handleAnalyzeStrategy(strategy.id, strategy.title)}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-neon-green border-t-transparent rounded-full animate-spin mr-2"></div>
                          Analyzing...
                        </>
                      ) : (
                        'Analyze Strategy'
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Live Odds Tab */}
          <TabsContent value="live-odds" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-gaming text-neon-blue mb-2">
                LIVE SPORTSBOOK ODDS
              </h2>
              <p className="text-gray-300">
                Real-time football odds comparison (NFL & NCAAF)
              </p>
              <div className="mt-4">
                <Button
                  variant="gaming"
                  size="sm"
                  onClick={refreshOdds}
                  disabled={refreshing || oddsLoading}
                  className="hover-glow"
                >
                  {refreshing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-neon-green border-t-transparent rounded-full animate-spin mr-2"></div>
                      Fetching...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh Odds Now
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Note: Manual refresh uses API quota
                </p>
              </div>
            </div>

            {oddsLoading ? (
              <div className="grid gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="gaming-card animate-pulse">
                    <div className="p-6">
                      <div className="h-20 bg-gray-700 rounded"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : liveOdds.length > 0 ? (
              <div className="grid gap-4">
                {liveOdds.map((game, index) => (
                  <Card key={index} className="gaming-card">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-gaming text-neon-blue">
                          {game.team1} vs {game.team2}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary">
                            {game.league}
                          </span>
                          <div className="text-sm text-gray-400">
                            {game.game_date ? new Date(game.game_date).toLocaleDateString() : 'TBD'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Moneyline Odds */}
                        {game.h2h_odds.length > 0 && (
                          <div className="gaming-stat-card">
                            <span className="text-xs text-gray-400 mb-2 block">Moneyline</span>
                            {game.h2h_odds.slice(0, 2).map((odd, i) => (
                              <div key={i} className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-300">{odd.bookmaker}</span>
                                <span className="text-neon-green font-bold">
                                  {odd.odds > 0 ? `+${odd.odds}` : odd.odds}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Spread Odds */}
                        {game.spread_odds.length > 0 && (
                          <div className="gaming-stat-card">
                            <span className="text-xs text-gray-400 mb-2 block">Spread</span>
                            {game.spread_odds.slice(0, 2).map((odd, i) => (
                              <div key={i} className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-300">{odd.bookmaker}</span>
                                <span className="text-white font-bold">
                                  {odd.odds > 0 ? `+${odd.odds}` : odd.odds}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Total Odds */}
                        {game.total_odds.length > 0 && (
                          <div className="gaming-stat-card">
                            <span className="text-xs text-gray-400 mb-2 block">Total</span>
                            {game.total_odds.slice(0, 2).map((odd, i) => (
                              <div key={i} className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-300">{odd.bookmaker}</span>
                                <span className="text-gold font-bold">
                                  {odd.odds > 0 ? `+${odd.odds}` : odd.odds}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4">
                        <Button 
                          size="sm" 
                          variant="gaming" 
                          className="w-full hover-glow"
                          onClick={() => handleAnalyzeStrategy(`odds-${index}`, `${game.team1} vs ${game.team2} Analysis`)}
                        >
                          ANALYZE GAME
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No live odds available</p>
                <p className="text-sm text-gray-500">Odds update every 30 minutes</p>
              </div>
            )}
          </TabsContent>

          {/* Custom Builder Tab */}
          <TabsContent value="custom-builder" className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-gaming text-neon-blue mb-2">
                CUSTOM STRATEGY BUILDER
              </h2>
              <p className="text-gray-300">
                Describe your betting approach and let GPT analyze and optimize it
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="gaming-card">
                <div className="p-6">
                  {/* Imported Picks Section */}
                  {importedPicks.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-gaming text-neon-green flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          IMPORTED PICKS ({importedPicks.length})
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearAllImportedPicks}
                          className="text-red-400 hover:bg-red-400/20"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Clear All
                        </Button>
                      </div>
                      
                      <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                        {importedPicks.map((pick) => (
                          <div
                            key={pick.id}
                            className="flex items-center justify-between p-2 bg-primary/10 rounded border border-primary/20"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-primary truncate">
                                {pick.title}
                              </div>
                              <div className="text-xs text-gray-400">
                                {pick.odds} @ {pick.bookmaker} • {pick.confidence}% conf
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveImportedPick(pick.id)}
                              className="text-red-400 hover:bg-red-400/20 ml-2"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          id="includePicks"
                          checked={includePicksInAnalysis}
                          onChange={(e) => setIncludePicksInAnalysis(e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor="includePicks" className="text-gray-300">
                          Include these picks in the analysis prompt
                        </label>
                      </div>
                    </div>
                  )}

                  <h3 className="text-xl font-gaming text-neon-green mb-4">
                    STRATEGY INPUT
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neon-blue mb-2">
                        Strategy Name
                      </label>
                      <Input
                        placeholder="e.g., 'Home Underdog Special'"
                        className="gaming-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neon-blue mb-2">
                        Strategy Description
                      </label>
                      <Textarea
                        placeholder="Describe your betting strategy, conditions, and approach in detail..."
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        className="gaming-input min-h-[120px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neon-blue mb-2">
                          Risk Level
                        </label>
                        <select className="gaming-input w-full">
                          <option>Conservative</option>
                          <option>Moderate</option>
                          <option>Aggressive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neon-blue mb-2">
                          Sport Focus
                        </label>
                        <select className="gaming-input w-full">
                          <option>All Sports</option>
                          <option>NFL</option>
                          <option>NCAAF</option>
                          <option>NBA</option>
                          <option>MLB</option>
                        </select>
                      </div>
                    </div>

                    <Button
                      variant="gaming"
                      className="w-full hover-glow"
                      onClick={handleAnalyzeCustom}
                      disabled={isAnalyzing || !customPrompt.trim()}
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-neon-green border-t-transparent rounded-full animate-spin mr-2"></div>
                          ANALYZING...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          ANALYZE STRATEGY
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="gaming-card">
                <div className="p-6">
                  <h3 className="text-xl font-gaming text-neon-green mb-4">
                    GPT ANALYSIS
                  </h3>
                  
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-neon-blue font-gaming">
                          AI ANALYZING YOUR STRATEGY...
                        </p>
                      </div>
                    </div>
                  ) : customPrompt.trim() ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-neon-blue/10 border border-neon-blue/30 rounded-lg">
                        <h4 className="text-neon-blue font-gaming mb-2">STRATEGY ASSESSMENT</h4>
                        <p className="text-gray-300 text-sm">
                          Your strategy shows promise. AI suggests focusing on teams with strong defensive records 
                          when playing at home as underdogs. Historical data shows 67% success rate.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="gaming-stat-card">
                          <span className="text-neon-green text-sm">Confidence</span>
                          <span className="text-white font-bold ml-2">74%</span>
                        </div>
                        <div className="gaming-stat-card">
                          <span className="text-neon-blue text-sm">Risk Score</span>
                          <span className="text-white font-bold ml-2">6.2/10</span>
                        </div>
                      </div>

                      <Button variant="neon" className="w-full">
                        <Users className="w-4 h-4 mr-2" />
                        Save Analysis
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <div className="text-center">
                        <Brain className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>Enter your strategy details to get AI analysis</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Analysis Results Tab */}
          <TabsContent value="analysis-results" className="space-y-6">
            {currentAnalysis && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-gaming text-neon-blue mb-2">
                    STRATEGY ANALYSIS RESULTS
                  </h2>
                  <p className="text-gray-300">
                    Comprehensive AI analysis of "{currentAnalysis.strategyName}"
                  </p>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <Card className="gaming-card text-center">
                    <div className="p-4">
                      <Zap className="w-6 h-6 mx-auto mb-2 text-neon-green" />
                      <div className="text-2xl font-gaming text-neon-green">
                        {currentAnalysis.confidence}%
                      </div>
                      <div className="text-sm text-gray-400">Confidence</div>
                    </div>
                  </Card>
                  <Card className="gaming-card text-center">
                    <div className="p-4">
                      <DollarSign className="w-6 h-6 mx-auto mb-2 text-neon-blue" />
                      <div className="text-2xl font-gaming text-neon-blue">
                        {currentAnalysis.expectedRoi}
                      </div>
                      <div className="text-sm text-gray-400">Expected ROI</div>
                    </div>
                  </Card>
                  <Card className="gaming-card text-center">
                    <div className="p-4">
                      <AlertTriangle className={`w-6 h-6 mx-auto mb-2 ${
                        currentAnalysis.riskLevel === 'LOW' ? 'text-neon-green' :
                        currentAnalysis.riskLevel === 'MEDIUM' ? 'text-gold' : 'text-red-400'
                      }`} />
                      <div className={`text-2xl font-gaming ${
                        currentAnalysis.riskLevel === 'LOW' ? 'text-neon-green' :
                        currentAnalysis.riskLevel === 'MEDIUM' ? 'text-gold' : 'text-red-400'
                      }`}>
                        {currentAnalysis.riskLevel}
                      </div>
                      <div className="text-sm text-gray-400">Risk Level</div>
                    </div>
                  </Card>
                  <Card className="gaming-card text-center">
                    <div className="p-4">
                      <Clock className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                      <div className="text-xl font-gaming text-purple-400">
                        {currentAnalysis.timeframe}
                      </div>
                      <div className="text-sm text-gray-400">Timeframe</div>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Historical Performance */}
                  <Card className="gaming-card">
                    <div className="p-6">
                      <h3 className="text-xl font-gaming text-neon-green mb-4 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        HISTORICAL PERFORMANCE
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="gaming-stat-card">
                          <span className="text-neon-blue text-sm">Total Bets</span>
                          <span className="text-white font-bold ml-2">{currentAnalysis.historicalPerformance.totalBets}</span>
                        </div>
                        <div className="gaming-stat-card">
                          <span className="text-neon-green text-sm">Win Rate</span>
                          <span className="text-white font-bold ml-2">{currentAnalysis.historicalPerformance.winRate.toFixed(1)}%</span>
                        </div>
                        <div className="gaming-stat-card">
                          <span className="text-gold text-sm">Avg Return</span>
                          <span className="text-white font-bold ml-2">{currentAnalysis.historicalPerformance.avgReturn.toFixed(1)}%</span>
                        </div>
                        <div className="gaming-stat-card">
                          <span className="text-purple-400 text-sm">Best Streak</span>
                          <span className="text-white font-bold ml-2">{currentAnalysis.historicalPerformance.bestStreak}</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Key Metrics */}
                  <Card className="gaming-card">
                    <div className="p-6">
                      <h3 className="text-xl font-gaming text-neon-blue mb-4 flex items-center">
                        <Target className="w-5 h-5 mr-2" />
                        KEY METRICS
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Sharpe Ratio</span>
                          <span className="text-neon-green font-bold">{currentAnalysis.keyMetrics.sharpeRatio.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Max Drawdown</span>
                          <span className="text-red-400 font-bold">{currentAnalysis.keyMetrics.maxDrawdown}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Profit Factor</span>
                          <span className="text-neon-blue font-bold">{currentAnalysis.keyMetrics.profitFactor.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Avg Hold Time</span>
                          <span className="text-purple-400 font-bold">{currentAnalysis.keyMetrics.avgHoldTime}</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Strengths */}
                  <Card className="gaming-card">
                    <div className="p-6">
                      <h3 className="text-xl font-gaming text-neon-green mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        STRENGTHS
                      </h3>
                      <ul className="space-y-2">
                        {currentAnalysis.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                            <div className="w-1 h-1 bg-neon-green rounded-full mt-2 flex-shrink-0" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>

                  {/* Weaknesses */}
                  <Card className="gaming-card">
                    <div className="p-6">
                      <h3 className="text-xl font-gaming text-red-400 mb-4 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        WEAKNESSES
                      </h3>
                      <ul className="space-y-2">
                        {currentAnalysis.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                            <div className="w-1 h-1 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                </div>

                {/* Recommendations */}
                <Card className="gaming-card">
                  <div className="p-6">
                    <h3 className="text-xl font-gaming text-gold mb-4 flex items-center">
                      <Brain className="w-5 h-5 mr-2" />
                      AI RECOMMENDED BETTING LINES
                    </h3>
                    
                    {/* Top Picks Banner */}
                    <div className="bg-gradient-to-r from-neon-green/20 to-neon-blue/20 border border-neon-green/50 rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-gold" />
                          <span className="font-sports font-bold text-gold">TOP AI PICKS</span>
                        </div>
                        <div className="text-sm text-neon-green font-bold">87% Win Rate</div>
                      </div>
                    </div>

                    {/* Betting Lines Grid */}
                    <div className="space-y-4">
                      {/* Game 1 */}
                      <Card className="gaming-card border-neon-green/30">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
                              <span className="font-sports font-bold">Chiefs vs Bills</span>
                              <span className="text-xs text-gray-400">8:15 PM ET</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="w-4 h-4 text-gold" />
                              <span className="text-gold font-bold text-sm">92% Confidence</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Button 
                              variant="gaming" 
                              className="h-auto p-3 bg-neon-green/20 border-neon-green hover:bg-neon-green/30"
                              data-testid="analyze-strategy-btn-chiefs-spread"
                            >
                              <div className="text-center w-full">
                                <div className="text-xs text-gray-300">SPREAD</div>
                                <div className="font-bold text-neon-green">Chiefs -3.5</div>
                                <div className="text-xs text-gray-400">-110</div>
                              </div>
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              className="h-auto p-3 border-gray-500 hover:border-neon-blue"
                            >
                              <div className="text-center w-full">
                                <div className="text-xs text-gray-300">TOTAL</div>
                                <div className="font-bold">Over 47.5</div>
                                <div className="text-xs text-gray-400">-105</div>
                              </div>
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              className="h-auto p-3 border-gray-500 hover:border-gold"
                            >
                              <div className="text-center w-full">
                                <div className="text-xs text-gray-300">MONEYLINE</div>
                                <div className="font-bold">Chiefs</div>
                                <div className="text-xs text-gray-400">-165</div>
                              </div>
                            </Button>
                          </div>
                          
                          <div className="mt-3 p-2 bg-neon-green/10 border border-neon-green/30 rounded">
                            <div className="flex items-center gap-2 text-sm">
                              <Target className="w-3 h-3 text-neon-green" />
                              <span className="text-neon-green font-bold">AI Reasoning:</span>
                              <span className="text-gray-300">Chiefs averaging 28.4 PPG vs Bills allowing 24.1. Weather favors running game.</span>
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* Game 2 */}
                      <Card className="gaming-card border-neon-blue/30">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse"></div>
                              <span className="font-sports font-bold">Ravens vs Bengals</span>
                              <span className="text-xs text-gray-400">1:00 PM ET</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="w-4 h-4 text-gold" />
                              <span className="text-gold font-bold text-sm">84% Confidence</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Button 
                              variant="outline" 
                              className="h-auto p-3 border-gray-500 hover:border-neon-green"
                            >
                              <div className="text-center w-full">
                                <div className="text-xs text-gray-300">SPREAD</div>
                                <div className="font-bold">Ravens -7.5</div>
                                <div className="text-xs text-gray-400">-110</div>
                              </div>
                            </Button>
                            
                            <Button 
                              variant="gaming" 
                              className="h-auto p-3 bg-neon-blue/20 border-neon-blue hover:bg-neon-blue/30"
                            >
                              <div className="text-center w-full">
                                <div className="text-xs text-gray-300">TOTAL</div>
                                <div className="font-bold text-neon-blue">Over 51.5</div>
                                <div className="text-xs text-gray-400">-115</div>
                              </div>
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              className="h-auto p-3 border-gray-500 hover:border-gold"
                            >
                              <div className="text-center w-full">
                                <div className="text-xs text-gray-300">PLAYER PROP</div>
                                <div className="font-bold">Lamar 250+ Pass Yds</div>
                                <div className="text-xs text-gray-400">+130</div>
                              </div>
                            </Button>
                          </div>
                          
                          <div className="mt-3 p-2 bg-neon-blue/10 border border-neon-blue/30 rounded">
                            <div className="flex items-center gap-2 text-sm">
                              <Target className="w-3 h-3 text-neon-blue" />
                              <span className="text-neon-blue font-bold">AI Reasoning:</span>
                              <span className="text-gray-300">Both teams rank top 5 in offensive DVOA. Dome conditions favor passing.</span>
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* Game 3 */}
                      <Card className="gaming-card border-gold/30">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gold rounded-full animate-pulse"></div>
                              <span className="font-sports font-bold">Cowboys vs 49ers</span>
                              <span className="text-xs text-gray-400">4:25 PM ET</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4 text-orange-400" />
                              <span className="text-orange-400 font-bold text-sm">76% Confidence</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Button 
                              variant="outline" 
                              className="h-auto p-3 border-gray-500 hover:border-neon-green"
                            >
                              <div className="text-center w-full">
                                <div className="text-xs text-gray-300">SPREAD</div>
                                <div className="font-bold">Cowboys +2.5</div>
                                <div className="text-xs text-gray-400">-105</div>
                              </div>
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              className="h-auto p-3 border-gray-500 hover:border-neon-blue"
                            >
                              <div className="text-center w-full">
                                <div className="text-xs text-gray-300">TOTAL</div>
                                <div className="font-bold">Under 44.5</div>
                                <div className="text-xs text-gray-400">-110</div>
                              </div>
                            </Button>
                            
                            <Button 
                              variant="gaming" 
                              className="h-auto p-3 bg-gold/20 border-gold hover:bg-gold/30"
                            >
                              <div className="text-center w-full">
                                <div className="text-xs text-gray-300">PLAYER PROP</div>
                                <div className="font-bold text-gold">Dak Under 1.5 TDs</div>
                                <div className="text-xs text-gray-400">+110</div>
                              </div>
                            </Button>
                          </div>
                          
                          <div className="mt-3 p-2 bg-gold/10 border border-gold/30 rounded">
                            <div className="flex items-center gap-2 text-sm">
                              <Target className="w-3 h-3 text-gold" />
                              <span className="text-gold font-bold">AI Reasoning:</span>
                              <span className="text-gray-300">49ers defense allowing just 1.2 passing TDs/game at home this season.</span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Strategy Summary */}
                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-background/50 rounded-lg border border-border/50">
                        <div className="text-2xl font-bold text-neon-green">3</div>
                        <div className="text-xs text-gray-400">Recommended Picks</div>
                      </div>
                      <div className="text-center p-3 bg-background/50 rounded-lg border border-border/50">
                        <div className="text-2xl font-bold text-gold">+$247</div>
                        <div className="text-xs text-gray-400">Expected Profit</div>
                      </div>
                      <div className="text-center p-3 bg-background/50 rounded-lg border border-border/50">
                        <div className="text-2xl font-bold text-neon-blue">84%</div>
                        <div className="text-xs text-gray-400">Avg Confidence</div>
                      </div>
                      <div className="text-center p-3 bg-background/50 rounded-lg border border-border/50">
                        <div className="text-2xl font-bold text-purple-400">2.4x</div>
                        <div className="text-xs text-gray-400">Parlay Multiplier</div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center">
                  <Button variant="gaming" onClick={() => setActiveTab("gpt-strategies")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Strategies
                  </Button>
                  <Button variant="neon" onClick={clearAnalysis}>
                    <Target className="w-4 h-4 mr-2" />
                    Clear Analysis
                  </Button>
                  <Button variant="hero">
                    <Users className="w-4 h-4 mr-2" />
                    Save to Portfolio
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalyzeStrategies;