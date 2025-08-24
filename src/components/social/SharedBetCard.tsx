
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageSquare, Flame, TrendingDown, Share2 } from 'lucide-react';
import { SharedBet } from '@/hooks/useSharedBets';
import { useToast } from '@/hooks/use-toast';

interface SharedBetCardProps {
  sharedBet: SharedBet;
  onTail: (sharedBetId: string, stake: number) => Promise<void>;
}

const SharedBetCard = ({ sharedBet, onTail }: SharedBetCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showTailDialog, setShowTailDialog] = useState(false);
  const [tailStake, setTailStake] = useState(25);
  const { toast } = useToast();

  const handleTail = async () => {
    try {
      await onTail(sharedBet.id, tailStake);
      setShowTailDialog(false);
      toast({
        title: "Bet Tailed!",
        description: `Successfully tailed ${sharedBet.owner_profile?.display_name}'s bet for $${tailStake}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to tail bet. Please try again.",
        variant: "destructive"
      });
    }
  };

  const totalOdds = sharedBet.legs.reduce((acc, leg) => acc * (leg.odds || 1), 1);

  return (
    <Card className="bg-gradient-card border-border hover:border-primary transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={sharedBet.owner_profile?.avatar_url} />
              <AvatarFallback>
                {sharedBet.owner_profile?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">{sharedBet.owner_profile?.display_name}</div>
              <div className="text-sm text-muted-foreground">
                {new Date(sharedBet.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <Badge variant="secondary">
            {sharedBet.legs.length === 1 ? 'Single' : `${sharedBet.legs.length}-Leg Parlay`}
          </Badge>
        </div>
        {sharedBet.title && (
          <h3 className="font-bold text-lg">{sharedBet.title}</h3>
        )}
        {sharedBet.comment && (
          <p className="text-muted-foreground">{sharedBet.comment}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bet Legs */}
        <div className="space-y-2">
          {sharedBet.legs.map((leg, index) => (
            <div key={leg.id} className="bg-muted/30 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">{leg.team1} vs {leg.team2}</div>
                  <div className="text-sm text-muted-foreground">
                    {leg.league} • {leg.bet_market}: {leg.bet_selection}
                  </div>
                </div>
                {leg.odds && (
                  <Badge variant="outline" className="font-mono">
                    {leg.odds > 0 ? '+' : ''}{leg.odds}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Total Odds */}
        <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
          <span className="font-semibold">Total Odds:</span>
          <Badge className="bg-primary font-mono text-lg">
            {totalOdds > 0 ? '+' : ''}{totalOdds.toFixed(0)}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex space-x-4">
            <button className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors">
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current text-red-500' : ''}`} />
              <span>{sharedBet.reactions_count?.likes || 0}</span>
            </button>
            <button className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors">
              <MessageSquare className="w-5 h-5" />
              <span>0</span>
            </button>
            <button className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors">
              <Flame className="w-5 h-5" />
              <span>{sharedBet.reactions_count?.fires || 0}</span>
            </button>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTailDialog(true)}
            >
              <Share2 className="w-4 h-4 mr-1" />
              Tail ({sharedBet.reactions_count?.tails || 0})
            </Button>
          </div>
        </div>

        {/* Tail Dialog */}
        {showTailDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg border max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Tail This Bet</h3>
              <p className="text-muted-foreground mb-4">
                Enter your stake amount to tail {sharedBet.owner_profile?.display_name}'s bet.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Stake Amount ($)</label>
                  <input
                    type="number"
                    value={tailStake}
                    onChange={(e) => setTailStake(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg mt-1"
                    min="1"
                    step="1"
                  />
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Potential Payout: ${(tailStake * totalOdds).toFixed(2)}
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={handleTail} className="flex-1">
                    Tail Bet
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowTailDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SharedBetCard;
