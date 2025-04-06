
-- Create table for tracking daily free identifications
CREATE TABLE IF NOT EXISTS public.daily_free_identifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remaining_identifications INTEGER NOT NULL DEFAULT 2,
  last_claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  claimed_date TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS daily_free_identifications_user_id_idx ON public.daily_free_identifications(user_id);
CREATE INDEX IF NOT EXISTS daily_free_identifications_claimed_date_idx ON public.daily_free_identifications(claimed_date);

-- Enable RLS
ALTER TABLE public.daily_free_identifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for users to read their own records
CREATE POLICY "Users can view their own daily identifications" 
  ON public.daily_free_identifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create RLS policy for the service role to manage all records
CREATE POLICY "Service role can manage all daily identifications" 
  ON public.daily_free_identifications 
  USING (auth.jwt() ->> 'role' = 'service_role');
