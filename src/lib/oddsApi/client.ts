/**
 * The Odds API v4 - Client Implementation
 * Canonical implementation following OddsAPI_v4_Loveable_Spec.txt
 * 
 * Key Features:
 * - Full type safety with canonical CSV data
 * - Automatic quota tracking via response headers
 * - Rate limiting with exponential backoff
 * - Request caching with configurable TTL
 * - Cost estimation logging
 * - Featured vs non-featured market routing
 */

import { OddsAPIError } from './errors';
import type {
  Sport, Event, Participant, EventMarket,
  GetOddsParams, GetEventOddsParams, GetEventsParams, GetScoresParams,
  GetEventMarketsParams, GetHistoricalOddsParams, GetHistoricalEventsParams,
  GetHistoricalEventOddsParams, APIResponse, QuotaHeaders, MarketKey,
  OddsAPIErrorResponse, RegionKey, BookmakerKey
} from './types';
import { FEATURED_MARKETS } from './types';

const ODDS_API_BASE = 'https://api.the-odds-api.com';
const ODDS_API_BASE_IPV6 = 'https://ipv6-api.the-odds-api.com';
const RATE_LIMIT_PER_SECOND = 30;
const RETRY_DELAYS = [1000, 2000, 4000, 8000]; // Exponential backoff

// Simple in-memory cache
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  quota: QuotaHeaders;
}

class OddsAPICache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttlMs: number, quota: QuotaHeaders): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
      quota
    });
  }

  get<T>(key: string): { data: T; quota: QuotaHeaders } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return { data: entry.data as T, quota: entry.quota };
  }

  clear(): void {
    this.cache.clear();
  }
}

export class OddsAPIClient {
  private apiKey: string;
  private baseURL: string;
  private cache: OddsAPICache;
  private lastRequestTime: number = 0;
  private requestQueue: Array<() => void> = [];

  constructor(apiKey: string, useIPv6: boolean = false) {
    if (!apiKey) {
      throw new Error('ODDS_API_KEY is required');
    }
    this.apiKey = apiKey;
    this.baseURL = useIPv6 ? ODDS_API_BASE_IPV6 : ODDS_API_BASE;
    this.cache = new OddsAPICache();
  }

  /**
   * Rate limiting: ~30 requests per second
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000 / RATE_LIMIT_PER_SECOND;

    if (timeSinceLastRequest < minInterval) {
      await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastRequest));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Extract quota headers from response
   */
  private extractQuotaHeaders(headers: Headers): QuotaHeaders {
    return {
      requestsUsed: parseInt(headers.get('x-requests-used') || '0'),
      requestsRemaining: parseInt(headers.get('x-requests-remaining') || '0'),
      requestsLast: headers.get('x-requests-last') || new Date().toISOString()
    };
  }

  /**
   * Estimate cost based on endpoint and parameters
   */
  private estimateCost(
    endpoint: string,
    params: Record<string, any>
  ): number {
    const regions = params.regions?.length || 1;
    const markets = params.markets?.length || 1;

    if (endpoint.includes('/sports') && !endpoint.includes('/odds')) {
      return 0; // Sports and events endpoints don't count
    }

    if (endpoint.includes('/scores') || endpoint.includes('/markets')) {
      return 1;
    }

    if (endpoint.includes('/events/') && endpoint.includes('/odds')) {
      // Event odds: 10 × markets × regions
      return 10 * markets * regions;
    }

    if (endpoint.includes('/odds')) {
      // Featured odds: regions × markets
      return regions * markets;
    }

    if (endpoint.includes('/historical')) {
      if (endpoint.includes('/events/')) {
        // Historical event odds: 10 × markets × regions
        return 10 * markets * regions;
      }
      // Historical odds: 10 × markets × regions
      return 10 * markets * regions;
    }

    if (endpoint.includes('/participants')) {
      return 1;
    }

    return 1; // Default
  }

  /**
   * Build query string from params
   */
  private buildQueryString(params: Record<string, any>): string {
    const query = new URLSearchParams();
    query.append('apiKey', this.apiKey);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query.append(key, value.join(','));
        } else if (typeof value === 'boolean') {
          query.append(key, value.toString());
        } else {
          query.append(key, value.toString());
        }
      }
    });

    return query.toString();
  }

  /**
   * Core request method with retry logic
   */
  private async request<T>(
    endpoint: string,
    params: Record<string, any> = {},
    cacheTTL?: number,
    retryCount: number = 0
  ): Promise<APIResponse<T>> {
    await this.waitForRateLimit();

    const queryString = this.buildQueryString(params);
    const cacheKey = `${endpoint}?${queryString}`;

    // Check cache
    if (cacheTTL) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached) {
        console.log(`[OddsAPI] Cache hit: ${endpoint}`);
        return {
          data: cached.data,
          quota: cached.quota,
          estimatedCost: 0
        };
      }
    }

    const url = `${this.baseURL}${endpoint}?${queryString}`;
    const estimatedCost = this.estimateCost(endpoint, params);

    console.log(`[OddsAPI] ${endpoint} - Estimated cost: ${estimatedCost}`);

    try {
      const response = await fetch(url);
      const quota = this.extractQuotaHeaders(response.headers);

      console.log(`[OddsAPI] Quota - Used: ${quota.requestsUsed}, Remaining: ${quota.requestsRemaining}`);

      if (!response.ok) {
        const errorData: OddsAPIErrorResponse = await response.json();
        const error = OddsAPIError.fromResponse(errorData, response.status);

        // Retry on rate limit
        if (error.code === 'EXCEEDED_FREQ_LIMIT' && retryCount < RETRY_DELAYS.length) {
          const delay = RETRY_DELAYS[retryCount];
          console.warn(`[OddsAPI] Rate limited, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.request<T>(endpoint, params, cacheTTL, retryCount + 1);
        }

        throw error;
      }

      const data: T = await response.json();

      // Cache successful response
      if (cacheTTL) {
        this.cache.set(cacheKey, data, cacheTTL, quota);
      }

      return {
        data,
        quota,
        estimatedCost
      };

    } catch (error) {
      if (error instanceof OddsAPIError) {
        throw error;
      }
      
      console.error('[OddsAPI] Request failed:', error);
      throw new OddsAPIError(
        'UNKNOWN_ERROR',
        error instanceof Error ? error.message : 'Unknown error',
        500
      );
    }
  }

  /**
   * GET /v4/sports
   * Returns list of in-season sports
   * Cost: 0 (does not count against quota)
   * Cache: 6 hours (sports don't change often)
   */
  async getSports(): Promise<APIResponse<Sport[]>> {
    return this.request<Sport[]>('/v4/sports', {}, 6 * 60 * 60 * 1000);
  }

  /**
   * GET /v4/sports/{sport}/odds
   * Featured markets only: h2h, spreads, totals, outrights
   * Cost: regions × markets
   * Cache: 60 seconds
   */
  async getOdds(
    sport: string,
    params: GetOddsParams
  ): Promise<APIResponse<Event[]>> {
    const { regions = ['us'], markets = ['h2h'], ...rest } = params;
    
    // Validate featured markets
    const invalidMarkets = markets.filter(m => !FEATURED_MARKETS.includes(m));
    if (invalidMarkets.length > 0) {
      console.warn(
        `[OddsAPI] Non-featured markets detected: ${invalidMarkets.join(', ')}. ` +
        `Use getEventOdds() instead.`
      );
    }

    return this.request<Event[]>(
      `/v4/sports/${sport}/odds`,
      { regions, markets, ...rest },
      60 * 1000
    );
  }

  /**
   * GET /v4/sports/{sport}/scores
   * Cost: 1
   * Cache: 30 seconds (live scores update frequently)
   */
  async getScores(
    sport: string,
    params: GetScoresParams = {}
  ): Promise<APIResponse<Event[]>> {
    return this.request<Event[]>(
      `/v4/sports/${sport}/scores`,
      params,
      30 * 1000
    );
  }

  /**
   * GET /v4/sports/{sport}/events
   * Cost: 0 (does not count)
   * Cache: 120 seconds
   */
  async getEvents(
    sport: string,
    params: GetEventsParams = {}
  ): Promise<APIResponse<Event[]>> {
    return this.request<Event[]>(
      `/v4/sports/${sport}/events`,
      params,
      120 * 1000
    );
  }

  /**
   * GET /v4/sports/{sport}/events/{eventId}/odds
   * Supports ALL markets including player props, alternates, periods
   * Cost: 10 × unique markets × regions
   * Cache: 60 seconds
   */
  async getEventOdds(
    sport: string,
    eventId: string,
    params: GetEventOddsParams
  ): Promise<APIResponse<Event>> {
    const { regions = ['us'], ...rest } = params;

    return this.request<Event>(
      `/v4/sports/${sport}/events/${eventId}/odds`,
      { regions, ...rest },
      60 * 1000
    );
  }

  /**
   * GET /v4/sports/{sport}/events/{eventId}/markets
   * Discover available markets for an event
   * Cost: 1
   * Cache: 300 seconds (5 minutes)
   */
  async getEventMarkets(
    sport: string,
    eventId: string,
    params: GetEventMarketsParams
  ): Promise<APIResponse<{ markets: EventMarket[] }>> {
    const { regions = ['us'], ...rest } = params;

    return this.request<{ markets: EventMarket[] }>(
      `/v4/sports/${sport}/events/${eventId}/markets`,
      { regions, ...rest },
      300 * 1000
    );
  }

  /**
   * GET /v4/sports/{sport}/participants
   * Cost: 1
   * Cache: 24 hours
   */
  async getParticipants(sport: string): Promise<APIResponse<Participant[]>> {
    return this.request<Participant[]>(
      `/v4/sports/${sport}/participants`,
      {},
      24 * 60 * 60 * 1000
    );
  }

  /**
   * GET /v4/historical/sports/{sport}/odds
   * Paid plans only
   * Cost: 10 × markets × regions
   * No cache (historical data)
   */
  async getHistoricalOdds(
    sport: string,
    params: GetHistoricalOddsParams
  ): Promise<APIResponse<Event[]>> {
    const { regions = ['us'], ...rest } = params;

    return this.request<Event[]>(
      `/v4/historical/sports/${sport}/odds`,
      { regions, ...rest }
    );
  }

  /**
   * GET /v4/historical/sports/{sport}/events
   * Paid plans only
   * Cost: 1
   */
  async getHistoricalEvents(
    sport: string,
    params: GetHistoricalEventsParams
  ): Promise<APIResponse<Event[]>> {
    return this.request<Event[]>(
      `/v4/historical/sports/${sport}/events`,
      params
    );
  }

  /**
   * GET /v4/historical/sports/{sport}/events/{eventId}/odds
   * Paid plans only
   * Cost: 10 × unique markets × regions
   */
  async getHistoricalEventOdds(
    sport: string,
    eventId: string,
    params: GetHistoricalEventOddsParams
  ): Promise<APIResponse<Event>> {
    const { regions = ['us'], ...rest } = params;

    return this.request<Event>(
      `/v4/historical/sports/${sport}/events/${eventId}/odds`,
      { regions, ...rest }
    );
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance for app-wide use
let clientInstance: OddsAPIClient | null = null;

export function getOddsAPIClient(apiKey?: string): OddsAPIClient {
  if (!clientInstance) {
    const key = apiKey || import.meta.env.VITE_ODDS_API_KEY;
    if (!key) {
      throw new Error('ODDS_API_KEY not configured');
    }
    clientInstance = new OddsAPIClient(key);
  }
  return clientInstance;
}

export function resetOddsAPIClient(): void {
  clientInstance = null;
}
