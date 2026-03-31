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
