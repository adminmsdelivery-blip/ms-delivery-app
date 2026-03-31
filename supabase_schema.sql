-- Database Schema for MS Delivery Services

-- Profiles table (linked to Supabase Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  company_name TEXT,
  owner_name TEXT,
  email TEXT,
  logo_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Clients table
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Orders table
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  order_number TEXT NOT NULL,
  order_date DATE DEFAULT CURRENT_DATE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  pickup_location TEXT,
  customer_name TEXT,
  customer_contact TEXT,
  drop_location TEXT,
  map_pin_url TEXT,
  outsource_name TEXT,
  outsource_charges NUMERIC DEFAULT 0,
  delivery_charges NUMERIC DEFAULT 0,
  units INTEGER DEFAULT 1,
  payment_mode TEXT,
  estimated_profit NUMERIC GENERATED ALWAYS AS (delivery_charges - outsource_charges) STORED,
  remark TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security (Keep enabled but allow public for this shared portal)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Simplified Policies for Shared Admin Portal
-- Note: In a real production app, you'd use real auth, but for this specific request,
-- we are allowing access to all records since it's a shared admin gate.

CREATE POLICY "Allow all access to profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "Allow all access to clients" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all access to orders" ON orders FOR ALL USING (true);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
