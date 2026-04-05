-- Update orders table schema for advanced settlement reports

-- Add missing fields for comprehensive order tracking
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS item_charge NUMERIC DEFAULT 0;

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS total_amount_received NUMERIC DEFAULT 0;

-- Update existing customer_contact to customer_contact_number for consistency
ALTER TABLE orders 
RENAME COLUMN customer_contact TO customer_contact_number;

-- Add comments for clarity
COMMENT ON COLUMN orders.item_charge IS 'Charge for the item being delivered';
COMMENT ON COLUMN orders.total_amount_received IS 'Total amount received from customer (COD or Online)';
COMMENT ON COLUMN orders.customer_contact_number IS 'Customer phone number for delivery coordination';

-- Update existing records with default values
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
  AND column_name IN ('item_charge', 'total_amount_received', 'customer_contact_number')
ORDER BY column_name;
