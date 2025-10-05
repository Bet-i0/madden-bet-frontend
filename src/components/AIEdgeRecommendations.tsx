import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, TrendingUp, AlertCircle } from "lucide-react";
import { useAIEdges } from "@/hooks/useAIEdges";
import { Progress } from "@/components/ui/progress";

export const AIEdgeRecommendations = () => {
  const { picks, loading, error, refresh } = useAIEdges();

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            AI Edge Recommendations
          </CardTitle>
          <CardDescription>Analyzing betting markets...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2 w-1/2" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            Unable to Load AI Edges
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!picks || picks.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            AI Edge Recommendations
          </CardTitle>
          <CardDescription>No edges detected in current markets</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              AI Edge Recommendations
            </CardTitle>
            <CardDescription>
              {picks.length} high-confidence betting edges detected
            </CardDescription>
          </div>
          <Button onClick={refresh} variant="ghost" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {picks.map((pick, idx) => (
          <div
            key={`${pick.gameId}-${idx}`}
            className="p-4 rounded-lg border border-border/50 bg-background/50 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="font-semibold text-sm">
                  {pick.away} @ {pick.home}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {pick.league}
                </Badge>
              </div>
              <Badge 
                variant={pick.confidence >= 85 ? "default" : "secondary"}
                className="font-mono"
              >
                {pick.confidence}%
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {pick.market} • {pick.side}
                </span>
                <span className="font-semibold">
                  {pick.book} @ {pick.odds > 0 ? '+' : ''}{pick.odds}
                </span>
              </div>
              
              <Progress value={pick.confidence} className="h-1.5" />
              
              <p className="text-xs text-muted-foreground italic">
                {pick.reason}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};