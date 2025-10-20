import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatOdds } from '@/lib/oddsCalculations';

interface OddsChange {
  legIndex: number;
  market: string;
  selection: string;
  oldOdds: number;
  newOdds: number;
  bpsDiff: number;
}

interface OddsChangeBannerProps {
  changes: OddsChange[];
  onAccept: () => void;
  onCancel: () => void;
}

export function OddsChangeBanner({ changes, onAccept, onCancel }: OddsChangeBannerProps) {
  if (changes.length === 0) return null;

  const totalBpsDiff = changes.reduce((sum, change) => sum + Math.abs(change.bpsDiff), 0);
  const avgBpsDiff = totalBpsDiff / changes.length;

  return (
    <Alert variant={avgBpsDiff > 100 ? 'destructive' : 'default'} className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        Odds Have Changed
        <span className="text-sm font-normal text-muted-foreground">
          ({changes.length} leg{changes.length > 1 ? 's' : ''})
        </span>
      </AlertTitle>
      <AlertDescription>
        <div className="space-y-3 mt-3">
          {changes.map((change, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 bg-background rounded-md border"
            >
              <div className="flex-1">
                <div className="font-medium text-sm">
                  Leg {change.legIndex + 1}: {change.market}
                </div>
                <div className="text-xs text-muted-foreground">{change.selection}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm line-through text-muted-foreground">
                    {formatOdds(change.oldOdds)}
                  </div>
                  <div className="text-sm font-medium flex items-center gap-1">
                    {change.bpsDiff > 0 ? (
                      <TrendingUp className="h-3 w-3 text-success" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    )}
                    {formatOdds(change.newOdds)}
                  </div>
                </div>
                <div
                  className={`text-xs font-mono px-2 py-1 rounded ${
                    change.bpsDiff > 0
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  {change.bpsDiff > 0 ? '+' : ''}
                  {change.bpsDiff} bps
                </div>
              </div>
            </div>
          ))}

          <div className="flex gap-2 mt-4">
            <Button onClick={onAccept} className="flex-1" size="sm">
              Accept New Odds & Continue
            </Button>
            <Button onClick={onCancel} variant="outline" size="sm">
              Cancel
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Odds can change rapidly. Review the new odds before confirming your bet.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
