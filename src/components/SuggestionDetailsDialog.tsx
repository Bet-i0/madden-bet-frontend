import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Target, 
  TrendingUp, 
  Clock, 
  RefreshCw,
  Copy,
  CheckCircle2
} from "lucide-react";
import { SuggestionPick } from "@/hooks/useAIInsights";

interface SuggestionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryLabel: string;
  trendHashtag?: string;
  picks: SuggestionPick[];
  loading: boolean;
  onConfirm: (selected: SuggestionPick[]) => void;
  onRefresh?: () => void;
}

const SuggestionDetailsDialog = ({
  open,
  onOpenChange,
  categoryLabel,
  trendHashtag,
  picks,
  loading,
  onConfirm,
  onRefresh
}: SuggestionDetailsDialogProps) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset selection when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
    }
  }, [open]);

  const handlePickToggle = (pickId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(pickId)) {
      newSelected.delete(pickId);
    } else {
      newSelected.add(pickId);
    }
    setSelectedIds(newSelected);
  };

  const handleConfirm = () => {
    const selectedPicks = picks.filter(pick => selectedIds.has(pick.id));
    onConfirm(selectedPicks);
  };

  const handleCopyToClipboard = () => {
    const selectedPicks = picks.filter(pick => selectedIds.has(pick.id));
    const text = selectedPicks.map(pick => 
      `${pick.title} (${pick.odds}) - ${pick.confidence}% conf - ${pick.rationale}`
    ).join('\n');
    navigator.clipboard.writeText(text);
  };

  const getMarketColor = (market: string) => {
    switch (market) {
      case 'SPREAD': return 'bg-neon-blue/20 text-neon-blue';
      case 'TOTAL': return 'bg-neon-green/20 text-neon-green';
      case 'MONEYLINE': return 'bg-gold/20 text-gold';
      case 'PROP': return 'bg-purple-400/20 text-purple-400';
      case 'ALT_SPREAD': return 'bg-cyan-400/20 text-cyan-400';
      case 'LIVE': return 'bg-red-400/20 text-red-400';
      default: return 'bg-gray-400/20 text-gray-400';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] gaming-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-sports text-xl">
            <Target className="w-5 h-5 text-neon-blue" />
            {categoryLabel}
            {trendHashtag && (
              <Badge variant="outline" className="text-neon-green border-neon-green">
                {trendHashtag}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {loading ? 'Analyzing trend...' : `${picks.length} AI recommendations found`}
            </div>
            {onRefresh && !loading && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="hover:bg-primary/20"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Picks List */}
          <ScrollArea className="h-[400px] pr-4">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="gaming-card p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-4 w-4 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {picks.map((pick) => (
                  <div
                    key={pick.id}
                    className={`gaming-card p-4 cursor-pointer transition-all ${
                      selectedIds.has(pick.id) ? 'ring-2 ring-neon-green' : ''
                    }`}
                    onClick={() => handlePickToggle(pick.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedIds.has(pick.id)}
                        onCheckedChange={() => handlePickToggle(pick.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        {/* Primary Info */}
                        <div className="flex items-center justify-between">
                          <h4 className="font-sports text-lg text-primary">
                            {pick.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge className={getMarketColor(pick.market)}>
                              {pick.market}
                            </Badge>
                            <Badge className="bg-neon-green/20 text-neon-green">
                              {pick.confidence}%
                            </Badge>
                          </div>
                        </div>

                        {/* Odds & Book */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-neon-blue" />
                            <span className="font-bold text-neon-blue">{pick.odds}</span>
                          </div>
                          {pick.bookmaker && (
                            <div className="text-gray-400">
                              @ {pick.bookmaker}
                            </div>
                          )}
                          {pick.game && (
                            <div className="text-gray-400">
                              {pick.game}
                            </div>
                          )}
                        </div>

                        {/* Rationale */}
                        <p className="text-sm text-gray-300 italic">
                          {pick.rationale}
                        </p>

                        {/* Game Details */}
                        {(pick.league || pick.startTime) && (
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            {pick.league && (
                              <span>{pick.league}</span>
                            )}
                            {pick.startTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(pick.startTime).toLocaleString()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-primary/20">
            <div className="text-sm text-gray-400">
              {selectedIds.size} selected
            </div>
            <div className="flex gap-2">
              {selectedIds.size > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToClipboard}
                  className="hover:bg-primary/20"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
              )}
              <Button
                variant="hero"
                onClick={handleConfirm}
                disabled={selectedIds.size === 0}
                data-testid="dialog-confirm-to-builder"
                className="min-w-[160px]"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Add to Strategy Builder
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestionDetailsDialog;