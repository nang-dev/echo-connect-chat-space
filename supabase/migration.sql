
-- Enable realtime functionality for the messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime functionality for the friends table
ALTER TABLE public.friends REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;
