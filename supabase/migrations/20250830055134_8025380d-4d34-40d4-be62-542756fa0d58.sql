-- Fix chat_messages RLS policies for better security

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Chat messages are viewable by everyone" ON public.chat_messages;

-- Create a more secure policy that still allows global chat functionality
-- but is explicit about the intent and can be easily modified later
CREATE POLICY "Authenticated users can view global chat messages" 
ON public.chat_messages 
FOR SELECT 
TO authenticated
USING (true);

-- Add a comment to document the intent
COMMENT ON POLICY "Authenticated users can view global chat messages" ON public.chat_messages 
IS 'Global sports betting discussion chat - all authenticated users can view messages. Consider adding room/channel support for more granular control in the future.';