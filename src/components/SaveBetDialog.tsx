import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useBets, type Bet, type BetLeg } from '@/hooks/useBets';
import { useProfile } from '@/hooks/useProfile';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, X } from 'lucide-react';

interface SaveBetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialBet?: Partial<Bet>;
}

const SaveBetDialog = ({ open, onOpenChange, initialBet }: SaveBetDialogProps) => {
  const [bet, setBet] = useState<Partial<Bet>>({
    bet_type: 'single',
    stake: 0,
    status: 'pending',
    ai_suggested: true,
    legs: [],
    ...initialBet
  });
  const [loading, setLoading] = useState(false);
  
  const { saveBet } = useBets();
  const { profile } = useProfile();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!bet.legs || bet.legs.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one bet selection.",
        variant: "destructive"
      });
      return;
    }

    if (!bet.stake || bet.stake <= 0) {
      toast({
        title: "Error", 
        description: "Please enter a valid stake amount.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await saveBet(bet as Omit<Bet, 'id'>);
      toast({
        title: "Bet saved!",
        description: "Your bet has been added to your tracker."
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error saving bet",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addLeg = () => {
    setBet(prev => ({
      ...prev,
      legs: [
        ...(prev.legs || []),
        {
          sport: '',
          league: '',
          team1: '',
          team2: '',
          bet_market: '',
          bet_selection: '',
          odds: 0
        }
      ]
    }));
  };

  const updateLeg = (index: number, updates: Partial<BetLeg>) => {
    setBet(prev => ({
      ...prev,
      legs: prev.legs?.map((leg, i) => i === index ? { ...leg, ...updates } : leg) || []
    }));
  };

  const removeLeg = (index: number) => {
    setBet(prev => ({
      ...prev,
      legs: prev.legs?.filter((_, i) => i !== index) || []
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-card border-border">
        <DialogHeader>
          <DialogTitle className="font-sports text-xl">Save Bet to Tracker</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Bet Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bet Type</Label>
              <Select value={bet.bet_type} onValueChange={(value) => setBet(prev => ({ ...prev, bet_type: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="parlay">Parlay</SelectItem>
                  <SelectItem value="teaser">Teaser</SelectItem>
                  <SelectItem value="round_robin">Round Robin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Stake ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={bet.stake || ''}
                onChange={(e) => setBet(prev => ({ ...prev, stake: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sportsbook</Label>
              <Select value={bet.sportsbook || profile?.default_sportsbook} onValueChange={(value) => setBet(prev => ({ ...prev, sportsbook: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sportsbook" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draftkings">DraftKings</SelectItem>
                  <SelectItem value="fanduel">FanDuel</SelectItem>
                  <SelectItem value="betmgm">BetMGM</SelectItem>
                  <SelectItem value="caesars">Caesars</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Total Odds</Label>
              <Input
                type="number"
                step="0.01"
                value={bet.total_odds || ''}
                onChange={(e) => setBet(prev => ({ ...prev, total_odds: parseFloat(e.target.value) || 0 }))}
                placeholder="e.g., -110"
              />
            </div>
          </div>

          <Separator />

          {/* Bet Legs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sports text-lg">Bet Selections</h3>
              <Button onClick={addLeg} variant="outline" size="sm">
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Selection
              </Button>
            </div>

            {bet.legs?.map((leg, index) => (
              <div key={index} className="p-4 border border-border rounded-lg space-y-3 bg-background/50">
                <div className="flex items-center justify-between">
                  <span className="font-sports text-sm text-muted-foreground">Selection {index + 1}</span>
                  <Button onClick={() => removeLeg(index)} variant="ghost" size="sm">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Sport</Label>
                    <Input
                      value={leg.sport}
                      onChange={(e) => updateLeg(index, { sport: e.target.value })}
                      placeholder="e.g., NFL"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>League</Label>
                    <Input
                      value={leg.league}
                      onChange={(e) => updateLeg(index, { league: e.target.value })}
                      placeholder="e.g., NFL"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Team 1</Label>
                    <Input
                      value={leg.team1}
                      onChange={(e) => updateLeg(index, { team1: e.target.value })}
                      placeholder="e.g., Chiefs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Team 2</Label>
                    <Input
                      value={leg.team2}
                      onChange={(e) => updateLeg(index, { team2: e.target.value })}
                      placeholder="e.g., Bills"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Market</Label>
                    <Select value={leg.bet_market} onValueChange={(value) => updateLeg(index, { bet_market: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Market" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spread">Spread</SelectItem>
                        <SelectItem value="moneyline">Moneyline</SelectItem>
                        <SelectItem value="total">Total (O/U)</SelectItem>
                        <SelectItem value="prop">Player Prop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Selection</Label>
                    <Input
                      value={leg.bet_selection}
                      onChange={(e) => updateLeg(index, { bet_selection: e.target.value })}
                      placeholder="e.g., Chiefs -3.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Odds</Label>
                    <Input
                      type="number"
                      value={leg.odds || ''}
                      onChange={(e) => updateLeg(index, { odds: parseFloat(e.target.value) || 0 })}
                      placeholder="-110"
                    />
                  </div>
                </div>
              </div>
            ))}

            {(!bet.legs || bet.legs.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No selections added yet</p>
                <Button onClick={addLeg} variant="outline" className="mt-2">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Your First Selection
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={bet.notes || ''}
              onChange={(e) => setBet(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any notes about this bet..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-gradient-primary">
              {loading ? 'Saving...' : 'Save Bet'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveBetDialog;