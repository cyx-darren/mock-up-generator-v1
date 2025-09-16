-- Fix the unique constraint to include 'side' field for dual-sided products
-- Drop the existing constraint and create a new one that includes side

-- First, drop the existing unique constraint
ALTER TABLE placement_constraints 
DROP CONSTRAINT IF EXISTS placement_constraints_item_id_placement_type_key;

-- Create the new unique constraint that includes side
ALTER TABLE placement_constraints 
ADD CONSTRAINT placement_constraints_item_id_placement_type_side_key 
UNIQUE (item_id, placement_type, side);