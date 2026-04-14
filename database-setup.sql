-- Create profiles table for company information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT,
  owner_name TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for company logos
CREATE POLICY "Company logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

CREATE POLICY "Anyone can upload company logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'company-logos');

CREATE POLICY "Anyone can update company logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'company-logos');

CREATE POLICY "Anyone can delete company logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'company-logos');

-- Set up RLS (Row Level Security) for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert profiles"
ON profiles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update profiles"
ON profiles FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete profiles"
ON profiles FOR DELETE
USING (true);
