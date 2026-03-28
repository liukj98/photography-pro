-- Fix RLS policies for photos table
-- Run this in Supabase SQL Editor

-- First, disable RLS temporarily to check if that's the issue
-- ALTER TABLE public.photos DISABLE ROW LEVEL SECURITY;

-- Or properly configure the policies:

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create their own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can update their own photos" ON public.photos;
DROP POLICY IF EXISTS "Users can delete their own photos" ON public.photos;
DROP POLICY IF EXISTS "Public photos are viewable by everyone" ON public.photos;
DROP POLICY IF EXISTS "Users can view their own private photos" ON public.photos;

-- Recreate policies with correct syntax
CREATE POLICY "Public photos are viewable by everyone" 
ON public.photos FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can view their own private photos" 
ON public.photos FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own photos" 
ON public.photos FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own photos" 
ON public.photos FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own photos" 
ON public.photos FOR DELETE 
USING (auth.uid() = user_id);

-- Also fix view_stats policies
DROP POLICY IF EXISTS "Users can view their own stats" ON public.view_stats;
DROP POLICY IF EXISTS "Anyone can create view stats" ON public.view_stats;

CREATE POLICY "Users can view their own stats" 
ON public.view_stats FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create view stats" 
ON public.view_stats FOR INSERT 
WITH CHECK (true);

-- Verify RLS is enabled
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.view_stats ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.photos TO authenticated;
GRANT ALL ON public.photos TO service_role;
GRANT ALL ON public.view_stats TO authenticated;
GRANT ALL ON public.view_stats TO service_role;
