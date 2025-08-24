import { useState } from 'react';
import { MessageCircle, Send, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const { messages, loading, onlineUsers, sendMessage } = useChat();
  const { user } = useAuth();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    await sendMessage(message);
    setMessage('');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          {onlineUsers.length > 1 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-background text-foreground border">
              {onlineUsers.length}
            </Badge>
          )}
        </Button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-80 h-96 flex flex-col shadow-xl bg-background/95 backdrop-blur">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h3 className="font-sports text-sm">GLOBAL CHAT</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {onlineUsers.length}
              </div>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="icon"
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-pulse text-muted-foreground text-sm">Loading messages...</div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col gap-1",
                      msg.user_id === user.id ? "items-end" : "items-start"
                    )}
                  >
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {msg.user_id !== user.id && (
                        <span className="font-medium">{msg.display_name}</span>
                      )}
                      <span>{formatTime(msg.created_at)}</span>
                    </div>
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 max-w-[70%] break-words text-sm",
                        msg.user_id === user.id
                          ? "bg-primary text-primary-foreground ml-auto"
                          : "bg-muted"
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 text-sm"
                maxLength={500}
              />
              <Button type="submit" size="icon" disabled={!message.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
};