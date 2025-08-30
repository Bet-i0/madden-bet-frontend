import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Zap, Target, TrendingUp, Activity, Bookmark, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import SaveBetDialog from "@/components/SaveBetDialog";
import { useProfile } from "@/hooks/useProfile";
import { useOddsLastUpdated } from "@/hooks/useOddsLastUpdated";
import { supabase } from "@/integrations/supabase/client";
import BackToHome from "@/components/BackToHome";
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  hasBetSuggestion?: boolean;
}
const AICoach = () => {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    text: "Welcome to your AI Coach! I'm connected to live odds data and ready to help you analyze games, build strategies, and find betting opportunities. What would you like to explore today?",
    sender: 'ai',
    timestamp: new Date()
  }]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [saveBetOpen, setSaveBetOpen] = useState(false);
  const [currentBetSuggestion, setCurrentBetSuggestion] = useState(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const {
    profile
  } = useProfile();
  const {
    lastUpdated: oddsLastUpdated,
    loading: oddsLoading
  } = useOddsLastUpdated();
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
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
    const currentInput = inputValue;
    setInputValue("");
    setIsTyping(true);
    try {
      // Call the real AI chat function
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in to use AI chat');
      }
      const {
        data,
        error
      } = await supabase.functions.invoke('ai-chat', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        body: {
          messages: [{
            role: 'user',
            content: currentInput
          }],
          stream: false
        }
      });
      if (error) {
        console.error('AI Chat error:', error);
        throw new Error(error.message);
      }
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.message,
        sender: 'ai',
        timestamp: new Date(),
        hasBetSuggestion: false
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error calling AI:', error);

      // Fallback to local response on error
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Please try again in a moment. In the meantime, I can help you analyze odds and trends using the real-time data we have available.",
        sender: 'ai',
        timestamp: new Date(),
        hasBetSuggestion: false
      };
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
    }
  };
  const quickActions = [{
    icon: Target,
    label: "Analyze Game",
    action: "Help me analyze today's featured games with real odds data"
  }, {
    icon: TrendingUp,
    label: "Line Movement",
    action: "Show me significant line movements in today's real odds"
  }, {
    icon: Activity,
    label: "Live Opportunities",
    action: "What live betting opportunities do you see right now?"
  }, {
    icon: Zap,
    label: "Best Value",
    action: "What are the best value bets in current odds?"
  }];
  const handleQuickAction = (action: string) => {
    setInputValue(action);
  };
  return <div className="min-h-screen bg-background text-foreground font-sports">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-primary/20">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <BackToHome variant="ghost" size="sm" className="hover:bg-primary/20 mr-2" />
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
            {profile && <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>
                  Odds: {oddsLoading ? '—' : oddsLastUpdated ? oddsLastUpdated.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              }) : 'No odds yet'}
                </span>
              </div>}
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex flex-col h-[calc(100vh-160px)] pb-20">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(message => <div key={message.id} className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.sender === 'ai' && <Avatar className="h-8 w-8 border border-primary/50">
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>}
              
              <Card className={`max-w-[80%] ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border-primary/20'}`}>
                <CardContent className="p-3">
                  <p className="leading-relaxed whitespace-pre-line font-thin text-base">{message.text}</p>
                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                  </div>
                  {message.sender === 'ai' && message.hasBetSuggestion && profile?.auto_save_bets !== false && <Button onClick={() => setSaveBetOpen(true)} size="sm" className="mt-3 bg-gradient-neon hover:shadow-glow font-sports text-accent-foreground">
                      <Bookmark className="w-3 h-3 mr-1" />
                      Save to Bet Tracker
                    </Button>}
                </CardContent>
              </Card>

              {message.sender === 'user' && <Avatar className="h-8 w-8 border border-primary/50">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>}
            </div>)}
          
          {isTyping && <div className="flex gap-3 justify-start">
              <Avatar className="h-8 w-8 border border-primary/50">
                <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="bg-muted border-primary/20">
                <CardContent className="p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{
                  animationDelay: '0.1s'
                }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{
                  animationDelay: '0.2s'
                }} />
                  </div>
                </CardContent>
              </Card>
            </div>}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-primary/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {quickActions.map((action, index) => <Button key={index} variant="outline" size="sm" onClick={() => handleQuickAction(action.action)} className="flex items-center gap-2 text-xs hover:bg-primary/20 hover:border-primary">
                <action.icon className="h-3 w-3" />
                {action.label}
              </Button>)}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-primary/20 bg-background/50">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Ask me about strategies, analysis, or insights..." onKeyPress={e => e.key === 'Enter' && handleSendMessage()} className="pr-12 bg-muted/50 border-primary/20 focus:border-primary" />
            </div>
            <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isTyping} variant="gaming" size="icon" className="shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            AI Coach provides analysis and insights. Not financial advice.
          </div>
        </div>
      </div>

      {/* Save Bet Dialog */}
      <SaveBetDialog open={saveBetOpen} onOpenChange={setSaveBetOpen} initialBet={currentBetSuggestion} />
    </div>;
};
export default AICoach;