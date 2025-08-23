import { useState, useEffect } from "react";
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Gamepad2, 
  Activity, 
  Award, 
  Settings, 
  Wallet, 
  Clock, 
  User,
  ChevronDown,
  Zap,
  BarChart3,
  Flame,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import stadiumBg from "@/assets/stadium-bg.jpg";

const Index = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const featuredGames = [
    { team1: "Chiefs", team2: "Bills", time: "8:15 PM", spread: "-3.5", total: "47.5" },
    { team1: "Cowboys", team2: "49ers", time: "4:25 PM", spread: "+2.5", total: "44.5" },
    { team1: "Ravens", team2: "Bengals", time: "1:00 PM", spread: "-7.5", total: "51.5" }
  ];

  const aiInsights = [
    { analysis: "Ravens Advantage", confidence: 87, reason: "Strong rushing attack vs weak run defense" },
    { analysis: "High-Scoring Game", confidence: 91, reason: "Weather conditions favor passing game" },
    { analysis: "Chiefs Edge", confidence: 78, reason: "Home field advantage in divisional game" }
  ];

  const bottomMenuItems = [
    { icon: Target, label: "AI Coach", active: false, path: "/ai-coach" },
    { icon: Activity, label: "Injuries", active: false, path: "/injuries" },
    { icon: BarChart3, label: "Analytics", active: false, path: "/analytics" },
    { icon: Settings, label: "Settings", active: false, path: null }
  ];

  return (
    <div className="min-h-screen bg-background font-gaming overflow-x-hidden">
      {/* HUD-Style Top Navigation */}
      <header className="sticky top-0 z-50 bg-gradient-card backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: AI Coach Status */}
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-neon px-4 py-2 rounded-lg shadow-glow">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-accent-foreground animate-pulse" />
                  <span className="font-bold text-accent-foreground font-sports">AI COACH</span>
                </div>
              </div>
            </div>

            {/* Center: Live Time/Date */}
            <div className="flex items-center space-x-2 text-silver-metallic">
              <Clock className="w-4 h-4" />
              <span className="font-sports text-lg">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="hidden md:inline text-muted-foreground">
                {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            {/* Right: User Profile */}
            <div className="flex items-center space-x-3">
              <div className="hidden md:flex flex-col items-end text-sm">
                <span className="font-semibold">SportsFan_99</span>
                <span className="text-gold-accent font-sports">ANALYST</span>
              </div>
              <div className="relative group cursor-pointer">
                <Avatar className="w-10 h-10 border-2 border-primary shadow-neon">
                  <AvatarImage src="/api/placeholder/40/40" />
                  <AvatarFallback className="bg-gradient-primary font-bold">PB</AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 absolute -bottom-1 -right-1 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Area - Today's Matchups */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${stadiumBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        
        <div className="relative container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-6xl md:text-8xl font-sports font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              BET.IO
            </h1>
            <div className="w-full overflow-hidden">
              <div className="animate-marquee whitespace-nowrap text-gold-accent font-sports text-xl">
                AI INSIGHTS • ODDS COMPARISON • INJURY REPORTS • SENTIMENT ANALYSIS • AI INSIGHTS • ODDS COMPARISON • INJURY REPORTS • SENTIMENT ANALYSIS
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {featuredGames.map((game, index) => (
              <Card 
                key={index}
                className="group bg-gradient-card border-border hover:border-primary transition-all duration-300 hover:shadow-neon cursor-pointer hover:scale-105"
                onClick={() => setSelectedPanel(`game-${index}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm text-muted-foreground font-sports">{game.time}</CardTitle>
                    <Flame className="w-4 h-4 text-destructive animate-glow-pulse" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="text-xl font-sports font-bold">{game.team1}</div>
                      <div className="text-silver-metallic font-bold">VS</div>
                      <div className="text-xl font-sports font-bold">{game.team2}</div>
                    </div>
                    <div className="flex justify-around text-sm space-x-4">
                      <div className="text-center">
                        <div className="text-muted-foreground">SPREAD</div>
                        <div className="font-bold text-primary">{game.spread}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">TOTAL</div>
                        <div className="font-bold text-primary">{game.total}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Horizontal Scroll Panels */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* AI Insights Panel */}
            <Card className="bg-gradient-card border-border hover:border-primary transition-all duration-300 group">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 font-sports text-2xl">
                  <Zap className="w-6 h-6 text-neon-blue animate-glow-pulse" />
                  <span>AI INSIGHTS</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aiInsights.map((insight, index) => (
                  <div key={index} className="bg-background/50 p-4 rounded-lg border border-border/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold font-sports">{insight.analysis}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-gold-accent" />
                        <span className="text-gold-accent font-bold">{insight.confidence}%</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.reason}</p>
                  </div>
                ))}
                <Button 
                  className="w-full bg-gradient-neon hover:shadow-glow font-sports text-accent-foreground"
                  onClick={() => navigate('/ai-coach')}
                >
                  CHAT WITH AI COACH
                </Button>
              </CardContent>
            </Card>

            {/* Strategy Builder Panel */}
            <Card className="bg-gradient-card border-border hover:border-primary transition-all duration-300 group cursor-pointer"
                  onClick={() => navigate('/analyze-strategies')}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 font-sports text-2xl">
                  <Target className="w-6 h-6 text-electric-purple animate-glow-pulse" />
                  <span>STRATEGY BUILDER</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-20 h-20 mx-auto bg-gradient-primary rounded-full flex items-center justify-center mb-4 shadow-neon">
                    <Target className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <h3 className="font-sports text-xl mb-2">ANALYZE STRATEGIES</h3>
                  <p className="text-muted-foreground mb-6">Build and test betting strategies with AI guidance</p>
                </div>
                <Button className="w-full bg-gradient-primary hover:shadow-neon font-sports">
                  START ANALYZING
                </Button>
              </CardContent>
            </Card>

            {/* Trending Now Panel */}
            <Card 
              className="bg-gradient-card border-border hover:border-primary transition-all duration-300 group cursor-pointer"
              onClick={() => navigate('/trending-now')}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 font-sports text-2xl">
                  <TrendingUp className="w-6 h-6 text-destructive animate-glow-pulse" />
                  <span>TRENDING NOW</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4 mb-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-neon rounded-full flex items-center justify-between mb-3 shadow-glow">
                    <TrendingUp className="w-8 h-8 text-accent-foreground mx-auto" />
                  </div>
                  <h3 className="font-sports text-lg mb-2">SOCIAL INTELLIGENCE</h3>
                  <p className="text-muted-foreground text-sm">Real-time trend analysis from X (Twitter)</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm">#MondayNightFootball</span>
                    <span className="text-neon-green text-sm font-bold">+2.3k</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm">#NBAPlayoffs</span>
                    <span className="text-neon-green text-sm font-bold">+1.8k</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm">#MarchMadness</span>
                    <span className="text-neon-green text-sm font-bold">+3.1k</span>
                  </div>
                </div>
                <Button className="w-full bg-gradient-primary hover:shadow-neon font-sports">
                  EXPLORE TRENDS
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Bottom Navigation/Shortcut Bar */}
      <footer className="sticky bottom-0 bg-gradient-card backdrop-blur-sm border-t border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-around items-center">
            {bottomMenuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => item.path && navigate(item.path)}
                className="flex flex-col items-center space-y-1 p-3 rounded-lg hover:bg-muted/50 transition-all duration-300 hover:shadow-glow group"
              >
                <item.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs font-sports text-muted-foreground group-hover:text-primary transition-colors">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;