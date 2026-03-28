-- Fix Storage RLS policies for 'photos' bucket
-- Run this in Supabase SQL Editor

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing storage policies for photos bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow all access to photos bucket" ON storage.objects;

-- Policy 1: Allow public read access to all files in photos bucket
CREATE POLICY "Public read access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'photos');

-- Policy 2: Allow authenticated users to upload to photos bucket
CREATE POLICY "Authenticated users can upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'photos');

-- Policy 3: Allow users to update their own files
CREATE POLICY "Users can update own files" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'photos' AND auth.uid() = owner);

-- Policy 4: Allow users to delete their own files
CREATE POLICY "Users can delete own files" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'photos' AND auth.uid() = owner);

-- Grant permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.objects TO service_role;

-- Also ensure the bucket exists and is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'photos';
