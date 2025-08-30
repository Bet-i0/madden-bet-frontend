import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw } from 'lucide-react';

const TriggerStrategyGeneration = () => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const triggerGeneration = async () => {
    try {
      setIsGenerating(true);
      setMessage('Generating strategy content...');
      
      const { data, error } = await supabase.functions.invoke('strategy-content-generator');
      
      if (error) {
        throw error;
      }
      
      setMessage('Strategy content generated successfully! Page will refresh in 3 seconds...');
      
      // Refresh page after 3 seconds
      setTimeout(() => {
        window.location.reload();
      }, 3000);
      
    } catch (error) {
      console.error('Error generating strategy content:', error);
      setMessage('Error generating content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg max-w-sm">
        <Button
          onClick={triggerGeneration}
          disabled={isGenerating}
          className="w-full mb-2"
          variant="gaming"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Strategy Content Now'
          )}
        </Button>
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </div>
    </div>
  );
};

// Auto-trigger on mount
const AutoTrigger = () => {
  useEffect(() => {
    const triggerGeneration = async () => {
      try {
        console.log('Auto-triggering strategy content generation...');
        const { data, error } = await supabase.functions.invoke('strategy-content-generator');
        
        if (error) {
          console.error('Error generating strategy content:', error);
        } else {
          console.log('Strategy content generated successfully:', data);
          // Refresh page after 5 seconds to show new content
          setTimeout(() => {
            window.location.reload();
          }, 5000);
        }
      } catch (error) {
        console.error('Error in auto-trigger:', error);
      }
    };

    triggerGeneration();
  }, []);

  return null;
};

export { TriggerStrategyGeneration, AutoTrigger };