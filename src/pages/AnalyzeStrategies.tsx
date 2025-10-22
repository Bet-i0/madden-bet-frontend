import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Strategy {
  name: string;
  winRate: number;
  roi: number;
  lastUsed: string;
}

const StrategyCard = ({ strategy }: { strategy: Strategy }) => (
  <div className="glass-card p-4">
    <div className="flex justify-between items-start">
      <h3 className="font-bold text-lg orbitron">{strategy.name}</h3>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon"><Edit className="w-4 h-4 text-muted-foreground" /></Button>
        <Button variant="ghost" size="icon"><Trash className="w-4 h-4 text-red-500" /></Button>
      </div>
    </div>
    <div className="flex gap-4 my-3">
      <Badge className="bg-primary/20 text-primary border-primary/30">Win Rate: {strategy.winRate}%</Badge>
      <Badge className="bg-electric-purple/20 text-electric-purple border-electric-purple/30">ROI: {strategy.roi}%</Badge>
    </div>
    <p className="text-xs text-muted-foreground">Last used: {strategy.lastUsed}</p>
  </div>
);

export default function AnalyzeStrategies() {
  const [strategies, setStrategies] = useState<Strategy[]>([
    { name: 'Underdog MLs', winRate: 45, roi: 25, lastUsed: '2 days ago' },
    { name: 'NBA First Quarter', winRate: 72, roi: 12, lastUsed: '1 day ago' },
  ]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newStrategyName, setNewStrategyName] = useState('');

  const handleCreateStrategy = () => {
    if (!newStrategyName.trim()) return;

    const newStrategy: Strategy = {
      name: newStrategyName,
      winRate: 0,
      roi: 0,
      lastUsed: 'Never',
    };
    setStrategies([newStrategy, ...strategies]);
    setIsFormOpen(false);
    setNewStrategyName('');
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-24 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="bebas-neue text-3xl">Strategy Builder</h1>
        <Button onClick={() => setIsFormOpen(true)} className="primary-gradient text-black font-bold">
          <Plus className="w-4 h-4 mr-2"/>
          New Strategy
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {strategies.map((strategy, i) => <StrategyCard key={i} strategy={strategy} />)}
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="bebas-neue text-2xl">Create New Strategy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="strategy-name">Strategy Name</Label>
              <Input 
                id="strategy-name"
                placeholder="e.g., Underdog MLs"
                value={newStrategyName}
                onChange={(e) => setNewStrategyName(e.target.value)}
                className="glass-card"
              />
            </div>
            <Button onClick={handleCreateStrategy} className="primary-gradient text-black w-full font-bold">
              Create Strategy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
