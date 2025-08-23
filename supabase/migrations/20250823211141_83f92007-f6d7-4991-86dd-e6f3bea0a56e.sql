-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  auto_save_bets BOOLEAN DEFAULT true,
  default_sportsbook TEXT DEFAULT 'draftkings',
  odds_format TEXT DEFAULT 'american',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create bet status enum
CREATE TYPE public.bet_status AS ENUM ('pending', 'won', 'lost', 'void', 'push');

-- Create bet type enum
CREATE TYPE public.bet_type AS ENUM ('single', 'parlay', 'teaser', 'round_robin');

-- Create bets table
CREATE TABLE public.bets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bet_type public.bet_type NOT NULL DEFAULT 'single',
  stake DECIMAL(10,2) NOT NULL,
  potential_payout DECIMAL(10,2),
  total_odds DECIMAL(10,2),
  status public.bet_status NOT NULL DEFAULT 'pending',
  sportsbook TEXT,
  notes TEXT,
  ai_suggested BOOLEAN DEFAULT false,
  settled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bets
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

-- Create bets policies
CREATE POLICY "Users can manage their own bets" 
ON public.bets FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create bet legs table
CREATE TABLE public.bet_legs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bet_id UUID NOT NULL REFERENCES public.bets(id) ON DELETE CASCADE,
  sport TEXT NOT NULL,
  league TEXT NOT NULL,
  game_date TIMESTAMP WITH TIME ZONE,
  team1 TEXT NOT NULL,
  team2 TEXT NOT NULL,
  bet_market TEXT NOT NULL, -- e.g., 'spread', 'total', 'moneyline'
  bet_selection TEXT NOT NULL, -- e.g., 'Chiefs -3.5', 'Over 47.5', 'Ravens ML'
  odds DECIMAL(10,2),
  result public.bet_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bet_legs
ALTER TABLE public.bet_legs ENABLE ROW LEVEL SECURITY;

-- Create bet_legs policies
CREATE POLICY "Users can manage bet legs for their own bets" 
ON public.bet_legs FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.bets 
  WHERE bets.id = bet_legs.bet_id 
  AND bets.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.bets 
  WHERE bets.id = bet_legs.bet_id 
  AND bets.user_id = auth.uid()
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bets_updated_at
  BEFORE UPDATE ON public.bets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'New User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();