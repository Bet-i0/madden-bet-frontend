# The Odds API v4 - Integration Guide

## Overview

This is the complete, canonical implementation of The Odds API v4 for Bet.io. All market keys, bookmaker keys, region keys, and endpoints match the official specification exactly.

## Canonical Data Sources

All data is loaded from CSV files in `src/data/odds-api/`:

- **regions.csv** - 7 regions (us, us2, uk, eu, au, us_dfs, us_ex)
- **bookmakers.csv** - 85 bookmakers with region mappings
- **markets.csv** - 88 markets (featured, additional, game periods, player props)
- **endpoints.csv** - All API endpoints with parameters and costs
- **errors.csv** - 32 error codes with descriptions

## Quick Start

```typescript
import { getOddsAPIClient } from '@/lib/oddsApi';

// Get client instance
const client = getOddsAPIClient();

// Example 1: Get sports list (free)
const { data: sports } = await client.getSports();

// Example 2: Get featured markets for NFL (cost: 1 × 3 = 3)
const { data: events, quota } = await client.getOdds('americanfootball_nfl', {
  regions: ['us'],
  markets: ['h2h', 'spreads', 'totals'],
  oddsFormat: 'american'
});

console.log(`Quota remaining: ${quota.requestsRemaining}`);

// Example 3: Get player props for an event (cost: 10 × markets × regions)
const { data: event } = await client.getEventOdds('americanfootball_nfl', eventId, {
  regions: ['us'],
  markets: ['player_pass_yds', 'player_rush_yds', 'player_receive_yds']
});
```

## React Hook Usage

```typescript
import { useOddsAPIClient } from '@/hooks/useOddsAPIClient';

function MyComponent() {
  const { loading, error, quota, getFeaturedOdds } = useOddsAPIClient();

  const handleFetchOdds = async () => {
    const events = await getFeaturedOdds('americanfootball_nfl', ['us'], ['h2h', 'spreads']);
    console.log(`Got ${events?.length} events`);
  };

  return (
    <div>
      {quota && <p>Quota remaining: {quota.remaining}</p>}
      <button onClick={handleFetchOdds} disabled={loading}>
        Fetch Odds
      </button>
    </div>
  );
}
```

## Featured vs Non-Featured Markets

### Featured Markets (Use `/odds` endpoint)
- **Markets**: h2h, spreads, totals, outrights
- **Cost**: regions × markets
- **Example**: 1 region × 3 markets = 3 requests

```typescript
// ✅ CORRECT - Featured markets
await client.getOdds('americanfootball_nfl', {
  regions: ['us'],
  markets: ['h2h', 'spreads', 'totals']
});
```

### Non-Featured Markets (Use `/events/{eventId}/odds` endpoint)
- **Markets**: All player props, period markets, alternates
- **Cost**: 10 × unique_markets × regions
- **Example**: 10 × 4 markets × 1 region = 40 requests

```typescript
// ✅ CORRECT - Player props require event-odds endpoint
await client.getEventOdds('basketball_nba', eventId, {
  regions: ['us'],
  markets: ['player_points', 'player_assists', 'player_rebounds']
});
```

### Market Discovery (Recommended)
Always discover markets first to know what's available:

```typescript
// Cost: 1 request
const { data } = await client.getEventMarkets('americanfootball_nfl', eventId, {
  regions: ['us']
});

const availableMarkets = data.markets.map(m => m.key);
console.log('Available:', availableMarkets);
```

## Canonical Keys

### Never Use Legacy Aliases

```typescript
// ❌ WRONG - Legacy aliases
markets: ['moneyline', 'spread', 'over_under']
bookmakers: ['caesars', 'william_hill']

// ✅ CORRECT - Canonical keys
markets: ['h2h', 'spreads', 'totals']
bookmakers: ['williamhill_us']
```

### Market Key Examples

```typescript
// Featured
'h2h', 'spreads', 'totals', 'outrights'

// Game Periods (NFL/NBA)
'h2h_q1', 'spreads_q1', 'totals_q1'
'h2h_1st_half', 'totals_2nd_half'

// MLB Specific
'totals_1st_innings', 'totals_1st_5_innings'

// NHL Specific
'h2h_1p', 'spreads_2p', 'totals_3p'

// Player Props - NFL
'player_pass_yds', 'player_pass_tds', 'player_rush_yds', 'player_receive_yds'

// Player Props - NBA
'player_points', 'player_assists', 'player_rebounds', 'player_threes'

// Player Props - MLB
'batter_hits', 'batter_home_runs', 'pitcher_strikeouts'
```

## Migration

If you have legacy keys, use the migration utilities:

```typescript
import { migrateMarketKey, migrateBookmakerKey } from '@/lib/oddsApi/migration';

// Migrate single keys
const canonical = migrateMarketKey('moneyline'); // Returns 'h2h'

// Generate migration report
import { generateMarketMigrationReport } from '@/lib/oddsApi/migration';

const report = generateMarketMigrationReport(['moneyline', 'spread', 'h2h']);
console.log(`Migrated: ${report.migratedKeys}`);
console.log('Aliases:', report.aliasesUsed);
```

## Cost Calculation

### Free Endpoints
- `/sports` - List sports (0 requests)
- `/events` - List events (0 requests)

### Low Cost
- `/scores` - Game scores (1 request)
- `/events/{eventId}/markets` - Market discovery (1 request)
- `/participants` - Player/team list (1 request)

### Standard Cost
- `/odds` - Featured markets: **regions × markets**
  - Example: 1 region × 3 markets = **3 requests**

### High Cost
- `/events/{eventId}/odds` - Non-featured markets: **10 × markets × regions**
  - Example: 10 × 4 markets × 1 region = **40 requests**

### Historical Cost (Paid Plans)
- Historical odds: **10 × markets × regions**
- Historical events: **1 request**
- Historical event odds: **10 × markets × regions**

## Caching

The client automatically caches responses:

- **Sports**: 6 hours
- **Events**: 2 minutes
- **Featured Odds**: 60 seconds
- **Event Markets**: 5 minutes
- **Event Odds**: 60 seconds
- **Participants**: 24 hours

Clear cache when needed:
```typescript
client.clearCache();
```

## Rate Limiting

- **Limit**: ~30 requests/second
- **Automatic Backoff**: Client automatically retries on HTTP 429
- **Retry Strategy**: Exponential backoff (1s, 2s, 4s, 8s)

## Error Handling

All errors are typed and include user-friendly messages:

```typescript
import { OddsAPIError } from '@/lib/oddsApi';

try {
  await client.getOdds('invalid_sport', { regions: ['us'] });
} catch (error) {
  if (error instanceof OddsAPIError) {
    console.log('Code:', error.code); // 'UNKNOWN_SPORT'
    console.log('User Message:', error.userMessage);
    console.log('Status:', error.statusCode);
    console.log('Retryable:', error.retryable);
  }
}
```

## Quota Monitoring

Track your usage via response headers:

```typescript
const { quota } = await client.getOdds('americanfootball_nfl', {
  regions: ['us'],
  markets: ['h2h']
});

console.log('Used:', quota.requestsUsed);
console.log('Remaining:', quota.requestsRemaining);
console.log('Last Request:', quota.requestsLast);
```

## Components

### Debug Panel
Shows canonical data and integration status:
```tsx
import { OddsAPIDebugPanel } from '@/components/OddsAPIDebugPanel';

<OddsAPIDebugPanel />
```

### Live Example
Interactive demo of API usage:
```tsx
import { OddsAPIExample } from '@/components/OddsAPIExample';

<OddsAPIExample />
```

## Best Practices

1. **Always check if markets are featured** before choosing endpoint
2. **Use market discovery** for non-featured markets to avoid wasted requests
3. **Batch requests** when possible to minimize calls
4. **Monitor quota** to avoid unexpected overages
5. **Use canonical keys** - never use legacy aliases in new code
6. **Cache aggressively** - sports/events change infrequently
7. **Handle errors gracefully** - implement retry logic for rate limits

## Support

For issues or questions:
- Check error codes in `errors.csv`
- Review endpoint specs in `endpoints.csv`
- See market definitions in `markets.csv`
- Consult The Odds API docs: https://the-odds-api.com/
