export type League = 'nfl' | 'cfb';
export type EndpointKey = 'teams' | 'gamesByDate' | 'injuriesByDate' | 'depthChartsByDate';
export type EndpointDef = { base: string; endpoints: Record<EndpointKey, string> };

export const manifests: Record<League, EndpointDef> = {
  nfl: {
    base: 'https://api.sportsdata.io/v3/nfl/scores/json',
    endpoints: {
      teams: '/Teams',
      gamesByDate: '/GamesByDate/{date}',
      injuriesByDate: '/Injuries/{date}',
      depthChartsByDate: '/DepthCharts/{date}',
    },
  },
  cfb: {
    base: 'https://api.sportsdata.io/v3/cfb/scores/json',
    endpoints: {
      teams: '/Teams',
      gamesByDate: '/GamesByDate/{date}',
      injuriesByDate: '/Injuries/{date}',
      depthChartsByDate: '/DepthCharts/{date}',
    },
  },
};

export function buildUrl(league: League, key: EndpointKey, params: Record<string,string> = {}) {
  const m = manifests[league];
  if (!m) throw new Error(`Unknown league: ${league}`);
  const template = m.endpoints[key];
  if (!template) throw new Error(`Unknown endpoint: ${key}`);
  let path = template;
  for (const [k, v] of Object.entries(params)) {
    path = path.replace(new RegExp(`{${k}}`, 'g'), encodeURIComponent(v));
  }
  // If any tokens remain like {date}, stop
  if (new RegExp('{[A-Za-z0-9_]+}').test(path)) {
    throw new Error(`Missing path params for ${key}: ${path}`);
  }
  return `${m.base}${path}`;
}

export const cadenceMinutes: Record<EndpointKey, { inSeason: number; offSeason: number }> = {
  teams: { inSeason: 1440, offSeason: 10080 },
  gamesByDate: { inSeason: 60, offSeason: 1440 },
  injuriesByDate: { inSeason: 5, offSeason: 60 },
  depthChartsByDate: { inSeason: 15, offSeason: 60 },
};

export const headers = (apiKey: string) => ({
  accept: 'application/json',
  'Ocp-Apim-Subscription-Key': apiKey,
});

export async function fetchJSON(url: string, apiKey: string) {
  const res = await fetch(url, { headers: headers(apiKey) });
  if (!res.ok) throw new Error(`sportsdataio ${res.status} ${url}`);
  return res.json();
}

export const ingestPlan: Array<{ league: League; key: EndpointKey; paramKeys?: string[] }> = [
  { league: 'nfl', key: 'teams' },
  { league: 'nfl', key: 'gamesByDate', paramKeys: ['date'] },
  { league: 'nfl', key: 'injuriesByDate', paramKeys: ['date'] },
  { league: 'nfl', key: 'depthChartsByDate', paramKeys: ['date'] },
  { league: 'cfb', key: 'teams' },
  { league: 'cfb', key: 'gamesByDate', paramKeys: ['date'] },
  { league: 'cfb', key: 'injuriesByDate', paramKeys: ['date'] },
  { league: 'cfb', key: 'depthChartsByDate', paramKeys: ['date'] },
];

export function assertApiKey() {
  const k = (globalThis as any).Deno?.env?.get('SPORTSDATAIO_API_KEY');
  if (!k) throw new Error('Missing SPORTSDATAIO_API_KEY in Edge Function secrets');
  return k as string;
}
