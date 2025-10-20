import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const TriggerSportsDataIOIngest = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const triggerIngest = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sportsdataio-ingest', {
        body: {}
      });

      if (error) throw error;

      toast({
        title: "SportsDataIO Ingest Triggered",
        description: `Fetched teams, games, injuries, and depth charts. ${data?.totalInserted ?? 0} rows inserted.`,
      });
    } catch (err) {
      console.error('Error triggering SportsDataIO ingest:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to trigger ingest",
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
          <Activity className="h-5 w-5" />
          SportsDataIO Ingest
        </CardTitle>
        <CardDescription>
          Fetch teams, games, injuries, and depth charts from SportsDataIO
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={triggerIngest}
          disabled={loading}
          className="w-full"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Fetch SportsDataIO Data
        </Button>
        <p className="text-xs text-muted-foreground mt-3">
          This will fetch data for NFL and CFB: teams, games, injuries, and depth charts
        </p>
      </CardContent>
    </Card>
  );
};
