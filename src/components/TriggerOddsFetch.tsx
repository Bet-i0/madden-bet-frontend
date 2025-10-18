import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const TriggerOddsFetch = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const triggerFetch = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('fetch-odds', {
        body: {}
      });

      if (error) throw error;

      toast({
        title: "Odds Fetch Triggered",
        description: "Game odds are being fetched and will appear shortly.",
      });
    } catch (err) {
      console.error('Error triggering odds fetch:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to fetch odds",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Manual Odds Refresh
        </CardTitle>
        <CardDescription>
          Fetch the latest game odds from the API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={triggerFetch}
          disabled={loading}
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Fetch Game Odds Now
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          This will fetch odds for NFL and NCAAF games in the next 24 hours
        </p>
      </CardContent>
    </Card>
  );
};