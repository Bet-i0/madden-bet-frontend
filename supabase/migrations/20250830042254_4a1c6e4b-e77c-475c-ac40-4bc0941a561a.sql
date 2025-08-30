-- Enable realtime for strategy_content table
ALTER TABLE public.strategy_content REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.strategy_content;