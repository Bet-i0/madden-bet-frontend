import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bot, Send, Target, TrendingUp, Activity, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { useAIChat } from '@/hooks/useAIChat';
import { useProfile } from '@/hooks/useProfile';
import { useOddsLastUpdated } from '@/hooks/useOddsLastUpdated';
import SaveBetDialog from '@/components/SaveBetDialog';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const ChatMessage = ({ msg }: { msg: Message }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`flex items-end gap-3 my-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}
  >
    {msg.sender === 'ai' && (
      <div className="w-8 h-8 primary-gradient rounded-full flex items-center justify-center flex-shrink-0">
        <Bot className="w-5 h-5 text-black" />
      </div>
    )}
    <div
      className={`max-w-xs md:max-w-md p-3 rounded-lg ${
        msg.sender === 'user'
          ? 'primary-gradient text-black'
          : 'glass-card'
      }`}
    >
      <p>{msg.text}</p>
    </div>
  </motion.div>
);

export default function AICoach() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: 'Welcome to the AI Coach! How can I help you find your edge today?' },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveBetData, setSaveBetData] = useState<any>(null);

  const { profile } = useProfile();
  const { lastUpdated } = useOddsLastUpdated();
  const { sendMessage } = useAIChat();

  const quickActions = [
    { text: 'Analyze Game', icon: Target },
    { text: 'Line Movement', icon: TrendingUp },
    { text: 'Live Opportunities', icon: Activity },
    { text: 'Best Value', icon: Zap },
  ];

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      await sendMessage(userMessage);
      setMessages(prev => [...prev, { sender: 'ai', text: 'I received your message and am analyzing it.' }]);
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-24 flex flex-col h-[calc(100vh-160px)]">
      {/* Sticky Header */}
      <div className="glass-card flex-shrink-0 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="w-10 h-10 primary-gradient rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="font-bold orbitron">AI Coach</h2>
              <div className="flex items-center gap-1 text-xs text-primary">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span>Online</span>
              </div>
            </div>
          </div>
          <span className="text-xs text-muted-foreground">Just now</span>
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-grow overflow-y-auto pr-2">
        {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-end gap-3 my-4"
          >
            <div className="w-8 h-8 primary-gradient rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-black" />
            </div>
            <div className="glass-card p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Thinking...</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {quickActions.map(action => (
            <Button 
              key={action.text} 
              variant="outline" 
              className="glass-card justify-start"
              onClick={() => handleQuickAction(action.text)}
            >
              <action.icon className="w-4 h-4 mr-2 text-primary"/>
              {action.text}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input 
            placeholder="Ask the AI Coach..." 
            className="glass-card"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button 
            className="primary-gradient text-black"
            onClick={handleSendMessage}
            disabled={isLoading}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI Coach provides insights, not financial advice. Always bet responsibly.
        </p>
      </div>

      {saveBetData && (
        <SaveBetDialog 
          open={true}
          onOpenChange={(open) => !open && setSaveBetData(null)}
          betData={saveBetData}
        />
      )}
    </div>
  );
}
