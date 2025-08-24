import { useState, useRef, useEffect } from "react";
import { 
  Send,
  Bot,
  User,
  Zap,
  Target,
  TrendingUp,
  Activity,
  Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import SaveBetDialog from "@/components/SaveBetDialog";
import { useProfile } from "@/hooks/useProfile";
import BackToHome from "@/components/BackToHome";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  hasBetSuggestion?: boolean;
}

const AICoach = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Welcome to your AI Coach! I'm here to help you analyze games, build strategies, and understand betting insights. What would you like to discuss today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [saveBetOpen, setSaveBetOpen] = useState(false);
  const [currentBetSuggestion, setCurrentBetSuggestion] = useState(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { profile } = useProfile();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response = getAIResponse(inputValue);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'ai',
        timestamp: new Date(),
        hasBetSuggestion: response.hasBetSuggestion
      };
      
      if (response.hasBetSuggestion) {
        setCurrentBetSuggestion(response.betData);
      }
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (userInput: string): { text: string; hasBetSuggestion: boolean; betData?: any } => {
    const input = userInput.toLowerCase();
    
    if (input.includes('parlay') || input.includes('combination')) {
      return {
        text: "For parlay strategies, I recommend starting with 2-3 legs maximum. Focus on correlated bets like same-game parlays where outcomes influence each other.\n\n**Suggested Parlay:**\n• Chiefs -3.5 (-110)\n• Over 47.5 (-105)\n• Mahomes 2+ TD passes (-150)\n\n**Total Odds:** +285 | **Confidence:** 72%\n\nWould you like me to analyze the correlation between these picks?",
        hasBetSuggestion: true,
        betData: {
          bet_type: 'parlay',
          total_odds: 285,
          legs: [
            {
              sport: 'NFL',
              league: 'NFL', 
              team1: 'Chiefs',
              team2: 'Bills',
              bet_market: 'spread',
              bet_selection: 'Chiefs -3.5',
              odds: -110
            },
            {
              sport: 'NFL',
              league: 'NFL',
              team1: 'Chiefs', 
              team2: 'Bills',
              bet_market: 'total',
              bet_selection: 'Over 47.5',
              odds: -105
            },
            {
              sport: 'NFL',
              league: 'NFL',
              team1: 'Chiefs',
              team2: 'Bills', 
              bet_market: 'prop',
              bet_selection: 'Mahomes 2+ TD passes',
              odds: -150
            }
          ]
        }
      };
    }
    
    if (input.includes('chiefs') || input.includes('mahomes')) {
      return {
        text: "The Chiefs are showing strong offensive metrics this season. Mahomes has a 68% completion rate with 2.1 TD/INT ratio. Their red zone efficiency is at 71%.\n\n**My Pick:** Chiefs -3.5 (-110)\n**Confidence:** 78%\n\nConsider their performance against divisional opponents when analyzing spreads.",
        hasBetSuggestion: true,
        betData: {
          bet_type: 'single',
          total_odds: -110,
          legs: [
            {
              sport: 'NFL',
              league: 'NFL',
              team1: 'Chiefs',
              team2: 'Bills',
              bet_market: 'spread', 
              bet_selection: 'Chiefs -3.5',
              odds: -110
            }
          ]
        }
      };
    }
    
    if (input.includes('injury') || input.includes('report')) {
      return {
        text: "Injury reports can significantly impact lines. Key positions to monitor: QB (4-7 point swing), RB1 (1-3 points), WR1/CB1 (1-2 points). I track real-time injury updates and their historical impact on team performance.",
        hasBetSuggestion: false
      };
    }
    
    return {
      text: "That's an interesting question! Based on current data trends and team analytics, I'd recommend focusing on situational advantages like home/away splits, weather conditions, and recent team momentum. What specific matchup are you analyzing?",
      hasBetSuggestion: false
    };
  };

  const quickActions = [
    { icon: Target, label: "Analyze Game", action: "Help me analyze today's featured games" },
    { icon: TrendingUp, label: "Line Movement", action: "Show me significant line movements today" },
    { icon: Activity, label: "Injury Impact", action: "What injuries should I be aware of?" },
    { icon: Zap, label: "Hot Picks", action: "What are your highest confidence picks?" }
  ];

  const handleQuickAction = (action: string) => {
    setInputValue(action);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sports">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-primary/20">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <BackToHome
              variant="ghost"
              size="sm"
              className="hover:bg-primary/20 mr-2"
            />
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 border-2 border-primary">
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold uppercase tracking-wider">AI Coach</h1>
                <p className="text-sm text-muted-foreground">Online • Ready to analyze</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-primary">LIVE SESSION</div>
            <div className="text-xs text-muted-foreground">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex flex-col h-[calc(100vh-160px)] pb-20">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'ai' && (
                <Avatar className="h-8 w-8 border border-primary/50">
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              
              <Card className={`max-w-[80%] ${
                message.sender === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted border-primary/20'
              }`}>
                <CardContent className="p-3">
                  <p className="text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  {message.sender === 'ai' && message.hasBetSuggestion && profile?.auto_save_bets !== false && (
                    <Button
                      onClick={() => setSaveBetOpen(true)}
                      size="sm"
                      className="mt-3 bg-gradient-neon hover:shadow-glow font-sports text-accent-foreground"
                    >
                      <Bookmark className="w-3 h-3 mr-1" />
                      Save to Bet Tracker
                    </Button>
                  )}
                </CardContent>
              </Card>

              {message.sender === 'user' && (
                <Avatar className="h-8 w-8 border border-primary/50">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 border border-primary/50">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-muted border-primary/20">
                <CardContent className="p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-primary/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action.action)}
                className="flex items-center gap-2 text-xs hover:bg-primary/20 hover:border-primary"
              >
                <action.icon className="h-3 w-3" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-primary/20 bg-background/50">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me about strategies, analysis, or insights..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="pr-12 bg-muted/50 border-primary/20 focus:border-primary"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              variant="gaming"
              size="icon"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            AI Coach provides analysis and insights. Not financial advice.
          </div>
        </div>
      </div>

      {/* Save Bet Dialog */}
      <SaveBetDialog
        open={saveBetOpen}
        onOpenChange={setSaveBetOpen}
        initialBet={currentBetSuggestion}
      />
    </div>
  );
};

export default AICoach;