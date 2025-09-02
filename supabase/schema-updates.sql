-- Schema Updates for Bulk Import and Audit System
-- Run this script to add missing columns required by new features

-- Add missing columns to gift_items table
ALTER TABLE gift_items 
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS primary_image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS additional_images JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS import_batch_id VARCHAR(255);

-- Update audit_log table structure to match AuditLogger implementation
ALTER TABLE audit_log 
RENAME COLUMN admin_user_id TO user_id;

ALTER TABLE audit_log 
RENAME COLUMN entity_type TO resource_type;

ALTER TABLE audit_log 
RENAME COLUMN entity_id TO resource_id;

ALTER TABLE audit_log 
ADD COLUMN IF NOT EXISTS user_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS request_id VARCHAR(255);

-- Make resource_id nullable since some audit entries don't have specific resource IDs
ALTER TABLE audit_log 
ALTER COLUMN resource_id DROP NOT NULL;

-- Add index for bulk import rollback queries
CREATE INDEX IF NOT EXISTS idx_gift_items_import_batch_id ON gift_items(import_batch_id) WHERE import_batch_id IS NOT NULL;

-- Add indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource_type ON audit_log(resource_type);

-- Update the gift_items trigger to handle updated_at for new columns
-- (The existing trigger should already handle this, but we'll make sure)

-- Comment explaining the schema changes
COMMENT ON COLUMN gift_items.price IS 'Product price for bulk import and catalog display';
COMMENT ON COLUMN gift_items.primary_image_url IS 'Primary product image URL for bulk import';
COMMENT ON COLUMN gift_items.additional_images IS 'Additional product images as JSON array for bulk import';
COMMENT ON COLUMN gift_items.import_batch_id IS 'Batch identifier for bulk import rollback functionality';
COMMENT ON COLUMN audit_log.details IS 'Structured audit data as JSON for enhanced logging';
COMMENT ON COLUMN audit_log.user_email IS 'Email of user performing action for audit trail';