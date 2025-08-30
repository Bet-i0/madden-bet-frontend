import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface APIToggleContextType {
  isAPIEnabled: boolean;
  toggleAPI: (command: string) => void;
}

const APIToggleContext = createContext<APIToggleContextType | undefined>(undefined);

export const APIToggleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAPIEnabled, setIsAPIEnabled] = useState(true);
  const { toast } = useToast();

  const toggleAPI = (command: string) => {
    const normalizedCommand = command.toLowerCase().trim();
    
    if (normalizedCommand === 'j.a.r.v.i.s') {
      setIsAPIEnabled(true);
      toast({
        title: "J.A.R.V.I.S Online",
        description: "All API systems activated",
        className: "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300"
      });
    } else if (normalizedCommand === 'f.r.i.d.a.y.') {
      setIsAPIEnabled(false);
      toast({
        title: "F.R.I.D.A.Y. Protocol",
        description: "All API systems paused",
        className: "bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-300"
      });
    }
  };

  // Listen for global commands
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Allow commands via chat or direct typing
      if (event.ctrlKey && event.key === '/') {
        const command = prompt('Enter command (J.A.R.V.I.S or F.R.I.D.A.Y.):');
        if (command) {
          toggleAPI(command);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <APIToggleContext.Provider value={{ isAPIEnabled, toggleAPI }}>
      {children}
    </APIToggleContext.Provider>
  );
};

export const useAPIToggle = () => {
  const context = useContext(APIToggleContext);
  if (context === undefined) {
    throw new Error('useAPIToggle must be used within an APIToggleProvider');
  }
  return context;
};