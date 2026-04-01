-- Check actual order data structure and values
SELECT 
  id,
  order_number,
  order_status,
  payment_status,
  payment_mode,
  outsource_id,
  delivery_charges,
  outsource_charges,
  created_at,
  -- Check if these fields exist
  CASE WHEN outsource_id IS NOT NULL THEN 'Has outsource_id' ELSE 'Missing outsource_id' END as outsource_check,
  CASE WHEN delivery_charges IS NOT NULL THEN 'Has delivery_charges' ELSE 'Missing delivery_charges' END as delivery_check,
  CASE WHEN outsource_charges IS NOT NULL THEN 'Has outsource_charges' ELSE 'Missing outsource_charges' END as outsource_charge_check
FROM orders
ORDER BY created_at DESC
LIMIT 5;
