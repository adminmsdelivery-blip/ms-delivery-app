-- Add status column to settlements table
ALTER TABLE settlements 
ADD COLUMN status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Settled'));
