-- Update orders table schema for comprehensive order tracking

-- Add new fields for detailed order information
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS pickup_location TEXT DEFAULT '';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_name TEXT DEFAULT '';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_location TEXT DEFAULT '';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_contact_number TEXT DEFAULT '';

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS item_charge NUMERIC DEFAULT 0;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS total_amount_received NUMERIC DEFAULT 0;

-- Add comments for clarity
COMMENT ON COLUMN orders.pickup_location IS 'Location where item is picked up from client';
COMMENT ON COLUMN orders.customer_name IS 'Name of the customer receiving the delivery';
COMMENT ON COLUMN orders.delivery_location IS 'Location where item is delivered to customer';
COMMENT ON COLUMN orders.customer_contact_number IS 'Customer phone number for delivery coordination';
COMMENT ON COLUMN orders.item_charge IS 'Charge for the item being delivered';
COMMENT ON COLUMN orders.total_amount_received IS 'Total amount received from customer (COD or Online)';

-- Update existing records with default values
UPDATE orders 
SET pickup_location = '' 
WHERE pickup_location IS NULL;

UPDATE orders 
SET customer_name = '' 
WHERE customer_name IS NULL;

UPDATE orders 
SET delivery_location = '' 
WHERE delivery_location IS NULL;

UPDATE orders 
SET customer_contact_number = '' 
WHERE customer_contact_number IS NULL;

UPDATE orders 
SET item_charge = 0 
WHERE item_charge IS NULL;

UPDATE orders 
SET total_amount_received = 0 
WHERE total_amount_received IS NULL;

-- Verify the changes
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('pickup_location', 'customer_name', 'delivery_location', 'customer_contact_number', 'item_charge', 'total_amount_received')
ORDER BY column_name;
