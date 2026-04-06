-- Add sample settlement to test the page
INSERT INTO settlements (type, outsource_name, amount, payment_date, reference_number, remark) VALUES
('Payout', 'Sample Driver', 250.00, CURRENT_DATE, 'TEST001', 'Sample settlement for testing');

-- Verify it was added
SELECT * FROM settlements ORDER BY created_at DESC LIMIT 1;
