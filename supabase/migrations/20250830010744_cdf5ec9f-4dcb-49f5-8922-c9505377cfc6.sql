-- Remove the existing 30-minute cron job
SELECT cron.unschedule('fetch-odds-every-30-min');

-- Create a new cron job that runs every 4 hours
SELECT cron.schedule(
  'fetch-odds-every-4-hours',
  '0 */4 * * *', -- Every 4 hours at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://avyqvcvalvtuqncexnbf.supabase.co/functions/v1/fetch-odds',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2eXF2Y3ZhbHZ0dXFuY2V4bmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5ODMzMDksImV4cCI6MjA3MTU1OTMwOX0.pnYYObPqmyxKVXGgT_VNGWgB1biT0qT_gMk1NK-B2ps"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Trigger the function immediately once
SELECT
  net.http_post(
      url:='https://avyqvcvalvtuqncexnbf.supabase.co/functions/v1/fetch-odds',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2eXF2Y3ZhbHZ0dXFuY2V4bmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5ODMzMDksImV4cCI6MjA3MTU1OTMwOX0.pnYYObPqmyxKVXGgT_VNGWgB1biT0qT_gMk1NK-B2ps"}'::jsonb,
      body:='{"manual_trigger": true}'::jsonb
  ) as immediate_request_id;