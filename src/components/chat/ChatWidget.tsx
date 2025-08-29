import React, { useState } from 'react';
import { Bot, Send, X, RotateCcw, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAIChat } from '@/hooks/useAIChat';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { messages, loading, usage, sendMessage, clearChat, stopGeneration } = useAIChat();
  const { user } = useAuth();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    await sendMessage(message);
    setMessage('');
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) return null;

  const usagePercentage = usage.maxCalls > 0 ? (usage.monthlyUsage / usage.maxCalls) * 100 : 0;

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 relative"
          size="icon"
        >
          <Bot className="h-6 w-6" />
          {usage.monthlyUsage >= usage.maxCalls && (
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500" />
          )}
        </Button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-80 h-[400px] flex flex-col shadow-xl bg-background/95 backdrop-blur">
          {/* Header */}
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="font-sports">SPORTSBOT AI</span>
                <Badge variant="secondary" className="text-xs">
                  {usage.monthlyUsage}/{usage.maxCalls}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={clearChat}
                  title="Clear chat"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
            {usage.maxCalls > 0 && (
              <div className="space-y-1">
                <Progress value={usagePercentage} className="h-1" />
                <div className="text-xs text-muted-foreground">
                  Monthly usage: {usage.monthlyUsage}/{usage.maxCalls} calls
                </div>
              </div>
            )}
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex flex-col flex-1 p-3 pt-0">
            <ScrollArea className="flex-1 pr-3">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={cn(
                          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                    <div className={`flex text-xs text-muted-foreground ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}>
                      {msg.role === 'user' ? 'You' : 'SportsBot'} • {formatTime(msg.timestamp)}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="animate-pulse">SportsBot is typing...</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={stopGeneration}
                        >
                          <Square className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="mt-3">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    usage.monthlyUsage >= usage.maxCalls 
                      ? "Usage limit reached..." 
                      : "Ask SportsBot anything..."
                  }
                  className="flex-1 text-sm"
                  disabled={loading || usage.monthlyUsage >= usage.maxCalls}
                  maxLength={500}
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={loading || usage.monthlyUsage >= usage.maxCalls || !message.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
};