-- Add feature flag for controlling data fetching
INSERT INTO public.feature_flags (key, enabled, note)
VALUES 
  ('data_fetching_enabled', true, 'Controls whether odds and props data fetching is enabled')
ON CONFLICT (key) DO NOTHING;