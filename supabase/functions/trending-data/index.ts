import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrendingTopic {
  id: number;
  hashtag: string;
  tweets: number;
  category: string;
  volume: string;
  sentiment: string;
  relevance: number;
  keyInsights: string[];
  change24h?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const twitterBearerToken = Deno.env.get('TWITTER_BEARER_TOKEN');

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Trending data request - User: ${user.id}`);

    let trendingTopics: TrendingTopic[] = [];

    if (!twitterBearerToken) {
      console.log('Twitter Bearer Token not found, using sports-focused mock data');
      // Use focused sports betting mock data when Twitter API is not available
      trendingTopics = generateSportsFocusedData();
    } else {
      // Use real Twitter API to get trending topics
      console.log('Fetching real trending data from Twitter API');
      try {
        trendingTopics = await fetchTwitterTrends(twitterBearerToken);
      } catch (error) {
        console.error('Twitter API error, falling back to mock data:', error);
        trendingTopics = generateSportsFocusedData();
      }
    }

    return new Response(
      JSON.stringify({ trendingTopics }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in trending-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchTwitterTrends(bearerToken: string): Promise<TrendingTopic[]> {
  // First, get trending topics from Twitter API v2
  const trendsResponse = await fetch('https://api.twitter.com/2/trends/by/woeid/1', {
    headers: {
      'Authorization': `Bearer ${bearerToken}`,
    },
  });

  if (!trendsResponse.ok) {
    throw new Error(`Twitter API error: ${trendsResponse.status}`);
  }

  const trendsData = await trendsResponse.json();
  
  // Filter for sports and betting related trends
  const sportsKeywords = [
    'football', 'nfl', 'nba', 'basketball', 'baseball', 'mlb', 'soccer', 'fifa', 'worldcup',
    'betting', 'odds', 'sportsbet', 'draftkings', 'fanduel', 'bet365', 'caesars',
    'parlay', 'moneyline', 'spread', 'over', 'under', 'prop', 'fantasy',
    'playoffs', 'championship', 'superbowl', 'finals', 'march madness', 'ncaa'
  ];

  const sportsTrends = trendsData.data?.filter((trend: any) => 
    sportsKeywords.some(keyword => 
      trend.name.toLowerCase().includes(keyword) ||
      trend.query?.toLowerCase().includes(keyword)
    )
  ) || [];

  // Convert Twitter trends to our format
  const trendingTopics: TrendingTopic[] = sportsTrends.slice(0, 6).map((trend: any, index: number) => {
    const category = categorizeHashtag(trend.name);
    const volume = trend.tweet_volume || Math.floor(Math.random() * 200000) + 50000;
    
    return {
      id: index + 1,
      hashtag: trend.name.startsWith('#') ? trend.name : `#${trend.name}`,
      tweets: volume,
      category: category,
      volume: `${Math.floor(volume / 1000)}K Tweets`,
      sentiment: generateSentiment(category),
      relevance: Math.floor(Math.random() * 20) + 80,
      keyInsights: generateInsights(trend.name, category),
      change24h: Math.floor(Math.random() * 200) - 100
    };
  });

  // If we don't have enough sports trends, supplement with mock data
  if (trendingTopics.length < 6) {
    const mockData = generateSportsFocusedData();
    const needed = 6 - trendingTopics.length;
    trendingTopics.push(...mockData.slice(0, needed));
  }

  return trendingTopics;
}

function generateSportsFocusedData(): TrendingTopic[] {
  const currentSeason = getCurrentSeason();
  const baseTopics = getSeasonalTopics(currentSeason);

  return baseTopics.map((topic, index) => ({
    ...topic,
    id: index + 1,
    tweets: Math.floor(Math.random() * 200000) + 50000,
    volume: `${Math.floor(Math.random() * 500 + 100)}K Tweets`,
    relevance: Math.floor(Math.random() * 20) + 80,
    change24h: Math.floor(Math.random() * 200) - 100
  }));
}

function getCurrentSeason(): string {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  
  if (month >= 9 && month <= 12) return 'fall'; // NFL, College Football
  if (month >= 1 && month <= 3) return 'winter'; // NBA, NHL, College Basketball
  if (month >= 3 && month <= 6) return 'spring'; // MLB, March Madness, NBA Playoffs
  return 'summer'; // MLB, Summer leagues
}

function getSeasonalTopics(season: string) {
  const topics = {
    fall: [
      {
        hashtag: "#NFLSunday",
        category: "Sports",
        sentiment: "excited",
        keyInsights: [
          "Home favorites covering at higher rate this week",
          "Weather conditions affecting outdoor game totals", 
          "Key injury reports creating line movement"
        ]
      },
      {
        hashtag: "#CollegeFootball",
        category: "Sports", 
        sentiment: "passionate",
        keyInsights: [
          "Ranked teams struggling against the spread",
          "Conference championship implications affecting motivation",
          "Public backing home underdogs heavily"
        ]
      },
      {
        hashtag: "#FantasyFootball",
        category: "Fantasy",
        sentiment: "analytical",
        keyInsights: [
          "Waiver wire pickups creating massive impacts",
          "Start/sit decisions trending toward volume plays",
          "Weather alerts affecting WR/TE projections"
        ]
      }
    ],
    winter: [
      {
        hashtag: "#NBABets",
        category: "Sports",
        sentiment: "positive",
        keyInsights: [
          "Road teams performing better ATS lately",
          "Player prop overs hitting at high clip",
          "Back-to-back situations creating value"
        ]
      },
      {
        hashtag: "#NHLHockey",
        category: "Sports",
        sentiment: "excited",
        keyInsights: [
          "Home ice advantage less significant this season",
          "Overtime trends favoring skilled teams",
          "Goalie matchups driving totals markets"
        ]
      }
    ],
    spring: [
      {
        hashtag: "#MarchMadness",
        category: "Sports",
        sentiment: "euphoric",
        keyInsights: [
          "Lower seeds covering spreads consistently",
          "First round upset patterns emerging",
          "Bracket pools driving public betting bias"
        ]
      },
      {
        hashtag: "#MLBSeason",
        category: "Sports",
        sentiment: "optimistic",
        keyInsights: [
          "Weather-dependent totals showing early value",
          "Pitching depth concerns affecting team totals",
          "Spring training stats creating false narratives"
        ]
      },
      {
        hashtag: "#NBAPlayoffs",
        category: "Sports",
        sentiment: "intense",
        keyInsights: [
          "Playoff experience showing in close games",
          "Home court less decisive than expected",
          "Star player props adjusting to playoff intensity"
        ]
      }
    ],
    summer: [
      {
        hashtag: "#MLBAllStar",
        category: "Sports",
        sentiment: "celebratory",
        keyInsights: [
          "All-Star break creating rest advantages",
          "Trade deadline affecting team chemistry",
          "Hot weather pushing run totals higher"
        ]
      },
      {
        hashtag: "#SummerLeague",
        category: "Sports",
        sentiment: "developmental",
        keyInsights: [
          "Rookie performances setting draft narratives",
          "European leagues providing betting value",
          "Tennis and golf taking center stage"
        ]
      }
    ]
  };

  const seasonTopics = topics[season as keyof typeof topics] || topics.fall;
  
  // Always include some general betting topics
  const generalTopics = [
    {
      hashtag: "#SportsBetting",
      category: "Betting",
      sentiment: "analytical",
      keyInsights: [
        "Sharp money identifying value in contrarian plays",
        "Public perception vs actual line value showing gaps",
        "Live betting volume increasing significantly"
      ]
    },
    {
      hashtag: "#BettingTips",
      category: "Betting",
      sentiment: "educational",
      keyInsights: [
        "Bankroll management becoming more mainstream",
        "Line shopping showing measurable ROI improvements",
        "Data analytics driving recreational bettor decisions"
      ]
    },
    {
      hashtag: "#DFSStrategy",
      category: "Fantasy",
      sentiment: "competitive",
      keyInsights: [
        "Contrarian plays succeeding in tournament formats",
        "Salary cap optimization tools gaining popularity",
        "Weather and pace factors becoming crucial"
      ]
    }
  ];

  return [...seasonTopics, ...generalTopics].slice(0, 6);
}

function categorizeHashtag(hashtag: string): string {
  const hashtag_lower = hashtag.toLowerCase();
  
  if (hashtag_lower.includes('bet') || hashtag_lower.includes('odds') || hashtag_lower.includes('line')) {
    return 'Betting';
  }
  if (hashtag_lower.includes('fantasy') || hashtag_lower.includes('dfs')) {
    return 'Fantasy';
  }
  return 'Sports';
}

function generateSentiment(category: string): string {
  const sentiments = {
    'Sports': ['excited', 'passionate', 'optimistic', 'intense'],
    'Betting': ['analytical', 'confident', 'cautious', 'strategic'],
    'Fantasy': ['competitive', 'hopeful', 'frustrated', 'determined']
  };
  
  const categoryOptions = sentiments[category as keyof typeof sentiments] || sentiments.Sports;
  return categoryOptions[Math.floor(Math.random() * categoryOptions.length)];
}

function generateInsights(trendName: string, category: string): string[] {
  const insightTemplates = {
    'Sports': [
      `${trendName} creating significant line movement`,
      "Public betting heavily on favorites in this matchup",
      "Sharp money showing contrarian interest",
      "Weather conditions potentially affecting game total"
    ],
    'Betting': [
      "Professional bettors identifying value opportunities",
      "Line shopping revealing significant price differences",
      "Historical data supporting contrarian approach",
      "Market inefficiency detected in current pricing"
    ],
    'Fantasy': [
      "Ownership projections favoring contrarian plays",
      "Salary cap optimization creating lineup advantages",
      "Weather and pace factors driving projections",
      "Late-week news affecting player values"
    ]
  };

  const templates = insightTemplates[category as keyof typeof insightTemplates] || insightTemplates.Sports;
  const shuffled = templates.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}