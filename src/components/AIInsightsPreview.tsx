import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Bot, TrendingUp, Target } from 'lucide-react';
import { useAIInsights } from '@/hooks/useAIInsights';

const AIInsightsPreview = () => {
  const navigate = useNavigate();
  const { currentInsight } = useAIInsights();

  // Show real insights or live data ready state
  const insight = currentInsight || {
    recommendation: "Live Data Connected",
    confidence: null,
    reasoning: "AI analysis is connected to real-time odds data and ready to provide insights based on current market conditions.",
    expectedValue: "Ready"
  };

  return (
    <Card className="gaming-card mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg font-sports">
          <Bot className="w-5 h-5 text-neon-blue" />
          <span>AI Insights</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{insight.recommendation}</span>
          </div>
          {insight.confidence && (
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3 text-neon-green" />
              <span className="text-xs text-neon-green">{insight.confidence}%</span>
            </div>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground leading-relaxed">
          {insight.reasoning}
        </p>
        
        <div className="flex justify-between items-center pt-2">
          <span className="text-xs">
            Expected Value: <span className="text-neon-green font-mono">{insight.expectedValue}</span>
          </span>
          <Button 
            size="sm" 
            onClick={() => navigate('/ai-coach')}
            className="bg-gradient-primary hover:shadow-neon font-sports text-xs px-3"
          >
            View Full Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIInsightsPreview;