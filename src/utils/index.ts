export const createPageUrl = (page: string) => {
  const routes: Record<string, string> = {
    'Dashboard': '/',
    'AICoach': '/ai-coach',
    'Analytics': '/analytics',
    'Injuries': '/injuries',
    'Strategies': '/strategies',
    'Trending': '/trending',
    'Social': '/social',
    'GameDetails': '/game-details'
  };
  
  // Handle query params
  if (page.includes('?')) {
    const [pageName, queryString] = page.split('?');
    return `${routes[pageName] || '/'}?${queryString}`;
  }
  
  return routes[page] || '/';
};
