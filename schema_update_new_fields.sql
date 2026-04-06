-- Schema Update: Add new fields to orders table for enhanced order registration

-- Step 1: Rename existing fields for consistency
ALTER TABLE orders RENAME COLUMN drop_location TO delivery_location;
ALTER TABLE orders RENAME COLUMN customer_contact TO customer_contact_number;

-- Step 2: Add new fields for comprehensive logistics data
ALTER TABLE orders ADD COLUMN item_charge NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN total_amount_received NUMERIC DEFAULT 0;

-- Step 3: Update the estimated profit calculation
-- Drop the existing generated column
ALTER TABLE orders DROP COLUMN IF EXISTS estimated_profit;

-- Recreate with new calculation: (Total Amount Received - Item Charge) - Outsource Charges
ALTER TABLE orders ADD COLUMN estimated_profit NUMERIC GENERATED ALWAYS AS ((total_amount_received - item_charge) - outsource_charges) STORED;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN orders.pickup_location IS 'Location where the item is picked up from client';
COMMENT ON COLUMN orders.delivery_location IS 'Location where the item is delivered to customer';
COMMENT ON COLUMN orders.customer_contact_number IS 'Contact number of the end customer receiving the delivery';
COMMENT ON COLUMN orders.item_charge IS 'Cost of the item being delivered (separate from delivery charge)';
COMMENT ON COLUMN orders.total_amount_received IS 'Total amount collected from customer for the order';
COMMENT ON COLUMN orders.estimated_profit IS 'Auto-calculated profit: (Total Amount Received - Item Charge) - Outsource Charges';
