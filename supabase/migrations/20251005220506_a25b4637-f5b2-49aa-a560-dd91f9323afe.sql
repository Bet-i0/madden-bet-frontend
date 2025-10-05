-- Fix security warning: set search_path on trigger function assign_free_plan_to_new_user
CREATE OR REPLACE FUNCTION public.assign_free_plan_to_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Get the free plan ID
  SELECT id INTO free_plan_id 
  FROM public.subscription_plans 
  WHERE name = 'Free' AND is_active = true 
  LIMIT 1;

  -- Create subscription for new user
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (user_id, plan_id)
    VALUES (NEW.user_id, free_plan_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Fix security warning: set search_path on upsert_strategy_content function
CREATE OR REPLACE FUNCTION public.upsert_strategy_content(
  p_strategy_id text,
  p_strategy_name text,
  p_content jsonb,
  p_picks jsonb,
  p_confidence numeric,
  p_expected_roi text,
  p_timeframe text,
  p_valid_until timestamp with time zone
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;