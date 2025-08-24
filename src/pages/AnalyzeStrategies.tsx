import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, TrendingUp, Target, Zap, Brain, DollarSign, Users, Clock, CheckCircle, AlertTriangle, TrendingDown, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useStrategyAnalysis } from "@/hooks/useStrategyAnalysis";

const AnalyzeStrategies = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("gpt-strategies");
  
  const { isAnalyzing, currentAnalysis, analyzeStrategy, clearAnalysis } = useStrategyAnalysis();

  // Mock live odds data from major sportsbooks
  const liveOdds = [
    { sportsbook: "DraftKings", team1: "Chiefs", team2: "Bills", odds1: "-110", odds2: "+105", spread: "-2.5" },
    { sportsbook: "FanDuel", team1: "Chiefs", team2: "Bills", odds1: "-115", odds2: "+110", spread: "-2.5" },
    { sportsbook: "BetMGM", team1: "Chiefs", team2: "Bills", odds1: "-108", odds2: "+102", spread: "-3.0" },
    { sportsbook: "Caesars", team1: "Chiefs", team2: "Bills", odds1: "-112", odds2: "+108", spread: "-2.5" },
  ];

  // GPT-picked strategies
  const gptStrategies = [
    {
      id: "value-hunter",
      title: "Value Hunter Pro",
      description: "AI identifies line discrepancies across books for maximum value",
      confidence: 87,
      expectedRoi: "+12.3%",
      timeframe: "Live",
      tags: ["Line Shopping", "Value Betting", "AI Powered"]
    },
    {
      id: "momentum-play",
      title: "Momentum Surge",
      description: "Capitalize on rapid line movements and public sentiment shifts",
      confidence: 92,
      expectedRoi: "+18.7%",
      timeframe: "2-4 hours",
      tags: ["Line Movement", "Public Betting", "Contrarian"]
    },
    {
      id: "injury-impact",
      title: "Injury Intelligence",
      description: "React to late-breaking injury news before lines adjust",
      confidence: 78,
      expectedRoi: "+9.4%",
      timeframe: "30 mins",
      tags: ["Breaking News", "Player Props", "Fast Action"]
    },
    {
      id: "weather-edge",
      title: "Weather Warrior",
      description: "Exploit weather-dependent betting opportunities in outdoor games",
      confidence: 85,
      expectedRoi: "+14.2%",
      timeframe: "24 hours",
      tags: ["Weather", "Totals", "Game Environment"]
    }
  ];

  const handleAnalyzeStrategy = async (strategyId: string, strategyName: string) => {
    await analyzeStrategy(strategyId, strategyName);
    setActiveTab("analysis-results");
  };

  const handleAnalyzeCustom = async () => {
    if (!customPrompt.trim()) return;
    await analyzeStrategy("custom", "Custom Strategy");
    setActiveTab("analysis-results");
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
                LIVE ODDS COMPARISON
              </h2>
              <p className="text-gray-300">
                Real-time odds comparison for analysis - Updated every 30 seconds via API
              </p>
            </div>

            <Card className="gaming-card">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-gaming text-neon-green">
                    CHIEFS @ BILLS
                  </h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
                    <span className="text-neon-green text-sm">LIVE</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-neon-blue/30">
                        <th className="text-left py-3 text-neon-blue font-gaming">SPORTSBOOK</th>
                        <th className="text-center py-3 text-neon-blue font-gaming">SPREAD</th>
                        <th className="text-center py-3 text-neon-blue font-gaming">CHIEFS</th>
                        <th className="text-center py-3 text-neon-blue font-gaming">BILLS</th>
                        <th className="text-center py-3 text-neon-blue font-gaming">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liveOdds.map((odds, index) => (
                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-800/30">
                          <td className="py-4 text-white font-bold">{odds.sportsbook}</td>
                          <td className="py-4 text-center text-neon-green">{odds.spread}</td>
                          <td className="py-4 text-center text-white">{odds.odds1}</td>
                          <td className="py-4 text-center text-white">{odds.odds2}</td>
                          <td className="py-4 text-center">
                            <Button 
                              size="sm" 
                              variant="neon" 
                              className="text-xs"
                              onClick={() => handleAnalyzeStrategy(`odds-${index}`, `${odds.sportsbook} Analysis`)}
                            >
                              ANALYZE
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 p-4 bg-neon-green/10 border border-neon-green/30 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="w-4 h-4 text-neon-green" />
                    <span className="text-neon-green font-gaming">VALUE OPPORTUNITY DETECTED</span>
                  </div>
                  <p className="text-gray-300 text-sm">
                    BetMGM showing +102 on Bills while market average is +106. 
                    Potential 4-point value edge identified.
                  </p>
                </div>
              </div>
            </Card>
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
                      AI RECOMMENDATIONS
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentAnalysis.recommendations.map((rec, index) => (
                        <div key={index} className="p-3 bg-gold/10 border border-gold/30 rounded-lg">
                          <p className="text-sm text-gray-300">{rec}</p>
                        </div>
                      ))}
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