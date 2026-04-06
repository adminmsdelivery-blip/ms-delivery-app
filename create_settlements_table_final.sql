-- Update Orders table for settlement tracking
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS settlement_status TEXT DEFAULT 'Pending' CHECK (settlement_status IN ('Pending', 'Settled'));

-- Create Settlements table for manual payment tracking
CREATE TABLE IF NOT EXISTS settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('Collection', 'Payout')), -- Collection (from Driver), Payout (to Driver)
  outsource_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  reference_number TEXT,
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS for settlements
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to settlements" ON settlements FOR ALL USING (true);
