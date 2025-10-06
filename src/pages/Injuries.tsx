import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, TrendingUp, Clock, Radio, MessageSquare, RefreshCw, Scan } from "lucide-react";
import BackToHome from "@/components/BackToHome";
import { useNavigate } from "react-router-dom";
import { useInjuryIntelligence } from "@/hooks/useInjuryIntelligence";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Injuries = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { candidates, loading, scanning, error, refresh, scanInjuries } = useInjuryIntelligence();
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [rationale, setRationale] = useState<string>("");
  const [loadingRationale, setLoadingRationale] = useState(false);

  const handleExplain = async (candidate: any) => {
    setSelectedCandidate(candidate);
    setLoadingRationale(true);
    setRationale("");

    try {
      const { data, error } = await supabase.functions.invoke('ai-strategy-rationale', {
        body: {
          segment: 'injury_intelligence',
          picks: [{
            player: candidate.player,
            market: candidate.market,
            line: candidate.line,
            best_book: candidate.bookmaker,
            best_odds: candidate.odds,
            consensus_odds: candidate.consensus_prob_now * candidate.odds,
            book_count: 5,
            edge_prob: candidate.lag_prob,
            edge_bps: candidate.lag_prob * 10000,
            game_date: candidate.game_date,
          }],
          context: {
            status: candidate.status,
            consensus_change_60m: candidate.consensus_change_60m,
            lag_prob: candidate.lag_prob,
          }
        }
      });

      if (error) throw error;

      if (data && data.picks && data.picks.length > 0 && data.picks[0].rationale) {
        setRationale(data.picks[0].rationale);
      }
    } catch (err) {
      console.error('Error fetching rationale:', err);
      toast({
        title: "Failed to generate rationale",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoadingRationale(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Out': return "bg-destructive/20 text-destructive border-destructive/30";
      case 'Doubtful': return "bg-orange-500/20 text-orange-500 border-orange-500/30";
      case 'Questionable': return "bg-amber-400/20 text-amber-400 border-amber-400/30";
      default: return "bg-muted/20 text-muted-foreground border-muted/30";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BackToHome />
              <div>
                <h1 className="text-2xl font-bold">Injury Intelligence</h1>
                <p className="text-sm text-muted-foreground">Real-time injury reports & AI-powered betting opportunities</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => scanInjuries()}
                disabled={scanning}
                variant="outline"
                size="sm"
              >
                {scanning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Scan className="h-4 w-4 mr-2" />
                    Scan Injuries
                  </>
                )}
              </Button>
              <Button onClick={refresh} disabled={loading} variant="ghost" size="sm">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Badge variant="outline" className="flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse text-green-500" />
                Live
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-6 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">
              Find Props Where Injury News Hasn't Been Priced In
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI scans injury reports and identifies opportunities where the market lags behind fresh news
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Injury Candidates */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Injury-Related Opportunities</CardTitle>
                <CardDescription>
                  Props where fresh injury news hasn't been fully priced in yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : candidates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No injury opportunities found.</p>
                    <p className="text-sm mt-1">Click "Scan Injuries" to fetch latest injury news.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {candidates.map((candidate, idx) => {
                      const minutesSince = Math.round(
                        (Date.now() - new Date(candidate.published_at).getTime()) / 60000
                      );
                      return (
                        <div
                          key={idx}
                          className={`p-4 border rounded-lg transition-all ${
                            selectedCandidate === candidate ? "border-primary bg-primary/5" : "hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{candidate.player}</h3>
                                <Badge className={getStatusColor(candidate.status)}>
                                  {candidate.status}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium text-muted-foreground">
                                {candidate.market} {candidate.line} @ {candidate.bookmaker}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Odds: {candidate.odds.toFixed(2)}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant="secondary" className="text-xs">
                                Score: {candidate.pick_score.toFixed(1)}
                              </Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {minutesSince}m ago
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs mb-3">
                            <div className="flex items-center gap-1">
                              <TrendingUp className={`h-3 w-3 ${
                                candidate.consensus_change_60m > 0 ? 'text-green-500' : 'text-red-500'
                              }`} />
                              <span>Δ60m: {(candidate.consensus_change_60m * 100).toFixed(1)}%</span>
                            </div>
                            <div>
                              Lag: {(candidate.lag_prob * 100).toFixed(1)}%
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExplain(candidate)}
                            disabled={loadingRationale && selectedCandidate === candidate}
                          >
                            {loadingRationale && selectedCandidate === candidate ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Explain
                              </>
                            )}
                          </Button>

                          {selectedCandidate === candidate && rationale && (
                            <div className="mt-3 p-3 bg-muted rounded-lg text-sm">
                              {rationale}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quick Stats */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Opportunities</span>
                  <span className="font-semibold">{candidates.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Out/Doubtful</span>
                  <span className="font-semibold text-red-500">
                    {candidates.filter(c => ['Out', 'Doubtful'].includes(c.status)).length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Pick Score</span>
                  <Badge variant="secondary">
                    {candidates.length > 0
                      ? (candidates.reduce((sum, c) => sum + c.pick_score, 0) / candidates.length).toFixed(1)
                      : '0.0'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {selectedCandidate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Selected Pick
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">{selectedCandidate.player}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className={getStatusColor(selectedCandidate.status)}>
                          {selectedCandidate.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Market:</span>
                        <span className="font-medium">
                          {selectedCandidate.market} {selectedCandidate.line}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pick Score:</span>
                        <Badge variant="secondary">{selectedCandidate.pick_score.toFixed(1)}</Badge>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => navigate("/ai-coach")}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Discuss with AI Coach
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Injuries;
