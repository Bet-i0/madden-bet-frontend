/**
 * The Odds API v4 - Data Loaders
 * Load and parse canonical CSV data
 */

import type { Region, Bookmaker, Market, RegionKey, BookmakerKey, MarketKey } from './types';

// Import CSVs as raw text - we'll parse them
import regionsCSV from '@/data/odds-api/regions.csv?raw';
import bookmakersCSV from '@/data/odds-api/bookmakers.csv?raw';
import marketsCSV from '@/data/odds-api/markets.csv?raw';

/**
 * Simple CSV parser
 */
function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });
    return row;
  });
}

/**
 * Load regions from CSV
 */
export function loadRegions(): Region[] {
  const rows = parseCSV(regionsCSV);
  return rows.map(row => ({
    key: row.key as RegionKey,
    description: row.description
  }));
}

/**
 * Load bookmakers from CSV
 */
export function loadBookmakers(): Bookmaker[] {
  const rows = parseCSV(bookmakersCSV);
  return rows.map(row => ({
    region_key: row.region_key as RegionKey,
    bookmaker_key: row.bookmaker_key as BookmakerKey,
    bookmaker_name: row.bookmaker_name,
    notes: row.notes
  }));
}

/**
 * Load markets from CSV
 */
export function loadMarkets(): Market[] {
  const rows = parseCSV(marketsCSV);
  return rows.map(row => ({
    category: row.category as any,
    sport_group: row.sport_group,
    market_key: row.market_key as MarketKey,
    market_name: row.market_name,
    description: row.description,
    notes: row.notes
  }));
}

/**
 * Get bookmakers for a specific region
 */
export function getBookmakersByRegion(region: RegionKey): Bookmaker[] {
  const all = loadBookmakers();
  return all.filter(b => b.region_key === region);
}

/**
 * Get markets by category
 */
export function getMarketsByCategory(category: string): Market[] {
  const all = loadMarkets();
  return all.filter(m => m.category === category);
}

/**
 * Get markets by sport group
 */
export function getMarketsBySportGroup(sportGroup: string): Market[] {
  const all = loadMarkets();
  return all.filter(m => 
    m.sport_group === sportGroup || 
    m.sport_group === 'All' ||
    m.sport_group === 'Exchanges'
  );
}

/**
 * Get featured markets
 */
export function getFeaturedMarkets(): Market[] {
  return getMarketsByCategory('featured');
}

/**
 * Get player prop markets
 */
export function getPlayerPropMarkets(): Market[] {
  return getMarketsByCategory('player_props');
}

/**
 * Get game period markets
 */
export function getGamePeriodMarkets(): Market[] {
  return getMarketsByCategory('game_period');
}

/**
 * Validate if a market key exists
 */
export function isValidMarketKey(key: string): boolean {
  const markets = loadMarkets();
  return markets.some(m => m.market_key === key);
}

/**
 * Validate if a region key exists
 */
export function isValidRegionKey(key: string): boolean {
  const regions = loadRegions();
  return regions.some(r => r.key === key);
}

/**
 * Validate if a bookmaker key exists
 */
export function isValidBookmakerKey(key: string): boolean {
  const bookmakers = loadBookmakers();
  return bookmakers.some(b => b.bookmaker_key === key);
}

/**
 * Get market display name
 */
export function getMarketDisplayName(key: MarketKey): string {
  const markets = loadMarkets();
  const market = markets.find(m => m.market_key === key);
  return market?.market_name || key;
}

/**
 * Get bookmaker display name
 */
export function getBookmakerDisplayName(key: BookmakerKey): string {
  const bookmakers = loadBookmakers();
  const bookmaker = bookmakers.find(b => b.bookmaker_key === key);
  return bookmaker?.bookmaker_name || key;
}

/**
 * Get region display name
 */
export function getRegionDisplayName(key: RegionKey): string {
  const regions = loadRegions();
  const region = regions.find(r => r.key === key);
  return region?.description || key;
}

// Pre-load and export for convenience
export const REGIONS = loadRegions();
export const BOOKMAKERS = loadBookmakers();
export const MARKETS = loadMarkets();
