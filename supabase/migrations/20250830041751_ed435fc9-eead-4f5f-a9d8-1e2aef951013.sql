-- Create table to store pre-generated strategy content
CREATE TABLE IF NOT EXISTS public.strategy_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id TEXT NOT NULL,
  strategy_name TEXT NOT NULL,
  content JSONB NOT NULL,
  picks JSONB NOT NULL DEFAULT '[]',
  confidence INTEGER NOT NULL DEFAULT 85,
  expected_roi TEXT NOT NULL DEFAULT '+0.0%',
  timeframe TEXT NOT NULL DEFAULT 'TBD',
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_strategy_content_strategy_id ON public.strategy_content(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_content_valid_until ON public.strategy_content(valid_until);

-- Enable RLS
ALTER TABLE public.strategy_content ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access since this is analysis content
CREATE POLICY "Strategy content is publicly readable" 
ON public.strategy_content 
FOR SELECT 
USING (true);

-- Create policy for system updates (for the cron job)
CREATE POLICY "System can update strategy content" 
ON public.strategy_content 
FOR ALL
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_strategy_content_updated_at
BEFORE UPDATE ON public.strategy_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();