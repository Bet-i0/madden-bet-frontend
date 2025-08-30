// Sports display name mapping and utilities
export const SPORTS_MAP = {
  // Display names for UI
  NFL: 'americanfootball_nfl',
  NCAAF: 'americanfootball_ncaaf',
  NBA: 'basketball_nba',
  NCAAB: 'basketball_ncaab',
  MLB: 'baseball_mlb',
  NHL: 'icehockey_nhl',
} as const;

export const REVERSE_SPORTS_MAP = {
  americanfootball_nfl: 'NFL',
  americanfootball_ncaaf: 'NCAAF', 
  basketball_nba: 'NBA',
  basketball_ncaab: 'NCAAB',
  baseball_mlb: 'MLB',
  icehockey_nhl: 'NHL',
} as const;

export type DisplaySport = keyof typeof SPORTS_MAP;
export type DatabaseSport = typeof SPORTS_MAP[DisplaySport];

// Convert display name to database key
export function getDbSportKey(displayName: DisplaySport): DatabaseSport {
  return SPORTS_MAP[displayName];
}

// Convert database key to display name
export function getDisplaySportName(dbKey: string): string {
  return REVERSE_SPORTS_MAP[dbKey as keyof typeof REVERSE_SPORTS_MAP] || dbKey;
}

// Get all supported sports for display
export function getAllDisplaySports(): DisplaySport[] {
  return Object.keys(SPORTS_MAP) as DisplaySport[];
}

// Get all database sport keys
export function getAllDbSportKeys(): DatabaseSport[] {
  return Object.values(SPORTS_MAP);
}

// League aliases for AI understanding
export const LEAGUE_ALIASES = {
  'nfl': ['nfl', 'national football league', 'american football nfl', 'pro football'],
  'ncaaf': ['ncaaf', 'college football', 'ncaa football', 'american football ncaaf', 'college'],
  'nba': ['nba', 'national basketball association', 'pro basketball'],
  'ncaab': ['ncaab', 'college basketball', 'ncaa basketball', 'march madness'],
  'mlb': ['mlb', 'major league baseball', 'baseball'],
  'nhl': ['nhl', 'national hockey league', 'hockey', 'ice hockey'],
} as const;

// Detect league from user message
export function detectLeagueFromMessage(message: string): DatabaseSport[] {
  const lowerMessage = message.toLowerCase();
  const detectedLeagues: DatabaseSport[] = [];
  
  // Check for specific league mentions
  for (const [league, aliases] of Object.entries(LEAGUE_ALIASES)) {
    if (aliases.some(alias => lowerMessage.includes(alias))) {
      const dbKey = getDbSportKey(league.toUpperCase() as DisplaySport);
      if (dbKey && !detectedLeagues.includes(dbKey)) {
        detectedLeagues.push(dbKey);
      }
    }
  }
  
  return detectedLeagues;
}