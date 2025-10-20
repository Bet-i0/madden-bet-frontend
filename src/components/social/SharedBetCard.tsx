
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart, MessageSquare, Flame, TrendingDown, Share2, Send, User } from 'lucide-react';
import { SharedBet } from '@/hooks/useSharedBets';
import { useToast } from '@/hooks/use-toast';
import { useReactions } from '@/hooks/useReactions';
import { useComments } from '@/hooks/useComments';
import ProfileModal from './ProfileModal';

interface SharedBetCardProps {
  sharedBet: SharedBet;
  onTail: (sharedBetId: string, stake: number) => Promise<void>;
  onProfileClick?: (userId: string) => void;
}

const SharedBetCard = ({ sharedBet, onTail, onProfileClick }: SharedBetCardProps) => {
  const [showTailDialog, setShowTailDialog] = useState(false);
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [tailStake, setTailStake] = useState(25);
  const [commentText, setCommentText] = useState('');
  const { toast } = useToast();
  const { 
    reactions, 
    fetchReactions, 
    addReaction, 
    getUserReaction, 
    getReactionCount 
  } = useReactions();
  const {
    comments,
    fetchComments,
    addComment,
    getCommentCount
  } = useComments();

  useEffect(() => {
    fetchReactions(sharedBet.id);
    fetchComments(sharedBet.id);
  }, [sharedBet.id]);

  const handleTail = async () => {
    try {
      await onTail(sharedBet.id, tailStake);
      await addReaction(sharedBet.id, '💯');
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

  const handleReaction = async (type: '👍' | '🔥') => {
    try {
      await addReaction(sharedBet.id, type);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive"
      });
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      await addComment(sharedBet.id, commentText);
      setCommentText('');
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      });
    }
  };

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick(sharedBet.owner_user_id);
    } else {
      setShowProfileModal(true);
    }
  };

  const totalOdds = sharedBet.legs.reduce((acc, leg) => acc * (leg.odds || 1), 1);

  return (
    <Card className="bg-gradient-card border-border hover:border-primary transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar 
              className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all" 
              onClick={handleProfileClick}
            >
              <AvatarImage src={sharedBet.owner_profile?.avatar_url} />
              <AvatarFallback>
                {sharedBet.owner_profile?.display_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div 
                className="font-semibold cursor-pointer hover:text-primary transition-colors" 
                onClick={handleProfileClick}
              >
                {sharedBet.owner_profile?.display_name}
              </div>
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
            <button 
              className="flex items-center space-x-1 text-muted-foreground hover:text-red-500 transition-colors"
              onClick={() => handleReaction('👍')}
            >
              <Heart className={`w-5 h-5 ${getUserReaction(sharedBet.id, '👍') ? 'fill-current text-red-500' : ''}`} />
              <span>{getReactionCount(sharedBet.id, '👍')}</span>
            </button>
            <button 
              className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setShowCommentsDialog(true)}
            >
              <MessageSquare className="w-5 h-5" />
              <span>{getCommentCount(sharedBet.id)}</span>
            </button>
            <button 
              className="flex items-center space-x-1 text-muted-foreground hover:text-orange-500 transition-colors"
              onClick={() => handleReaction('🔥')}
            >
              <Flame className={`w-5 h-5 ${getUserReaction(sharedBet.id, '🔥') ? 'fill-current text-orange-500' : ''}`} />
              <span>{getReactionCount(sharedBet.id, '🔥')}</span>
            </button>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTailDialog(true)}
            >
              <Share2 className="w-4 h-4 mr-1" />
              Tail ({getReactionCount(sharedBet.id, '💯')})
            </Button>
          </div>
        </div>

        {/* Tail Dialog */}
        <Dialog open={showTailDialog} onOpenChange={setShowTailDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tail This Bet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Enter your stake amount to tail {sharedBet.owner_profile?.display_name}'s bet.
              </p>
              
              <div>
                <label className="text-sm font-medium">Stake Amount ($)</label>
                <Input
                  type="number"
                  value={tailStake}
                  onChange={(e) => setTailStake(Number(e.target.value))}
                  min="1"
                  step="1"
                  className="mt-1"
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
          </DialogContent>
        </Dialog>

        {/* Comments Dialog */}
        <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Comments</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <ScrollArea className="h-60 pr-4">
                {comments.filter(c => c.shared_bet_id === sharedBet.id).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comments
                      .filter(c => c.shared_bet_id === sharedBet.id)
                      .map((comment) => (
                      <div key={comment.id} className="flex space-x-2">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={comment.user_profile?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {comment.user_profile?.display_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="bg-muted p-2 rounded-lg">
                            <div className="font-medium text-sm">{comment.user_profile?.display_name}</div>
                            <div className="text-sm">{comment.content}</div>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(comment.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <Button onClick={handleAddComment} size="sm">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Profile Modal */}
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userId={sharedBet.owner_user_id}
        />
      </CardContent>
    </Card>
  );
};

export default SharedBetCard;
