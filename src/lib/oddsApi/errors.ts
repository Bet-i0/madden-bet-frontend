/**
 * The Odds API v4 - Error Classes
 * Based on errors.csv canonical source
 */

import { OddsAPIErrorCode, OddsAPIErrorResponse } from './types';

export class OddsAPIError extends Error {
  public readonly code: OddsAPIErrorCode | 'UNKNOWN_ERROR';
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly userMessage: string;

  constructor(
    code: OddsAPIErrorCode | 'UNKNOWN_ERROR',
    message: string,
    statusCode: number,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'OddsAPIError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.userMessage = this.getUserFriendlyMessage();
  }

  private getUserFriendlyMessage(): string {
    const messages: Record<string, string> = {
      MISSING_KEY: 'API key is required. Please check your configuration.',
      INVALID_KEY: 'API key is invalid. Please verify your subscription.',
      DEACTIVATED_KEY: 'API key has been deactivated. Please renew your subscription.',
      EXCEEDED_FREQ_LIMIT: 'Rate limit exceeded. Please wait a few seconds and try again.',
      OUT_OF_USAGE_CREDITS: 'Monthly usage limit reached. Please upgrade your plan or wait for reset.',
      MISSING_REGION: 'Please select at least one region or bookmaker.',
      INVALID_REGION: 'One or more selected regions are invalid. Please check your selection.',
      INVALID_BOOKMAKERS: 'One or more selected bookmakers are invalid. Please check your selection.',
      MISSING_MARKET: 'Please select at least one market.',
      INVALID_MARKET: 'One or more selected markets are invalid for this sport.',
      INVALID_MARKET_COMBO: 'This sport only supports outrights market. Please select outrights.',
      INVALID_DATE_FORMAT: 'Invalid date format. Must be ISO8601 or unix.',
      INVALID_ODDS_FORMAT: 'Invalid odds format. Must be decimal or american.',
      INVALID_SPORT: 'Invalid sport selection.',
      UNKNOWN_SPORT: 'Sport not found or not currently in season.',
      INVALID_SCORES_DAYS_FROM: 'Invalid daysFrom parameter. Must be 1-3.',
      INVALID_EVENT_IDS: 'Invalid event IDs provided.',
      INVALID_EVENT_ID: 'Invalid event ID. Event IDs must be 32 characters.',
      EVENT_NOT_FOUND: 'Event not found. It may have concluded or the ID is incorrect.',
      MISSING_HISTORICAL_TIMESTAMP: 'Historical date parameter is required.',
      INVALID_HISTORICAL_TIMESTAMP: 'Invalid historical timestamp. Must be ISO8601 format.',
      INVALID_COMMENCE_TIME_FROM: 'Invalid commenceTimeFrom. Must be ISO8601 format.',
      INVALID_COMMENCE_TIME_TO: 'Invalid commenceTimeTo. Must be ISO8601 format.',
      INVALID_COMMENCE_TIME_RANGE: 'commenceTimeTo must be later than commenceTimeFrom.',
      INVALID_INCLUDE_LINKS: 'includeLinks must be true or false.',
      INVALID_INCLUDE_SIDS: 'includeSids must be true or false.',
      INVALID_INCLUDE_BET_LIMITS: 'includeBetLimits must be true or false.',
      INVALID_INCLUDE_MULTIPLIERS: 'includeMultipliers must be true or false.',
      HISTORICAL_UNAVAILABLE_ON_FREE_USAGE_PLAN: 'Historical data requires a paid plan. Please upgrade.',
      HISTORICAL_MARKETS_UNAVAILABLE_AT_DATE: 'The requested markets were not available at that date.',
      UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
    };

    return messages[this.code] || this.message;
  }

  static fromResponse(response: OddsAPIErrorResponse, statusCode: number): OddsAPIError {
    const code = response.code || 'UNKNOWN_ERROR';
    const retryable = code === 'EXCEEDED_FREQ_LIMIT';
    
    return new OddsAPIError(
      code,
      response.message,
      statusCode,
      retryable
    );
  }

  static isRetryable(error: Error): boolean {
    if (error instanceof OddsAPIError) {
      return error.retryable;
    }
    return false;
  }
}

// Error code to guidance mapping for developers
export const ERROR_GUIDANCE: Record<OddsAPIErrorCode | 'UNKNOWN_ERROR', string> = {
  MISSING_KEY: 'Ensure ODDS_API_KEY environment variable is set',
  INVALID_KEY: 'Verify API key is correct and subscription is active',
  DEACTIVATED_KEY: 'Renew subscription at the-odds-api.com',
  EXCEEDED_FREQ_LIMIT: 'Implement exponential backoff; rate limit is ~30 req/s',
  OUT_OF_USAGE_CREDITS: 'Check quota headers; implement usage monitoring',
  MISSING_REGION: 'Provide regions or bookmakers parameter',
  INVALID_REGION: 'Use region keys from regions.csv: us, us2, uk, eu, au, us_dfs, us_ex',
  INVALID_BOOKMAKERS: 'Use bookmaker keys from bookmakers.csv',
  MISSING_MARKET: 'Provide markets parameter or let it default to h2h',
  INVALID_MARKET: 'Use /event-odds for non-featured markets; check markets.csv',
  INVALID_MARKET_COMBO: 'For outrights sports, only outrights market is valid',
  INVALID_DATE_FORMAT: 'Use dateFormat: "iso" or "unix"',
  INVALID_ODDS_FORMAT: 'Use oddsFormat: "decimal" or "american"',
  INVALID_ALL_SPORTS_PARAM: 'For /sports endpoint, all must be true or false',
  INVALID_SPORT: 'Check sport key exists in /sports response',
  UNKNOWN_SPORT: 'Sport not found; call /sports to get active sports',
  INVALID_SCORES_DAYS_FROM: 'daysFrom must be integer 1-3',
  INVALID_EVENT_IDS: 'Event IDs must be comma-separated 32-char strings',
  INVALID_EVENT_ID: 'Event ID must be exactly 32 characters',
  EVENT_NOT_FOUND: 'Event concluded or ID incorrect; verify with /events',
  MISSING_HISTORICAL_TIMESTAMP: 'Provide date parameter in ISO8601 format',
  INVALID_HISTORICAL_TIMESTAMP: 'Use ISO8601 format: YYYY-MM-DDTHH:mm:ssZ',
  INVALID_COMMENCE_TIME_FROM: 'Use ISO8601 format for commenceTimeFrom',
  INVALID_COMMENCE_TIME_TO: 'Use ISO8601 format for commenceTimeTo',
  INVALID_COMMENCE_TIME_RANGE: 'Ensure commenceTimeTo > commenceTimeFrom',
  INVALID_INCLUDE_LINKS: 'includeLinks must be boolean or "true"/"false" string',
  INVALID_INCLUDE_SIDS: 'includeSids must be boolean or "true"/"false" string',
  INVALID_INCLUDE_BET_LIMITS: 'includeBetLimits must be boolean or "true"/"false" string',
  INVALID_INCLUDE_MULTIPLIERS: 'includeMultipliers must be boolean (DFS only)',
  HISTORICAL_UNAVAILABLE_ON_FREE_USAGE_PLAN: 'Historical endpoints require paid subscription',
  HISTORICAL_MARKETS_UNAVAILABLE_AT_DATE: 'Try different timestamp or markets',
  UNKNOWN_ERROR: 'Check logs for details; may be network or server issue'
};
