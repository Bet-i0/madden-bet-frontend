import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Pause, Play, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const DataFetchingControl = () => {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('enabled')
        .eq('key', 'data_fetching_enabled')
        .single();

      if (error) throw error;
      setEnabled(data?.enabled ?? true);
    } catch (err) {
      console.error('Error fetching data fetching status:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDataFetching = async (newState: boolean) => {
    try {
      setLoading(true);
      
      // Note: This will only work if you have admin permissions
      // In production, you'd want to create a special RPC function for this
      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled: newState })
        .eq('key', 'data_fetching_enabled');

      if (error) {
        // If direct update fails, user doesn't have permission
        toast({
          title: "Permission Required",
          description: "You need admin access to control data fetching. Please update the feature flag directly in Supabase.",
          variant: "destructive",
        });
        return;
      }

      setEnabled(newState);
      toast({
        title: newState ? "Data Fetching Enabled" : "Data Fetching Paused",
        description: newState 
          ? "Cron jobs will resume fetching odds data every 10 minutes."
          : "Cron jobs will skip data fetching to save on API costs.",
      });
    } catch (err) {
      console.error('Error toggling data fetching:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update setting",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              API Cost Control
            </CardTitle>
            <CardDescription>
              Pause data fetching cron jobs to save on API costs
            </CardDescription>
          </div>
          <Badge variant={enabled ? "default" : "secondary"} className="text-sm">
            {enabled ? (
              <>
                <Play className="h-3 w-3 mr-1" />
                Active
              </>
            ) : (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Paused
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="space-y-1">
            <p className="font-medium">Data Fetching</p>
            <p className="text-sm text-muted-foreground">
              {enabled 
                ? "Odds & props fetch every 10 minutes" 
                : "All data fetching is paused"}
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={toggleDataFetching}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Affected Services:</span>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
              <span>fetch-prop-odds</span>
              <Badge variant="outline" className="text-xs">Every 10min</Badge>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
              <span>fetch-odds</span>
              <Badge variant="outline" className="text-xs">Manual/Cron</Badge>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            disabled={loading}
            className="w-full"
          >
            <RefreshCw className={`h-3 w-3 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            <strong>Note:</strong> Pausing data fetching will stop all automated odds updates. 
            Existing data remains accessible, but won't be refreshed until you re-enable.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
