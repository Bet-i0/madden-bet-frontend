import { useState, useEffect } from "react";
import { 
  AlertTriangle, 
  Clock, 
  User, 
  Activity, 
  TrendingDown, 
  Shield, 
  Target, 
  MessageSquare, 
  Users,
  Flame,
  ChevronRight,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import BackToHome from "@/components/BackToHome";

const Injuries = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedInjury, setSelectedInjury] = useState<any>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const injuryReports = [
    {
      id: 1,
      player: "Patrick Mahomes",
      team: "Kansas City Chiefs",
      position: "QB",
      injury: "Ankle Sprain",
      status: "Questionable",
      severity: "Minor",
      lastUpdate: "2 hours ago",
      projectedReturn: "This Week",
      fantasyImpact: "Medium",
      bettingImplications: "Chiefs spread may be affected (-1.5 pts)",
      description: "Right ankle sprain sustained during practice. Expected to play with pain management.",
      relatedPlayers: ["Travis Kelce", "Tyreek Hill"],
      weeklyTrend: "Improving"
    },
    {
      id: 2,
      player: "Christian McCaffrey",
      team: "San Francisco 49ers",
      position: "RB",
      injury: "Hamstring Strain",
      status: "Doubtful",
      severity: "Moderate",
      lastUpdate: "4 hours ago",
      projectedReturn: "Next Week",
      fantasyImpact: "High",
      bettingImplications: "49ers total may drop (-3.5 pts)",
      description: "Grade 2 hamstring strain. Unlikely to suit up this week.",
      relatedPlayers: ["Jordan Mason", "Kyle Juszczyk"],
      weeklyTrend: "Declining"
    },
    {
      id: 3,
      player: "Cooper Kupp",
      team: "Los Angeles Rams",
      position: "WR",
      injury: "Knee Contusion",
      status: "Probable",
      severity: "Minor",
      lastUpdate: "1 hour ago",
      projectedReturn: "This Week",
      fantasyImpact: "Low",
      bettingImplications: "Rams passing props stable",
      description: "Minor knee bruising from contact in practice. Should be ready to go.",
      relatedPlayers: ["Matthew Stafford", "Puka Nacua"],
      weeklyTrend: "Stable"
    }
  ];

  const generateGPTInsight = async (injury: any) => {
    setIsLoadingInsight(true);
    setAiInsight("");
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const insights = [
      `Given ${injury.player}'s ${injury.injury}, I recommend AVOIDING his player props this week. The ${injury.severity.toLowerCase()} nature of this injury could limit his effectiveness. Consider fading ${injury.team} in your parlays.`,
      `${injury.player}'s ${injury.injury} creates value in ${injury.relatedPlayers[0]} props. The backup options suggest a shift in game plan. This injury makes UNDER bets more attractive for team totals.`,
      `Monitor ${injury.player} closely - his ${injury.status.toLowerCase()} status creates uncertainty. If he plays, expect limited snaps. This injury scenario favors defensive props and lower-scoring game outcomes.`,
      `The ${injury.team} offense will adapt around ${injury.player}'s absence. Look for increased targets to ${injury.relatedPlayers.join(' and ')}. Team total UNDER becomes more valuable.`
    ];
    
    setAiInsight(insights[Math.floor(Math.random() * insights.length)]);
    setIsLoadingInsight(false);
  };

  const handleInjuryClick = (injury: any) => {
    setSelectedInjury(injury);
    generateGPTInsight(injury);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'minor': return "text-neon-green";
      case 'moderate': return "text-amber-400";
      case 'severe': return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'probable': return "bg-neon-green/20 text-neon-green border-neon-green/30";
      case 'questionable': return "bg-amber-400/20 text-amber-400 border-amber-400/30";
      case 'doubtful': return "bg-destructive/20 text-destructive border-destructive/30";
      case 'out': return "bg-muted/20 text-muted-foreground border-muted/30";
      default: return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  return (
    <div className="min-h-screen bg-background font-gaming overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-card backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Live Status */}
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-neon px-4 py-2 rounded-lg shadow-glow">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-accent-foreground animate-pulse" />
                  <span className="font-bold text-accent-foreground font-sports">INJURY TRACKER</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-neon-green">
                <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
                <span className="font-sports text-sm">LIVE UPDATES</span>
              </div>
            </div>

            {/* Center: Time */}
            <div className="flex items-center space-x-2 text-silver-metallic">
              <Clock className="w-4 h-4" />
              <span className="font-sports text-lg">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="hidden md:inline text-muted-foreground">
                {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            {/* Right: Back Button */}
            <BackToHome 
              variant="outline" 
              className="font-sports"
            />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-8 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold font-sports tracking-wider">
              INJURY <span className="text-gradient-primary">INTELLIGENCE</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real-time injury reports with AI-powered betting impact analysis
            </p>
            <div className="flex justify-center space-x-4">
              <Badge variant="secondary" className="px-4 py-2 font-sports">
                <Heart className="w-4 h-4 mr-2" />
                REAL-TIME DATA
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 font-sports">
                <Target className="w-4 h-4 mr-2" />
                AI ANALYSIS
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 font-sports">
                <TrendingDown className="w-4 h-4 mr-2" />
                BETTING IMPACT
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Injury Reports List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold font-sports">ACTIVE REPORTS</h2>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Last updated: {currentTime.toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {injuryReports.map((injury) => (
                  <Card 
                    key={injury.id}
                    className={`gaming-card cursor-pointer transition-all duration-300 hover:shadow-neon hover:scale-[1.02] ${
                      selectedInjury?.id === injury.id ? 'ring-2 ring-primary shadow-neon' : ''
                    }`}
                    onClick={() => handleInjuryClick(injury)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-xl font-bold font-sports">{injury.player}</h3>
                            <Badge variant="outline" className="font-sports">
                              {injury.position}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{injury.team}</p>
                        </div>
                        <Badge className={`${getStatusColor(injury.status)} font-sports`}>
                          {injury.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Injury</p>
                          <p className="font-semibold">{injury.injury}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Severity</p>
                          <p className={`font-semibold ${getSeverityColor(injury.severity)}`}>
                            {injury.severity}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Return</p>
                          <p className="font-semibold">{injury.projectedReturn}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Fantasy Impact</p>
                          <p className="font-semibold">{injury.fantasyImpact}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Updated {injury.lastUpdate}
                        </span>
                        <ChevronRight className="w-5 h-5 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* AI Analysis Panel */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold font-sports">AI IMPACT ANALYSIS</h2>
              
              {selectedInjury ? (
                <Card className="gaming-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <User className="w-6 h-6 text-primary" />
                      <span className="font-sports">{selectedInjury.player} ANALYSIS</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">Injury Details</h4>
                      <p className="text-muted-foreground">{selectedInjury.description}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Betting Implications</h4>
                      <p className="text-amber-400">{selectedInjury.bettingImplications}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Related Players to Watch</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedInjury.relatedPlayers.map((player: string, index: number) => (
                          <Badge key={index} variant="secondary" className="font-sports">
                            {player}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {isLoadingInsight ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Flame className="w-5 h-5 text-primary animate-pulse" />
                          <span className="font-sports">AI ANALYZING...</span>
                        </div>
                        <div className="bg-muted/20 rounded-lg p-4 animate-pulse">
                          <div className="h-4 bg-muted rounded mb-2"></div>
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                        </div>
                      </div>
                    ) : aiInsight ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Flame className="w-5 h-5 text-primary" />
                          <span className="font-sports text-primary">AI BETTING INSIGHT</span>
                        </div>
                        <div className="bg-gradient-card p-4 rounded-lg border border-primary/20">
                          <p className="text-foreground">{aiInsight}</p>
                        </div>
                      </div>
                    ) : null}

                    <Button 
                      className="w-full bg-gradient-neon hover:shadow-glow font-sports text-accent-foreground"
                      onClick={() => navigate('/ai-coach')}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      DISCUSS WITH AI COACH
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="gaming-card">
                  <CardContent className="p-8 text-center space-y-4">
                    <Shield className="w-16 h-16 text-muted-foreground mx-auto" />
                    <h3 className="text-xl font-sports">SELECT AN INJURY REPORT</h3>
                    <p className="text-muted-foreground">
                      Click on any injury report to get AI-powered betting insights and impact analysis
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <footer className="bg-gradient-card border-t border-border py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary font-sports">127</div>
              <div className="text-sm text-muted-foreground">Active Reports</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-neon-green font-sports">89%</div>
              <div className="text-sm text-muted-foreground">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400 font-sports">34</div>
              <div className="text-sm text-muted-foreground">Teams Affected</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400 font-sports">Live</div>
              <div className="text-sm text-muted-foreground">Updates</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Injuries;