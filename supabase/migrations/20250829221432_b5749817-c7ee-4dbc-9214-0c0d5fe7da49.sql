-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the fetch-odds function to run every 30 minutes
SELECT cron.schedule(
  'fetch-odds-every-30-min',
  '*/30 * * * *', -- Every 30 minutes
  $$
  SELECT
    net.http_post(
        url:='https://avyqvcvalvtuqncexnbf.supabase.co/functions/v1/fetch-odds',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2eXF2Y3ZhbHZ0dXFuY2V4bmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5ODMzMDksImV4cCI6MjA3MTU1OTMwOX0.pnYYObPqmyxKVXGgT_VNGWgB1biT0qT_gMk1NK-B2ps"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);