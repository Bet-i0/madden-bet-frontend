/**
 * The Odds API v4 - Migration Utilities
 * Map legacy IDs to canonical keys from CSV files
 */

import type { MarketKey, BookmakerKey, RegionKey } from './types';
import { loadMarkets, loadBookmakers } from './data';

/**
 * Legacy market aliases that need migration
 * Map old keys → canonical keys
 */
export const MARKET_ALIASES: Record<string, MarketKey> = {
  // Common aliases
  'moneyline': 'h2h',
  'ml': 'h2h',
  'head_to_head': 'h2h',
  'spread': 'spreads',
  'point_spread': 'spreads',
  'handicap': 'spreads',
  'total': 'totals',
  'over_under': 'totals',
  'ou': 'totals',
  'futures': 'outrights',
  
  // Period variations
  'q1_h2h': 'h2h_q1',
  'q1_spread': 'spreads_q1',
  'q1_total': 'totals_q1',
  'first_quarter_h2h': 'h2h_q1',
  
  // Player props variations
  'passing_yards': 'player_pass_yds',
  'passing_touchdowns': 'player_pass_tds',
  'rushing_yards': 'player_rush_yds',
  'receiving_yards': 'player_receive_yds',
  'points': 'player_points',
  'assists': 'player_assists',
  'rebounds': 'player_rebounds',
};

/**
 * Legacy bookmaker aliases
 */
export const BOOKMAKER_ALIASES: Record<string, BookmakerKey> = {
  'caesars': 'williamhill_us',
  'william_hill': 'williamhill_us',
  'draftkings_dfs': 'pick6',
  'betonline': 'betonlineag',
  'mybookie': 'mybookieag',
  'lowvig': 'lowvig',
  'betfair': 'betfair_sb_uk',
  'betfair_exchange': 'betfair_ex_uk',
};

/**
 * Migrate market key from legacy to canonical
 */
export function migrateMarketKey(legacyKey: string): MarketKey {
  const normalized = legacyKey.toLowerCase().trim();
  
  // Check if already canonical
  const markets = loadMarkets();
  const canonical = markets.find(m => m.market_key === normalized);
  if (canonical) {
    return canonical.market_key;
  }
  
  // Check aliases
  if (MARKET_ALIASES[normalized]) {
    console.warn(`[Migration] Market alias detected: "${legacyKey}" → "${MARKET_ALIASES[normalized]}"`);
    return MARKET_ALIASES[normalized];
  }
  
  // Unknown market - log for manual review
  console.error(`[Migration] Unknown market key: "${legacyKey}". Update MARKET_ALIASES mapping.`);
  return normalized as MarketKey;
}

/**
 * Migrate bookmaker key from legacy to canonical
 */
export function migrateBookmakerKey(legacyKey: string): BookmakerKey {
  const normalized = legacyKey.toLowerCase().trim();
  
  // Check if already canonical
  const bookmakers = loadBookmakers();
  const canonical = bookmakers.find(b => b.bookmaker_key === normalized);
  if (canonical) {
    return canonical.bookmaker_key;
  }
  
  // Check aliases
  if (BOOKMAKER_ALIASES[normalized]) {
    console.warn(`[Migration] Bookmaker alias detected: "${legacyKey}" → "${BOOKMAKER_ALIASES[normalized]}"`);
    return BOOKMAKER_ALIASES[normalized];
  }
  
  console.error(`[Migration] Unknown bookmaker key: "${legacyKey}". Update BOOKMAKER_ALIASES mapping.`);
  return normalized as BookmakerKey;
}

/**
 * Batch migrate market keys
 */
export function migrateMarketKeys(legacyKeys: string[]): MarketKey[] {
  return legacyKeys.map(migrateMarketKey);
}

/**
 * Batch migrate bookmaker keys
 */
export function migrateBookmakerKeys(legacyKeys: string[]): BookmakerKey[] {
  return legacyKeys.map(migrateBookmakerKey);
}

/**
 * Detect if a market is featured (works with /odds endpoint)
 */
export function isFeaturedMarket(marketKey: MarketKey): boolean {
  const featured: MarketKey[] = ['h2h', 'spreads', 'totals', 'outrights', 'h2h_lay', 'outrights_lay'];
  return featured.includes(marketKey);
}

/**
 * Detect if markets require /event-odds instead of /odds
 */
export function requiresEventOddsEndpoint(markets: MarketKey[]): boolean {
  return markets.some(m => !isFeaturedMarket(m));
}

/**
 * Generate migration report for existing data
 */
export interface MigrationReport {
  totalKeys: number;
  migratedKeys: number;
  unknownKeys: string[];
  aliasesUsed: Array<{ old: string; new: string }>;
}

export function generateMarketMigrationReport(legacyKeys: string[]): MigrationReport {
  const report: MigrationReport = {
    totalKeys: legacyKeys.length,
    migratedKeys: 0,
    unknownKeys: [],
    aliasesUsed: []
  };

  const markets = loadMarkets();
  const canonicalKeys = new Set(markets.map(m => m.market_key));

  for (const key of legacyKeys) {
    const normalized = key.toLowerCase().trim();
    
    if (canonicalKeys.has(normalized as MarketKey)) {
      continue; // Already canonical
    }
    
    if (MARKET_ALIASES[normalized]) {
      report.migratedKeys++;
      report.aliasesUsed.push({
        old: key,
        new: MARKET_ALIASES[normalized]
      });
    } else {
      report.unknownKeys.push(key);
    }
  }

  return report;
}

export function generateBookmakerMigrationReport(legacyKeys: string[]): MigrationReport {
  const report: MigrationReport = {
    totalKeys: legacyKeys.length,
    migratedKeys: 0,
    unknownKeys: [],
    aliasesUsed: []
  };

  const bookmakers = loadBookmakers();
  const canonicalKeys = new Set(bookmakers.map(b => b.bookmaker_key));

  for (const key of legacyKeys) {
    const normalized = key.toLowerCase().trim();
    
    if (canonicalKeys.has(normalized as BookmakerKey)) {
      continue;
    }
    
    if (BOOKMAKER_ALIASES[normalized]) {
      report.migratedKeys++;
      report.aliasesUsed.push({
        old: key,
        new: BOOKMAKER_ALIASES[normalized]
      });
    } else {
      report.unknownKeys.push(key);
    }
  }

  return report;
}
