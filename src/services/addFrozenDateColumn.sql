-- Add frozen_date column to food_items table if it doesn't exist

-- Check if the column exists and add it if not
ALTER TABLE food_items 
ADD COLUMN IF NOT EXISTS frozen_date TIMESTAMP WITH TIME ZONE;

-- Update existing frozen items to have frozen_date set to today if null
UPDATE food_items 
SET frozen_date = NOW() 
WHERE status = 'frozen' AND frozen_date IS NULL;