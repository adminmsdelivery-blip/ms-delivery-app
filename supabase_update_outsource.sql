-- Create outsources table
CREATE TABLE outsources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS for outsources
ALTER TABLE outsources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to outsources" ON outsources FOR ALL USING (true);

-- Update orders table: Replace outsource_name with outsource_id
ALTER TABLE orders ADD COLUMN outsource_id UUID REFERENCES outsources(id);
ALTER TABLE orders DROP COLUMN outsource_name;

-- Update settlements table: Replace outsource_name with outsource_id
ALTER TABLE settlements ADD COLUMN outsource_id UUID REFERENCES outsources(id);
ALTER TABLE settlements DROP COLUMN outsource_name;
