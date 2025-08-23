import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeState, applyTeamTheme, resetToDefaultTheme, findTeamTheme } from '@/lib/teamThemes';

interface ThemeContextType {
  themeState: ThemeState;
  updateSport: (sport: string) => void;
  updateTeam: (team: string) => void;
  toggleThemeEnabled: (enabled: boolean) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEME_STORAGE_KEY = 'betio-team-theme';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeState, setThemeState] = useState<ThemeState>({
    sport: '',
    team: '',
    enabled: false
  });

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme) as ThemeState;
        setThemeState(parsed);
        
        // Apply the saved theme if enabled
        if (parsed.enabled && parsed.sport && parsed.team) {
          const teamTheme = findTeamTheme(parsed.sport, parsed.team);
          if (teamTheme) {
            applyTeamTheme(teamTheme);
          }
        }
      } catch (error) {
        console.warn('Failed to parse saved theme:', error);
      }
    }
  }, []);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeState));
  }, [themeState]);

  const updateSport = (sport: string) => {
    setThemeState(prev => ({
      ...prev,
      sport,
      team: '', // Reset team when sport changes
    }));
  };

  const updateTeam = (team: string) => {
    setThemeState(prev => {
      const newState = { ...prev, team };
      
      // Auto-apply theme if enabled
      if (newState.enabled && newState.sport && team) {
        const teamTheme = findTeamTheme(newState.sport, team);
        if (teamTheme) {
          applyTeamTheme(teamTheme);
        }
      }
      
      return newState;
    });
  };

  const toggleThemeEnabled = (enabled: boolean) => {
    setThemeState(prev => {
      const newState = { ...prev, enabled };
      
      if (enabled && newState.sport && newState.team) {
        // Apply team theme
        const teamTheme = findTeamTheme(newState.sport, newState.team);
        if (teamTheme) {
          applyTeamTheme(teamTheme);
        }
      } else if (!enabled) {
        // Reset to default theme
        resetToDefaultTheme();
      }
      
      return newState;
    });
  };

  const resetTheme = () => {
    setThemeState({
      sport: '',
      team: '',
      enabled: false
    });
    resetToDefaultTheme();
  };

  return (
    <ThemeContext.Provider
      value={{
        themeState,
        updateSport,
        updateTeam,
        toggleThemeEnabled,
        resetTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};