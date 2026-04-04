-- Add login page customization fields to profiles table

-- Add login_heading field
ALTER TABLE profiles 
ADD COLUMN login_heading TEXT DEFAULT '';

-- Add login_subheading field  
ALTER TABLE profiles 
ADD COLUMN login_subheading TEXT DEFAULT '';

-- Update existing records with default values
UPDATE profiles 
SET login_heading = 'MS Delivery', 
    login_subheading = 'Logistics Management Portal' 
WHERE login_heading IS NULL OR login_heading = '';

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('login_heading', 'login_subheading');
