import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronDown, ChevronUp, RefreshCw, Info, 
  AlertCircle, CheckCircle, Database 
} from "lucide-react";
import { REGIONS, BOOKMAKERS, MARKETS } from "@/lib/oddsApi";
import { useOddsLastUpdated } from "@/hooks/useOddsLastUpdated";

/**
 * Admin diagnostics panel for The Odds API v4
 * Shows quota, canonical data, and integration status
 */
export const OddsAPIDebugPanel = () => {
  const [expanded, setExpanded] = useState(false);
  const { lastUpdated, loading } = useOddsLastUpdated();

  const featuredMarkets = MARKETS.filter(m => m.category === 'featured');
  const playerPropMarkets = MARKETS.filter(m => m.category === 'player_props');
  const periodMarkets = MARKETS.filter(m => m.category === 'game_period');

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Odds API Diagnostics</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        <CardDescription>
          The Odds API v4 integration status and canonical data
        </CardDescription>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Integration Status */}
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Integration Status
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">API Version:</span>
                <Badge variant="outline" className="ml-2">v4</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="ml-2">
                  {loading ? 'Loading...' : lastUpdated ? lastUpdated.toLocaleString() : 'Never'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Regions:</span>
                <Badge variant="outline" className="ml-2">{REGIONS.length}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Bookmakers:</span>
                <Badge variant="outline" className="ml-2">{BOOKMAKERS.length}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Markets:</span>
                <Badge variant="outline" className="ml-2">{MARKETS.length}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Featured Markets:</span>
                <Badge variant="outline" className="ml-2">{featuredMarkets.length}</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Regions */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Regions</h4>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map(region => (
                <Badge key={region.key} variant="secondary">
                  {region.key}: {region.description}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Market Categories */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Market Categories</h4>
            <ScrollArea className="h-[200px] w-full rounded border p-3">
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Featured ({featuredMarkets.length})
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {featuredMarkets.map(m => (
                      <Badge key={m.market_key} variant="default" className="text-xs">
                        {m.market_key}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Player Props ({playerPropMarkets.length})
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {playerPropMarkets.slice(0, 10).map(m => (
                      <Badge key={m.market_key} variant="outline" className="text-xs">
                        {m.market_key}
                      </Badge>
                    ))}
                    {playerPropMarkets.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{playerPropMarkets.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Period Markets ({periodMarkets.length})
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {periodMarkets.slice(0, 10).map(m => (
                      <Badge key={m.market_key} variant="outline" className="text-xs">
                        {m.market_key}
                      </Badge>
                    ))}
                    {periodMarkets.length > 10 && (
                      <Badge variant="outline" className="text-xs">
                        +{periodMarkets.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* US Bookmakers Sample */}
          <div>
            <h4 className="text-sm font-semibold mb-2">US Bookmakers (Sample)</h4>
            <div className="flex flex-wrap gap-2">
              {BOOKMAKERS.filter(b => b.region_key === 'us').slice(0, 8).map(b => (
                <Badge 
                  key={b.bookmaker_key} 
                  variant="secondary"
                  className="text-xs"
                >
                  {b.bookmaker_name}
                  {b.notes && <Info className="ml-1 h-3 w-3" />}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Important Notes */}
          <div className="bg-muted/50 rounded p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Featured markets</strong> (h2h, spreads, totals, outrights) use /odds endpoint</p>
                <p><strong>Player props & period markets</strong> use /event-odds endpoint</p>
                <p><strong>Cost:</strong> Featured = regions × markets; Event = 10 × markets × regions</p>
                <p><strong>Rate limit:</strong> ~30 requests/second with automatic backoff</p>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
