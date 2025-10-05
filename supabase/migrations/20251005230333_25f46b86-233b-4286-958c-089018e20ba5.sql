-- Add requests_remaining column to ingest_runs table
ALTER TABLE public.ingest_runs 
ADD COLUMN IF NOT EXISTS requests_remaining integer;