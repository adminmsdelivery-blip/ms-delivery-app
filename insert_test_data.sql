-- Insert test settlement data to verify the table works
INSERT INTO settlements (type, outsource_name, amount, payment_date, reference_number, remark) VALUES
('Collection', 'Test Driver 1', 500.00, CURRENT_DATE, 'TEST001', 'Test settlement for debugging'),
('Payout', 'Test Driver 2', 300.00, CURRENT_DATE, 'TEST002', 'Another test settlement');

-- Check if data was inserted
SELECT * FROM settlements ORDER BY created_at DESC;
