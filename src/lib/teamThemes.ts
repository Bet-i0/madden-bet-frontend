export interface TeamTheme {
  name: string;
  primary: string;    // HSL format
  secondary: string;  // HSL format
  accent: string;     // HSL format
  foreground: string; // HSL format
}

export interface SportTeams {
  [key: string]: TeamTheme[];
}

export const teamThemes: SportTeams = {
  NFL: [
    { name: "Kansas City Chiefs", primary: "0 84% 50%", secondary: "45 100% 51%", accent: "0 84% 60%", foreground: "0 0% 98%" },
    { name: "Dallas Cowboys", primary: "214 86% 27%", secondary: "0 0% 75%", accent: "214 86% 37%", foreground: "0 0% 98%" },
    { name: "Green Bay Packers", primary: "79 100% 25%", secondary: "45 100% 51%", accent: "79 100% 35%", foreground: "0 0% 98%" },
    { name: "Pittsburgh Steelers", primary: "45 100% 51%", secondary: "0 0% 0%", accent: "45 100% 61%", foreground: "0 0% 98%" },
    { name: "New England Patriots", primary: "214 86% 27%", secondary: "0 84% 50%", accent: "214 86% 37%", foreground: "0 0% 98%" },
    { name: "San Francisco 49ers", primary: "0 84% 50%", secondary: "45 100% 51%", accent: "0 84% 60%", foreground: "0 0% 98%" },
    { name: "Seattle Seahawks", primary: "203 100% 19%", secondary: "123 46% 34%", accent: "203 100% 29%", foreground: "0 0% 98%" },
    { name: "Denver Broncos", primary: "25 100% 50%", secondary: "214 86% 27%", accent: "25 100% 60%", foreground: "0 0% 98%" },
  ],
  NBA: [
    { name: "Los Angeles Lakers", primary: "267 100% 37%", secondary: "45 100% 51%", accent: "267 100% 47%", foreground: "0 0% 98%" },
    { name: "Golden State Warriors", primary: "218 100% 47%", secondary: "45 100% 51%", accent: "218 100% 57%", foreground: "0 0% 98%" },
    { name: "Boston Celtics", primary: "123 46% 34%", secondary: "0 0% 100%", accent: "123 46% 44%", foreground: "0 0% 98%" },
    { name: "Chicago Bulls", primary: "0 84% 50%", secondary: "0 0% 0%", accent: "0 84% 60%", foreground: "0 0% 98%" },
    { name: "Miami Heat", primary: "0 84% 50%", secondary: "0 0% 0%", accent: "0 84% 60%", foreground: "0 0% 98%" },
    { name: "Brooklyn Nets", primary: "0 0% 0%", secondary: "0 0% 100%", accent: "0 0% 20%", foreground: "0 0% 98%" },
    { name: "Toronto Raptors", primary: "0 84% 50%", secondary: "0 0% 0%", accent: "0 84% 60%", foreground: "0 0% 98%" },
    { name: "Milwaukee Bucks", primary: "123 46% 34%", secondary: "32 100% 95%", accent: "123 46% 44%", foreground: "0 0% 98%" },
  ],
  MLB: [
    { name: "New York Yankees", primary: "214 86% 27%", secondary: "0 0% 100%", accent: "214 86% 37%", foreground: "0 0% 98%" },
    { name: "Los Angeles Dodgers", primary: "218 100% 47%", secondary: "0 0% 100%", accent: "218 100% 57%", foreground: "0 0% 98%" },
    { name: "Boston Red Sox", primary: "0 84% 50%", secondary: "214 86% 27%", accent: "0 84% 60%", foreground: "0 0% 98%" },
    { name: "San Francisco Giants", primary: "25 100% 50%", secondary: "0 0% 0%", accent: "25 100% 60%", foreground: "0 0% 98%" },
    { name: "Chicago Cubs", primary: "218 100% 47%", secondary: "0 84% 50%", accent: "218 100% 57%", foreground: "0 0% 98%" },
    { name: "Atlanta Braves", primary: "214 86% 27%", secondary: "0 84% 50%", accent: "214 86% 37%", foreground: "0 0% 98%" },
    { name: "Houston Astros", primary: "25 100% 50%", secondary: "214 86% 27%", accent: "25 100% 60%", foreground: "0 0% 98%" },
    { name: "Philadelphia Phillies", primary: "0 84% 50%", secondary: "218 100% 47%", accent: "0 84% 60%", foreground: "0 0% 98%" },
  ],
  MLS: [
    { name: "LA Galaxy", primary: "214 86% 27%", secondary: "45 100% 51%", accent: "214 86% 37%", foreground: "0 0% 98%" },
    { name: "Seattle Sounders", primary: "123 46% 34%", secondary: "218 100% 47%", accent: "123 46% 44%", foreground: "0 0% 98%" },
    { name: "Atlanta United", primary: "0 84% 50%", secondary: "0 0% 0%", accent: "0 84% 60%", foreground: "0 0% 98%" },
    { name: "Portland Timbers", primary: "123 46% 34%", secondary: "45 100% 51%", accent: "123 46% 44%", foreground: "0 0% 98%" },
    { name: "LAFC", primary: "0 0% 0%", secondary: "45 100% 51%", accent: "0 0% 20%", foreground: "0 0% 98%" },
    { name: "Inter Miami", primary: "316 61% 67%", secondary: "0 0% 0%", accent: "316 61% 77%", foreground: "0 0% 98%" },
    { name: "New York City FC", primary: "195 100% 39%", secondary: "25 100% 50%", accent: "195 100% 49%", foreground: "0 0% 98%" },
    { name: "Toronto FC", primary: "0 84% 50%", secondary: "0 0% 40%", accent: "0 84% 60%", foreground: "0 0% 98%" },
  ]
};

export interface ThemeState {
  sport: string;
  team: string;
  enabled: boolean;
}

export const applyTeamTheme = (theme: TeamTheme) => {
  const root = document.documentElement;
  
  // Apply team colors to CSS variables
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--secondary', theme.secondary);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--primary-foreground', theme.foreground);
  
  // Update gradients with team colors
  root.style.setProperty('--gradient-primary', `linear-gradient(135deg, hsl(${theme.primary}), hsl(${theme.secondary}))`);
  root.style.setProperty('--gradient-neon', `linear-gradient(135deg, hsl(${theme.accent}), hsl(${theme.primary}))`);
  
  // Update shadows with team colors
  root.style.setProperty('--shadow-neon', `0 0 20px hsl(${theme.primary} / 0.5)`);
  root.style.setProperty('--shadow-glow', `0 0 40px hsl(${theme.accent} / 0.4)`);
};

export const resetToDefaultTheme = () => {
  const root = document.documentElement;
  
  // Reset to original values from index.css
  root.style.setProperty('--primary', '220.9 39.3% 11%');
  root.style.setProperty('--secondary', '220 14.3% 95.9%');
  root.style.setProperty('--accent', '220 14.3% 95.9%');
  root.style.setProperty('--primary-foreground', '210 20% 98%');
  
  // Reset gradients and shadows
  root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--neon-blue)))');
  root.style.setProperty('--gradient-neon', 'linear-gradient(135deg, hsl(var(--neon-green)), hsl(var(--neon-blue)))');
  root.style.setProperty('--shadow-neon', '0 0 20px hsl(var(--neon-blue) / 0.5)');
  root.style.setProperty('--shadow-glow', '0 0 40px hsl(var(--neon-green) / 0.4)');
};

export const getTeamsByLeague = (sport: string): TeamTheme[] => {
  return teamThemes[sport] || [];
};

export const findTeamTheme = (sport: string, teamName: string): TeamTheme | null => {
  const teams = getTeamsByLeague(sport);
  return teams.find(team => team.name === teamName) || null;
};