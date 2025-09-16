-- Migration: Add dual-side printing support to the mockup generator
-- Date: 2025-09-16
-- Description: Adds support for products that can be printed on both front and back sides

-- ============================================
-- 1. Update gift_items table
-- ============================================

-- Add back_image_url column for back view of products
ALTER TABLE gift_items 
ADD COLUMN IF NOT EXISTS back_image_url TEXT;

-- Add flag to indicate if product supports back printing
ALTER TABLE gift_items 
ADD COLUMN IF NOT EXISTS has_back_printing BOOLEAN DEFAULT false;

-- Add descriptions for the new columns
COMMENT ON COLUMN gift_items.back_image_url IS 'URL for the back view image of the product';
COMMENT ON COLUMN gift_items.has_back_printing IS 'Whether this product supports printing on the back side';

-- ============================================
-- 2. Update placement_constraints table
-- ============================================

-- First, create the ENUM type for side if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'constraint_side') THEN
        CREATE TYPE constraint_side AS ENUM ('front', 'back');
    END IF;
END$$;

-- Add side column to placement_constraints
ALTER TABLE placement_constraints 
ADD COLUMN IF NOT EXISTS side constraint_side DEFAULT 'front';

COMMENT ON COLUMN placement_constraints.side IS 'Which side of the product this constraint applies to';

-- Drop the existing unique constraint if it exists
ALTER TABLE placement_constraints 
DROP CONSTRAINT IF EXISTS unique_constraint_per_item_and_type;

-- Create new unique constraint including side
ALTER TABLE placement_constraints 
ADD CONSTRAINT unique_constraint_per_item_type_side 
UNIQUE (item_id, placement_type, side);

-- ============================================
-- 3. Create indexes for performance
-- ============================================

-- Index for querying constraints by item, type, and side
CREATE INDEX IF NOT EXISTS idx_placement_constraints_item_type_side 
ON placement_constraints(item_id, placement_type, side);

-- Index for finding products with back printing enabled
CREATE INDEX IF NOT EXISTS idx_gift_items_has_back_printing 
ON gift_items(has_back_printing) 
WHERE has_back_printing = true;

-- ============================================
-- 4. Update existing constraints to have 'front' side
-- ============================================

-- Ensure all existing constraints are marked as 'front' side
UPDATE placement_constraints 
SET side = 'front' 
WHERE side IS NULL;

-- ============================================
-- 5. Sample data for testing (optional)
-- ============================================

-- Example: Enable back printing for a test product
-- UPDATE gift_items 
-- SET has_back_printing = true,
--     back_image_url = 'https://example.com/product-back.jpg'
-- WHERE id = 'test-product-id';

-- Example: Add a back constraint for the same product
-- INSERT INTO placement_constraints (
--     item_id, 
--     placement_type, 
--     side,
--     constraint_image_url,
--     min_logo_width,
--     max_logo_width,
--     min_logo_height,
--     max_logo_height,
--     default_position_x,
--     default_position_y,
--     is_validated
-- ) VALUES (
--     'test-product-id',
--     'horizontal',
--     'back',
--     'https://example.com/back-constraint.png',
--     50,
--     400,
--     50,
--     400,
--     100,
--     100,
--     true
-- );

-- ============================================
-- ROLLBACK SCRIPT (save separately)
-- ============================================
-- To rollback these changes, run:
-- 
-- ALTER TABLE placement_constraints DROP CONSTRAINT IF EXISTS unique_constraint_per_item_type_side;
-- ALTER TABLE placement_constraints DROP COLUMN IF EXISTS side;
-- DROP TYPE IF EXISTS constraint_side;
-- ALTER TABLE gift_items DROP COLUMN IF EXISTS back_image_url;
-- ALTER TABLE gift_items DROP COLUMN IF EXISTS has_back_printing;
-- DROP INDEX IF EXISTS idx_placement_constraints_item_type_side;
-- DROP INDEX IF EXISTS idx_gift_items_has_back_printing;
-- ALTER TABLE placement_constraints ADD CONSTRAINT unique_constraint_per_item_and_type UNIQUE (item_id, placement_type);