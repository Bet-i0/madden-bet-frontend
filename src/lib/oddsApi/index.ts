/**
 * The Odds API v4 - Main Export
 * Canonical integration for Bet.io
 */

export { OddsAPIClient, getOddsAPIClient, resetOddsAPIClient } from './client';
export { OddsAPIError, ERROR_GUIDANCE } from './errors';
export {
  loadRegions,
  loadBookmakers,
  loadMarkets,
  getBookmakersByRegion,
  getMarketsByCategory,
  getMarketsBySportGroup,
  getFeaturedMarkets,
  getPlayerPropMarkets,
  getGamePeriodMarkets,
  isValidMarketKey,
  isValidRegionKey,
  isValidBookmakerKey,
  getMarketDisplayName,
  getBookmakerDisplayName,
  getRegionDisplayName,
  REGIONS,
  BOOKMAKERS,
  MARKETS
} from './data';
export * from './types';
