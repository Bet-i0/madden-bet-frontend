-- Fix the confidence column to accept decimal values and add unique constraint
ALTER TABLE public.strategy_content 
ALTER COLUMN confidence TYPE NUMERIC USING confidence::numeric;

-- Add unique constraint on strategy_id to allow ON CONFLICT
ALTER TABLE public.strategy_content 
ADD CONSTRAINT unique_strategy_id UNIQUE (strategy_id);

-- Update the edge function to use UPSERT properly
CREATE OR REPLACE FUNCTION public.upsert_strategy_content(
  p_strategy_id TEXT,
  p_strategy_name TEXT,
  p_content JSONB,
  p_picks JSONB,
  p_confidence NUMERIC,
  p_expected_roi TEXT,
  p_timeframe TEXT,
  p_valid_until TIMESTAMP WITH TIME ZONE
) RETURNS UUID AS $$
DECLARE
  result_id UUID;
BEGIN
  INSERT INTO public.strategy_content (
    strategy_id, strategy_name, content, picks, confidence, expected_roi, timeframe, valid_until
  ) VALUES (
    p_strategy_id, p_strategy_name, p_content, p_picks, p_confidence, p_expected_roi, p_timeframe, p_valid_until
  )
  ON CONFLICT (strategy_id) 
  DO UPDATE SET
    strategy_name = EXCLUDED.strategy_name,
    content = EXCLUDED.content,
    picks = EXCLUDED.picks,
    confidence = EXCLUDED.confidence,
    expected_roi = EXCLUDED.expected_roi,
    timeframe = EXCLUDED.timeframe,
    valid_until = EXCLUDED.valid_until,
    updated_at = now()
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;