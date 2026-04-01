-- Check order statuses
SELECT 
  order_status,
  COUNT(*) as count
FROM orders
GROUP BY order_status;

-- Check a sample order to see the data structure
SELECT 
  id,
  order_number,
  order_status,
  payment_status,
  outsource_id,
  delivery_charges,
  outsource_charges,
  created_at
FROM orders
LIMIT 2;
