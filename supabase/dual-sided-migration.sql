-- Dual-sided printing support migration
-- Adds support for front and back printing on products

-- Add dual-sided printing columns to gift_items table
ALTER TABLE gift_items 
ADD COLUMN IF NOT EXISTS has_back_printing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS back_image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS horizontal_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS vertical_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS all_over_enabled BOOLEAN DEFAULT FALSE;

-- Add side column to placement_constraints table
ALTER TABLE placement_constraints 
ADD COLUMN IF NOT EXISTS side VARCHAR(10) DEFAULT 'front' CHECK (side IN ('front', 'back'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_gift_items_has_back_printing ON gift_items(has_back_printing);
CREATE INDEX IF NOT EXISTS idx_placement_constraints_side ON placement_constraints(side);

-- Add comments explaining the new columns
COMMENT ON COLUMN gift_items.has_back_printing IS 'Whether the product supports printing on the back side';
COMMENT ON COLUMN gift_items.back_image_url IS 'URL for the back view of the product';
COMMENT ON COLUMN gift_items.horizontal_enabled IS 'Whether horizontal logo placement is enabled';
COMMENT ON COLUMN gift_items.vertical_enabled IS 'Whether vertical logo placement is enabled';
COMMENT ON COLUMN gift_items.all_over_enabled IS 'Whether all-over pattern printing is enabled';
COMMENT ON COLUMN placement_constraints.side IS 'Which side of the product this constraint applies to (front or back)';

-- Enable one product for dual-sided testing
UPDATE gift_items SET 
  has_back_printing = TRUE,
  back_image_url = CONCAT(primary_image_url, '-back')
WHERE id = '23d21ac8-c9c8-4626-bbf5-31c09ec5e023';