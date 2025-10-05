-- Enable required extensions for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule fetch-prop-odds to run every 10 minutes
-- After 24h of stability, can be tightened to */5
SELECT cron.schedule(
  'fetch-player-props-every-10min',
  '*/10 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://avyqvcvalvtuqncexnbf.supabase.co/functions/v1/fetch-prop-odds',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2eXF2Y3ZhbHZ0dXFuY2V4bmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5ODMzMDksImV4cCI6MjA3MTU1OTMwOX0.pnYYObPqmyxKVXGgT_VNGWgB1biT0qT_gMk1NK-B2ps"}'::jsonb
    ) as request_id;
  $$
);

-- Optional: Schedule cleanup function to run hourly at :15 past the hour
SELECT cron.schedule(
  'cleanup-old-player-props',
  '15 * * * *',
  $$
  SELECT cleanup_old_player_props();
  $$
);