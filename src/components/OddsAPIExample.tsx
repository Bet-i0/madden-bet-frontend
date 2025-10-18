import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Zap, TrendingUp, Users } from "lucide-react";
import { useOddsAPIClient } from "@/hooks/useOddsAPIClient";
import type { Sport, Event, MarketKey } from "@/lib/oddsApi/types";

/**
 * Example component demonstrating The Odds API v4 integration
 * Shows featured vs non-featured market workflows
 */
export const OddsAPIExample = () => {
  const { loading, error, quota, getSports, getFeaturedOdds, getPlayerProps, discoverEventMarkets } = useOddsAPIClient();
  
  const [sports, setSports] = useState<Sport[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventMarkets, setEventMarkets] = useState<MarketKey[]>([]);

  const handleGetSports = async () => {
    const result = await getSports();
    if (result) setSports(result);
  };

  const handleGetFeaturedOdds = async () => {
    const result = await getFeaturedOdds('americanfootball_nfl', ['us'], ['h2h', 'spreads', 'totals']);
    if (result) setFeaturedEvents(result);
  };

  const handleDiscoverMarkets = async (eventId: string) => {
    const result = await discoverEventMarkets('americanfootball_nfl', eventId);
    if (result) setEventMarkets(result);
  };

  const handleGetPlayerProps = async (eventId: string) => {
    const result = await getPlayerProps('americanfootball_nfl', eventId);
    if (result) setSelectedEvent(result);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Odds API v4 - Live Demo
            </CardTitle>
            <CardDescription>
              Test featured markets, player props, and market discovery
            </CardDescription>
          </div>
          {quota && (
            <div className="text-right text-sm">
              <div className="text-muted-foreground">Quota</div>
              <div className="font-semibold">
                {quota.remaining.toLocaleString()} remaining
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <Tabs defaultValue="featured" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="featured">
              <TrendingUp className="h-4 w-4 mr-2" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="props">
              <Users className="h-4 w-4 mr-2" />
              Player Props
            </TabsTrigger>
            <TabsTrigger value="sports">Sports List</TabsTrigger>
          </TabsList>

          <TabsContent value="featured" className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={handleGetFeaturedOdds}
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Fetch NFL Featured Markets
              </Button>
              <Badge variant="outline">
                Cost: 1 × 3 markets = 3 requests
              </Badge>
            </div>

            {featuredEvents.length > 0 && (
              <ScrollArea className="h-[300px] rounded border p-3">
                <div className="space-y-3">
                  {featuredEvents.slice(0, 5).map(event => (
                    <div key={event.id} className="border-b pb-3">
                      <div className="font-semibold">
                        {event.away_team} @ {event.home_team}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.commence_time).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {event.bookmakers?.length || 0} bookmakers
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDiscoverMarkets(event.id)}
                        >
                          Discover Markets
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleGetPlayerProps(event.id)}
                        >
                          Get Player Props
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="props" className="space-y-4">
            {selectedEvent ? (
              <div>
                <h4 className="font-semibold mb-2">
                  {selectedEvent.away_team} @ {selectedEvent.home_team}
                </h4>
                <ScrollArea className="h-[300px] rounded border p-3">
                  <div className="space-y-2">
                    {selectedEvent.bookmakers?.map(bookmaker => (
                      <div key={bookmaker.key} className="border-b pb-2">
                        <Badge variant="secondary">{bookmaker.title}</Badge>
                        <div className="mt-2 space-y-1">
                          {bookmaker.markets.map(market => (
                            <div key={market.key} className="text-sm">
                              <span className="font-medium">{market.key}:</span>{' '}
                              {market.outcomes.length} outcomes
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Badge variant="outline" className="mt-2">
                  Cost: 10 × markets × regions
                </Badge>
              </div>
            ) : eventMarkets.length > 0 ? (
              <div>
                <h4 className="font-semibold mb-2">Available Markets</h4>
                <div className="flex flex-wrap gap-2">
                  {eventMarkets.map(market => (
                    <Badge key={market} variant="outline">
                      {market}
                    </Badge>
                  ))}
                </div>
                <Badge variant="outline" className="mt-2">
                  Discovery cost: 1 request
                </Badge>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Select an event from Featured tab to view player props
              </div>
            )}
          </TabsContent>

          <TabsContent value="sports" className="space-y-4">
            <Button onClick={handleGetSports} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Load Sports
            </Button>

            {sports.length > 0 && (
              <ScrollArea className="h-[300px] rounded border p-3">
                <div className="space-y-2">
                  {sports.filter(s => s.active).map(sport => (
                    <div key={sport.key} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{sport.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {sport.key} • {sport.group}
                        </div>
                      </div>
                      {sport.has_outrights && (
                        <Badge variant="secondary" className="text-xs">
                          Outrights
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-xs text-muted-foreground bg-muted/50 p-3 rounded">
          <strong>Tips:</strong> Featured markets (h2h, spreads, totals) are cheap to fetch.
          Player props and period markets are 10× more expensive but give detailed data.
          Always discover markets first to know what's available!
        </div>
      </CardContent>
    </Card>
  );
};
