/**
 * The Odds API v4 - Type Definitions
 * Generated from canonical CSV files - DO NOT EDIT MANUALLY
 * Source: regions.csv, bookmakers.csv, markets.csv, endpoints.csv, errors.csv
 */

// ============= REGIONS =============
export type RegionKey = 'us' | 'us2' | 'uk' | 'eu' | 'au' | 'us_dfs' | 'us_ex';

export interface Region {
  key: RegionKey;
  description: string;
}

// ============= BOOKMAKERS =============
export type BookmakerKey = 
  // US Region
  | 'betonlineag' | 'betmgm' | 'betrivers' | 'betus' | 'bovada' 
  | 'williamhill_us' | 'draftkings' | 'fanatics' | 'fanduel' | 'lowvig' | 'mybookieag'
  // US2 Region
  | 'ballybet' | 'betanysports' | 'betparx' | 'espnbet' | 'fliff' | 'hardrockbet' | 'rebet'
  // US DFS
  | 'pick6' | 'prizepicks' | 'underdog'
  // US Exchanges
  | 'betopenly' | 'novig' | 'prophetx'
  // UK Region
  | 'sport888' | 'betfair_ex_uk' | 'betfair_sb_uk' | 'betvictor' | 'betway' 
  | 'boylesports' | 'casumo' | 'coral' | 'grosvenor' | 'ladbrokes_uk' 
  | 'leovegas' | 'livescorebet' | 'matchbook' | 'paddypower' | 'skybet' 
  | 'smarkets' | 'unibet_uk' | 'virginbet' | 'williamhill'
  // EU Region
  | 'onexbet' | 'betclic_fr' | 'betfair_ex_eu' | 'betsson' | 'coolbet' 
  | 'everygame' | 'gtbets' | 'leovegas_se' | 'marathonbet' | 'nordicbet' 
  | 'parionssport_fr' | 'pinnacle' | 'suprabets' | 'tipico_de' | 'unibet_fr' 
  | 'unibet_it' | 'unibet_nl' | 'unibet_se' | 'winamax_de' | 'winamax_fr'
  // AU Region
  | 'betfair_ex_au' | 'betr_au' | 'betright' | 'bet365_au' | 'boombet' 
  | 'dabble_au' | 'ladbrokes_au' | 'neds' | 'playup' | 'pointsbetau' 
  | 'sportsbet' | 'tab' | 'tabtouch' | 'unibet';

export interface Bookmaker {
  region_key: RegionKey;
  bookmaker_key: BookmakerKey;
  bookmaker_name: string;
  notes: string;
}

// ============= MARKETS =============
export type MarketCategory = 'featured' | 'additional' | 'game_period' | 'player_props';

export type MarketKey = 
  // Featured markets
  | 'h2h' | 'spreads' | 'totals' | 'outrights' | 'h2h_lay' | 'outrights_lay'
  // Additional markets
  | 'alternate_spreads' | 'alternate_totals' | 'btts' | 'draw_no_bet' 
  | 'corners' | 'corners_3_way' | 'corners_odd_or_even'
  // Game period markets - Quarters
  | 'h2h_q1' | 'spreads_q1' | 'totals_q1'
  | 'h2h_q2' | 'spreads_q2' | 'totals_q2'
  | 'h2h_q3' | 'spreads_q3' | 'totals_q3'
  | 'h2h_q4' | 'spreads_q4' | 'totals_q4'
  // Game period markets - Halves
  | 'h2h_1st_half' | 'spreads_1st_half' | 'totals_1st_half'
  | 'h2h_2nd_half' | 'spreads_2nd_half' | 'totals_2nd_half'
  // MLB specific
  | 'totals_1st_innings' | 'totals_1st_5_innings'
  // NHL specific
  | 'h2h_1p' | 'spreads_1p' | 'totals_1p'
  | 'h2h_2p' | 'spreads_2p' | 'totals_2p'
  | 'h2h_3p' | 'spreads_3p' | 'totals_3p'
  // Player props - NFL/NCAAF/CFL
  | 'player_pass_tds' | 'player_pass_yds' | 'player_pass_attempts' | 'player_pass_completions'
  | 'player_rush_yds' | 'player_rush_attempts' | 'player_rush_tds'
  | 'player_receive_yds' | 'player_receptions' | 'player_receive_tds'
  | 'player_interceptions' | 'player_kicking_points' | 'player_field_goals' | 'player_longest_field_goal'
  // Player props - NBA/NCAAB/WNBA
  | 'player_points' | 'player_assists' | 'player_rebounds' | 'player_points_rebounds_assists'
  | 'player_threes' | 'player_steals' | 'player_blocks' | 'player_turnovers'
  | 'player_double_double' | 'player_triple_double'
  // Player props - MLB
  | 'batter_hits' | 'batter_home_runs' | 'batter_doubles' | 'batter_total_bases'
  | 'batter_rbis' | 'batter_runs_scored'
  | 'pitcher_strikeouts' | 'pitcher_outs' | 'pitcher_hits_allowed' | 'pitcher_walks'
  // Player props - NHL
  | 'player_goals' | 'player_shots_on_goal'
  // Player props - Soccer
  | 'player_shots_on_target'
  // Player props - AFL
  | 'player_disposals'
  // Player props - NRL
  | 'player_tries' | 'player_tackles';

export interface Market {
  category: MarketCategory;
  sport_group: string;
  market_key: MarketKey;
  market_name: string;
  description: string;
  notes: string;
}

// Featured markets that work with /odds endpoint
export const FEATURED_MARKETS: MarketKey[] = ['h2h', 'spreads', 'totals', 'outrights', 'h2h_lay', 'outrights_lay'];

// ============= API PARAMETERS =============
export type DateFormat = 'iso' | 'unix';
export type OddsFormat = 'decimal' | 'american';

export interface BaseAPIParams {
  regions?: RegionKey[];
  bookmakers?: BookmakerKey[];
  dateFormat?: DateFormat;
  oddsFormat?: OddsFormat;
}

export interface GetOddsParams extends BaseAPIParams {
  markets?: MarketKey[];
  eventIds?: string[];
  commenceTimeFrom?: string; // ISO8601
  commenceTimeTo?: string; // ISO8601
  includeLinks?: boolean;
  includeSids?: boolean;
  includeBetLimits?: boolean;
}

export interface GetEventOddsParams extends BaseAPIParams {
  markets?: MarketKey[];
  includeLinks?: boolean;
  includeSids?: boolean;
  includeBetLimits?: boolean;
}

export interface GetEventsParams {
  dateFormat?: DateFormat;
  eventIds?: string[];
  commenceTimeFrom?: string;
  commenceTimeTo?: string;
}

export interface GetScoresParams {
  daysFrom?: number; // 1-3
  dateFormat?: DateFormat;
  eventIds?: string[];
}

export interface GetEventMarketsParams extends BaseAPIParams {
  includeLinks?: boolean;
  includeSids?: boolean;
}

export interface GetHistoricalOddsParams extends BaseAPIParams {
  markets: MarketKey[];
  date: string; // ISO8601
}

export interface GetHistoricalEventsParams {
  date: string;
  dateFormat?: DateFormat;
  eventIds?: string[];
}

export interface GetHistoricalEventOddsParams extends BaseAPIParams {
  markets?: MarketKey[];
  date: string;
}

// ============= API RESPONSES =============
export interface Sport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export interface Outcome {
  name: string;
  price: number; // decimal or american depending on oddsFormat
  point?: number; // for spreads/totals
  description?: string; // for player props
  sid?: string; // if includeSids=true
  link?: string; // if includeLinks=true
  bet_limit?: number; // if includeBetLimits=true
  multiplier?: number; // for DFS sites
}

export interface Market_Response {
  key: MarketKey;
  last_update: string; // ISO8601
  outcomes: Outcome[];
}

export interface Bookmaker_Response {
  key: BookmakerKey;
  title: string;
  last_update: string;
  markets: Market_Response[];
}

export interface Event {
  id: string; // 32-char event id
  sport_key: string;
  sport_title: string;
  commence_time: string; // ISO8601 or unix
  home_team: string;
  away_team: string;
  bookmakers?: Bookmaker_Response[];
  // For scores endpoint
  completed?: boolean;
  scores?: Array<{
    name: string;
    score: string;
  }>;
  last_update?: string;
}

export interface Participant {
  id: string; // prefixed with 'par_'
  full_name: string;
}

export interface EventMarket {
  key: MarketKey;
}

// ============= ERROR CODES =============
export type OddsAPIErrorCode = 
  | 'MISSING_KEY' | 'INVALID_KEY' | 'DEACTIVATED_KEY'
  | 'EXCEEDED_FREQ_LIMIT' | 'OUT_OF_USAGE_CREDITS'
  | 'MISSING_REGION' | 'INVALID_REGION' | 'INVALID_BOOKMAKERS'
  | 'MISSING_MARKET' | 'INVALID_MARKET' | 'INVALID_MARKET_COMBO'
  | 'INVALID_DATE_FORMAT' | 'INVALID_ODDS_FORMAT' | 'INVALID_ALL_SPORTS_PARAM'
  | 'INVALID_SPORT' | 'UNKNOWN_SPORT'
  | 'INVALID_SCORES_DAYS_FROM'
  | 'INVALID_EVENT_IDS' | 'INVALID_EVENT_ID' | 'EVENT_NOT_FOUND'
  | 'MISSING_HISTORICAL_TIMESTAMP' | 'INVALID_HISTORICAL_TIMESTAMP'
  | 'INVALID_COMMENCE_TIME_FROM' | 'INVALID_COMMENCE_TIME_TO' | 'INVALID_COMMENCE_TIME_RANGE'
  | 'INVALID_INCLUDE_LINKS' | 'INVALID_INCLUDE_SIDS' | 'INVALID_INCLUDE_BET_LIMITS'
  | 'INVALID_INCLUDE_MULTIPLIERS'
  | 'HISTORICAL_UNAVAILABLE_ON_FREE_USAGE_PLAN' | 'HISTORICAL_MARKETS_UNAVAILABLE_AT_DATE';

export interface OddsAPIErrorResponse {
  code?: OddsAPIErrorCode;
  message: string;
}

// ============= QUOTA TRACKING =============
export interface QuotaHeaders {
  requestsUsed: number;
  requestsRemaining: number;
  requestsLast: string;
}

export interface APIResponse<T> {
  data: T;
  quota: QuotaHeaders;
  estimatedCost: number;
}
