-- Check if tables exist and have data
SELECT 
  'orders' as table_name,
  COUNT(*) as record_count,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM orders
UNION ALL
SELECT 
  'outsources' as table_name,
  COUNT(*) as record_count,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM outsources
UNION ALL
SELECT 
  'settlements' as table_name,
  COUNT(*) as record_count,
  MIN(created_at) as earliest_record,
  MAX(created_at) as latest_record
FROM settlements;

-- Check orders table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;

-- Check if orders have outsource_id
SELECT 
  COUNT(*) as total_orders,
  COUNT(outsource_id) as orders_with_outsource_id,
  COUNT(CASE WHEN outsource_id IS NULL THEN 1 END) as orders_without_outsource_id
FROM orders;
