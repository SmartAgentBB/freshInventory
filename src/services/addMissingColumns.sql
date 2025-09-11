-- Add missing columns to food_items table

-- Add thumbnail column for storing image URLs
ALTER TABLE food_items 
ADD COLUMN IF NOT EXISTS thumbnail TEXT;

-- Add remains column for tracking remaining percentage (0.0 to 1.0)
ALTER TABLE food_items 
ADD COLUMN IF NOT EXISTS remains NUMERIC DEFAULT 1.0;

-- Add storage_days column for tracking storage duration
ALTER TABLE food_items 
ADD COLUMN IF NOT EXISTS storage_days INTEGER DEFAULT 7;

-- Create index for remains column for efficient filtering
CREATE INDEX IF NOT EXISTS idx_food_items_remains ON food_items(remains);

-- Update existing rows to have default remains value
UPDATE food_items SET remains = 1.0 WHERE remains IS NULL;

-- Update existing rows to have default storage_days value
UPDATE food_items SET storage_days = 7 WHERE storage_days IS NULL;