-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE admin_role AS ENUM ('super_admin', 'product_manager', 'viewer');
CREATE TYPE item_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE placement_type AS ENUM ('horizontal', 'vertical', 'all_over');
CREATE TYPE session_status AS ENUM ('processing', 'completed', 'failed');

-- Admin users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role admin_role DEFAULT 'product_manager',
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gift items table
CREATE TABLE gift_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    tags JSONB DEFAULT '[]',
    base_image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    status item_status DEFAULT 'draft',
    horizontal_enabled BOOLEAN DEFAULT FALSE,
    vertical_enabled BOOLEAN DEFAULT FALSE,
    all_over_enabled BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES admin_users(id),
    updated_by UUID REFERENCES admin_users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Placement constraints table
CREATE TABLE placement_constraints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES gift_items(id) ON DELETE CASCADE,
    placement_type placement_type NOT NULL,
    constraint_image_url VARCHAR(500) NOT NULL,
    detected_area_pixels INTEGER,
    detected_area_percentage DECIMAL(5,2),
    min_logo_width INTEGER,
    min_logo_height INTEGER,
    max_logo_width INTEGER,
    max_logo_height INTEGER,
    default_x_position INTEGER,
    default_y_position INTEGER,
    guidelines_text TEXT,
    pattern_settings JSONB DEFAULT '{}',
    is_validated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(item_id, placement_type)
);

-- Mockup sessions table
CREATE TABLE mockup_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255),
    item_id UUID NOT NULL REFERENCES gift_items(id),
    template_id UUID REFERENCES placement_constraints(id),
    original_logo_url VARCHAR(500) NOT NULL,
    processed_logo_url VARCHAR(500),
    mockup_url VARCHAR(500),
    generation_params JSONB DEFAULT '{}',
    status session_status DEFAULT 'processing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Audit log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID NOT NULL REFERENCES admin_users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_gift_items_status ON gift_items(status);
CREATE INDEX idx_gift_items_category ON gift_items(category);
CREATE INDEX idx_gift_items_is_active ON gift_items(is_active);
CREATE INDEX idx_placement_constraints_item_id ON placement_constraints(item_id);
CREATE INDEX idx_placement_constraints_type ON placement_constraints(placement_type);
CREATE INDEX idx_mockup_sessions_item_id ON mockup_sessions(item_id);
CREATE INDEX idx_mockup_sessions_status ON mockup_sessions(status);
CREATE INDEX idx_mockup_sessions_expires_at ON mockup_sessions(expires_at);
CREATE INDEX idx_audit_log_admin_user_id ON audit_log(admin_user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gift_items_updated_at BEFORE UPDATE ON gift_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_placement_constraints_updated_at BEFORE UPDATE ON placement_constraints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE mockup_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users (only super_admins can manage users)
CREATE POLICY "Admin users can view their own profile" ON admin_users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Super admins can manage all users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id::text = auth.uid()::text AND role = 'super_admin'
        )
    );

-- RLS Policies for gift_items (admin users can manage based on role)
CREATE POLICY "Admin users can view gift items" ON gift_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id::text = auth.uid()::text
        )
    );

CREATE POLICY "Product managers and super admins can manage gift items" ON gift_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('super_admin', 'product_manager')
        )
    );

-- Public access for active gift items (for customer-facing catalog)
CREATE POLICY "Public can view active gift items" ON gift_items
    FOR SELECT USING (status = 'active' AND is_active = true);

-- RLS Policies for placement_constraints
CREATE POLICY "Admin users can view placement constraints" ON placement_constraints
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id::text = auth.uid()::text
        )
    );

CREATE POLICY "Product managers and super admins can manage placement constraints" ON placement_constraints
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('super_admin', 'product_manager')
        )
    );

-- Public access for constraints of active items
CREATE POLICY "Public can view constraints for active items" ON placement_constraints
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM gift_items 
            WHERE id = placement_constraints.item_id 
            AND status = 'active' 
            AND is_active = true
        )
    );

-- RLS Policies for mockup_sessions (public access for creation, admin for viewing)
CREATE POLICY "Anyone can create mockup sessions" ON mockup_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view their own mockup sessions" ON mockup_sessions
    FOR SELECT USING (true);

CREATE POLICY "Admin users can view all mockup sessions" ON mockup_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id::text = auth.uid()::text
        )
    );

-- RLS Policies for audit_log (admin only)
CREATE POLICY "Admin users can view audit log" ON audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE id::text = auth.uid()::text
        )
    );

CREATE POLICY "System can insert audit log entries" ON audit_log
    FOR INSERT WITH CHECK (true);

-- Create storage buckets (these need to be created via Supabase dashboard or API)
-- gift-items bucket for product images
-- constraint-images bucket for marked constraint images
-- user-logos bucket for uploaded logos
-- generated-mockups bucket for AI-generated mockups

-- Function to automatically generate SKU
CREATE OR REPLACE FUNCTION generate_sku()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sku IS NULL OR NEW.sku = '' THEN
        NEW.sku := 'ITEM-' || UPPER(SUBSTRING(MD5(NEW.name || NOW()::text), 1, 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_sku_trigger
    BEFORE INSERT ON gift_items
    FOR EACH ROW EXECUTE FUNCTION generate_sku();