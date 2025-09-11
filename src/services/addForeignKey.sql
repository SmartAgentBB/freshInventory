-- Add foreign key relationship between food_items and storage_info
-- This allows us to join the tables to get storage_days

-- First, add a storage_info_id column if it doesn't exist
ALTER TABLE food_items 
ADD COLUMN IF NOT EXISTS storage_info_id UUID;

-- Create a foreign key constraint
ALTER TABLE food_items
ADD CONSTRAINT fk_food_items_storage_info
FOREIGN KEY (storage_info_id)
REFERENCES storage_info(id)
ON DELETE SET NULL;