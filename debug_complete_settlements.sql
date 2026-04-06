-- Complete diagnostic query for settlements debugging
SELECT 
  o.id,
  o.order_number,
  o.outsource_id,
  o.delivery_charges,
  o.outsource_charges,
  o.payment_mode,
  o.created_at,
  os.name as outsource_name
FROM orders o
LEFT JOIN outsources os ON o.outsource_id = os.id
WHERE o.outsource_id IS NOT NULL
ORDER BY o.created_at DESC
LIMIT 10;

-- Check settlements table
SELECT * FROM settlements ORDER BY created_at DESC LIMIT 5;

-- Count total orders with outsource
SELECT COUNT(*) as total_orders, 
       COUNT(CASE WHEN outsource_id IS NOT NULL THEN 1 END) as orders_with_outsource
FROM orders;
