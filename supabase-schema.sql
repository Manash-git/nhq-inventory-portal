-- NHQ Inventory Portal - Supabase Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- 1. Products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  serial SERIAL,
  product_description TEXT NOT NULL,
  part_number TEXT NOT NULL,
  category TEXT DEFAULT 'Other',
  quantity INTEGER DEFAULT 0,
  image_url TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Activity logs table
CREATE TABLE activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('add', 'delete', 'edit', 'archived')),
  description TEXT,
  user_id TEXT,
  user_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for performance
CREATE INDEX idx_products_archived ON products(is_archived);
CREATE INDEX idx_products_serial ON products(serial);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);

-- 4. Storage bucket for product images
-- Run this in Supabase Storage dashboard:
-- Create a new bucket called "product-images" with public access

-- 5. Row Level Security (RLS) - Optional but recommended
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (we handle auth in the app)
CREATE POLICY "Allow all for authenticated" ON products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated" ON activity_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- 6. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
