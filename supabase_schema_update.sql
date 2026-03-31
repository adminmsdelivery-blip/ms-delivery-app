-- Create outsources table
CREATE TABLE IF NOT EXISTS outsources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS for outsources
ALTER TABLE outsources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to outsources" ON outsources FOR ALL USING (true);

-- Update orders table to use outsource_id
ALTER TABLE orders ADD COLUMN IF NOT EXISTS outsource_id UUID REFERENCES outsources(id);

-- Update settlements table to use outsource_id
ALTER TABLE settlements ADD COLUMN IF NOT EXISTS outsource_id UUID REFERENCES outsources(id);
ALTER TABLE settlements DROP COLUMN IF EXISTS outsource_name;
