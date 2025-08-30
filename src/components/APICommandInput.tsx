import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Power, PowerOff } from 'lucide-react';
import { useAPIToggle } from '@/contexts/APIToggleContext';
import { useUserRole } from '@/hooks/useUserRole';

export const APICommandInput = () => {
  const [command, setCommand] = useState('');
  const { isAPIEnabled, toggleAPI } = useAPIToggle();
  const { isAdmin, loading } = useUserRole();

  // Only show for admin users
  if (loading || !isAdmin) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      toggleAPI(command);
      setCommand('');
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          {isAPIEnabled ? (
            <Power className="w-4 h-4 text-green-500" />
          ) : (
            <PowerOff className="w-4 h-4 text-orange-500" />
          )}
          <span className="text-xs font-mono">
            API: {isAPIEnabled ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="J.A.R.V.I.S / F.R.I.D.A.Y."
            className="text-xs font-mono w-40"
          />
          <Button type="submit" size="sm" variant="outline">
            Execute
          </Button>
        </form>
      </div>
    </div>
  );
};